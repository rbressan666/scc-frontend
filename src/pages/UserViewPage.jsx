import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, apiUtils } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Loader2,
  User,
  Mail,
  Shield,
  Calendar,
  Edit
} from 'lucide-react';

const UserViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setUser(response.data);
      } else {
        setError('Usuário não encontrado');
      }
    } catch (error) {
      setError(apiUtils.formatError(error));
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                  Visualizar Usuário
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </main>
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
                Visualizar Cadastro Completo do Usuário
              </h1>
            </div>

            <Button onClick={() => navigate(`/usuarios/${user.id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Usuário
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {user.nome_completo}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">E-mail</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Perfil de Acesso</label>
                    <div className="mt-1">
                      <Badge 
                        variant={user.perfil === 'admin' ? 'default' : 'secondary'}
                        className="flex items-center w-fit"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.perfil}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant={user.ativo ? 'success' : 'destructive'}
                        className={`flex items-center w-fit ${
                          user.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Data de Criação</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Última Atualização</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              {user.observacoes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Observações</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {user.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/usuarios')}
            >
              Voltar à Lista
            </Button>
            <Button onClick={() => navigate(`/usuarios/${user.id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Usuário
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserViewPage;

