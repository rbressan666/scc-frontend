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
      console.error('Erro ao carregar variações de produtos:', error);
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

  const getEstoqueStatus = (atual, minimo) => {
    if (atual <= minimo) {
      return { variant: 'destructive', text: 'Baixo' };
    } else if (atual <= minimo * 1.5) {
      return { variant: 'secondary', text: 'Atenção' };
    }
    return { variant: 'default', text: 'Normal' };
  };

  const goToCameraRegistration = () => {
    navigate('/produtos/cadastro-camera');
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
            
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">SCC</span>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900">
              Gestão de Produtos
            </h1>
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
                    Gerencie produtos e variações do estoque
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={goToCameraRegistration}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Cadastrar por Câmera
                  </Button>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Filtros */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="Buscar por nome..."
                    value={filters.nome}
                    onChange={(e) => handleFilterChange('nome', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Select
                    value={filters.setor}
                    onValueChange={(value) => handleFilterChange('setor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os setores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os setores</SelectItem>
                      {setores.map((setor) => (
                        <SelectItem key={setor.id} value={setor.nome}>
                          {setor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select
                    value={filters.categoria}
                    onValueChange={(value) => handleFilterChange('categoria', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.nome}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Variação</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Preço de Custo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : variacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Nenhuma variação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      variacoes.map((variacao) => {
                        const status = getEstoqueStatus(variacao.estoque_atual, variacao.estoque_minimo);
                        return (
                          <TableRow key={variacao.id}>
                            <TableCell className="font-medium">
                              {variacao.produto?.nome || 'N/A'}
                            </TableCell>
                            <TableCell>{variacao.nome}</TableCell>
                            <TableCell>{variacao.produto?.setor?.nome || 'N/A'}</TableCell>
                            <TableCell>{variacao.produto?.categoria?.nome || 'N/A'}</TableCell>
                            <TableCell>{variacao.estoque_atual || 0}</TableCell>
                            <TableCell>{variacao.estoque_minimo || 0}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>
                                {status.text}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(variacao.preco_custo)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProdutosPage;

