import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { variacaoService, setorService, categoriaService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const ProdutosPage = () => {
  const navigate = useNavigate();
  const [variacoes, setVariacoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    nome: '',
    setor: '',
    categoria: '',
    estoque_baixo: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadVariacoes();
  }, [filters, setores, categorias, toast]);

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
      const response = await variacaoService.getAll(filters);
      setVariacoes(response.data || []);
    } catch (error) {
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
      setor: '',
      categoria: '',
      estoque_baixo: false
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getEstoqueStatus = (atual, minimo) => {
    if (atual <= minimo) {
      return { variant: 'destructive', text: 'Baixo' };
    } else if (atual <= minimo * 1.5) {
      return { variant: 'secondary', text: 'Atenção' };
    }
    return { variant: 'default', text: 'Normal' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">SCC</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Gestão de Produtos
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Variações de Produtos</CardTitle>
                  <CardDescription>
                    Gerencie todas as variações de produtos do estoque
                  </CardDescription>
                </div>
                <Button disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto (Em breve)
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Filtros */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtros:</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={filters.nome}
                      onChange={(e) => handleFilterChange('nome', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filters.setor} onValueChange={(value) => handleFilterChange('setor', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os setores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os setores</SelectItem>
                      {setores.map((setor) => (
                        <SelectItem key={setor.id} value={setor.id}>
                          {setor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.categoria} onValueChange={(value) => handleFilterChange('categoria', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={filters.estoque_baixo ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('estoque_baixo', !filters.estoque_baixo)}
                    >
                      Estoque Baixo
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando produtos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto / Variação</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Preço Custo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma variação de produto encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      variacoes.map((variacao) => {
                        const estoqueStatus = getEstoqueStatus(variacao.estoque_atual, variacao.estoque_minimo);
                        
                        return (
                          <TableRow key={variacao.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{variacao.produto_nome}</div>
                                <div className="text-sm text-gray-500">{variacao.nome}</div>
                              </div>
                            </TableCell>
                            <TableCell>{variacao.categoria_nome}</TableCell>
                            <TableCell>{variacao.setor_nome}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{variacao.estoque_atual}</span>
                                  <Badge variant={estoqueStatus.variant} className="text-xs">
                                    {estoqueStatus.text}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Mín: {variacao.estoque_minimo}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(variacao.preco_custo)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{variacao.unidade_sigla}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  title="Edição em breve"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  title="Exclusão em breve"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProdutosPage;

