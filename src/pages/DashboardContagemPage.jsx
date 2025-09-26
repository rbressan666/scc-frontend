import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, Clock, Package, AlertTriangle, Users, TrendingUp, CheckCircle } from 'lucide-react';

const DashboardContagemPage = () => {
  const navigate = useNavigate();
  const [turnoAtual, setTurnoAtual] = useState(null);
  const [contagensAndamento, setContagensAndamento] = useState([]);
  const [alertasRecentes, setAlertasRecentes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simular dados para demonstração
      const mockTurnoAtual = {
        id: '1',
        data_turno: '2025-09-26',
        tipo_turno: 'diurno',
        horario_inicio: '2025-09-26T08:00:00Z',
        status: 'aberto',
        usuario_abertura: 'João Silva'
      };

      const mockContagens = [
        {
          id: '1',
          tipo_contagem: 'inicial',
          status: 'em_andamento',
          usuario_responsavel: 'João Silva',
          total_itens_contados: 15,
          progresso: 65,
          tempo_decorrido: 45
        },
        {
          id: '2',
          tipo_contagem: 'final',
          status: 'pre_fechada',
          usuario_responsavel: 'Maria Santos',
          total_itens_contados: 23,
          progresso: 100,
          tempo_decorrido: 120
        }
      ];

      const mockAlertas = [
        {
          id: '1',
          tipo_alerta: 'compra_urgente',
          prioridade: 'urgente',
          titulo: 'Compra Urgente - Heineken 600ml',
          created_at: '2025-09-26T10:30:00Z'
        },
        {
          id: '2',
          tipo_alerta: 'parecer_operador',
          prioridade: 'alta',
          titulo: 'Parecer do Operador',
          created_at: '2025-09-26T08:45:00Z'
        }
      ];

      const mockEstatisticas = {
        totalProdutos: 150,
        produtosContados: 98,
        percentualConcluido: 65,
        tempoMedio: 2.5,
        operadoresAtivos: 3,
        alertasAtivos: 5
      };

      setTurnoAtual(mockTurnoAtual);
      setContagensAndamento(mockContagens);
      setAlertasRecentes(mockAlertas);
      setEstatisticas(mockEstatisticas);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      em_andamento: { variant: 'default', text: 'Em Andamento', color: 'bg-blue-500' },
      pre_fechada: { variant: 'secondary', text: 'Pré-fechada', color: 'bg-yellow-500' },
      fechada: { variant: 'secondary', text: 'Fechada', color: 'bg-green-500' }
    };
    
    const config = statusConfig[status] || statusConfig.em_andamento;
    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade) => {
    const configs = {
      urgente: { color: 'bg-red-500', text: 'Urgente' },
      alta: { color: 'bg-orange-500', text: 'Alta' },
      media: { color: 'bg-yellow-500', text: 'Média' },
      baixa: { color: 'bg-blue-500', text: 'Baixa' }
    };
    
    const config = configs[prioridade] || configs.media;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
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
                <div className="bg-purple-600 text-white p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard de Contagem</h1>
                  <p className="text-sm text-gray-500">Visão Geral do Turno Atual</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Turno Ativo
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Informações do Turno Atual */}
        {turnoAtual && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Turno Atual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Data:</span>
                  <p className="font-medium">{formatDate(turnoAtual.data_turno)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <p className="font-medium capitalize">{turnoAtual.tipo_turno}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Início:</span>
                  <p className="font-medium">{formatDateTime(turnoAtual.horario_inicio)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Responsável:</span>
                  <p className="font-medium">{turnoAtual.usuario_abertura}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Produtos Contados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {estatisticas.produtosContados}/{estatisticas.totalProdutos}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <Progress value={estatisticas.percentualConcluido} className="mt-3" />
              <p className="text-xs text-gray-500 mt-1">{estatisticas.percentualConcluido}% concluído</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Operadores Ativos</p>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.operadoresAtivos}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-purple-600">{estatisticas.tempoMedio}h</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.alertasAtivos}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contagens em Andamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Contagens em Andamento</span>
                <Button
                  onClick={() => navigate('/contagens/nova')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nova Contagem
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contagensAndamento.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma contagem em andamento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contagensAndamento.map((contagem) => (
                    <div
                      key={contagem.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/contagem/${contagem.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">Contagem {contagem.tipo_contagem}</h4>
                          {getStatusBadge(contagem.status)}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{contagem.usuario_responsavel}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso:</span>
                          <span>{contagem.progresso}%</span>
                        </div>
                        <Progress value={contagem.progresso} />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Itens contados: {contagem.total_itens_contados}</span>
                          <span>Tempo: {contagem.tempo_decorrido}min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Alertas Recentes</span>
                <Button
                  onClick={() => navigate('/alertas')}
                  size="sm"
                  variant="outline"
                >
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertasRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum alerta recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertasRecentes.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/alertas/${alerta.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{alerta.titulo}</h4>
                        {getPrioridadeBadge(alerta.prioridade)}
                      </div>
                      <p className="text-xs text-gray-500">{formatDateTime(alerta.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardContagemPage;
