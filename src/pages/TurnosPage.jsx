import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, Clock, User, Calendar, AlertCircle, Package } from 'lucide-react';
import { turnosService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TurnosPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [turnoAtual, setTurnoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingTurno, setCreatingTurno] = useState(false);

  useEffect(() => {
    fetchTurnos();
    fetchTurnoAtual();
  }, []);

  const fetchTurnos = async () => {
    try {
      setError(null);
      const response = await turnosService.getAll();
      setTurnos(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar turnos:', error);
      setError('Erro ao carregar turnos. Tente novamente.');
    }
  };

  const fetchTurnoAtual = async () => {
    try {
      const response = await turnosService.getCurrent();
      setTurnoAtual(response.data);
    } catch (error) {
      // Se não há turno atual, não é erro
      if (error.status !== 404) {
        console.error('Erro ao buscar turno atual:', error);
      }
      setTurnoAtual(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTurno = async () => {
    if (turnoAtual) {
      alert('Já existe um turno aberto. Feche o turno atual antes de abrir um novo.');
      return;
    }

    setCreatingTurno(true);
    try {
      const novoTurno = {
        tipo_turno: 'diurno', // Por padrão, pode ser alterado futuramente
        observacoes_abertura: 'Turno criado pelo sistema'
      };

      const response = await turnosService.create(novoTurno);
      
      if (response.success) {
        await fetchTurnos();
        await fetchTurnoAtual();
        alert('Turno criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar turno:', error);
      alert(error.message || 'Erro ao criar turno. Tente novamente.');
    } finally {
      setCreatingTurno(false);
    }
  };

  const handleCloseTurno = async (turnoId) => {
    if (!window.confirm('Tem certeza que deseja fechar este turno?')) {
      return;
    }

    try {
      const dadosFechamento = {
        observacoes_fechamento: 'Turno fechado pelo usuário'
      };

      const response = await turnosService.close(turnoId, dadosFechamento);
      
      if (response.success) {
        await fetchTurnos();
        await fetchTurnoAtual();
        alert('Turno fechado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao fechar turno:', error);
      alert(error.message || 'Erro ao fechar turno. Tente novamente.');
    }
  };

  const handleReopenTurno = async (turnoId) => {
    if (!isAdmin()) {
      alert('Apenas administradores podem reabrir turnos.');
      return;
    }

    if (turnoAtual) {
      alert('Já existe um turno aberto. Feche o turno atual antes de reabrir outro.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja reabrir este turno?')) {
      return;
    }

    try {
      const response = await turnosService.reopen(turnoId);
      
      if (response.success) {
        await fetchTurnos();
        await fetchTurnoAtual();
        alert('Turno reaberto com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao reabrir turno:', error);
      alert(error.message || 'Erro ao reabrir turno. Tente novamente.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      aberto: { variant: 'default', text: 'Aberto', color: 'bg-green-500' },
      fechado: { variant: 'secondary', text: 'Fechado', color: 'bg-gray-500' },
      em_progresso: { variant: 'default', text: 'Em Progresso', color: 'bg-blue-500' }
    };
    
    const config = statusConfig[status] || statusConfig.aberto;
    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
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
          <p className="mt-4 text-gray-600">Carregando turnos...</p>
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
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestão de Turnos</h1>
                  <p className="text-sm text-gray-500">Gerenciar turnos de trabalho</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCreateTurno}
                disabled={creatingTurno || !!turnoAtual}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{creatingTurno ? 'Criando...' : 'Novo Turno'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Alerta se há turno aberto */}
        {turnoAtual && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Turno Ativo</h3>
                <p className="text-sm text-blue-700">
                  Há um turno aberto desde {formatDateTime(turnoAtual.horario_inicio)}. 
                  Feche o turno atual antes de abrir um novo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Lista de Turnos */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            {turnos.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum turno encontrado</p>
                <p className="text-sm text-gray-400">Crie um novo turno para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {turnos.map((turno) => (
                  <div
                    key={turno.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">
                          Turno {turno.tipo_turno} - {formatDate(turno.data_turno)}
                        </h4>
                        {getStatusBadge(turno.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {turno.status === 'aberto' && (
                          <Button
                            onClick={() => handleCloseTurno(turno.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Fechar Turno
                          </Button>
                        )}
                        {turno.status === 'fechado' && isAdmin() && (
                          <Button
                            onClick={() => handleReopenTurno(turno.id)}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Reabrir
                          </Button>
                        )}
                        <Button
                          onClick={() => navigate(`/turnos/${turno.id}`)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Início:</span>
                        <p className="font-medium">{formatDateTime(turno.horario_inicio)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fim:</span>
                        <p className="font-medium">{formatDateTime(turno.horario_fim)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Responsável:</span>
                        <p className="font-medium">{turno.usuario_abertura}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{turno.status}</p>
                      </div>
                    </div>

                    {turno.observacoes_abertura && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-gray-500 text-sm">Observações:</span>
                        <p className="text-sm">{turno.observacoes_abertura}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TurnosPage;
