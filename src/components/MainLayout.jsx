import React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';
import { Button } from './ui/button';
import { PanelLeftIcon, Home, Package, Users, Settings, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/dashboard",
      adminOnly: false
    },
    {
      title: "Produtos",
      icon: Package,
      path: "/produtos",
      adminOnly: false
    },
    {
      title: "Usuários",
      icon: Users,
      path: "/usuarios",
      adminOnly: true
    },
    {
      title: "Configurações",
      icon: Settings,
      path: "/configuracoes",
      adminOnly: true
    },
    {
      title: "Perfil",
      icon: User,
      path: "/perfil",
      adminOnly: false
    }
  ];

  const availableItems = menuItems.filter(item => 
    !item.adminOnly || isAdmin()
  );

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SCC</span>
            </div>
            <h2 className="text-lg font-bold">Sistema SCC</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {availableItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => navigate(item.path)}
                    className="w-full justify-start"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-2">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Sair
          </Button>
        </div>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full w-full">
          <header className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Sistema de Controle de Custos</h1>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-gray-50 w-full">
            {children}
          </main>
        </div>
      </SidebarInset>
    </div>
  );
};

export default MainLayout;

