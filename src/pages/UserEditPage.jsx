import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, apiUtils } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Loader2,
  User,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

const UserEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    perfil: 'usuario',
    senha: '',
    ativo: true
  });

  // Verificar permissões
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadUser();
  }, [id, isAdmin, navigate]);

  // Carregar dados do usuário
  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getById(id);
      
      if (response.success) {
        const user = response.data;
        setFormData({
          nome_completo: user.nome_completo || '',
          email: user.email || '',
          perfil: user.perfil || 'usuario',
          senha: '', // Sempre vazio por segurança
          ativo: user.ativo !== undefined ? user.ativo : true
        });
      } else {
        setError('Usuário não encontrado');
      }
    } catch (error) {
      setError(apiUtils.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  // Atualizar campo do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulário
  const validateForm = () => {
    if (!formData.nome_completo.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    
    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('E-mail inválido');
      return false;
    }
    
    return true;
  };

  // Salvar usuário
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');
      
      // Preparar dados para envio (não enviar senha se estiver vazia)
      const dataToSend = {
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim(),
        perfil: formData.perfil,
        ativo: formData.ativo
      };
      
      // Só incluir senha se foi preenchida
      if (formData.senha.trim()) {
        dataToSend.senha = formData.senha;
      }
      
      const response = await userService.update(id, dataToSend);
      
      if (response.success) {
        navigate('/usuarios');
      } else {
        setError(response.message || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      setError(apiUtils.formatError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/usuarios')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Editar Usuário
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Editar Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Nome Completo *
                  </label>
                  <Input
                    type="text"
                    value={formData.nome_completo}
                    onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                    placeholder="Digite o nome completo"
                    className="w-full"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite o e-mail"
                    className="w-full"
                  />
                </div>

                {/* Perfil */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Perfil de Acesso *
                  </label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(value) => handleInputChange('perfil', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operador">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nova Senha */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Nova Senha (deixe em branco para manter a atual)
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Status
                  </label>
                  <Select
                    value={formData.ativo ? "true" : "false"}
                    onValueChange={(value) => handleInputChange('ativo', value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/usuarios')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserEditPage;

