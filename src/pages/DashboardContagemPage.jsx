import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, Clock, Package, AlertTriangle, Users, CheckCircle, X, Play, Square } from 'lucide-react';
import { turnosService, contagensService, alertasService, userService, produtoService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardContagemPage = () => {
  const navigate = useNavigate();
  const { id: turnoId } = useParams();
  const { isAdmin } = useAuth();
  const [turno, setTurno] = useState(null);
  const [contagens, setContagens] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (turnoId) {
      fetchDashboardData();
    }
  }, [turnoId]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Buscar dados em paralelo
      const [turnoRes, contagensRes, alertasRes, usuariosRes, produtosRes] = await Promise.allSettled([
        turnosService.getById(turnoId),
        contagensService.getByTurno(turnoId),
        alertasService.getAll(),
        userService.getAll(),
        produtoService.getAll()
      ]);

      // Processar turno
      if (turnoRes.status === 'fulfilled') {
        setTurno(turnoRes.value.data);
      }

      // Processar contagens
      if (contagensRes.status === 'fulfilled') {
        setContagens(contagensRes.value.data || []);
      }

      // Processar alertas (filtrar apenas os ativos)
      if (alertasRes.status === 'fulfilled') {
        const alertasAtivos = (alertasRes.value.data || []).filter(a => a.status === 'ativo');
        setAlertas(alertasAtivos);
      }

      // Processar usuários ativos
      if (usuariosRes.status === 'fulfilled') {
        const usuariosAtivos = (usuariosRes.value.data || []).filter(u => u.ativo);
        setUsuarios(usuariosAtivos);
      }

      // Processar produtos
      if (produtosRes.status === 'fulfilled') {
        setProdutos(produtosRes.value.data || []);
      }

      // Calcular estatísticas
      calcularEstatisticas(contagensRes.value?.data || [], produtosRes.value?.data || []);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (contagens, produtos) => {
    const totalProdutos = produtos.length;
    let produtosContados = 0;
    
    // Contar produtos que já foram contados
    contagens.forEach(contagem => {
      if (contagem.total_itens_contados > 0) {
        produtosContados += contagem.total_itens_contados;
      }
    });

    const percentualConcluido = totalProdutos > 0 ? Math.round((produtosContados / totalProdutos) * 100) : 0;

    setEstatisticas({
      totalProdutos,
      produtosContados,
      percentualConcluido: Math.min(percentualConcluido, 100), // Limitar a 100%
      operadoresAtivos: usuarios.filter(u => u.ativo).length,
      alertasAtivos: alertas.length
    });
  };

  const handleFecharTurno = async () => {
    if (!window.confirm('Tem certeza que deseja fechar este turno?')) {
      return;
    }

    try {
      const response = await turnosService.close(turnoId, {
        observacoes_fechamento: 'Turno fechado via dashboard'
      });
      
      if (response.success) {
        alert('Turno fechado com sucesso!');
        navigate('/turnos');
      }
    } catch (error) {
      console.error('Erro ao fechar turno:', error);
      alert(error.message || 'Erro ao fechar turno.');
    }
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

  if (!turno) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500">Turno não encontrado</p>
          <Button onClick={() => navigate('/turnos')} className="mt-4">
            Voltar aos Turnos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Turno */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/turnos')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Turno {turno.tipo_turno} - {formatDate(turno.data_turno)}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Início: {formatDateTime(turno.horario_inicio)}</span>
                    <span>•</span>
                    <span>Responsável: {turno.usuario_abertura}</span>
                    <span>•</span>
                    <Badge className="bg-green-500 text-white">Ativo</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin() && (
                <Button
                  onClick={handleFecharTurno}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Fechar Turno
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Estatísticas Rápidas - Cards Compactos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">Progresso</p>
                  <p className="text-lg font-bold text-gray-900">{estatisticas.produtosContados}/{estatisticas.totalProdutos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">Operadores</p>
                  <p className="text-lg font-bold text-gray-900">{usuarios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">Alertas</p>
                  <p className="text-lg font-bold text-gray-900">{alertas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">Contagens</p>
                  <p className="text-lg font-bold text-gray-900">{contagens.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Atividades do Turno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Checklist de Entrada */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Checklist de Entrada</span>
                  <Badge className="bg-green-500 text-white text-xs">Concluído</Badge>
                </div>
                <Button
                  onClick={() => navigate(`/checklist-entrada/${turnoId}`)}
                  size="sm"
                  variant="outline"
                >
                  Abrir
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Verificação de equipamentos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Conferência de produtos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Validação de sistema</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contagens Ativas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>Contagens</span>
                </div>
                <Button
                  onClick={() => navigate(`/contagem/${turnoId}`)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {contagens.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma contagem iniciada</p>
              ) : (
                <div className="space-y-2">
                  {contagens.slice(0, 3).map((contagem) => (
                    <div key={contagem.id} className="flex items-center justify-between text-sm">
                      <span>{contagem.tipo_contagem}</span>
                      <Badge className="bg-blue-500 text-white text-xs">
                        {contagem.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas Ativos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Alertas</span>
                  {alertas.length > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {alertas.length}
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => navigate('/alertas')}
                  size="sm"
                  variant="outline"
                >
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {alertas.length === 0 ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Nenhum alerta ativo</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertas.slice(0, 3).map((alerta) => (
                    <div key={alerta.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{alerta.titulo}</span>
                      <Badge className="bg-red-500 text-white text-xs">
                        {alerta.prioridade}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist de Saída */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <X className="h-5 w-5 text-gray-400" />
                  <span>Checklist de Saída</span>
                  <Badge variant="outline" className="text-xs">Pendente</Badge>
                </div>
                <Button
                  onClick={() => navigate(`/checklist-saida/${turnoId}`)}
                  size="sm"
                  variant="outline"
                >
                  Abrir
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded"></div>
                  <span>Finalizar contagens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded"></div>
                  <span>Resolver alertas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded"></div>
                  <span>Gerar relatórios</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardContagemPage;
