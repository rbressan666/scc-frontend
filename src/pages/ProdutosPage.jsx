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
  Search,
  Filter,
  Package,
  Edit,
  Save,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2
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
  const [saving, setSaving] = useState(false);
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVariacoesPorProduto = (produtoId) => {
    return variacoes.filter(variacao => variacao.id_produto === produtoId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.variacoes.length === 0) {
      alert('É necessário adicionar pelo menos uma variação ao produto');
      return;
    }

    try {
      setSaving(true);
      let produto;
      
      if (editingProduct) {
        // Atualizar produto existente
        const produtoData = {
          nome: formData.nome,
          id_categoria: formData.id_categoria,
          id_setor: formData.id_setor,
          imagem_principal_url: formData.imagem_principal_url || null
        };

        await produtoService.update(editingProduct.id, produtoData);

        // Desativar variações existentes (em vez de usar delete)
        const variacoesExistentes = getVariacoesPorProduto(editingProduct.id);
        for (const variacao of variacoesExistentes) {
          try {
            await variacaoService.deactivate(variacao.id);
          } catch (error) {
            console.error('Erro ao desativar variação:', error);
            // Continua mesmo se houver erro na desativação
          }
        }

        // Criar novas variações com ordem correta
        for (let i = 0; i < formData.variacoes.length; i++) {
          const variacao = formData.variacoes[i];
          const variacaoData = {
            id_produto: editingProduct.id,
            nome: variacao.nome,
            estoque_atual: variacao.estoque_atual,
            estoque_minimo: variacao.estoque_minimo,
            preco_custo: variacao.preco_custo,
            fator_prioridade: i + 1, // Usar índice + 1 para manter ordem
            id_unidade_controle: variacao.id_unidade_controle
          };

          await variacaoService.create(variacaoData);
        }

        produto = { ...editingProduct, ...produtoData };
      } else {
        // Criar novo produto
        const produtoData = {
          nome: formData.nome,
          id_categoria: formData.id_categoria,
          id_setor: formData.id_setor,
          imagem_principal_url: formData.imagem_principal_url || null
        };

        const produtoRes = await produtoService.create(produtoData);
        produto = produtoRes.data;

        // Criar variações com ordem correta
        for (let i = 0; i < formData.variacoes.length; i++) {
          const variacao = formData.variacoes[i];
          const variacaoData = {
            id_produto: produto.id,
            nome: variacao.nome,
            estoque_atual: variacao.estoque_atual,
            estoque_minimo: variacao.estoque_minimo,
            preco_custo: variacao.preco_custo,
            fator_prioridade: i + 1, // Usar índice + 1 para manter ordem
            id_unidade_controle: variacao.id_unidade_controle
          };

          await variacaoService.create(variacaoData);
        }
      }

      // Recarregar dados
      await loadData();
      
      // Resetar formulário
      resetForm();
      setShowForm(false);
      setEditingProduct(null);
      
      // Mostrar mensagem de sucesso sem alert
      console.log(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (produto) => {
    setEditingProduct(produto);
    const produtoVariacoes = getVariacoesPorProduto(produto.id);
    
    // Ordenar variações por fator_prioridade
    const variacoesOrdenadas = produtoVariacoes.sort((a, b) => a.fator_prioridade - b.fator_prioridade);
    
    setFormData({
      nome: produto.nome,
      id_categoria: produto.id_categoria,
      id_setor: produto.id_setor,
      imagem_principal_url: produto.imagem_principal_url || '',
      variacoes: variacoesOrdenadas.map(v => ({
        nome: v.nome,
        estoque_atual: v.estoque_atual,
        estoque_minimo: v.estoque_minimo,
        preco_custo: v.preco_custo,
        fator_prioridade: v.fator_prioridade,
        id_unidade_controle: v.id_unidade_controle
      }))
    });
    
    setShowForm(true);
  };

  const handleAddVariacao = () => {
    if (!novaVariacao.id_unidade_controle) {
      alert('Unidade de medida é obrigatória');
      return;
    }

    // Buscar nome da unidade selecionada para usar como nome da variação
    const unidadeSelecionada = unidadesMedida.find(u => u.id === novaVariacao.id_unidade_controle);
    
    setFormData(prev => ({
      ...prev,
      variacoes: [...prev.variacoes, {
        ...novaVariacao,
        // Usar o nome da unidade de medida como nome da variação
        nome: unidadeSelecionada?.nome || 'Variação'
      }]
    }));

    // Resetar apenas os campos do formulário, mantendo a unidade selecionada
    setNovaVariacao({
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

  const handleMoveVariacao = (fromIndex, toIndex) => {
    setFormData(prev => {
      const newVariacoes = [...prev.variacoes];
      const [movedItem] = newVariacoes.splice(fromIndex, 1);
      newVariacoes.splice(toIndex, 0, movedItem);
      return {
        ...prev,
        variacoes: newVariacoes
      };
    });
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
      estoque_atual: 0,
      estoque_minimo: 0,
      preco_custo: 0,
      fator_prioridade: 3,
      id_unidade_controle: ''
    });
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = !selectedSetor || produto.id_setor === selectedSetor;
    const matchesCategoria = !selectedCategoria || produto.id_categoria === selectedCategoria;
    
    return matchesSearch && matchesSetor && matchesCategoria;
  });

  const getSetorNome = (setorId) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nome : 'N/A';
  };

  const getCategoriaNome = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : 'N/A';
  };

  const getUnidadeNome = (unidadeId) => {
    const unidade = unidadesMedida.find(u => u.id === unidadeId);
    return unidade ? unidade.nome : 'N/A';
  };

  const getUnidadeSigla = (unidadeId) => {
    const unidade = unidadesMedida.find(u => u.id === unidadeId);
    return unidade ? unidade.sigla : 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  // Tela de loading durante salvamento
  if (saving) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Salvando produto...</p>
          <p className="text-gray-500 text-sm">Por favor, aguarde</p>
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
                onClick={() => {
                  if (showForm) {
                    // Se estiver no formulário, voltar para lista de produtos
                    setShowForm(false);
                    setEditingProduct(null);
                    resetForm();
                  } else {
                    // Se estiver na lista, voltar para dashboard
                    navigate('/dashboard');
                  }
                }}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{showForm ? 'Voltar para Lista' : 'Voltar'}</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Sistema Contagem Cadoz</h1>
                  <p className="text-sm text-gray-500">Gestão de Produtos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Produtos</span>
                </CardTitle>
                <CardDescription>
                  Gerencie os produtos e suas variações
                </CardDescription>
              </div>
              
              {!showForm && (
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingProduct(null);
                    setShowForm(true);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Produto</span>
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {showForm ? (
              /* Formulário de Produto */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL da Imagem
                      </label>
                      <Input
                        value={formData.imagem_principal_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, imagem_principal_url: e.target.value }))}
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Unidade de Medida *
                          </label>
                          <select
                            value={novaVariacao.id_unidade_controle}
                            onChange={(e) => setNovaVariacao(prev => ({ ...prev, id_unidade_controle: e.target.value }))}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="">Selecione</option>
                            {unidadesMedida.map((unidade) => (
                              <option key={unidade.id} value={unidade.id}>
                                {unidade.nome} ({unidade.sigla})
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
                        <h4 className="font-medium text-gray-700 mb-3">
                          Variações Adicionadas ({formData.variacoes.length})
                          <span className="text-xs text-gray-500 ml-2">
                            • A primeira variação será a unidade padrão
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {formData.variacoes.map((variacao, index) => {
                            const unidade = unidadesMedida.find(u => u.id === variacao.id_unidade_controle);
                            const isDefault = index === 0;
                            
                            return (
                              <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${isDefault ? 'border-blue-500 bg-blue-50' : ''}`}>
                                <div className="flex items-center space-x-4 text-sm flex-1">
                                  <span className="font-medium">{variacao.nome}</span>
                                  <span>Unidade: {unidade?.nome} ({unidade?.sigla})</span>
                                  <span>Estoque: {variacao.estoque_atual}</span>
                                  <span>Mínimo: {variacao.estoque_minimo}</span>
                                  <span>Preço: R$ {Number(variacao.preco_custo || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {/* Badge PADRÃO à direita */}
                                  {isDefault && (
                                    <Badge className="bg-blue-500 text-white text-xs">
                                      PADRÃO
                                    </Badge>
                                  )}
                                  {/* Botões de ordenação */}
                                  {index > 0 && (
                                    <Button
                                      type="button"
                                      onClick={() => handleMoveVariacao(index, index - 1)}
                                      size="sm"
                                      variant="outline"
                                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                      title="Mover para cima"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {index < formData.variacoes.length - 1 && (
                                    <Button
                                      type="button"
                                      onClick={() => handleMoveVariacao(index, index + 1)}
                                      size="sm"
                                      variant="outline"
                                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                      title="Mover para baixo"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  )}
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
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
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
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingProduct ? 'Atualizar' : 'Salvar'} Produto
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              /* Lista de Produtos */
              <div className="space-y-4">
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={selectedSetor}
                    onChange={(e) => setSelectedSetor(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Todos os setores</option>
                    {setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSetor('');
                      setSelectedCategoria('');
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>

                {/* Tabela de Produtos */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Variações</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProdutos.map((produto) => {
                        const produtoVariacoes = getVariacoesPorProduto(produto.id);
                        // Ordenar variações por fator_prioridade
                        const variacoesOrdenadas = produtoVariacoes.sort((a, b) => a.fator_prioridade - b.fator_prioridade);
                        
                        return (
                          <TableRow key={produto.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {produto.imagem_principal_url && (
                                  <img
                                    src={produto.imagem_principal_url}
                                    alt={produto.nome}
                                    className="w-10 h-10 rounded-lg object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {produto.nome}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getSetorNome(produto.id_setor)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getCategoriaNome(produto.id_categoria)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {variacoesOrdenadas.slice(0, 2).map((variacao, index) => (
                                  <div key={variacao.id} className="text-sm flex items-center space-x-2">
                                    <span className="font-medium">{variacao.nome}</span>
                                    <span className="text-gray-500">
                                      ({getUnidadeSigla(variacao.id_unidade_controle)})
                                    </span>
                                    {index === 0 && (
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                                        PADRÃO
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                                {variacoesOrdenadas.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{variacoesOrdenadas.length - 2} mais
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={produto.ativo ? 'default' : 'secondary'}>
                                {produto.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(produto)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {filteredProdutos.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProdutosPage;
