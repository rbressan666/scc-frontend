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
      
      const [produtosRes, variacoesRes, setoresRes, categoriasRes] = await Promise.allSettled([
        produtoService.getAll(),
        variacaoService.getAll(),
        setorService.getAll(),
        categoriaService.getAll()
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

      // Simular contagens existentes
      setContagens({
        'produto-1': 150,
        'produto-2': 75
      });

      // Simular usuários ativos
      setUsuariosAtivos({
        'produto-3': 'João Silva'
      });

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

  const handleContagemSimples = (produtoId, valor) => {
    setContagens(prev => ({
      ...prev,
      [produtoId]: Number(valor) || 0
    }));
  };

  const abrirModalDetalhado = (produto) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
    setContagemDetalhada([]);
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

  const calcularTotalDetalhado = () => {
    return contagemDetalhada.reduce((total, item) => {
      // Aqui seria aplicada a conversão de unidades
      // Por exemplo: se unidade for "caixa" e produto tem fator 24, multiplicar por 24
      return total + Number(item.quantidade);
    }, 0);
  };

  const salvarContagemDetalhada = () => {
    const total = calcularTotalDetalhado();
    handleContagemSimples(produtoSelecionado.id, total);
    setModalAberto(false);
    setProdutoSelecionado(null);
  };

  // Agrupar produtos por setor e categoria
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
              
              {Object.entries(categorias).map(([categoriaNome, produtosCategoria]) => (
                <div key={categoriaNome} className={`${coresCategorias[categoriaNome] || 'bg-gray-100'} rounded-lg p-3 mb-4`}>
                  <h3 className="text-md font-semibold text-gray-800 mb-3">{categoriaNome}</h3>
                  
                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variações</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contagem Atual</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {produtosCategoria.map((produto) => {
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
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium">{item.quantidade} {item.unidade}</span>
                        {item.observacao && <span className="text-gray-600">- {item.observacao}</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removerLinhaDetalhada(item.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
