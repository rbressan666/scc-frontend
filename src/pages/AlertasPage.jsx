import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, AlertTriangle, Bell, CheckCircle, X, MessageSquare } from 'lucide-react';

const AlertasPage = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');

  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    try {
      // Simular dados para demonstração
      const mockAlertas = [
        {
          id: '1',
          tipo_alerta: 'compra_urgente',
          prioridade: 'urgente',
          titulo: 'Compra Urgente - Heineken 600ml',
          descricao: 'Estoque zerado (era 20, agora 0)',
          status: 'ativo',
          usuario_gerador: 'João Silva',
          created_at: '2025-09-26T10:30:00Z',
          dados_contexto: { produto: 'Heineken 600ml', quantidade_anterior: 20, quantidade_atual: 0 }
        },
        {
          id: '2',
          tipo_alerta: 'variacao_inconsistente',
          prioridade: 'alta',
          titulo: 'Variação Inconsistente - Limão',
          descricao: 'Aumento suspeito (era 20, agora 35)',
          status: 'ativo',
          usuario_gerador: 'Maria Santos',
          created_at: '2025-09-26T09:15:00Z',
          dados_contexto: { produto: 'Limão', quantidade_anterior: 20, quantidade_atual: 35 }
        },
        {
          id: '3',
          tipo_alerta: 'parecer_operador',
          prioridade: 'alta',
          titulo: 'Parecer do Operador',
          descricao: 'Urgente: festa no próximo turno, comprar chopp IPA',
          status: 'ativo',
          usuario_gerador: 'João Silva',
          created_at: '2025-09-26T08:45:00Z',
          dados_contexto: { parecer: 'Urgente: festa no próximo turno, comprar chopp IPA' }
        },
        {
          id: '4',
          tipo_alerta: 'estoque_baixo',
          prioridade: 'media',
          titulo: 'Estoque Baixo - Coca-Cola Lata',
          descricao: 'Estoque abaixo do mínimo (atual: 5, mínimo: 10)',
          status: 'lido',
          usuario_gerador: 'Maria Santos',
          created_at: '2025-09-25T16:20:00Z',
          dados_contexto: { produto: 'Coca-Cola Lata', quantidade_atual: 5, minimo: 10 }
        }
      ];
      setAlertas(mockAlertas);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      setLoading(false);
    }
  };

  const getPrioridadeConfig = (prioridade) => {
    const configs = {
      urgente: { 
        icon: AlertTriangle, 
        color: 'bg-red-500', 
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      alta: { 
        icon: AlertTriangle, 
        color: 'bg-orange-500', 
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      media: { 
        icon: Bell, 
        color: 'bg-yellow-500', 
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      baixa: { 
        icon: Bell, 
        color: 'bg-blue-500', 
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    };
    return configs[prioridade] || configs.media;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ativo: { variant: 'default', text: 'Ativo', color: 'bg-red-500' },
      lido: { variant: 'secondary', text: 'Lido', color: 'bg-gray-500' },
      resolvido: { variant: 'secondary', text: 'Resolvido', color: 'bg-green-500' },
      ignorado: { variant: 'outline', text: 'Ignorado', color: 'bg-gray-400' }
    };
    
    const config = statusConfig[status] || statusConfig.ativo;
    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      compra_urgente: AlertTriangle,
      variacao_inconsistente: AlertTriangle,
      parecer_operador: MessageSquare,
      estoque_baixo: Bell,
      falha_contagem: X
    };
    return icons[tipo] || Bell;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleMarcarComoLido = async (alertaId) => {
    try {
      // Aqui seria feita a chamada para a API
      setAlertas(prev => 
        prev.map(alerta => 
          alerta.id === alertaId 
            ? { ...alerta, status: 'lido' }
            : alerta
        )
      );
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const handleResolver = async (alertaId) => {
    try {
      // Aqui seria feita a chamada para a API
      setAlertas(prev => 
        prev.map(alerta => 
          alerta.id === alertaId 
            ? { ...alerta, status: 'resolvido' }
            : alerta
        )
      );
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const alertasFiltrados = alertas.filter(alerta => {
    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'ativos') return alerta.status === 'ativo';
    if (filtroAtivo === 'lidos') return alerta.status === 'lido';
    if (filtroAtivo === 'resolvidos') return alerta.status === 'resolvido';
    return alerta.prioridade === filtroAtivo;
  });

  const contadores = {
    todos: alertas.length,
    ativos: alertas.filter(a => a.status === 'ativo').length,
    urgente: alertas.filter(a => a.prioridade === 'urgente').length,
    alta: alertas.filter(a => a.prioridade === 'alta').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 text-white p-2 rounded-lg">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">SCC - Alertas</h1>
                  <p className="text-sm text-gray-500">Sistema de Alertas e Notificações</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-red-600 border-red-600">
                {contadores.ativos} ativo{contadores.ativos !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">
                {contadores.todos} total
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filtroAtivo} onValueChange={setFiltroAtivo}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="todos">Todos ({contadores.todos})</TabsTrigger>
                <TabsTrigger value="ativos">Ativos ({contadores.ativos})</TabsTrigger>
                <TabsTrigger value="urgente">Urgente ({contadores.urgente})</TabsTrigger>
                <TabsTrigger value="alta">Alta ({contadores.alta})</TabsTrigger>
                <TabsTrigger value="lidos">Lidos</TabsTrigger>
                <TabsTrigger value="resolvidos">Resolvidos</TabsTrigger>
              </TabsList>

              <TabsContent value={filtroAtivo} className="mt-6">
                {alertasFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta encontrado</h3>
                    <p className="text-gray-500">Não há alertas para o filtro selecionado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alertasFiltrados.map((alerta) => {
                      const prioridadeConfig = getPrioridadeConfig(alerta.prioridade);
                      const TipoIcon = getTipoIcon(alerta.tipo_alerta);
                      
                      return (
                        <div
                          key={alerta.id}
                          className={`border rounded-lg p-4 ${prioridadeConfig.bgColor} ${prioridadeConfig.borderColor} hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3">
                              <div className={`${prioridadeConfig.color} text-white p-2 rounded-lg`}>
                                <TipoIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-medium ${prioridadeConfig.textColor} mb-1`}>
                                  {alerta.titulo}
                                </h4>
                                <p className="text-gray-700 text-sm mb-2">{alerta.descricao}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Por: {alerta.usuario_gerador}</span>
                                  <span>{formatDateTime(alerta.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${prioridadeConfig.color} text-white`}>
                                {alerta.prioridade.toUpperCase()}
                              </Badge>
                              {getStatusBadge(alerta.status)}
                            </div>
                          </div>
                          
                          {alerta.status === 'ativo' && (
                            <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarcarComoLido(alerta.id)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marcar como Lido
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleResolver(alerta.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Resolver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-600 border-gray-600 hover:bg-gray-50"
                              >
                                Ignorar
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AlertasPage;
