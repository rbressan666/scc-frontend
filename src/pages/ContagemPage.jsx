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
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { produtoService, variacaoService, setorService, categoriaService, contagensService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const ContagemPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const { toast } = useToast();
  
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
  const [inicializandoContagem, setInicializandoContagem] = useState(false);
  
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

  useEffect(() => {
    if (turnoId) {
      carregarDados();
    }
  }, [turnoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando carregamento de dados para turno:', turnoId);
      
      const [produtosRes, variacoesRes, setoresRes, categoriasRes, unidadesRes] = await Promise.allSettled([
        produtoService.getAll(),
        variacaoService.getAll(),
        setorService.getAll(),
        categoriaService.getAll(),
        // Assumindo que existe um serviço de unidades de medida
        fetch('/api/unidades-medida').then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (produtosRes.status === 'fulfilled') {
        const produtosData = produtosRes.value?.data || produtosRes.value || [];
        setProdutos(Array.isArray(produtosData) ? produtosData : []);
        console.log('✅ Produtos carregados:', produtosData.length);
      }

      if (variacoesRes.status === 'fulfilled') {
        const variacoesData = variacoesRes.value?.data || variacoesRes.value || [];
        setVariacoes(Array.isArray(variacoesData) ? variacoesData : []);
        console.log('✅ Variações carregadas:', variacoesData.length);
      }

      if (setoresRes.status === 'fulfilled') {
        const setoresData = setoresRes.value?.data || setoresRes.value || [];
        setSetores(Array.isArray(setoresData) ? setoresData : []);
        console.log('✅ Setores carregados:', setoresData.length);
      }

      if (categoriasRes.status === 'fulfilled') {
        const categoriasData = categoriasRes.value?.data || categoriasRes.value || [];
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        console.log('✅ Categorias carregadas:', categoriasData.length);
      }

      if (unidadesRes.status === 'fulfilled') {
        const unidadesData = unidadesRes.value?.data || unidadesRes.value || [];
        setUnidadesMedida(Array.isArray(unidadesData) ? unidadesData : []);
        console.log('✅ Unidades de medida carregadas:', unidadesData.length);
      }

      // Inicializar contagem após carregar dados básicos
      await inicializarContagem();

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da contagem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inicializarContagem = async () => {
    try {
      setInicializandoContagem(true);
      console.log('🔄 Inicializando contagem para turno:', turnoId);
      
      // Tentar carregar contagem existente
      let contagemAtiva = null;
      
      try {
        const contagensRes = await contagensService.getByTurno(turnoId);
        const contagensData = contagensRes?.data || [];
        console.log('📊 Contagens existentes:', contagensData.length);
        
        // Buscar contagem ativa
        contagemAtiva = contagensData.find(c => 
          c.status === 'ativa' || 
          c.status === 'em_andamento' || 
          c.status === 'aberta'
        );
        
        console.log('🎯 Contagem ativa encontrada:', !!contagemAtiva);
        
      } catch (error) {
        console.log('⚠️ Erro ao buscar contagens existentes:', error.message);
      }
      
      // Se não encontrou contagem ativa, criar uma nova
      if (!contagemAtiva) {
        console.log('🆕 Criando nova contagem...');
        
        try {
          const novaContagemRes = await contagensService.create({
            turno_id: turnoId,
            tipo_contagem: 'geral',
            status: 'em_andamento'
          });
          
          contagemAtiva = novaContagemRes?.data || novaContagemRes;
          console.log('✅ Nova contagem criada:', contagemAtiva?.id);
          
        } catch (createError) {
          console.error('❌ Erro ao criar contagem:', createError);
          
          // Fallback: criar contagem local temporária
          contagemAtiva = {
            id: `temp-${turnoId}-${Date.now()}`,
            turno_id: turnoId,
            tipo_contagem: 'geral',
            status: 'em_andamento',
            _isLocal: true
          };
          
          console.log('🔄 Contagem local temporária criada:', contagemAtiva.id);
          
          toast({
            title: "Modo Offline",
            description: "Contagem será salva localmente até conexão ser restaurada",
            variant: "default",
          });
        }
      }
      
      // Definir contagem atual
      if (contagemAtiva) {
        setContagemAtual(contagemAtiva);
        console.log('🎯 Contagem atual definida:', contagemAtiva.id);
        
        // Carregar itens da contagem se não for local
        if (!contagemAtiva._isLocal) {
          await carregarItensContagem(contagemAtiva.id);
        }
      } else {
        throw new Error('Não foi possível inicializar contagem');
      }
      
    } catch (error) {
      console.error('❌ Erro crítico na inicialização:', error);
      
      toast({
        title: "Erro de Inicialização",
        description: "Não foi possível inicializar a contagem. Tente recarregar a página.",
        variant: "destructive",
      });
      
    } finally {
      setInicializandoContagem(false);
    }
  };

  const carregarItensContagem = async (contagemId) => {
    try {
      console.log('📦 Carregando itens da contagem:', contagemId);
      
      const itensRes = await contagensService.getItens(contagemId);
      const itens = itensRes?.data || [];
      
      setItensContagem(itens);
      console.log('✅ Itens carregados:', itens.length);
      
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
      console.log('📊 Contagens por produto atualizadas:', Object.keys(contagensPorProduto).length);
      
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
    }
  };

  const handleContagemSimples = async (produtoId, valor) => {
    console.log('🔢 Iniciando contagem simples:', { produtoId, valor, contagemAtual: !!contagemAtual });
    
    // Verificar se contagem está inicializada
    if (!contagemAtual) {
      console.log('⚠️ Contagem não inicializada, tentando inicializar...');
      
      toast({
        title: "Inicializando Contagem",
        description: "Aguarde enquanto preparamos a contagem...",
      });
      
      try {
        await inicializarContagem();
        
        // Verificar novamente após inicialização
        if (!contagemAtual) {
          throw new Error('Falha na inicialização da contagem');
        }
        
      } catch (error) {
        console.error('❌ Falha na inicialização:', error);
        
        toast({
          title: "Erro",
          description: "Não foi possível inicializar a contagem. Recarregue a página.",
          variant: "destructive",
        });
        
        return;
      }
    }

    try {
      const quantidade = Number(valor) || 0;
      console.log('📊 Processando quantidade:', quantidade);
      
      // Buscar primeira variação do produto para usar como referência
      const produtoVariacoes = getVariacoesPorProduto(produtoId);
      if (produtoVariacoes.length === 0) {
        toast({
          title: "Erro",
          description: "Produto não possui variações cadastradas",
          variant: "destructive",
        });
        return;
      }
      
      const variacaoPrincipal = produtoVariacoes[0];
      console.log('🎯 Variação principal:', variacaoPrincipal.id);
      
      // Se contagem é local, salvar apenas no estado
      if (contagemAtual._isLocal) {
        setContagens(prev => ({
          ...prev,
          [produtoId]: quantidade
        }));
        
        console.log('💾 Contagem salva localmente');
        return;
      }
      
      // Verificar se já existe item para este produto na contagem
      const itemExistente = itensContagem.find(item => {
        const variacao = variacoes.find(v => v.id === item.variacao_id);
        return variacao && variacao.id_produto === produtoId;
      });
      
      if (itemExistente) {
        console.log('🔄 Atualizando item existente:', itemExistente.id);
        
        await contagensService.updateItem(contagemAtual.id, itemExistente.id, {
          quantidade_contada: quantidade,
          quantidade_convertida: quantidade,
          observacoes: 'Contagem simples atualizada'
        });
      } else {
        console.log('🆕 Criando novo item de contagem');
        
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
      await carregarItensContagem(contagemAtual.id);
      
      console.log('✅ Contagem simples concluída');
      
    } catch (error) {
      console.error('❌ Erro na contagem simples:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao salvar contagem. Tente novamente.",
        variant: "destructive",
      });
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
    if (!produtoId) return [];
    
    // Buscar variações do produto
    const produtoVariacoes = getVariacoesPorProduto(produtoId);
    if (produtoVariacoes.length === 0) return [];
    
    // Buscar unidades de medida usadas nas variações
    const unidadesIds = [...new Set(produtoVariacoes.map(v => v.id_unidade_controle))];
    const unidadesRelacionadas = unidadesMedida.filter(u => unidadesIds.includes(u.id));
    
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
    return setor?.nome || '';
  };

  const getCategoriaNome = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nome || '';
  };

  // Componente de status da contagem
  const StatusContagem = () => {
    if (loading || inicializandoContagem) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Carregando contagem...</span>
        </div>
      );
    }
    
    if (!contagemAtual) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>Contagem não inicializada</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={inicializarContagem}
            className="ml-2"
          >
            Tentar Novamente
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Package className="w-4 h-4" />
        <span>
          Contagem ativa: {contagemAtual._isLocal ? 'Local' : contagemAtual.id}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados da contagem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Contagem de Produtos
                </h1>
                <p className="text-sm text-gray-500">Turno: {turnoId}</p>
              </div>
            </div>
            
            <StatusContagem />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setor
                </label>
                <select
                  value={filtros.setor}
                  onChange={(e) => setFiltros(prev => ({ ...prev, setor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os setores</option>
                  {setores.map(setor => (
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
                <select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Produto
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Digite o nome do produto..."
                    value={filtros.produto}
                    onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <div className="grid gap-4">
          {produtosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum produto encontrado com os filtros aplicados</p>
              </CardContent>
            </Card>
          ) : (
            produtosFiltrados.map(produto => (
              <Card key={produto.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {produto.nome}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {getSetorNome(produto.id_setor)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoriaNome(produto.id_categoria)}
                        </Badge>
                      </div>
                      
                      {produto.descricao && (
                        <p className="text-sm text-gray-600 mb-3">
                          {produto.descricao}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Input de contagem simples */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Quantidade:
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={contagens[produto.id] || ''}
                          onChange={(e) => handleContagemSimples(produto.id, e.target.value)}
                          className="w-24 text-center"
                          placeholder="0"
                          disabled={!contagemAtual || inicializandoContagem}
                        />
                      </div>
                      
                      {/* Botão de contagem detalhada */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProdutoSelecionado(produto);
                          setModalAberto(true);
                        }}
                        className="flex items-center gap-2"
                        disabled={!contagemAtual || inicializandoContagem}
                      >
                        <Edit3 className="w-4 h-4" />
                        Detalhada
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContagemPage;
