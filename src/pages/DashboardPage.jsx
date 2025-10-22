import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Smartphone, LogOut, Settings, BarChart3, Package, Cog, Database, Clock, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import api from '../services/api';
import { initPush } from '../services/pushClient';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [dbUsage, setDbUsage] = useState({ bytes: null, pretty: null, tables: null, percent: null });
  const [pushInfo, setPushInfo] = useState({ show: false, status: 'unknown', reason: null, actionable: false, hint: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/admin/db-usage');
        const data = res?.data || res;
        const bytes = data?.bytes ?? null;
        const limit = Number(import.meta.env.VITE_DB_LIMIT_BYTES || 0) || null; // opcional, define limite para %
        const percent = bytes && limit ? Math.min(100, Math.round((bytes / limit) * 100)) : null;
        setDbUsage({ bytes, pretty: data?.pretty || null, tables: data?.tables || null, percent });
      } catch {
        // deixa mocado se falhar
        setDbUsage({ bytes: null, pretty: null, tables: null, percent: null });
      }
    })();
  }, []);

  // Checagem de suporte a Push e possibilidade de solicitar permissão
  useEffect(() => {
    const secure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasSW = 'serviceWorker' in navigator;
    const hasPush = 'PushManager' in window;
    const hasNotif = 'Notification' in window;
    const perm = hasNotif ? Notification.permission : 'unsupported';
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // iOS requer PWA instalada na Tela Inicial (iOS 16.4+)
    if (isIOS && (!isStandalone || !hasPush)) {
      setPushInfo({
        show: true,
        status: 'unsupported',
        reason: 'ios-home-screen-required',
        actionable: false,
        hint: 'No iPhone, toque em Compartilhar e “Adicionar à Tela de Início” para habilitar notificações.'
      });
      return;
    }

    if (!secure || !hasSW || !hasPush || !hasNotif) {
      const reason = !secure ? 'insecure-context' : !hasSW ? 'no-service-worker' : !hasPush ? 'no-pushmanager' : 'no-notification-api';
      setPushInfo({ show: true, status: 'unsupported', reason, actionable: false, hint: null });
      return;
    }

    if (perm === 'default') {
      setPushInfo({ show: true, status: 'prompt', reason: null, actionable: true, hint: null });
    } else if (perm === 'denied') {
      setPushInfo({ show: true, status: 'blocked', reason: 'denied', actionable: false, hint: 'Notificações estão bloqueadas no navegador. Ative nas configurações do site.' });
    } else {
      // granted — nenhuma ação
      setPushInfo({ show: false, status: 'granted', reason: null, actionable: false, hint: null });
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      const res = await initPush();
      if (res?.enabled) {
        setPushInfo({ show: false, status: 'granted', reason: null, actionable: false, hint: null });
      } else {
        setPushInfo({ show: true, status: 'error', reason: res?.reason || 'unknown', actionable: true, hint: 'Tente novamente ou verifique as configurações do navegador.' });
      }
    } catch (e) {
      setPushInfo({ show: true, status: 'error', reason: e?.message || 'unknown', actionable: true, hint: 'Tente novamente mais tarde.' });
    }
  };

  const menuItems = [
    {
      id: 'turnos',
      title: 'Gestão de Turnos',
      description: 'Gerenciar turnos de trabalho e contagens',
      icon: Clock,
      path: '/turnos',
      adminOnly: false,
      color: 'bg-blue-600'
    },
    {
      id: 'notifications-admin',
      title: 'Notificações',
      description: 'Fila, últimos envios e dispatcher',
      icon: Bell,
      path: '/admin/notifications',
      adminOnly: true,
      color: 'bg-indigo-600'
    },
    {
      id: 'diagnostics',
      title: 'Diagnósticos',
      description: 'Status da fila e últimos envios de notificações',
      icon: BarChart3,
      path: '/admin/diagnosticos',
      adminOnly: true,
      color: 'bg-teal-600'
    },
    {
      id: 'planning',
      title: 'Planejamento',
      description: 'Regras semanais de escala e geração de lembretes',
      icon: Cog,
      path: '/planejamento',
      adminOnly: true,
      color: 'bg-emerald-600'
    },
    {
      id: 'alertas',
      title: 'Alertas do Sistema',
      description: 'Visualizar e gerenciar alertas de contagem',
      icon: AlertTriangle,
      path: '/alertas',
      adminOnly: false,
      color: 'bg-red-600'
    },
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
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCC</h1>
                <p className="text-xs text-gray-500">Sistema Contagem Cadoz</p>
              </div>
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
          {pushInfo.show && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">Notificações no celular</div>
                  {pushInfo.status === 'prompt' && (
                    <div>Ative as notificações para receber avisos de turnos e lembretes.</div>
                  )}
                  {pushInfo.status === 'blocked' && (
                    <div>{pushInfo.hint}</div>
                  )}
                  {pushInfo.status === 'unsupported' && (
                    <div>{pushInfo.hint || 'Este dispositivo/navegador não suporta Web Push.'}</div>
                  )}
                  {pushInfo.status === 'error' && (
                    <div>Não foi possível ativar agora ({pushInfo.reason}). {pushInfo.hint}</div>
                  )}
                </div>
              </div>
              {pushInfo.actionable && (
                <Button size="sm" onClick={handleEnablePush} className="shrink-0">Ativar notificações</Button>
              )}
            </div>
          )}
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            {availableItems.map((item) => {
              const IconComponent = item.icon;
              const isClickable = item.path && !item.disabled;

              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md py-2 gap-2 min-h-[68px] ${
                    isClickable ? 'hover:scale-105' : 'opacity-75 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (isClickable) {
                      navigate(item.path);
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg ${item.color}`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2">
                    <CardDescription className="text-xs mb-1 line-clamp-1">
                      {item.description}
                    </CardDescription>
                    
                    {item.showProgress && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Uso do armazenamento</span>
                          <span>{dbUsage.percent !== null ? `${dbUsage.percent}%` : (dbUsage.pretty || 'N/D')}</span>
                        </div>
                        <Progress value={dbUsage.percent ?? 0} className="h-1.5" />
                        {dbUsage.pretty && (
                          <div className="text-[11px] text-gray-500">{dbUsage.pretty}{dbUsage.tables!=null ? ` • ${dbUsage.tables} tabelas` : ''}</div>
                        )}
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

