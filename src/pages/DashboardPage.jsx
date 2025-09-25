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
    item.adminOnly || isAdmin()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-white font-bold text-sm">SCC</span>
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
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isClickable ? 'hover:scale-105' : 'opacity-75 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (isClickable) {
                      navigate(item.path);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      {item.description}
                    </CardDescription>
                    
                    {item.showProgress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Uso do armazenamento</span>
                          <span>12%</span>
                        </div>
                        <Progress value={12} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

