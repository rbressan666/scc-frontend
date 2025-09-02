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

  // Estados do Formulário
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados do QR Code
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrStatus, setQrStatus] = useState(''); // 'generating', 'waiting', 'scanned', 'expired'
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é dispositivo mobile
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
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
          } else {
            setError(result.message || 'Erro ao processar login via QR Code');
          }
        } catch (error) {
          console.error('Erro ao processar login via QR Code:', error);
          setError('Erro ao processar login via QR Code');
        }
      });

      // Listener para QR expirado
      qrCodeSocket.onQRExpired(() => {
        setShowQRCode(false);
        setQrStatus('');
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
        qrCodeSocket.removeAllListeners();
      }
    };
  }, [showQRCode, login, navigate, location]);

  // Manipular mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpar erro ao digitar
  const clearError = () => {
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
      console.error('Erro de conexão. Tente novamente.', error);
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
      setShowQRCode(true);

      const qrData = await qrCodeSocket.generateQRCode();
      
      if (qrData.success) {
        // Gerar URL do QR Code
        const qrUrl = await QRCode.toDataURL(qrData.qrCodeData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrUrl);
        setQrStatus('waiting');
        
        // Configurar timeout para expiração (5 minutos)
        setTimeout(() => {
          if (qrStatus === 'waiting') {
            setShowQRCode(false);
            setQrStatus('');
            setError('QR Code expirado. Gere um novo código.');
          }
        }, 5 * 60 * 1000); // 5 minutos
        
      } else {
        throw new Error(qrData.message || 'Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      setError('Erro ao gerar QR Code: ' + error.message);
      setShowQRCode(false);
      setQrStatus('');
    }
  };

  // Cancelar QR Code
  const handleCancelQR = () => {
    qrCodeSocket.cancelQRSession();
    setShowQRCode(false);
    setQrStatus('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
          <CardTitle className="text-2xl font-bold text-gray-900">Sistema Contagem Cadoz</CardTitle>
          <CardDescription className="text-gray-600">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!showQRCode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="roberto.fujiy@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={clearError}
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
                    placeholder="Cadoz@001"
                    value={formData.senha}
                    onChange={handleInputChange}
                    onFocus={clearError}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800"
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">OU ACESSE COM O CELULAR</span>
                </div>
              </div>

              <Button
                type="button"
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
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-64 h-64 bg-white p-4 rounded-lg border">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {qrStatus === 'waiting' && (
                  <p className="text-sm text-gray-600">
                    <Smartphone className="inline mr-1 h-4 w-4" />
                    Escaneie o QR Code com seu celular
                  </p>
                )}
                {qrStatus === 'scanned' && (
                  <p className="text-sm text-green-600">
                    ✅ QR Code escaneado! Confirme o login no seu celular
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleCancelQR}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

