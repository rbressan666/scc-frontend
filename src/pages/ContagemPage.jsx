import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Package, Scan, Plus, Check, Clock, User } from 'lucide-react';

const ContagemPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const [contagem, setContagem] = useState(null);
  const [itensContados, setItensContados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [parecerOperador, setParecerOperador] = useState('');

  useEffect(() => {
    fetchContagem();
  }, [turnoId]);

  const fetchContagem = async () => {
    try {
      // Simular dados para demonstração
      const mockContagem = {
        id: '1',
        turno_id: turnoId,
        tipo_contagem: 'inicial',
        status: 'em_andamento',
        usuario_responsavel: 'João Silva',
        data_inicio: '2025-09-26T08:30:00Z',
        total_itens_contados: 15
      };

      const mockItens = [
        {
          id: '1',
          variacao_id: '1',
          produto_nome: 'Heineken 600ml',
          quantidade_contada: 24,
          unidade_medida: 'un',
          quantidade_convertida: 24,
          usuario_contador: 'João Silva',
          data_contagem: '2025-09-26T09:00:00Z'
        },
        {
          id: '2',
          variacao_id: '2',
          produto_nome: 'Coca-Cola Lata 350ml',
          quantidade_contada: 48,
          unidade_medida: 'un',
          quantidade_convertida: 48,
          usuario_contador: 'João Silva',
          data_contagem: '2025-09-26T09:15:00Z'
        }
      ];

      setContagem(mockContagem);
      setItensContados(mockItens);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar contagem:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      em_andamento: { variant: 'default', text: 'Em Andamento', color: 'bg-blue-500' },
      pre_fechada: { variant: 'secondary', text: 'Pré-fechada', color: 'bg-yellow-500' },
      fechada: { variant: 'secondary', text: 'Fechada', color: 'bg-green-500' },
      reaberta: { variant: 'destructive', text: 'Reaberta', color: 'bg-orange-500' }
    };
    
    const config = statusConfig[status] || statusConfig.em_andamento;
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

  const handlePreClose = async () => {
    try {
      // Aqui seria feita a chamada para a API
      console.log('Pré-fechando contagem com parecer:', parecerOperador);
      // Atualizar status local
      setContagem(prev => ({ ...prev, status: 'pre_fechada' }));
    } catch (error) {
      console.error('Erro ao pré-fechar contagem:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contagem...</p>
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
                onClick={() => navigate(`/turnos/${turnoId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contagem {contagem?.tipo_contagem}</h1>
                  <p className="text-sm text-gray-500">Turno: {turnoId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(contagem?.status)}
              <Button
                onClick={() => setShowScanner(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Scan className="h-4 w-4" />
                <span>Scanner</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações da Contagem */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Informações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Responsável:</span>
                  <p className="font-medium">{contagem?.usuario_responsavel}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Início:</span>
                  <p className="font-medium">{formatDateTime(contagem?.data_inicio)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Itens Contados:</span>
                  <p className="font-medium text-2xl text-green-600">{contagem?.total_itens_contados}</p>
                </div>
                
                {contagem?.status === 'em_andamento' && (
                  <div className="space-y-3 pt-4 border-t">
                    <label className="text-sm font-medium text-gray-700">
                      Parecer do Operador:
                    </label>
                    <Textarea
                      value={parecerOperador}
                      onChange={(e) => setParecerOperador(e.target.value)}
                      placeholder="Adicione observações sobre a contagem..."
                      rows={3}
                    />
                    <Button
                      onClick={handlePreClose}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={!parecerOperador.trim()}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Concluir Contagem
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Itens Contados */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Itens Contados</span>
                  <Button
                    onClick={() => navigate(`/contagem/${contagem?.id}/adicionar`)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {itensContados.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item contado</h3>
                    <p className="text-gray-500 mb-4">Use o scanner ou adicione itens manualmente.</p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        onClick={() => setShowScanner(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Scan className="h-4 w-4 mr-2" />
                        Usar Scanner
                      </Button>
                      <Button
                        onClick={() => navigate(`/contagem/${contagem?.id}/adicionar`)}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Manual
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itensContados.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{item.produto_nome}</h4>
                          <Badge variant="outline">
                            {item.quantidade_contada} {item.unidade_medida}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{item.usuario_contador}</span>
                          </div>
                          <span>{formatDateTime(item.data_contagem)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContagemPage;
