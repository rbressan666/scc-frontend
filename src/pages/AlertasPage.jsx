import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, AlertTriangle, CheckCircle, Eye, X, Package } from 'lucide-react';
import { alertasService } from '../services/api';
import { useAuth } from '../context/useAuth';

const AlertasPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    try {
      setError(null);
      const response = await alertasService.getAll();
      setAlertas(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      setError('Erro ao carregar alertas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertaId) => {
    try {
      const response = await alertasService.markAsRead(alertaId);
      if (response.success) {
        await fetchAlertas();
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
      alert(error.message || 'Erro ao marcar alerta como lido.');
    }
  };

  const handleResolveAlerta = async (alertaId) => {
    if (!isAdmin()) {
      alert('Apenas administradores podem resolver alertas.');
      return;
    }

    const resolucao = prompt('Digite a resolução do alerta:');
    if (!resolucao) return;

    try {
      const response = await alertasService.resolve(alertaId, { resolucao });
      if (response.success) {
        await fetchAlertas();
        alert('Alerta resolvido com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      alert(error.message || 'Erro ao resolver alerta.');
    }
  };

  const handleIgnoreAlerta = async (alertaId) => {
    if (!isAdmin()) {
      alert('Apenas administradores podem ignorar alertas.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja ignorar este alerta?')) {
      return;
    }

    try {
      const response = await alertasService.ignore(alertaId);
      if (response.success) {
        await fetchAlertas();
        alert('Alerta ignorado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao ignorar alerta:', error);
      alert(error.message || 'Erro ao ignorar alerta.');
    }
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

  const getStatusBadge = (status) => {
    const configs = {
      ativo: { color: 'bg-red-500', text: 'Ativo' },
      lido: { color: 'bg-blue-500', text: 'Lido' },
      resolvido: { color: 'bg-green-500', text: 'Resolvido' },
      ignorado: { color: 'bg-gray-500', text: 'Ignorado' }
    };
    
    const config = configs[status] || configs.ativo;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTipoAlertaIcon = (tipo) => {
    const icons = {
      compra_urgente: AlertTriangle,
      parecer_operador: Eye,
      variacao_suspeita: AlertTriangle,
      produto_zerado: X
    };
    
    const IconComponent = icons[tipo] || AlertTriangle;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filterAlertas = (alertas, filter) => {
    switch (filter) {
      case 'ativos':
        return alertas.filter(a => a.status === 'ativo');
      case 'lidos':
        return alertas.filter(a => a.status === 'lido');
      case 'resolvidos':
        return alertas.filter(a => a.status === 'resolvido');
      case 'urgentes':
        return alertas.filter(a => a.prioridade === 'urgente');
      default:
        return alertas;
    }
  };

  const filteredAlertas = filterAlertas(alertas, activeTab);

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
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Alertas do Sistema</h1>
                  <p className="text-sm text-gray-500">Gerenciar alertas de contagem</p>
                </div>
              </div>
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

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{alertas.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {alertas.filter(a => a.status === 'ativo').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {alertas.filter(a => a.prioridade === 'urgente').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {alertas.filter(a => a.status === 'resolvido').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="ativos">Ativos</TabsTrigger>
                <TabsTrigger value="urgentes">Urgentes</TabsTrigger>
                <TabsTrigger value="lidos">Lidos</TabsTrigger>
                <TabsTrigger value="resolvidos">Resolvidos</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredAlertas.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum alerta encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAlertas.map((alerta) => (
                      <div
                        key={alerta.id}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          alerta.status === 'ativo' ? 'border-red-200 bg-red-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {getTipoAlertaIcon(alerta.tipo_alerta)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{alerta.titulo}</h4>
                              <p className="text-sm text-gray-600 mt-1">{alerta.descricao}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getPrioridadeBadge(alerta.prioridade)}
                            {getStatusBadge(alerta.status)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Criado em: {formatDateTime(alerta.created_at)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {alerta.status === 'ativo' && (
                              <Button
                                onClick={() => handleMarkAsRead(alerta.id)}
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                Marcar como Lido
                              </Button>
                            )}
                            
                            {(alerta.status === 'ativo' || alerta.status === 'lido') && isAdmin() && (
                              <>
                                <Button
                                  onClick={() => handleResolveAlerta(alerta.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Resolver
                                </Button>
                                <Button
                                  onClick={() => handleIgnoreAlerta(alerta.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-600 border-gray-600 hover:bg-gray-50"
                                >
                                  Ignorar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {alerta.resolucao && (
                          <div className="mt-3 pt-3 border-t bg-green-50 rounded p-2">
                            <span className="text-green-700 text-sm font-medium">Resolução:</span>
                            <p className="text-sm text-green-600">{alerta.resolucao}</p>
                          </div>
                        )}
                      </div>
                    ))}
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
