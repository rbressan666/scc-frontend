import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  ArrowLeft,
  Search,
  Filter,
  Package,
  Edit3,
  Users,
  Plus,
  Save,
  X
} from 'lucide-react';
import { produtoService, variacaoService, setorService, categoriaService, contagensService } from '../services/api';

const ContagemPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  
  // Estados principais
  const [produtos, setProdutos] = useState([]);
  const [variacoes, setVariacoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contagens, setContagens] = useState({});
  const [contagemAtual, setContagemAtual] = useState(null);
  const [itensContagem, setItensContagem] = useState([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    setor: '',
    categoria: '',
    produto: ''
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

  // Cores para setores e categorias
  const coresSetores = {
    'Alimentação': 'bg-blue-50',
    'Limpeza': 'bg-green-50',
    'Higiene': 'bg-purple-50',
    'Bebidas': 'bg-yellow-50'
  };

  const coresCategorias = {
    'Bebidas': 'bg-blue-100',
    'Laticínios': 'bg-green-100',
    'Produtos de Limpeza': 'bg-purple-100',
    'Higiene Pessoal': 'bg-yellow-100'
  };

  useEffect(() => {
    if (turnoId) {
      carregarDados();
    }
  }, [turnoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [produtosRes, variacoesRes, setoresRes, categoriasRes, contagensRes] = await Promise.allSettled([
        produtoService.getAll(),
        variacaoService.getAll(),
        setorService.getAll(),
        categoriaService.getAll(),
        contagensService.getByTurno(turnoId)
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

      // Carregar contagens existentes do turno
      if (contagensRes.status === 'fulfilled') {
        const contagensData = contagensRes.value.data || [];
        
        // Buscar ou criar contagem ativa para este turno
        let contagemAtiva = contagensData.find(c => c.status === 'ativa' || c.status === 'em_andamento');
        
        if (!contagemAtiva && contagensData.length === 0) {
          // Criar nova contagem se não existir nenhuma
          try {
            const novaContagem = await contagensService.create({
              turno_id: turnoId,
              tipo_contagem: 'geral'
            });
            contagemAtiva = novaContagem.data;
          } catch (error) {
            console.error('Erro ao criar contagem:', error);
          }
        }
        
        if (contagemAtiva) {
          setContagemAtual(contagemAtiva);
          
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
      }

      // Simular usuários ativos (pode ser implementado com WebSocket futuramente)
      setUsuariosAtivos({});

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    const matchSetor = !filtros.setor || produto.id_setor === filtros.setor;
    const matchCategoria = !filtros.categoria || produto.id_categoria === filtros.categoria;
    const matchProduto = !filtros.produto || produto.nome.toLowerCase().includes(filtros.produto.toLowerCase());
    
    return matchSetor && matchCategoria && matchProduto;
  });

  const getVariacoesPorProduto = (produtoId) => {
    return variacoes.filter(v => v.id_produto === produtoId);
  };

  const getSetorNome = (setorId) => {
    const setor = setores.find(s => s.id === setorId);
    return setor?.nome || '';
  };

  const getCategoriaNome = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nome || '';
  };

  const getCategoriaHierarquia = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return '';
    
    const hierarquia = [];
    let categoriaAtual = categoria;
    
    // Construir hierarquia até a raiz
    while (categoriaAtual) {
      hierarquia.unshift(categoriaAtual);
      categoriaAtual = categorias.find(c => c.id === categoriaAtual.id_categoria_pai);
    }
    
    return hierarquia;
  };

  const renderCategoriaComIndentacao = (hierarquia) => {
    return hierarquia.map((cat, index) => (
      <span key={cat.id}>
        {'  '.repeat(index)}{index > 0 ? '└─ ' : ''}{cat.nome}
        {index < hierarquia.length - 1 && <br />}
      </span>
    ));
  };

  const handleContagemSimples = async (produtoId, valor) => {
    if (!contagemAtual) {
      alert('Erro: Nenhuma contagem ativa encontrada');
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
      
      // Verificar se já existe item para este produto na contagem
      const itemExistente = itensContagem.find(item => {
        const variacao = variacoes.find(v => v.id === item.variacao_id);
        return variacao && variacao.id_produto === produtoId;
      });
      
      if (itemExistente) {
        // Atualizar item existente
        await contagensService.updateItem(contagemAtual.id, itemExistente.id, {
          quantidade_contada: quantidade,
          quantidade_convertida: quantidade,
          observacoes: 'Contagem simples atualizada'
        });
      } else {
        // Criar novo item
        await contagensService.addItem(contagemAtual.id, {
          variacao_id: variacaoPrincipal.id,
          quantidade_contada: quantidade,
          unidade_medida_id: variacaoPrincipal.id_unidade_controle,
          quantidade_convertida: quantidade,
          observacoes: 'Contagem simples'
        });
      }
      
      // Atualizar estado local
      setContagens(prev => ({
        ...prev,
        [produtoId]: quantidade
      }));
      
      // Recarregar itens da contagem
      const itensRes = await contagensService.getItens(contagemAtual.id);
      setItensContagem(itensRes.data || []);
      
    } catch (error) {
      console.error('Erro ao salvar contagem:', error);
      alert('Erro ao salvar contagem: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const abrirModalDetalhado = (produto) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
    
    // Obter unidade principal do produto (primeira variação)
    const produtoVariacoes = getVariacoesPorProduto(produto.id);
    const unidadePrincipal = produtoVariacoes.length > 0 ? 'unidade' : 'unidade';
    
    // Carregar contagem atual se existir
    const contagemAtual = contagens[produto.id] || 0;
    if (contagemAtual > 0) {
      // Mostrar valor atual como primeira linha (unidade principal)
      setContagemDetalhada([{
        id: 'atual',
        quantidade: contagemAtual,
        unidade: unidadePrincipal,
        observacao: 'Contagem atual',
        isExisting: true
      }]);
    } else {
      setContagemDetalhada([]);
    }
    
    // Definir unidade principal como default para nova linha
    setNovaLinha({
      quantidade: 0,
      unidade: unidadePrincipal,
      observacao: ''
    });
  };

  const adicionarLinhaDetalhada = () => {
    if (novaLinha.quantidade > 0) {
      setContagemDetalhada(prev => [...prev, { ...novaLinha, id: Date.now() }]);
      setNovaLinha({ quantidade: 0, unidade: '', observacao: '' });
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
    return contagemDetalhada.reduce((total, item) => {
      const quantidade = Number(item.quantidade) || 0;
      
      // Aplicar conversão de unidades
      switch (item.unidade) {
        case 'caixa':
          return total + (quantidade * 24); // 24 unidades por caixa
        case 'pacote':
          return total + (quantidade * 12); // 12 unidades por pacote
        case 'unidade':
        default:
          return total + quantidade;
      }
    }, 0);
  };

  const salvarContagemDetalhada = async () => {
    if (!contagemAtual || !produtoSelecionado) {
      alert('Erro: Dados insuficientes para salvar');
      return;
    }

    try {
      const produtoVariacoes = getVariacoesPorProduto(produtoSelecionado.id);
      if (produtoVariacoes.length === 0) {
        alert('Produto não possui variações cadastradas');
        return;
      }

      const variacaoPrincipal = produtoVariacoes[0];

      // Remover itens existentes deste produto na contagem
      const itensExistentes = itensContagem.filter(item => {
        const variacao = variacoes.find(v => v.id === item.variacao_id);
        return variacao && variacao.id_produto === produtoSelecionado.id;
      });

      for (const item of itensExistentes) {
        await contagensService.removeItem(contagemAtual.id, item.id);
      }

      // Adicionar novos itens detalhados (exceto o item atual que é apenas referência)
      for (const linha of contagemDetalhada) {
        if (!linha.isExisting && linha.quantidade > 0) {
          const quantidadeConvertida = calcularQuantidadeConvertida(linha.quantidade, linha.unidade);
          
          await contagensService.addItem(contagemAtual.id, {
            variacao_id: variacaoPrincipal.id,
            quantidade_contada: linha.quantidade,
            unidade_medida_id: variacaoPrincipal.id_unidade_controle,
            quantidade_convertida: quantidadeConvertida,
            observacoes: linha.observacao || 'Contagem detalhada'
          });
        }
      }

      // Calcular e salvar total
      const total = calcularTotalDetalhado();
      
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
      
    } catch (error) {
      console.error('Erro ao salvar contagem detalhada:', error);
      alert('Erro ao salvar contagem detalhada: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const calcularQuantidadeConvertida = (quantidade, unidade) => {
    const qtd = Number(quantidade) || 0;
    switch (unidade) {
      case 'caixa':
        return qtd * 24; // 24 unidades por caixa
      case 'pacote':
        return qtd * 12; // 12 unidades por pacote
      case 'unidade':
      default:
        return qtd;
    }
  };

  // Agrupar produtos por setor e categoria hierárquica
  const produtosAgrupados = produtosFiltrados.reduce((acc, produto) => {
    const setorNome = getSetorNome(produto.id_setor);
    const hierarquiaCategoria = getCategoriaHierarquia(produto.id_categoria);
    const categoriaKey = hierarquiaCategoria.map(c => c.nome).join(' → ');
    
    if (!acc[setorNome]) {
      acc[setorNome] = {};
    }
    if (!acc[setorNome][categoriaKey]) {
      acc[setorNome][categoriaKey] = {
        produtos: [],
        hierarquia: hierarquiaCategoria
      };
    }
    
    acc[setorNome][categoriaKey].produtos.push(produto);
    return acc;
  }, {});

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
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contagem de Produtos</h1>
                  <p className="text-sm text-gray-500">Turno: {turnoId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
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
              
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="categorias-list"
                    value={filtros.categoria ? getCategoriaNome(filtros.categoria) : ''}
                    onChange={(e) => {
                      const categoriaEncontrada = categorias.find(c => 
                        c.nome.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setFiltros(prev => ({ 
                        ...prev, 
                        categoria: categoriaEncontrada ? categoriaEncontrada.id : '' 
                      }));
                    }}
                    placeholder="Digite ou selecione uma categoria..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <datalist id="categorias-list">
                    <option value="">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.nome}>
                        {categoria.nome}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
              
              <div className="flex-1 min-w-[250px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar produto..."
                    value={filtros.produto}
                    onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Produtos por Setor/Categoria */}
        <div className="space-y-6">
          {Object.entries(produtosAgrupados).map(([setorNome, categorias]) => (
            <div key={setorNome} className={`${coresSetores[setorNome] || 'bg-gray-50'} rounded-lg p-4`}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{setorNome}</h2>
              
              {Object.entries(categorias).map(([categoriaKey, categoriaData]) => (
                <div key={categoriaKey} className={`${coresCategorias[categoriaData.hierarquia[categoriaData.hierarquia.length - 1]?.nome] || 'bg-gray-100'} rounded-lg p-3 mb-4`}>
                  <div className="mb-3">
                    <h3 className="text-md font-semibold text-gray-800 font-mono leading-relaxed">
                      {renderCategoriaComIndentacao(categoriaData.hierarquia)}
                    </h3>
                  </div>
                  
                  {/* Filtros da tabela */}
                  <div className="bg-gray-50 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="Filtrar produtos..."
                          className="w-48 h-8 text-sm"
                        />
                        <select className="h-8 text-sm border border-gray-300 rounded-md">
                          <option value="">Todos os status</option>
                          <option value="ativo">Apenas ativos</option>
                          <option value="inativo">Apenas inativos</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Ordenar por:</span>
                        <select className="h-8 text-sm border border-gray-300 rounded-md">
                          <option value="nome">Nome</option>
                          <option value="contagem">Contagem</option>
                          <option value="variacoes">Nº Variações</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                            Produto ↕
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                            Variações ↕
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                            Status ↕
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                            Contagem ↕
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {categoriaData.produtos.map((produto) => {
                          const produtoVariacoes = getVariacoesPorProduto(produto.id);
                          const contagemAtual = contagens[produto.id] || 0;
                          const usuarioAtivo = usuariosAtivos[produto.id];
                          
                          return (
                            <tr key={produto.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {produto.imagem_principal_url ? (
                                      <img 
                                        src={produto.imagem_principal_url} 
                                        alt={produto.nome}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{produto.nome}</p>
                                    {usuarioAtivo && (
                                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                                        <Users className="h-3 w-3" />
                                        <span>{usuarioAtivo} está contando</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{produtoVariacoes.length} variação(ões)</span>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={produto.ativo ? "default" : "secondary"}>
                                  {produto.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={contagemAtual}
                                  onChange={(e) => handleContagemSimples(produto.id, e.target.value)}
                                  className="w-20 text-center"
                                  min="0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalDetalhado(produto)}
                                  className="flex items-center space-x-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Detalhado</span>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Contagem Detalhada */}
      {modalAberto && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Contagem Detalhada - {produtoSelecionado.nome}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalAberto(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Adicionar nova linha */}
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="font-medium mb-3">Adicionar Contagem</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    value={novaLinha.quantidade}
                    onChange={(e) => setNovaLinha(prev => ({ ...prev, quantidade: e.target.value }))}
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                  </label>
                  <select
                    value={novaLinha.unidade}
                    onChange={(e) => setNovaLinha(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione</option>
                    <option value="unidade">Unidades</option>
                    <option value="caixa">Caixas (24 un)</option>
                    <option value="pacote">Pacotes (12 un)</option>
                  </select>
                </div>
                <div className="flex items-end">
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
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação (opcional)
                </label>
                <Input
                  value={novaLinha.observacao}
                  onChange={(e) => setNovaLinha(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Ex: Produtos na prateleira superior"
                />
              </div>
            </div>

            {/* Lista de contagens adicionadas */}
            {contagemDetalhada.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-3">Contagens Adicionadas</h4>
                <div className="space-y-2">
                  {contagemDetalhada.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-4 gap-3 items-center">
                        <div>
                          <Input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => editarLinhaDetalhada(item.id, { quantidade: e.target.value })}
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
                            <option value="unidade">Unidades</option>
                            <option value="caixa">Caixas (24 un)</option>
                            <option value="pacote">Pacotes (12 un)</option>
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
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removerLinhaDetalhada(item.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            disabled={item.isExisting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {item.isExisting && (
                        <p className="text-xs text-blue-600 mt-1">Contagem atual (não editável)</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Total calculado: {calcularTotalDetalhado()} unidades
                  </p>
                </div>
              </div>
            )}

            {/* Botões do modal */}
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarContagemDetalhada}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Contagem
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContagemPage;
