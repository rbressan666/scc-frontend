import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Settings, BarChart3, Package, Cog, Database, Import } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { Button } from '@/components/ui/button';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const menuItems = [
    {
      id: "users",
      title: "Gerenciar Usuários",
      description: "Criar, editar e gerenciar usuários do sistema",
      icon: Users,
      path: "/usuarios",
      adminOnly: true,
      color: "bg-blue-500"
    },
    {
      id: "products",
      title: "Produtos",
      description: "Gerenciar produtos e variações do estoque",
      icon: Package,
      path: "/produtos",
      adminOnly: true,
      color: "bg-orange-500"
    },
    {
      id: "configuracoes",
      title: "Configurações",
      description: "Gerenciar setores, categorias e unidades de medida",
      icon: Cog,
      path: "/configuracoes",
      adminOnly: true,
      color: "bg-gray-500"
    },
    {
      id: "profile",
      title: "Meu Perfil",
      description: "Visualizar e editar informações do perfil",
      icon: Settings,
      path: "/perfil",
      adminOnly: false,
      color: "bg-green-500"
    },
    {
      id: "reports",
      title: "Relatórios",
      description: "Visualizar relatórios e estatísticas do sistema (em breve)",
      icon: BarChart3,
      path: null, // Desabilitado
      adminOnly: true,
      color: "bg-purple-500",
      disabled: true
    },
    {
      id: "database",
      title: "Uso do Banco",
      description: "Monitorar uso do armazenamento Supabase",
      icon: Database,
      path: null, // Não navega, apenas mostra informações
      adminOnly: true,
      color: "bg-indigo-500",
      showProgress: true
    }
  ];

  const availableItems = menuItems.filter(item => 
    !item.adminOnly || isAdmin()
  );

  return (
    <MainLayout>
      <div className="w-full max-w-none">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao Sistema
          </h2>
          <p className="text-lg text-gray-600">
            Selecione uma opção abaixo para começar a usar o sistema.
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="h-6 w-6 text-white" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Informações do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nome:</span>
                <span className="text-sm font-medium">{user?.nome_completo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">E-mail:</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Perfil:</span>
                <span className="text-sm font-medium capitalize">{user?.perfil}</span>
              </div>
              <div className="flex justify-between items-center">
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
              <CardTitle className="text-xl">Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Versão:</span>
                <span className="text-sm font-medium">MVP 2.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Módulo:</span>
                <span className="text-sm font-medium">Gestão Completa</span>
              </div>
              <div className="flex justify-between items-center">
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
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
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
    </MainLayout>
  );
};

export default DashboardPage;

