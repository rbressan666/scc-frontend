import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Smartphone, QrCode, Eye, EyeOff } from 'lucide-react';
import { qrCodeSocket } from '../services/socketService';
import QRCode from 'qrcode';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  // Estados do formulário
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados do QR Code
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrStatus, setQrStatus] = useState(''); // 'generating', 'waiting', 'scanned', 'expired'

  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar dispositivo mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  // Configurar listeners do WebSocket
  useEffect(() => {
    if (showQRCode) {
      // Listener para QR escaneado
      qrCodeSocket.onQRScanned(() => {
        setQrStatus('scanned');
      });

      // Listener para login bem-sucedido
      qrCodeSocket.onLoginSuccess(async (data) => {
        try {
          // Simular login com os dados recebidos
          const result = await login(data.user.email, null, data.token);
          if (result.success) {
            navigate('/dashboard');
          }
        } catch (error) {
          setError('Erro ao processar login via QR Code');
        }
      });

      // Listener para QR expirado
      qrCodeSocket.onQRExpired(() => {
        setQrStatus('expired');
        setError('QR Code expirado. Gere um novo código.');
      });

      // Listener para QR cancelado
      qrCodeSocket.onQRCancelled(() => {
        setShowQRCode(false);
        setQrStatus('');
      });
    }

    return () => {
      if (showQRCode) {
        qrCodeSocket.removeQRListeners();
      }
    };
  }, [showQRCode, login, navigate]);

  // Manipular mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro ao digitar
    if (error) setError('');
  };

  // Submeter formulário de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.senha) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.senha);
      
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Erro no login');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Gerar QR Code
  const handleGenerateQR = async () => {
    try {
      setQrStatus('generating');
      setError('');
      
      const qrData = await qrCodeSocket.generateQRCode();
      
      // Gerar URL do QR Code
      const qrUrl = await QRCode.toDataURL(qrData.qrCodeData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeData(qrData.qrCodeData);
      setQrCodeUrl(qrUrl);
      setQrStatus('waiting');
      setShowQRCode(true);
      
    } catch (error) {
      setError('Erro ao gerar QR Code: ' + error.message);
      setQrStatus('');
    }
  };

  // Cancelar QR Code
  const handleCancelQR = () => {
    qrCodeSocket.cancelQRSession();
    setShowQRCode(false);
    setQrStatus('');
    setQrCodeData('');
    setQrCodeUrl('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">SCC</span>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema Contagem Cadoz</CardTitle>
          <CardDescription>
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showQRCode ? (
            <>
              {/* Formulário de Login */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="senha"
                      name="senha"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              {/* Opções de Login */}
              <div className="space-y-3">
                {!isMobile && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Ou acesse com o celular
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleGenerateQR}
                      disabled={qrStatus === 'generating'}
                    >
                      {qrStatus === 'generating' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando QR Code...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Gerar QR Code
                        </>
                      )}
                    </Button>
                  </>
                )}

                {isMobile && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGenerateQR}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Acessar com QR Code
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* Tela do QR Code */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code para login" 
                    className="border rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-2">
                {qrStatus === 'waiting' && (
                  <p className="text-sm text-gray-600">
                    Escaneie o QR Code com seu celular para fazer login
                  </p>
                )}
                
                {qrStatus === 'scanned' && (
                  <div className="flex items-center justify-center text-green-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    QR Code escaneado! Aguardando confirmação...
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelQR}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerateQR}
                  className="flex-1"
                  disabled={qrStatus === 'generating'}
                >
                  Novo QR Code
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

