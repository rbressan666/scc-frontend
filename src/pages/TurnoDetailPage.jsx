import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowLeft, Plus, Save, Check, Zap } from 'lucide-react';
import { turnosService, setorService, categoriaService, fatorConversaoService } from '../services/api';
import { useToast } from '../hooks/use-toast';

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
  
  // Filtros
  const [searchTermo, setSearchTermo] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Modal de detalhe de contagem
  const [detalhesModal, setDetalhesModal] = useState({
    aberto: false,
    produtoId: null,
    variacoes: [],
    contagensDetalhadas: {}
  });
  const [fatoresConversao, setFatoresConversao] = useState({});

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

  // Carregar setores, categorias e unidades de medida
  const fetchFilterData = useCallback(async () => {
    try {
      const [setoresRes, categoriasRes] = await Promise.all([
        setorService.getAll(),
        categoriaService.getAll()
      ]);
      
      setSetores(setoresRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados de filtro:', err);
    }
  }, []);

  useEffect(() => {
    fetchTurnoDetail();
    fetchFilterData();
  }, [fetchTurnoDetail, fetchFilterData]);

  // Filtrar produtos baseado em: busca, setor, categoria
  const produtosFiltrados = comparacao.filter(item => {
    const matchBusca = item.produto_nome.toLowerCase().includes(searchTermo.toLowerCase());
    const matchSetor = !filtroSetor || item.setor_id === filtroSetor;
    const matchCategoria = !filtroCategoria || item.categoria_id === filtroCategoria;
    return matchBusca && matchSetor && matchCategoria;
  });

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
      
      // Salvar para cada variação do produto
      const variacoes = item.variacoes || [];
      
      for (const variacao of variacoes) {
        await turnosService.saveContagemItem({
          contagemId: contagensInfo[0]?.id,
          variacaoId: variacao.variacao_id,
          quantidade: Number(quantidade) / variacoes.length, // Distribuir igualmente
          unidadeMedidaId: variacao.id_unidade_controle,
          observacoes: ''
        });
      }

      toast({
        title: 'Sucesso',
        description: `Produto contado com sucesso`,
        variant: 'default'
      });

      const novoEditando = { ...editingItems };
      delete novoEditando[item.produto_id];
      setEditingItems(novoEditando);

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

  const handleAbrirDetalheModal = async (item) => {
    try {
      const variacoes = item.variacoes || [];
      const fatores = {};
      
      // Carregar fatores de conversão para cada variação
      for (const variacao of variacoes) {
        try {
          const res = await fatorConversaoService.getByVariacao(variacao.variacao_id);
          fatores[variacao.variacao_id] = res.data || [];
        } catch {
          fatores[variacao.variacao_id] = [];
        }
      }
      
      setFatoresConversao(fatores);
      setDetalhesModal({
        aberto: true,
        produtoId: item.produto_id,
        variacoes,
        contagensDetalhadas: {}
      });
    } catch (err) {
      console.error('Erro ao abrir modal de detalhe:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar fatores de conversão',
        variant: 'destructive'
      });
    }
  };

  const handleSalvarDetalheContagem = async () => {
    try {
      const { variacoes, contagensDetalhadas } = detalhesModal;
      
      for (const variacao of variacoes) {
        const detalhes = contagensDetalhadas[variacao.variacao_id] || [];
        let totalConvertido = 0;
        
        for (const detalhe of detalhes) {
          if (detalhe.quantidade > 0) {
            const fator = fatoresConversao[variacao.variacao_id]?.find(
              f => f.id_unidade_medida === detalhe.unidade_id
            );
            totalConvertido += detalhe.quantidade * (fator?.fator || 1);
          }
        }
        
        if (totalConvertido > 0) {
          await turnosService.saveContagemItem({
            contagemId: contagensInfo[0]?.id,
            variacaoId: variacao.variacao_id,
            quantidade: totalConvertido,
            unidadeMedidaId: variacao.id_unidade_controle,
            observacoes: ''
          });
        }
      }
      
      toast({
        title: 'Sucesso',
        description: 'Contagem detalhada salva com sucesso',
        variant: 'default'
      });
      
      setDetalhesModal({ aberto: false, produtoId: null, variacoes: [], contagensDetalhadas: {} });
      fetchTurnoDetail();
    } catch (err) {
      console.error('Erro ao salvar detalhe de contagem:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar contagem detalhada',
        variant: 'destructive'
      });
    }
  };

  const handleIniciarNovaContagem = async () => {
    try {
      setInicandoNovaContagem(true);

      if (contagensInfo.length > 0) {
        const contagemAtual = contagensInfo[0];
        await turnosService.finalizarContagem(contagemAtual.id);
      }

      const novaContagemResult = await turnosService.iniciarNovaContagem();

      if (novaContagemResult.success) {
        toast({
          title: 'Sucesso',
          description: 'Nova contagem iniciada',
          variant: 'default'
        });

        setEditingItems({});
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search">Pesquisar por produto</Label>
            <Input
              id="search"
              placeholder="Digite o nome do produto..."
              value={searchTermo}
              onChange={(e) => setSearchTermo(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setor">Setor</Label>
              <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                <SelectTrigger id="setor" className="mt-1">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger id="categoria" className="mt-1">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contagens */}
      <Card>
        <CardHeader>
          <CardTitle>
            {contagensInfo.length > 0 && (
              <>
                <div>Contagem Atual - {new Date(contagensInfo[0]?.data_inicio).toLocaleString('pt-BR')}</div>
                {contagensInfo.length > 1 && (
                  <div className="text-sm text-gray-500 mt-2">
                    Contagem Anterior - {new Date(contagensInfo[1]?.data_inicio).toLocaleString('pt-BR')}
                  </div>
                )}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-2 font-semibold">Produto</th>
                  <th className="text-left py-3 px-2 font-semibold text-xs">Setor / Categoria</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Anterior</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Atual</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Saldo</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  produtosFiltrados.map((item) => {
                    const anterior = Number(item.contagem_anterior || 0);
                    const atual = editingItems[item.produto_id] !== undefined 
                      ? Number(editingItems[item.produto_id])
                      : Number(item.contagem_atual || 0);
                    const saldo = atual - anterior;
                    const estaEditando = editingItems[item.produto_id] !== undefined;

                    return (
                      <tr key={item.produto_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {item.produto_nome || 'Produto sem nome'}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-600">
                          <div>{item.setor_nome || '-'}</div>
                          <div className="text-gray-500">{item.categoria_nome || '-'}</div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="secondary">{anterior.toFixed(1)} {item.unidade_principal_sigla || 'un'}</Badge>
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
                            <Badge variant="default">{atual.toFixed(1)} {item.unidade_principal_sigla || 'un'}</Badge>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={saldo >= 0 ? 'default' : 'destructive'}>
                            {saldo.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2 space-x-2">
                          {estaEditando ? (
                            <Button
                              size="sm"
                              onClick={() => handleSalvarItem(item)}
                              disabled={savingItems[item.produto_id]}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditQuantidade(item.produto_id, atual)}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              {item.variacoes && item.variacoes.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAbrirDetalheModal(item)}
                                >
                                  <Zap className="w-4 h-4" />
                                </Button>
                              )}
                            </>
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

      {/* Modal de Detalhe de Contagem */}
      <Dialog open={detalhesModal.aberto} onOpenChange={(aberto) => 
        setDetalhesModal({ ...detalhesModal, aberto })
      }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhe da Contagem por Unidade de Medida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {detalhesModal.variacoes.map(variacao => (
              <div key={variacao.variacao_id} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">{variacao.variacao_nome}</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label>Unidade Principal: {variacao.unidade_sigla}</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="0"
                        defaultValue={Number(variacao.contagem_atual || 0).toFixed(3)}
                        readOnly
                        className="mt-1 bg-gray-100"
                      />
                    </div>
                  </div>
                  {(fatoresConversao[variacao.variacao_id] || []).map(fator => (
                    <div key={fator.id}>
                      <Label>{fator.unidade_nome} ({fator.unidade_sigla}) - Fator: {fator.fator}</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="0"
                        onChange={(e) => {
                          const detalhes = detalhesModal.contagensDetalhadas[variacao.variacao_id] || [];
                          const idx = detalhes.findIndex(d => d.unidade_id === fator.id_unidade_medida);
                          if (idx >= 0) {
                            detalhes[idx].quantidade = parseFloat(e.target.value) || 0;
                          } else {
                            detalhes.push({
                              unidade_id: fator.id_unidade_medida,
                              quantidade: parseFloat(e.target.value) || 0
                            });
                          }
                          setDetalhesModal({
                            ...detalhesModal,
                            contagensDetalhadas: {
                              ...detalhesModal.contagensDetalhadas,
                              [variacao.variacao_id]: detalhes
                            }
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalhesModal({ aberto: false, produtoId: null, variacoes: [], contagensDetalhadas: {} })}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarDetalheContagem}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TurnoDetailPage;
