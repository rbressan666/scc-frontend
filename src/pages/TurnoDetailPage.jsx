import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, Save, Check } from 'lucide-react';
import { turnosService } from '../services/api';
import { useToast } from '../components/ui/use-toast';

const TurnoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [turno, setTurno] = useState(null);
  const [comparacao, setComparacao] = useState([]);
  const [contagensInfo, setContagensInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItems, setEditingItems] = useState({});
  const [savingItems, setSavingItems] = useState({});
  const [inicandoNovaContagem, setInicandoNovaContagem] = useState(false);

  const fetchTurnoDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await turnosService.getDetail(id);
      
      if (response.success) {
        setTurno(response.data.turno);
        setComparacao(response.data.comparacao || []);
        setContagensInfo(response.data.contagens || []);
      } else {
        setError(response.message || 'Erro ao carregar turno');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhe do turno:', err);
      setError('Erro ao carregar detalhe do turno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTurnoDetail();
  }, [fetchTurnoDetail]);

  const handleEditQuantidade = (produtoId, novaQuantidade) => {
    setEditingItems({
      ...editingItems,
      [produtoId]: novaQuantidade
    });
  };

  const handleSalvarItem = async (item) => {
    const quantidade = editingItems[item.produto_id] !== undefined 
      ? editingItems[item.produto_id] 
      : item.contagem_atual;

    try {
      setSavingItems({ ...savingItems, [item.produto_id]: true });
      
      await turnosService.saveContagemItem({
        contagemId: item.contagem_id_atual,
        variacaoId: item.variacao_id,
        quantidade: Number(quantidade),
        unidadeMedidaId: '1', // TODO: Obter unidade padrão do produto
        observacoes: ''
      });

      toast({
        title: 'Sucesso',
        description: `Produto contado com sucesso`,
        variant: 'default'
      });

      // Remover do estado de edição
      const novoEditando = { ...editingItems };
      delete novoEditando[item.produto_id];
      setEditingItems(novoEditando);

      // Recarregar dados
      fetchTurnoDetail();
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar item de contagem',
        variant: 'destructive'
      });
    } finally {
      setSavingItems({ ...savingItems, [item.produto_id]: false });
    }
  };

  const handleIniciarNovaContagem = async () => {
    try {
      setInicandoNovaContagem(true);

      // 1. Finalizar contagem atual
      if (contagensInfo.length > 0) {
        const contagemAtual = contagensInfo[0];
        await turnosService.finalizarContagem(contagemAtual.id);
      }

      // 2. Iniciar nova contagem
      const novaContagemResult = await turnosService.iniciarNovaContagem();

      if (novaContagemResult.success) {
        toast({
          title: 'Sucesso',
          description: 'Nova contagem iniciada',
          variant: 'default'
        });

        // Limpar edições
        setEditingItems({});

        // Recarregar dados
        fetchTurnoDetail();
      }
    } catch (err) {
      console.error('Erro ao iniciar nova contagem:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar nova contagem',
        variant: 'destructive'
      });
    } finally {
      setInicandoNovaContagem(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Carregando dados do turno...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="text-lg text-gray-600">Turno não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhe do Turno</h1>
        </div>
        <Button 
          onClick={handleIniciarNovaContagem}
          disabled={inicandoNovaContagem}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Iniciar Nova Contagem
        </Button>
      </div>

      {/* Turno Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {turno.tipo_turno?.toUpperCase() || 'TURNO'} - {new Date(turno.data_turno).toLocaleDateString('pt-BR')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Início</p>
              <p className="font-semibold">
                {new Date(turno.horario_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={turno.status === 'aberto' ? 'default' : 'secondary'}>
                {turno.status?.toUpperCase() || 'DESCONHECIDO'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contagens */}
      <Card>
        <CardHeader>
          <CardTitle>Contagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contagensInfo.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contagensInfo.map((contagem, index) => (
                <div key={contagem.id} className="rounded border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">{index === 0 ? 'Contagem mais recente' : 'Contagem anterior'}</p>
                  <p className="text-sm font-semibold">{contagem.tipo_contagem || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{contagem.status?.replace('_', ' ') || 'Sem status'}</p>
                  <p className="text-xs text-gray-500">
                    {contagem.data_inicio ? new Date(contagem.data_inicio).toLocaleString('pt-BR') : 'Data não informada'}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-2 font-semibold">Produto</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Anterior</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Atual</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Saldo</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Ação</th>
                </tr>
              </thead>
              <tbody>
                {comparacao.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      Nenhum produto cadastrado
                    </td>
                  </tr>
                ) : (
                  comparacao.map((item) => {
                    const anterior = Number(item.contagem_anterior || 0);
                    const atual = editingItems[item.produto_id] !== undefined 
                      ? Number(editingItems[item.produto_id])
                      : Number(item.contagem_atual || 0);
                    const saldo = atual - anterior;
                    const estaEditando = editingItems[item.produto_id] !== undefined;

                    return (
                      <tr key={`${item.produto_id}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {item.produto_nome || 'Produto sem nome'}
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="secondary">{anterior.toFixed(1)} un</Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          {estaEditando ? (
                            <input
                              type="number"
                              step="0.001"
                              value={editingItems[item.produto_id]}
                              onChange={(e) => handleEditQuantidade(item.produto_id, e.target.value)}
                              className="w-20 px-2 py-1 border rounded text-center"
                              autoFocus
                            />
                          ) : (
                            <Badge variant="default">{atual.toFixed(1)} un</Badge>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={saldo >= 0 ? 'default' : 'destructive'}>
                            {saldo.toFixed(1)} un
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          {estaEditando ? (
                            <Button
                              size="sm"
                              onClick={() => handleSalvarItem(item)}
                              disabled={savingItems[item.produto_id]}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditQuantidade(item.produto_id, atual)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurnoDetailPage;
