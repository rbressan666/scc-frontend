import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Smartphone, LogOut, Settings, BarChart3, Package, Cog, Database, Clock, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import api, { turnosService, statutesService, userService } from '../services/api';
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
  const [turnoModal, setTurnoModal] = useState({ open: false, stage: null, loading: false, turno: null, opener: null });
  const [turnoCheckDone, setTurnoCheckDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
  const res = await api.get('/api/admin/db-usage');
        const data = res?.data || res;
        const bytes = data?.bytes ?? null;
  // Limite fixo: 0,5 GB (plano atual do Supabase)
  const HALF_GB = 0.5 * 1024 * 1024 * 1024; // 0,5 GiB em bytes
  const percent = bytes != null ? Math.min(100, Math.round((bytes / HALF_GB) * 100)) : null;
        setDbUsage({ bytes, pretty: data?.pretty || null, tables: data?.tables || null, percent });
      } catch {
        // deixa mocado se falhar
        setDbUsage({ bytes: null, pretty: null, tables: null, percent: null });
      }
    })();
  }, []);

  // Checar termos pendentes e estado do turno após login (apenas primeira carga)
  useEffect(() => {
    const run = async () => {
      if (!user || turnoCheckDone) return;
      // Admins não recebem modal de turno
      if (isAdmin()) {
        setTurnoCheckDone(true);
        return;
      }
      try {
        // Verificar se há termos pendentes: se houver, não exibir modal de turno ainda
        const pendingRes = await statutesService.getPending();
        const hasPendencias = Array.isArray(pendingRes?.data) ? pendingRes.data.length > 0 : (Array.isArray(pendingRes) ? pendingRes.length > 0 : false);
        if (hasPendencias) { setTurnoCheckDone(true); return; }

        // Buscar turno atual
        try {
          const turnoRes = await turnosService.getCurrent();
          if (turnoRes?.success && turnoRes.data) {
            const turno = turnoRes.data;
            // Buscar nome de quem abriu
            let opener = null;
            try {
              const uRes = await userService.getById(turno.usuario_abertura);
              opener = uRes?.data || uRes?.user || null;
            } catch (errOpener) {
              console.debug('Falha ao obter usuário que abriu o turno (ignorado)', errOpener);
            }
            setTurnoModal({ open: true, stage: 'open-existing', loading: false, turno, opener });
          } else {
            // Prompt para abrir novo
            setTurnoModal({ open: true, stage: 'prompt-create', loading: false, turno: null, opener: null });
          }
        } catch {
          // 404 ou erro -> prompt criar
          setTurnoModal({ open: true, stage: 'prompt-create', loading: false, turno: null, opener: null });
        }
      } finally {
        setTurnoCheckDone(true);
      }
    };
    run();
  }, [user, turnoCheckDone, isAdmin]);

  const handleConfirmEnterTurno = async () => {
    if (turnoModal.turno?.id) {
      try {
        await turnosService.join(turnoModal.turno.id);
      } catch (errJoin) {
        console.debug('Falha ao registrar participação no turno (ignorado)', errJoin);
      }
    }
    setTurnoModal(m => ({ ...m, open: false }));
    if (turnoModal.turno?.id) {
      // Redireciona direto para o checklist de entrada conforme planejado (rota: /checklist-entrada/:turnoId)
      navigate(`/checklist-entrada/${turnoModal.turno.id}`);
    } else {
      navigate('/turnos');
    }
  };

  const handleDeclineCreateTurno = () => {
    setTurnoModal(m => ({ ...m, open: false }));
  };

  const handleCreateTurno = async () => {
    setTurnoModal(m => ({ ...m, loading: true }));
    try {
      // Tipo de turno simples baseado no horário
      const hora = new Date().getHours();
      const tipo_turno = (hora >= 6 && hora < 18) ? 'diurno' : 'noturno';
      const createRes = await turnosService.create({ tipo_turno });
      if (createRes?.success && createRes.data) {
        let opener = null;
        try {
          const uRes = await userService.getById(createRes.data.usuario_abertura);
          opener = uRes?.data || uRes?.user || null;
        } catch (errOpenerCreate) {
          console.debug('Falha ao obter usuário abertura turno recém criado (ignorado)', errOpenerCreate);
        }
        // Registrar o próprio usuário como participante também
        try {
          await turnosService.join(createRes.data.id);
        } catch (errJoinCreate) {
          console.debug('Falha ao registrar participação após criação do turno (ignorado)', errJoinCreate);
        }
        setTurnoModal({ open: true, stage: 'open-existing', loading: false, turno: createRes.data, opener });
      } else {
        setTurnoModal(m => ({ ...m, loading: false }));
      }
    } catch {
      setTurnoModal(m => ({ ...m, loading: false }));
    }
  };

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
      id: 'updates',
      title: 'Últimas Atualizações',
      description: 'Resumo das novidades e correções mais recentes',
      icon: TrendingUp,
      path: '/atualizacoes',
      adminOnly: false,
      color: 'bg-sky-600'
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
      id: 'pedidos-propaganda',
      title: 'Controle de Pedidos/Propaganda',
      description: 'Gerenciar pedidos e configuração do app de visualização TV',
      icon: Smartphone,
      path: '/admin/pedidos-propaganda',
      adminOnly: true,
      color: 'bg-purple-600'
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

  // Card dinâmico de Termos conforme perfil
  const termosItem = {
    id: 'termos-ciencia',
    title: 'Termos & Ciência',
    description: isAdmin() ? 'Gerenciar termos e ver ciência dos usuários' : 'Consultar termos que você já reconheceu',
    icon: Cog,
    path: isAdmin() ? '/admin/termos' : '/termos-usuario',
    adminOnly: false,
    color: 'bg-yellow-600'
  };

  // Garantir que o card de uso do banco fique sempre por último
  const filtered = menuItems.filter(item => !item.adminOnly || isAdmin());
  const dbCardIndex = filtered.findIndex(i => i.id === 'database');
  let dbCard = null;
  if (dbCardIndex !== -1) {
    dbCard = filtered.splice(dbCardIndex, 1)[0];
  }
  const availableItems = [...filtered, termosItem, ...(dbCard ? [dbCard] : [])];

  // Gate: não renderizar o dashboard até concluir checagem de turno/termos
  if (!turnoCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Preparando seu ambiente...</p>
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

      {turnoModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            {turnoModal.stage === 'open-existing' && (
              <>
                <h2 className="text-lg font-semibold">Turno em andamento</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {`Há um turno aberto.
Aberto por: ${turnoModal.opener?.nome_completo || turnoModal.opener?.email || 'Usuário'}
Iniciado em: ${turnoModal.turno?.horario_inicio ? new Date(turnoModal.turno.horario_inicio).toLocaleString() : 'N/D'}
Tipo: ${turnoModal.turno?.tipo_turno || 'N/D'}

Você será incluído automaticamente e redirecionado para a visão detalhada.
Em seguida, siga os passos do assistente.`}
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setTurnoModal(m => ({ ...m, open: false }))}>Agora não</Button>
                  <Button size="sm" onClick={handleConfirmEnterTurno}>Entrar no Turno</Button>
                </div>
              </>
            )}
            {turnoModal.stage === 'prompt-create' && (
              <>
                <h2 className="text-lg font-semibold">Nenhum turno aberto</h2>
                <p className="text-sm text-gray-700">
                  Não há turno aberto agora. Deseja iniciar seu turno abrindo um novo?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleDeclineCreateTurno}>Agora não</Button>
                  <Button size="sm" disabled={turnoModal.loading} onClick={handleCreateTurno}>
                    {turnoModal.loading ? 'Abrindo...' : 'Abrir Turno'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

