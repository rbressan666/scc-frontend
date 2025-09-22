// pages/ProdutosPage.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Camera, 
  Image as ImageIcon,
  Eye,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { variacaoService, setorService, categoriaService } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import Layout from '../components/Layout';

const ProdutosPage = () => {
  const navigate = useNavigate();
  const [variacoes, setVariacoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    nome: '',
    setor: 'todos',
    categoria: 'todas',
    estoque_baixo: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadVariacoes();
  }, [filters]);

  const loadData = async () => {
    try {
      const [setoresRes, categoriasRes] = await Promise.all([
        setorService.getAll(),
        categoriaService.getAll()
      ]);
      
      setSetores(setoresRes.data || []);
      setCategorias(categoriasRes.data || []);
      
      await loadVariacoes();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const loadVariacoes = async () => {
    try {
      setLoading(true);
      
      // Converter filtros para o formato esperado pela API
      const apiFilters = {
        nome: filters.nome || undefined,
        setor: filters.setor === 'todos' ? undefined : filters.setor,
        categoria: filters.categoria === 'todas' ? undefined : filters.categoria,
        estoque_baixo: filters.estoque_baixo
      };
      
      const response = await variacaoService.getAll(apiFilters);
      setVariacoes(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar variações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar variações de produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      nome: '',
      setor: 'todos',
      categoria: 'todas',
      estoque_baixo: false
    });
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatQuantity = (value) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }).format(value);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-blue-100 text-blue-800';
      case 5: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Crítica';
      case 2: return 'Alta';
      case 3: return 'Média';
      case 4: return 'Baixa';
      case 5: return 'Muito Baixa';
      default: return 'Indefinida';
    }
  };

  const isEstoqueBaixo = (variacao) => {
    return variacao.estoque_atual <= variacao.estoque_minimo;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
              <p className="text-gray-600">Gerencie produtos, variações e estoque</p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Botões de funcionalidades de foto */}
            <Button
              onClick={() => navigate('/produtos/reconhecimento')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Reconhecer Produto
            </Button>
            
            <Button
              onClick={() => navigate('/produtos/cadastro-via-foto')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Camera className="h-4 w-4" />
              Cadastrar via Foto
            </Button>

            <Button
              onClick={() => navigate('/produtos/cadastro-camera')}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Cadastrar via Câmera
            </Button>

            <Button
              onClick={() => navigate('/produtos/novo')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-lg">Filtros</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Produto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={filters.nome}
                    onChange={(e) => handleFilterChange('nome', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Setor</label>
                <Select
                  value={filters.setor}
                  onValueChange={(value) => handleFilterChange('setor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Setores</SelectItem>
                    {setores.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={filters.categoria}
                  onValueChange={(value) => handleFilterChange('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Categorias</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estoque</label>
                <Select
                  value={filters.estoque_baixo ? 'baixo' : 'todos'}
                  onValueChange={(value) => handleFilterChange('estoque_baixo', value === 'baixo')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Estoques</SelectItem>
                    <SelectItem value="baixo">Apenas Estoque Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Produtos Cadastrados</CardTitle>
                <CardDescription>
                  {variacoes.length} {variacoes.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : variacoes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  {Object.values(filters).some(f => f && f !== 'todos' && f !== 'todas')
                    ? 'Nenhum produto corresponde aos filtros aplicados.'
                    : 'Comece cadastrando seu primeiro produto.'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/produtos/cadastro-via-foto')}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="h-4 w-4" />
                    Cadastrar via Foto
                  </Button>
                  <Button
                    onClick={() => navigate('/produtos/novo')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastro Manual
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Foto</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Variação</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variacoes.map((variacao) => (
                      <TableRow key={variacao.id}>
                        <TableCell>
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {variacao.produto_imagem_principal ? (
                              <img
                                src={variacao.produto_imagem_principal}
                                alt={variacao.produto_nome}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {variacao.produto_nome}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {variacao.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {variacao.setor_nome}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {variacao.categoria_nome}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`text-sm font-medium ${
                              isEstoqueBaixo(variacao) ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatQuantity(variacao.estoque_atual)} {variacao.unidade_sigla}
                            </div>
                            <div className="text-xs text-gray-500">
                              Mín: {formatQuantity(variacao.estoque_minimo)}
                            </div>
                            {isEstoqueBaixo(variacao) && (
                              <Badge variant="destructive" className="text-xs">
                                Estoque Baixo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(variacao.preco_custo)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(variacao.fator_prioridade)}>
                            {getPriorityLabel(variacao.fator_prioridade)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/produtos/${variacao.produto_id}`)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/produtos/${variacao.produto_id}/editar`)}
                              title="Editar produto"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProdutosPage;

