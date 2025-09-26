import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, Clock, User, Calendar } from 'lucide-react';

const TurnosPage = () => {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    try {
      // Simular dados para demonstração
      const mockTurnos = [
        {
          id: '1',
          data_turno: '2025-09-26',
          tipo_turno: 'diurno',
          horario_inicio: '2025-09-26T08:00:00Z',
          horario_fim: null,
          status: 'aberto',
          usuario_abertura: 'João Silva',
          observacoes_abertura: 'Turno normal'
        },
        {
          id: '2',
          data_turno: '2025-09-25',
          tipo_turno: 'noturno',
          horario_inicio: '2025-09-25T20:00:00Z',
          horario_fim: '2025-09-26T06:00:00Z',
          status: 'fechado',
          usuario_abertura: 'Maria Santos',
          observacoes_abertura: 'Turno com evento especial'
        }
      ];
      setTurnos(mockTurnos);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar turnos:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      aberto: { variant: 'default', text: 'Aberto', color: 'bg-green-500' },
      fechado: { variant: 'secondary', text: 'Fechado', color: 'bg-gray-500' },
      cancelado: { variant: 'destructive', text: 'Cancelado', color: 'bg-red-500' }
    };
    
    const config = statusConfig[status] || statusConfig.aberto;
    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTipoTurnoBadge = (tipo) => {
    const tipoConfig = {
      diurno: { text: 'Diurno', color: 'bg-blue-500' },
      noturno: { text: 'Noturno', color: 'bg-purple-500' },
      especial: { text: 'Especial', color: 'bg-orange-500' }
    };
    
    const config = tipoConfig[tipo] || tipoConfig.diurno;
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
                  <h1 className="text-2xl font-bold text-gray-900">SCC - Turnos</h1>
                  <p className="text-sm text-gray-500">Gestão de Turnos de Trabalho</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/turnos/novo')}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Turno</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Turnos</span>
              <Badge variant="outline" className="text-sm">
                {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {turnos.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum turno encontrado</h3>
                <p className="text-gray-500 mb-4">Comece criando um novo turno de trabalho.</p>
                <Button
                  onClick={() => navigate('/turnos/novo')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Turno
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {turnos.map((turno) => (
                  <div
                    key={turno.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/turnos/${turno.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDate(turno.data_turno)}</span>
                        </div>
                        {getTipoTurnoBadge(turno.tipo_turno)}
                        {getStatusBadge(turno.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>{turno.usuario_abertura}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Início:</span>
                        <p className="font-medium">{formatDateTime(turno.horario_inicio)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fim:</span>
                        <p className="font-medium">{formatDateTime(turno.horario_fim)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Observações:</span>
                        <p className="font-medium truncate">{turno.observacoes_abertura || '-'}</p>
                      </div>
                    </div>
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
