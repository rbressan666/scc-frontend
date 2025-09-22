import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Loader2,
  User,
  Save,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Calendar
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_completo: user?.nome_completo || '',
    email: user?.email || '',
    senha: ''
  });

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
    
    // Se senha foi preenchida, validar
    if (formData.senha.trim() && formData.senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  // Salvar perfil
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Preparar dados para envio
      const dataToSend = {
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim()
      };
      
      // Só incluir senha se foi preenchida
      if (formData.senha.trim()) {
        dataToSend.senha = formData.senha;
      }
      
      const response = await userService.updateProfile(dataToSend);
      
      if (response.success) {
        // Atualizar dados do usuário no contexto
        await updateUser();
        setSuccess('Perfil atualizado com sucesso!');
        setEditMode(false);
        setFormData(prev => ({ ...prev, senha: '' })); // Limpar senha
      } else {
        setError(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      setError(error.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edição
  const handleCancel = () => {
    setFormData({
      nome_completo: user?.nome_completo || '',
      email: user?.email || '',
      senha: ''
    });
    setEditMode(false);
    setError('');
    setSuccess('');
  };

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
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Meu Perfil
              </h1>
            </div>

            {!editMode && (
              <Button onClick={() => setEditMode(true)}>
                Editar Perfil
              </Button>
            )}
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

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {editMode ? 'Editar Perfil' : 'Informações do Perfil'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {editMode ? (
                // Modo de Edição
                <div className="space-y-6">
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
                    <div className="md:col-span-2">
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
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
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
                </div>
              ) : (
                // Modo de Visualização
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {user?.nome_completo}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">E-mail</label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Perfil de Acesso</label>
                      <div className="mt-1">
                        <Badge 
                          variant={user?.perfil === 'admin' ? 'default' : 'secondary'}
                          className="flex items-center w-fit"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user?.perfil}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        <Badge 
                          variant={user?.ativo ? 'success' : 'destructive'}
                          className={`flex items-center w-fit ${
                            user?.ativo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user?.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Último Login</label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

