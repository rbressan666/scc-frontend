import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3
} from 'lucide-react';
import { 
  produtoService, 
  variacaoService, 
  setorService, 
  categoriaService, 
  contagensService,
  unidadeMedidaService 
} from '../services/api';

const ContagemPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  
  // Estados principais
  const [produtos, setProdutos] = useState([]);
  const [variacoes, setVariacoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [contagens, setContagens] = useState({});
  const [contagemAtual, setContagemAtual] = useState(null);
  const [itensContagem, setItensContagem] = useState([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    setor: '',
    categoria: '',
    produto: '',
    categoriaInput: ''
  });
  
  // Estados do modal de contagem detalhada
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [contagemDetalhada, setContagemDetalhada] = useState([]);
  const [novaLinha, setNovaLinha] = useState({
    quantidade: 0,
    unidade: '',
    observacao: ''
  });

  useEffect(() => {
    if (turnoId) {
      carregarDados();
    }
  }, [turnoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [produtosRes, variacoesRes, setoresRes, categoriasRes, unidadesRes] = await Promise.allSettled([
        produtoService.getAll(),
        variacaoService.getAll(),
        setorService.getAll(),
        categoriaService.getAll(),
        unidadeMedidaService.getAll()
      ]);

      if (produtosRes.status === 'fulfilled') {
        setProdutos(produtosRes.value.data || []);
      }

      if (variacoesRes.status === 'fulfilled') {
        setVariacoes(variacoesRes.value.data || []);
      }

      if (setoresRes.status === 'fulfilled') {
        setSetores(setoresRes.value.data || []);
      }

      if (categoriasRes.status === 'fulfilled') {
        setCategorias(categoriasRes.value.data || []);
      }

      if (unidadesRes.status === 'fulfilled') {
        setUnidadesMedida(unidadesRes.value.data || []);
      }

      // Carregar ou criar contagem para este turno
      await carregarOuCriarContagem();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarOuCriarContagem = async () => {
    try {
      // Tentar carregar contagens existentes do turno
      const contagensRes = await contagensService.getByTurno(turnoId);
      const contagensData = contagensRes.data || [];
      
      // Buscar contagem ativa
      let contagemAtiva = contagensData.find(c => 
        c.status === 'ativa' || 
        c.status === 'em_andamento' || 
        c.status === 'aberta'
      );
      
      // Se não há contagem ativa, criar uma nova
      if (!contagemAtiva) {
        console.log('Criando nova contagem para o turno:', turnoId);
        const novaContagemRes = await contagensService.create({
          turno_id: turnoId,
          tipo_contagem: 'geral'
        });
        contagemAtiva = novaContagemRes.data;
        console.log('Nova contagem criada:', contagemAtiva);
      }
      
      if (contagemAtiva) {
        setContagemAtual(contagemAtiva);
        console.log('Contagem ativa definida:', contagemAtiva);
        
        // Carregar itens da contagem
        try {
          const itensRes = await contagensService.getItens(contagemAtiva.id);
          const itens = itensRes.data || [];
          setItensContagem(itens);
          
          // Converter itens para formato de contagens por produto
          const contagensPorProduto = {};
          itens.forEach(item => {
            if (item.variacao_id) {
              const variacao = variacoes.find(v => v.id === item.variacao_id);
              if (variacao) {
                contagensPorProduto[variacao.id_produto] = item.quantidade_convertida || item.quantidade_contada;
              }
            }
          });
          setContagens(contagensPorProduto);
        } catch (error) {
          console.error('Erro ao carregar itens da contagem:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar/criar contagem:', error);
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    const matchSetor = !filtros.setor || produto.id_setor === filtros.setor;
    const matchCategoria = !filtros.categoria || produto.id_categoria === filtros.categoria;
    const matchProduto = !filtros.produto || produto.nome.toLowerCase().includes(filtros.produto.toLowerCase());
    
    return matchSetor && matchCategoria && matchProduto;
  });

  const getVariacoesPorProduto = (produtoId) => {
    return variacoes.filter(variacao => variacao.id_produto === produtoId);
  };

  const getUnidadesPorProduto = (produtoId) => {
    if (!produtoId) return unidadesMedida; // Fallback para todas as unidades
    
    // Buscar variações do produto
    const produtoVariacoes = getVariacoesPorProduto(produtoId);
    if (produtoVariacoes.length === 0) return unidadesMedida;
    
    // Buscar unidades de medida usadas nas variações
    const unidadesIds = [...new Set(produtoVariacoes.map(v => v.id_unidade_controle))];
    const unidadesRelacionadas = unidadesMedida.filter(u => unidadesIds.includes(u.id));
    
    // Se não encontrou unidades relacionadas, retornar todas
    if (unidadesRelacionadas.length === 0) return unidadesMedida;
    
    // Ordenar: primeira variação (default) primeiro, depois alfabético
    const variacaoDefault = produtoVariacoes[0];
    return unidadesRelacionadas.sort((a, b) => {
      if (a.id === variacaoDefault.id_unidade_controle) return -1;
      if (b.id === variacaoDefault.id_unidade_controle) return 1;
      return a.nome.localeCompare(b.nome);
    });
  };

  const getSetorNome = (setorId) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nome : 'Setor não encontrado';
  };

  const getCategoriaNome = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : 'Categoria não encontrada';
  };

  const renderFiltroCategoria = () => {
    const categoriasFiltradas = categorias.filter(categoria =>
      categoria.nome.toLowerCase().includes(filtros.categoriaInput.toLowerCase())
    );

    return (
      <div className="relative">
        <Input
          list="categorias-list"
          value={filtros.categoriaInput}
          onChange={(e) => {
            setFiltros(prev => ({ ...prev, categoriaInput: e.target.value }));
            // Buscar categoria correspondente
            const categoriaEncontrada = categorias.find(c => 
              c.nome.toLowerCase() === e.target.value.toLowerCase()
            );
            setFiltros(prev => ({ 
              ...prev, 
              categoria: categoriaEncontrada ? categoriaEncontrada.id : '' 
            }));
          }}
          placeholder="Digite ou selecione categoria"
          className="w-full"
        />
        <datalist id="categorias-list">
          {categoriasFiltradas.map(categoria => (
            <option key={categoria.id} value={categoria.nome} />
          ))}
        </datalist>
      </div>
    );
  };

  const handleContagemSimples = async (produtoId, valor) => {
    console.log('=== DEBUG CONTAGEM SIMPLES ===');
    console.log('contagemAtual:', contagemAtual);
    console.log('produtoId:', produtoId);
    console.log('valor:', valor);
    
    // Validação mais robusta
    if (!contagemAtual || !contagemAtual.id) {
      console.error('Contagem atual não encontrada ou sem ID');
      alert('Erro: Contagem não inicializada. Recarregando página...');
      window.location.reload();
      return;
    }

    if (!produtoId) {
      alert('Erro: Produto não identificado');
      return;
    }

    try {
      const quantidade = Number(valor) || 0;
      
      // Buscar primeira variação do produto para usar como referência
      const produtoVariacoes = getVariacoesPorProduto(produtoId);
      if (produtoVariacoes.length === 0) {
        alert('Produto não possui variações cadastradas');
        return;
      }
      
      const variacaoPrincipal = produtoVariacoes[0];
      console.log('Variação principal:', variacaoPrincipal);
      
      // Verificar se já existe item para este produto na contagem
      const itemExistente = itensContagem.find(item => {
        const variacao = variacoes.find(v => v.id === item.variacao_id);
        return variacao && variacao.id_produto === produtoId;
      });
      
      console.log('Item existente:', itemExistente);
      
      if (itemExistente) {
        // Atualizar item existente
        console.log('Atualizando item existente...');
        await contagensService.updateItem(contagemAtual.id, itemExistente.id, {
          quantidade_contada: quantidade,
          quantidade_convertida: quantidade,
          observacoes: 'Contagem simples atualizada'
        });
      } else {
        // Criar novo item
        console.log('Criando novo item...');
        const novoItem = {
          variacao_id: variacaoPrincipal.id,
          quantidade_contada: quantidade,
          unidade_medida_id: variacaoPrincipal.id_unidade_controle,
          quantidade_convertida: quantidade,
          observacoes: 'Contagem simples'
        };
        console.log('Dados do novo item:', novoItem);
        
        await contagensService.addItem(contagemAtual.id, novoItem);
      }
      
      // Atualizar estado local
      setContagens(prev => ({
        ...prev,
        [produtoId]: quantidade
      }));
      
      // Recarregar itens da contagem
      const itensRes = await contagensService.getItens(contagemAtual.id);
      setItensContagem(itensRes.data || []);
      
      console.log('Contagem salva com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar contagem:', error);
      alert('Erro ao salvar contagem: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const abrirModalDetalhado = (produto) => {
    setProdutoSelecionado(produto);
    
    // Buscar unidade default do produto
    const unidadesProduto = getUnidadesPorProduto(produto.id);
    const unidadeDefault = unidadesProduto.length > 0 ? unidadesProduto[0].sigla : 'unidade';
    
    // Inicializar com uma linha vazia
    setContagemDetalhada([{
      id: Date.now(),
      quantidade: 0,
      unidade: unidadeDefault,
      observacao: '',
      isExisting: false
    }]);
    
    setNovaLinha({
      quantidade: 0,
      unidade: unidadeDefault,
      observacao: ''
    });
    
    setModalAberto(true);
  };

  const adicionarLinhaDetalhada = () => {
    // Buscar unidade default do produto selecionado
    const unidadesProduto = getUnidadesPorProduto(produtoSelecionado?.id);
    const unidadeDefault = unidadesProduto.length > 0 ? unidadesProduto[0].sigla : 'unidade';
    
    if (novaLinha.quantidade > 0) {
      setContagemDetalhada(prev => [...prev, { ...novaLinha, id: Date.now() }]);
      setNovaLinha({ quantidade: 0, unidade: unidadeDefault, observacao: '' });
    }
  };

  const removerLinhaDetalhada = (id) => {
    setContagemDetalhada(prev => prev.filter(item => item.id !== id));
  };

  const editarLinhaDetalhada = (id, novosDados) => {
    setContagemDetalhada(prev => prev.map(item => 
      item.id === id ? { ...item, ...novosDados } : item
    ));
  };

  const calcularTotalDetalhado = () => {
    if (!produtoSelecionado) return 0;
    
    // Buscar variações do produto para obter unidade default
    const produtoVariacoes = getVariacoesPorProduto(produtoSelecionado.id);
    if (produtoVariacoes.length === 0) return 0;
    
    const variacaoDefault = produtoVariacoes[0]; // Primeira variação é a default
    const unidadeDefault = unidadesMedida.find(u => u.id === variacaoDefault.id_unidade_controle);
    
    return contagemDetalhada.reduce((total, item) => {
      const quantidade = Number(item.quantidade) || 0;
      if (quantidade <= 0) return total;
      
      const unidadeUsada = unidadesMedida.find(u => u.sigla === item.unidade || u.id === item.unidade);
      const quantidadeConvertida = calcularQuantidadeConvertida(quantidade, unidadeUsada, unidadeDefault);
      
      return total + quantidadeConvertida;
    }, 0);
  };

  const salvarContagemDetalhada = async () => {
    console.log('=== DEBUG CONTAGEM DETALHADA ===');
    console.log('contagemAtual:', contagemAtual);
    console.log('produtoSelecionado:', produtoSelecionado);
    console.log('contagemDetalhada:', contagemDetalhada);
    
    // Validações mais robustas
    if (!contagemAtual || !contagemAtual.id) {
      console.error('Contagem atual não encontrada ou sem ID');
      alert('Erro: Contagem não inicializada. Recarregando página...');
      window.location.reload();
      return;
    }
    
    if (!produtoSelecionado || !produtoSelecionado.id) {
      console.error('Produto selecionado não encontrado ou sem ID');
      alert('Erro: Produto não selecionado corretamente');
      return;
    }

    try {
      const produtoVariacoes = getVariacoesPorProduto(produtoSelecionado.id);
      if (produtoVariacoes.length === 0) {
        alert('Produto não possui variações cadastradas');
        return;
      }

      const variacaoPrincipal = produtoVariacoes[0];
      console.log('Variação principal:', variacaoPrincipal);

      // Remover itens existentes deste produto na contagem
      const itensExistentes = itensContagem.filter(item => {
        const variacao = variacoes.find(v => v.id === item.variacao_id);
        return variacao && variacao.id_produto === produtoSelecionado.id;
      });

      console.log('Removendo itens existentes:', itensExistentes);
      for (const item of itensExistentes) {
        await contagensService.removeItem(contagemAtual.id, item.id);
      }

      // Adicionar novos itens detalhados
      const unidadeDefault = unidadesMedida.find(u => u.id === variacaoPrincipal.id_unidade_controle);
      console.log('Unidade default:', unidadeDefault);
      
      for (const linha of contagemDetalhada) {
        if (!linha.isExisting && linha.quantidade > 0) {
          const unidadeUsada = unidadesMedida.find(u => u.sigla === linha.unidade || u.id === linha.unidade);
          const quantidadeConvertida = calcularQuantidadeConvertida(linha.quantidade, unidadeUsada, unidadeDefault);
          
          const novoItem = {
            variacao_id: variacaoPrincipal.id,
            quantidade_contada: linha.quantidade,
            unidade_medida_id: unidadeUsada?.id || variacaoPrincipal.id_unidade_controle,
            quantidade_convertida: quantidadeConvertida,
            observacoes: linha.observacao || `Contagem detalhada - ${unidadeUsada?.nome || 'Unidade'}`
          };
          
          console.log('Adicionando item:', novoItem);
          await contagensService.addItem(contagemAtual.id, novoItem);
        }
      }

      // Calcular e salvar total
      const total = calcularTotalDetalhado();
      console.log('Total calculado:', total);
      
      // Atualizar estado local
      setContagens(prev => ({
        ...prev,
        [produtoSelecionado.id]: total
      }));

      // Recarregar itens da contagem
      const itensRes = await contagensService.getItens(contagemAtual.id);
      setItensContagem(itensRes.data || []);

      setModalAberto(false);
      setProdutoSelecionado(null);
      setContagemDetalhada([]);
      
      console.log('Contagem detalhada salva com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar contagem detalhada:', error);
      alert('Erro ao salvar contagem detalhada: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const calcularQuantidadeConvertida = (quantidade, unidadeUsada, unidadeDefault) => {
    const qtd = Number(quantidade) || 0;
    
    // Se não há unidades definidas, retorna a quantidade original
    if (!unidadeUsada || !unidadeDefault) {
      return qtd;
    }
    
    // Se a unidade usada é a mesma que a default, não precisa converter
    if (unidadeUsada.id === unidadeDefault.id) {
      return qtd;
    }
    
    // Converter para unidade base (considerando as quantidades das unidades)
    const quantidadeUnidadeUsada = Number(unidadeUsada.quantidade) || 1;
    const quantidadeUnidadeDefault = Number(unidadeDefault.quantidade) || 1;
    
    // Calcular proporção
    // Ex: Se default é Caixa(24) e usuário digitou em Unidade(1)
    // 12 unidades = 12 * (1/24) = 0.5 caixas
    const proporcao = quantidadeUnidadeUsada / quantidadeUnidadeDefault;
    
    return qtd * proporcao;
  };

  // Agrupar produtos por setor e categoria hierárquica
  const produtosAgrupados = produtosFiltrados.reduce((acc, produto) => {
    const setorNome = getSetorNome(produto.id_setor);
    const categoriaNome = getCategoriaNome(produto.id_categoria);
    
    if (!acc[setorNome]) {
      acc[setorNome] = {};
    }
    
    if (!acc[setorNome][categoriaNome]) {
      acc[setorNome][categoriaNome] = [];
    }
    
    acc[setorNome][categoriaNome].push(produto);
    
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contagem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Sistema Contagem Cadoz</h1>
                  <p className="text-sm text-gray-500">Contagem de Produtos</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {contagemAtual && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Contagem Ativa
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Contagem de Produtos</span>
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {produtosFiltrados.length} produtos
                </Badge>
                <Badge variant="outline">
                  {Object.keys(contagens).length} contados
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setor
                </label>
                <select
                  value={filtros.setor}
                  onChange={(e) => setFiltros(prev => ({ ...prev, setor: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos os setores</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                {renderFiltroCategoria()}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <Input
                  value={filtros.produto}
                  onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
                  placeholder="Buscar produto..."
                  className="w-full"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => setFiltros({ setor: '', categoria: '', produto: '', categoriaInput: '' })}
                  variant="outline"
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {/* Lista de Produtos Agrupados */}
            <div className="space-y-6">
              {Object.entries(produtosAgrupados).map(([setorNome, categorias]) => (
                <div key={setorNome} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    {setorNome}
                  </h3>
                  
                  {Object.entries(categorias).map(([categoriaNome, produtosCategoria]) => (
                    <div key={categoriaNome} className="mb-4 last:mb-0">
                      <h4 className="text-md font-medium text-gray-700 mb-3 pl-4 border-l-2 border-blue-200">
                        {categoriaNome}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                        {produtosCategoria.map((produto) => {
                          const quantidadeAtual = contagens[produto.id] || 0;
                          const temContagem = quantidadeAtual > 0;
                          
                          return (
                            <div
                              key={produto.id}
                              className={`border rounded-lg p-3 ${
                                temContagem ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900 text-sm">
                                  {produto.nome}
                                </h5>
                                {temContagem && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  step="0.001"
                                  value={quantidadeAtual}
                                  onChange={(e) => handleContagemSimples(produto.id, e.target.value)}
                                  placeholder="Quantidade"
                                  className="flex-1 h-8 text-sm"
                                />
                                
                                <Button
                                  onClick={() => abrirModalDetalhado(produto)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  title="Contagem detalhada"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {usuariosAtivos[produto.id] && (
                                <div className="mt-2 text-xs text-blue-600 flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {usuariosAtivos[produto.id]} está contando
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {produtosFiltrados.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum produto encontrado com os filtros aplicados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de Contagem Detalhada */}
      {modalAberto && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Contagem Detalhada - {produtoSelecionado.nome}
              </h3>
              <Button
                onClick={() => setModalAberto(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>

            {/* Adicionar Nova Linha */}
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-3">Adicionar Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Input
                    type="number"
                    step="0.001"
                    value={novaLinha.quantidade}
                    onChange={(e) => setNovaLinha(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))}
                    placeholder="Quantidade"
                    className="text-sm"
                  />
                </div>
                <div>
                  <select
                    value={novaLinha.unidade}
                    onChange={(e) => setNovaLinha(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {getUnidadesPorProduto(produtoSelecionado.id).map((unidade, index) => (
                      <option key={unidade.id} value={unidade.sigla}>
                        {unidade.nome} ({unidade.sigla})
                        {index === 0 ? ' - PADRÃO' : ''}
                        {unidade.quantidade && unidade.quantidade !== 1 ? ` - ${unidade.quantidade}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    value={novaLinha.observacao}
                    onChange={(e) => setNovaLinha(prev => ({ ...prev, observacao: e.target.value }))}
                    placeholder="Observação"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Button
                    onClick={adicionarLinhaDetalhada}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-gray-700">Itens da Contagem</h4>
              {contagemDetalhada.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                  <div>
                    <Input
                      type="number"
                      step="0.001"
                      value={item.quantidade}
                      onChange={(e) => editarLinhaDetalhada(item.id, { quantidade: parseFloat(e.target.value) || 0 })}
                      className="text-sm"
                      disabled={item.isExisting}
                    />
                  </div>
                  <div>
                    <select
                      value={item.unidade}
                      onChange={(e) => editarLinhaDetalhada(item.id, { unidade: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      disabled={item.isExisting}
                    >
                      {getUnidadesPorProduto(produtoSelecionado?.id).map((unidade, index) => (
                        <option key={unidade.id} value={unidade.sigla}>
                          {unidade.nome} ({unidade.sigla})
                          {index === 0 ? ' - PADRÃO' : ''}
                          {unidade.quantidade && unidade.quantidade !== 1 ? ` - ${unidade.quantidade}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Input
                      value={item.observacao}
                      onChange={(e) => editarLinhaDetalhada(item.id, { observacao: e.target.value })}
                      placeholder="Observação"
                      className="text-sm"
                      disabled={item.isExisting}
                    />
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    Convertido: {calcularQuantidadeConvertida(
                      item.quantidade,
                      unidadesMedida.find(u => u.sigla === item.unidade),
                      unidadesMedida.find(u => u.id === getVariacoesPorProduto(produtoSelecionado.id)[0]?.id_unidade_controle)
                    ).toFixed(3)}
                  </div>
                  <div>
                    <Button
                      onClick={() => removerLinhaDetalhada(item.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={item.isExisting}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total e Ações */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-lg font-semibold">
                Total calculado: {calcularTotalDetalhado().toFixed(3)} unidades
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setModalAberto(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={salvarContagemDetalhada}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar Contagem
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContagemPage;
