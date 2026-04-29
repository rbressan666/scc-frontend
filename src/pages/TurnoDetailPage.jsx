import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowLeft, Plus, Save, Check, Zap, Trash2 } from 'lucide-react';
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
  const [modalInput, setModalInput] = useState({ quantidade: '', unidadeId: '' });
  const [modalItems, setModalItems] = useState({});

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

  // Filtrar e agrupar produtos baseado em: busca, setor, categoria
  const produtosFiltrados = comparacao
    .filter(item => {
      const matchBusca = item.produto_nome.toLowerCase().includes(searchTermo.toLowerCase());
      const matchSetor = !filtroSetor || item.setor_id === filtroSetor;
      const matchCategoria = !filtroCategoria || item.categoria_id === filtroCategoria;
      return matchBusca && matchSetor && matchCategoria;
    })
    .sort((a, b) => {
      // Ordenar por Setor, depois Categoria, depois Produto
      const setorCompare = (a.setor_nome || '').localeCompare(b.setor_nome || '');
      if (setorCompare !== 0) return setorCompare;
      
      const categoriaCompare = (a.categoria_nome || '').localeCompare(b.categoria_nome || '');
      if (categoriaCompare !== 0) return categoriaCompare;
      
      return (a.produto_nome || '').localeCompare(b.produto_nome || '');
    });

  // Agrupar produtos por Setor e Categoria
  const produtosAgrupados = produtosFiltrados.reduce((acc, item) => {
    const setorKey = item.setor_id || 'sem-setor';
    const categoriaKey = item.categoria_id || 'sem-categoria';
    
    if (!acc[setorKey]) {
      acc[setorKey] = {
        setor_id: item.setor_id,
        setor_nome: item.setor_nome,
        categorias: {}
      };
    }
    
    if (!acc[setorKey].categorias[categoriaKey]) {
      acc[setorKey].categorias[categoriaKey] = {
        categoria_id: item.categoria_id,
        categoria_nome: item.categoria_nome,
        produtos: []
      };
    }
    
    acc[setorKey].categorias[categoriaKey].produtos.push(item);
    return acc;
  }, {});

  // Filtro com suporte a "Todos"
  const handleSetorChange = (value) => {
    setFiltroSetor(value === '__todos' ? '' : value);
  };

  const handleCategoriaChange = (value) => {
    setFiltroCategoria(value === '__todos' ? '' : value);
  };

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
      setModalInput({ quantidade: '', unidadeId: '' });
      setModalItems({});
    } catch (err) {
      console.error('Erro ao abrir modal de detalhe:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar fatores de conversão',
        variant: 'destructive'
      });
    }
  };

  const handleAdicionarItem = (variacaoId) => {
    const quantidade = parseFloat(modalInput.quantidade);
    const unidadeId = modalInput.unidadeId;

    if (!quantidade || quantidade <= 0) {
      toast({
        title: 'Erro',
        description: 'Digite uma quantidade válida',
        variant: 'destructive'
      });
      return;
    }

    if (!unidadeId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma unidade de medida',
        variant: 'destructive'
      });
      return;
    }

    const key = `${variacaoId}`;
    const novoItem = {
      id: Date.now(),
      unidadeId,
      quantidade,
      unidadeName: fatoresConversao[variacaoId]?.find(f => f.id_unidade_medida === unidadeId)?.unidade_nome || 'Un',
      unidadeSigla: fatoresConversao[variacaoId]?.find(f => f.id_unidade_medida === unidadeId)?.unidade_sigla || 'un',
      fator: fatoresConversao[variacaoId]?.find(f => f.id_unidade_medida === unidadeId)?.fator || 1
    };

    setModalItems(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), novoItem]
    }));

    setModalInput({ quantidade: '', unidadeId: '' });
  };

  const handleRemoverItem = (variacaoId, itemId) => {
    const key = `${variacaoId}`;
    setModalItems(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(item => item.id !== itemId)
    }));
  };

  const handleSalvarDetalheContagem = async () => {
    try {
      const { variacoes } = detalhesModal;
      
      for (const variacao of variacoes) {
        const items = modalItems[`${variacao.variacao_id}`] || [];
        let totalConvertido = 0;
        
        for (const item of items) {
          totalConvertido += item.quantidade * item.fator;
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
      setModalInput({ quantidade: '', unidadeId: '' });
      setModalItems({});
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
              <Select value={filtroSetor || '__todos'} onValueChange={handleSetorChange}>
                <SelectTrigger id="setor" className="mt-1">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos">Todos os setores</SelectItem>
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
              <Select value={filtroCategoria || '__todos'} onValueChange={handleCategoriaChange}>
                <SelectTrigger id="categoria" className="mt-1">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos">Todas as categorias</SelectItem>
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
                  <th className="text-center py-3 px-2 font-semibold text-xs">Anterior</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Atual</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(produtosAgrupados).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  Object.values(produtosAgrupados).flatMap(setor =>
                    Object.entries(setor.categorias).flatMap(([categoryKey, categoria], catIndex) => {
                      const isFirstCategory = catIndex === 0;
                      const produtos = categoria.produtos;
                      return [
                        // Setor header - só na primeira categoria
                        ...(isFirstCategory ? [
                          <tr key={`setor-${setor.setor_id}`} className="bg-blue-100 border-b-2 border-blue-300">
                            <td colSpan="4" className="py-3 px-2 font-bold text-blue-900">
                              {setor.setor_nome || 'Setor sem nome'}
                            </td>
                          </tr>
                        ] : []),
                        // Categoria header
                        <tr key={`categoria-${categoryKey}`} className="bg-gray-200 border-b border-gray-300">
                          <td colSpan="4" className="py-2 px-4 font-semibold text-gray-800">
                            {categoria.categoria_nome || 'Categoria sem nome'}
                          </td>
                        </tr>,
                        // Produto rows
                        ...produtos.map(item => {
                          const anterior = Number(item.contagem_anterior || 0);
                          const atual = editingItems[item.produto_id] !== undefined 
                            ? Number(editingItems[item.produto_id])
                            : Number(item.contagem_atual || 0);
                          const saldo = atual - anterior;
                          const estaEditando = editingItems[item.produto_id] !== undefined;
                          
                          let saldoVariant = 'secondary';
                          if (saldo === 0) saldoVariant = 'secondary';
                          else if (saldo > 0) saldoVariant = 'default';
                          else saldoVariant = 'destructive';

                          return (
                            <tr key={item.produto_id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-6 font-medium text-gray-900">
                                {item.produto_nome || 'Produto sem nome'}
                              </td>
                              <td className="text-center py-3 px-2">
                                <Badge variant="secondary">{anterior.toFixed(1)} {item.unidade_principal_sigla || 'un'}</Badge>
                              </td>
                              <td className="text-center py-3 px-2">
                                <div className="flex items-center justify-center gap-2">
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
                                </div>
                              </td>
                              <td className="text-center py-3 px-2">
                                <Badge variant={saldoVariant}>
                                  {saldo.toFixed(1)}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      ];
                    })
                  )
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
        <DialogContent className="max-w-3xl max-h-96">
          <DialogHeader>
            <DialogTitle>Detalhe da Contagem por Unidade de Medida</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {(() => {
              const allUnitsMap = {};
              const controlUnitSigla = detalhesModal.variacoes[0]?.unidade_sigla || 'un';
              
              detalhesModal.variacoes.forEach(variacao => {
                (fatoresConversao[variacao.variacao_id] || []).forEach(fator => {
                  if (!allUnitsMap[fator.id_unidade_medida]) {
                    allUnitsMap[fator.id_unidade_medida] = fator;
                  }
                });
              });
              
              const allUnits = Object.values(allUnitsMap);
              
              let allItems = [];
              detalhesModal.variacoes.forEach(variacao => {
                const items = modalItems[`${variacao.variacao_id}`] || [];
                allItems = [...allItems, ...items.map(item => ({ ...item, variacaoId: variacao.variacao_id }))];
              });
              
              let totalEmUnidasesControle = 0;
              for (const item of allItems) {
                totalEmUnidasesControle += item.quantidade * item.fator;
              }
              
              return (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <h4 className="font-semibold text-lg">Adicionar Quantidade</h4>
                  
                  {/* Input para adicionar item */}
                  <div className="grid grid-cols-3 gap-2 pb-4 border-b">
                    <div>
                      <Label className="text-xs">Quantidade</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="0"
                        value={modalInput.quantidade}
                        onChange={(e) => setModalInput({ ...modalInput, quantidade: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unidade</Label>
                      <Select value={modalInput.unidadeId} onValueChange={(value) => setModalInput({ ...modalInput, unidadeId: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {allUnits.map(unit => (
                            <SelectItem key={unit.id_unidade_medida} value={unit.id_unidade_medida}>
                              {unit.unidade_nome} ({unit.unidade_sigla})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => handleAdicionarItem(detalhesModal.variacoes[0].variacao_id)}
                        className="w-full"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de itens adicionados */}
                  {allItems.length > 0 && (
                    <div className="space-y-2">
                      <Label className="font-semibold text-sm">Itens adicionados:</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {allItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">
                              {item.quantidade.toFixed(3)} {item.unidadeSigla} = {(item.quantidade * item.fator).toFixed(3)} {controlUnitSigla}
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoverItem(item.variacaoId, item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="mt-4 pt-3 border-t border-gray-300 bg-white p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total em {controlUnitSigla}:</span>
                      <span className="text-lg font-bold text-blue-600">{totalEmUnidasesControle.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDetalhesModal({ aberto: false, produtoId: null, variacoes: [], contagensDetalhadas: {} });
              setModalInput({ quantidade: '', unidadeId: '' });
              setModalItems({});
            }}>
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
