import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Smartphone, LogOut, Settings, BarChart3, Package, Cog, Database } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      id: 'users',
      title: 'Gerenciar Usuários',
      description: 'Criar, editar e gerenciar usuários do sistema',
      icon: Users,
      path: '/usuarios',
      adminOnly: true,
      color: 'bg-blue-500'
    },
    {
      id: 'products',
      title: 'Produtos',
      description: 'Gerenciar produtos e variações do estoque',
      icon: Package,
      path: '/produtos',
      adminOnly: true,
      color: 'bg-orange-500'
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Gerenciar setores, categorias e unidades de medida',
      icon: Cog,
      path: '/configuracoes',
      adminOnly: true,
      color: 'bg-gray-500'
    },
    {
      id: 'profile',
      title: 'Meu Perfil',
      description: 'Visualizar e editar informações do perfil',
      icon: Settings,
      path: '/perfil',
      adminOnly: false,
      color: 'bg-green-500'
    },
    {
      id: 'reports',
      title: 'Relatórios',
      description: 'Visualizar relatórios e estatísticas do sistema (em breve)',
      icon: BarChart3,
      path: null, // Desabilitado
      adminOnly: true,
      color: 'bg-purple-500',
      disabled: true
    },
    {
      id: 'database',
      title: 'Uso do Banco',
      description: 'Monitorar uso do armazenamento Supabase',
      icon: Database,
      path: null, // Não navega, apenas mostra informações
      adminOnly: true,
      color: 'bg-indigo-500',
      showProgress: true
    }
  ];

  // Filtrar itens baseado no perfil do usuário
  const availableItems = menuItems.filter(item => 
    !item.adminOnly || isAdmin()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">SCC</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema Contagem Cadoz
              </h1>
            </div>

            {/* User Info e Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  Olá, {user?.nome_completo}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.perfil}
                </p>
              </div>

              {/* Handoff Icon (para futuras funcionalidades) */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                title="Handoff (Em breve)"
              >
                <Smartphone className="h-4 w-4" />
              </Button>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo ao Sistema
            </h2>
            <p className="text-gray-600">
              Selecione uma opção abaixo para começar a usar o sistema.
            </p>
          </div>

          {/* Menu Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableItems.map((item) => {
              const IconComponent = item.icon;
              const isClickable = item.path && !item.disabled;
              
              return (
                <Card 
                  key={item.id} 
                  className={`transition-all duration-200 ${
                    isClickable 
                      ? 'hover:shadow-lg cursor-pointer transform hover:-translate-y-1' 
                      : item.disabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-default'
                  }`}
                  onClick={() => isClickable && navigate(item.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-gray-600 mb-3">
                      {item.description}
                    </CardDescription>
                    
                    {/* Barra de progresso para uso do banco */}
                    {item.showProgress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Usado:</span>
                          <span className="font-medium">~2.1 GB / 8 GB</span>
                        </div>
                        <Progress value={26} className="h-2" />
                        <p className="text-xs text-gray-500">
                          Plano gratuito Supabase - 26% utilizado
                        </p>
                      </div>
                    )}
                    
                    {item.disabled && (
                      <div className="text-xs text-gray-400 italic">
                        Funcionalidade em desenvolvimento
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* User Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nome:</span>
                  <span className="text-sm font-medium">{user?.nome_completo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">E-mail:</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Perfil:</span>
                  <span className="text-sm font-medium capitalize">{user?.perfil}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${user?.ativo ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* System Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Versão:</span>
                  <span className="text-sm font-medium">MVP 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Módulo:</span>
                  <span className="text-sm font-medium">Gestão Completa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Último Login:</span>
                  <span className="text-sm font-medium">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions (apenas para admin) */}
          {isAdmin() && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => navigate('/usuarios/novo')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/usuarios')}
                >
                  Ver Todos os Usuários
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

