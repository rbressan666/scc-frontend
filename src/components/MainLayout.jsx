import React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from './ui/sidebar';
import { Button } from './ui/button';
import { PanelLeftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <Sidebar>
      <SidebarTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-50 md:hidden">
          <PanelLeftIcon className="h-4 w-4" />
        </Button>
      </SidebarTrigger>
      <SidebarHeader>
        <h2 className="text-xl font-bold">SCC</h2>
      </SidebarHeader>
      <SidebarContent>
        {/* Aqui você pode adicionar os itens do menu lateral */}
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/produtos')}>Produtos</Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/usuarios')}>Usuários</Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/configuracoes')}>Configurações</Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/perfil')}>Perfil</Button>
      </SidebarContent>
      <SidebarInset>
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b">
            <h1 className="text-2xl font-bold">Bem-vindo ao SCC</h1>
            <Button onClick={handleLogout} variant="outline">Sair</Button>
          </header>
          <main className="flex-1 p-4 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarInset>
    </Sidebar>
  );
};

export default MainLayout;


