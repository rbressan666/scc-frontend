import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Eye,
  Save,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setorService, categoriaService, unidadeMedidaService, produtoService, variacaoService } from '../services/api';

const ProdutosPage = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [variacoes, setVariacoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    id_categoria: '',
    id_setor: '',
    imagem_principal_url: '',
    variacoes: []
  });

  const [novaVariacao, setNovaVariacao] = useState({
    nome: '',
    estoque_atual: 0,
    estoque_minimo: 0,
    preco_custo: 0,
    fator_prioridade: 3,
    id_unidade_controle: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados das APIs reais
      const [setoresRes, categoriasRes, unidadesRes, produtosRes, variacoesRes] = await Promise.allSettled([
        setorService.getAll(),
        categoriaService.getAll(),
        unidadeMedidaService.getAll(),
        produtoService.getAll(),
        variacaoService.getAll()
      ]);

      if (setoresRes.status === 'fulfilled') {
        setSetores(setoresRes.value.data || []);
      }

      if (categoriasRes.status === 'fulfilled') {
        setCategorias(categoriasRes.value.data || []);
      }

      if (unidadesRes.status === 'fulfilled') {
        setUnidadesMedida(unidadesRes.value.data || []);
      }

      if (produtosRes.status === 'fulfilled') {
        setProdutos(produtosRes.value.data || []);
      }

      if (variacoesRes.status === 'fulfilled') {
        setVariacoes(variacoesRes.value.data || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.id_categoria || !formData.id_setor) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.variacoes.length === 0) {
      alert('Adicione pelo menos uma variação do produto');
      return;
    }

    try {
      // Criar produto
      const produtoData = {
        nome: formData.nome,
        id_categoria: formData.id_categoria,
        id_setor: formData.id_setor,
        imagem_principal_url: formData.imagem_principal_url || null
      };

      const produtoResponse = await produtoService.create(produtoData);
      const produtoId = produtoResponse.data.id;

      // Criar variações
      for (const variacao of formData.variacoes) {
        const variacaoData = {
          id_produto: produtoId,
          nome: variacao.nome,
          estoque_atual: variacao.estoque_atual,
          estoque_minimo: variacao.estoque_minimo,
          preco_custo: variacao.preco_custo,
          fator_prioridade: variacao.fator_prioridade,
          id_unidade_controle: variacao.id_unidade_controle
        };

        await variacaoService.create(variacaoData);
      }
      
      alert('Produto salvo com sucesso!');
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadData();
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleAddVariacao = () => {
    if (!novaVariacao.nome || !novaVariacao.id_unidade_controle) {
      alert('Preencha o nome e a unidade de medida da variação');
      return;
    }

    setFormData(prev => ({
      ...prev,
      variacoes: [...prev.variacoes, { ...novaVariacao, id: Date.now().toString() }]
    }));

    setNovaVariacao({
      nome: '',
      estoque_atual: 0,
      estoque_minimo: 0,
      preco_custo: 0,
      fator_prioridade: 3,
      id_unidade_controle: ''
    });
  };

  const handleRemoveVariacao = (index) => {
    setFormData(prev => ({
      ...prev,
      variacoes: prev.variacoes.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      id_categoria: '',
      id_setor: '',
      imagem_principal_url: '',
      variacoes: []
    });
    setNovaVariacao({
      nome: '',
      estoque_atual: 0,
      estoque_minimo: 0,
      preco_custo: 0,
      fator_prioridade: 3,
      id_unidade_controle: ''
    });
  };

  const handleViewProduct = (produto) => {
    // Implementar visualização detalhada do produto
    alert(`Visualizar produto: ${produto.nome}\n\nEsta funcionalidade será implementada em breve.`);
  };

  const handleEditProduct = (produto) => {
    // Carregar dados do produto no formulário para edição
    const produtoVariacoes = getVariacoesPorProduto(produto.id);
    
    setFormData({
      id: produto.id,
      nome: produto.nome,
      id_categoria: produto.id_categoria,
      id_setor: produto.id_setor,
      imagem_principal_url: produto.imagem_principal_url || '',
      variacoes: produtoVariacoes
    });
    
    setEditingProduct(produto);
    setShowForm(true);
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = !selectedSetor || produto.id_setor === selectedSetor;
    const matchesCategoria = !selectedCategoria || produto.id_categoria === selectedCategoria;
    
    return matchesSearch && matchesSetor && matchesCategoria;
  });

  const getVariacoesPorProduto = (produtoId) => {
    return variacoes.filter(v => v.id_produto === produtoId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
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
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
                  <p className="text-sm text-gray-500">Gerenciar produtos e variações</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!showForm ? (
          <>
            {/* Filtros */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar produto
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Nome do produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Setor
                    </label>
                    <select
                      value={selectedSetor}
                      onChange={(e) => setSelectedSetor(e.target.value)}
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
                      value={selectedCategoria}
                      onChange={(e) => setSelectedCategoria(e.target.value)}
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
                </div>
              </CardContent>
            </Card>

            {/* Lista de Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Cadastrados ({filteredProdutos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProdutos.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProdutos.map((produto) => {
                      const produtoVariacoes = getVariacoesPorProduto(produto.id);
                      
                      return (
                        <div key={produto.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              {/* Imagem do produto */}
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {produto.imagem_principal_url ? (
                                  <img 
                                    src={produto.imagem_principal_url} 
                                    alt={produto.nome}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center ${produto.imagem_principal_url ? 'hidden' : 'flex'}`}>
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              </div>
                              
                              {/* Informações do produto */}
                              <div>
                                <h3 className="font-medium text-lg">{produto.nome}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span><strong>Setor:</strong> {produto.setor_nome}</span>
                                  <span>•</span>
                                  <span><strong>Categoria:</strong> {produto.categoria_nome}</span>
                                  <span>•</span>
                                  <span><strong>Variações:</strong> {produtoVariacoes.length}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewProduct(produto)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditProduct(produto)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>
                          
                          {/* Variações */}
                          {produtoVariacoes.length > 0 && (
                            <div className="border-t pt-3">
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Variações:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {produtoVariacoes.map((variacao) => (
                                  <div key={variacao.id} className="bg-gray-50 p-2 rounded text-sm">
                                    <div className="font-medium">{variacao.nome}</div>
                                    <div className="text-gray-600">
                                      Estoque: {variacao.estoque_atual} {variacao.unidade_nome}
                                    </div>
                                    <div className="text-gray-600">
                                      Preço: R$ {Number(variacao.preco_custo || 0).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Formulário de Cadastro */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Básicos do Produto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Coca-Cola"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem
                    </label>
                    <Input
                      value={formData.imagem_principal_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, imagem_principal_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Setor *
                    </label>
                    <select
                      value={formData.id_setor}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_setor: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Selecione um setor</option>
                      {setores.map((setor) => (
                        <option key={setor.id} value={setor.id}>
                          {setor.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.id_categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_categoria: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variações */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Variações do Produto</h3>
                  
                  {/* Adicionar Nova Variação */}
                  <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                    <h4 className="font-medium text-gray-700 mb-3">Adicionar Variação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nome *
                        </label>
                        <Input
                          value={novaVariacao.nome}
                          onChange={(e) => setNovaVariacao(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Ex: 350ml"
                          size="sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Unidade *
                        </label>
                        <select
                          value={novaVariacao.id_unidade_controle}
                          onChange={(e) => setNovaVariacao(prev => ({ ...prev, id_unidade_controle: e.target.value }))}
                          className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                        >
                          <option value="">Selecione</option>
                          {unidadesMedida.map((unidade) => (
                            <option key={unidade.id} value={unidade.id}>
                              {unidade.sigla}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Estoque Atual
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          value={novaVariacao.estoque_atual}
                          onChange={(e) => setNovaVariacao(prev => ({ ...prev, estoque_atual: parseFloat(e.target.value) || 0 }))}
                          size="sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Estoque Mínimo
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          value={novaVariacao.estoque_minimo}
                          onChange={(e) => setNovaVariacao(prev => ({ ...prev, estoque_minimo: parseFloat(e.target.value) || 0 }))}
                          size="sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Preço Custo
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={novaVariacao.preco_custo}
                          onChange={(e) => setNovaVariacao(prev => ({ ...prev, preco_custo: parseFloat(e.target.value) || 0 }))}
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={handleAddVariacao}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Variações Adicionadas */}
                  {formData.variacoes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Variações Adicionadas ({formData.variacoes.length})</h4>
                      <div className="space-y-2">
                        {formData.variacoes.map((variacao, index) => {
                          const unidade = unidadesMedida.find(u => u.id === variacao.id_unidade_controle);
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="font-medium">{variacao.nome}</span>
                                <span>Unidade: {unidade?.sigla}</span>
                                <span>Estoque: {variacao.estoque_atual}</span>
                                <span>Mínimo: {variacao.estoque_minimo}</span>
                                <span>Preço: R$ {Number(variacao.preco_custo || 0).toFixed(2)}</span>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleRemoveVariacao(index)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingProduct ? 'Atualizar' : 'Salvar'} Produto
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ProdutosPage;
