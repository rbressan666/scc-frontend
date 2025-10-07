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
  RefreshCw,
  Calculator
} from 'lucide-react';
import { produtoService, variacaoService, setorService, categoriaService, contagensService, unidadeMedidaService } from '../services/api';
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
    unidade_id: '',
    observacao: ''
  });

  // Cores para setores e categorias (layout original)
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
      console.log('🔄 Iniciando carregamento de dados para turno:', turnoId);
      
      const [produtosRes, variacoesRes, setoresRes, categoriasRes, unidadesRes] = await Promise.allSettled([
        produtoService.getAll(),
        variacaoService.getAll(),
        setorService.getAll(),
        categoriaService.getAll(),
        // Carregar unidades de medida
        unidadeMedidaService.getAll()
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
      
      // Atualizar estado local imediatamente para feedback visual
      setContagens(prev => ({
        ...prev,
        [produtoId]: quantidade
      }));
      
      // Se contagem é local, salvar apenas no estado
      if (contagemAtual._isLocal) {
        console.log('💾 Contagem salva localmente');
        return;
      }
      
      // Buscar primeira variação do produto ordenada por prioridade para usar como referência
      const produtoVariacoes = getVariacoesPorProduto(produtoId).sort((a, b) => a.fator_prioridade - b.fator_prioridade);
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
      
      // Recarregar itens da contagem
      await carregarItensContagem(contagemAtual.id);
      
      console.log('✅ Contagem simples concluída');
      
    } catch (error) {
      console.error('❌ Erro na contagem simples:', error);
      
      // Reverter estado local em caso de erro
      setContagens(prev => {
        const newContagens = { ...prev };
        delete newContagens[produtoId];
        return newContagens;
      });
      
      toast({
        title: "Erro",
        description: "Erro ao salvar contagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para obter unidades de medida relacionadas ao produto
  const getUnidadesPorProduto = (produtoId) => {
    console.log('🔍 Buscando unidades para produto:', produtoId);
    
    // Buscar variações do produto ordenadas por fator_prioridade
    const produtoVariacoes = getVariacoesPorProduto(produtoId).sort((a, b) => a.fator_prioridade - b.fator_prioridade);
    console.log('📦 Variações encontradas (ordenadas):', produtoVariacoes.length);
    
    // Extrair IDs únicos das unidades de controle mantendo a ordem de prioridade
    const unidadeIds = [];
    const unidadesJaAdicionadas = new Set();
    
    produtoVariacoes.forEach(variacao => {
      if (variacao.id_unidade_controle && !unidadesJaAdicionadas.has(variacao.id_unidade_controle)) {
        unidadeIds.push(variacao.id_unidade_controle);
        unidadesJaAdicionadas.add(variacao.id_unidade_controle);
      }
    });
    
    console.log('🎯 IDs de unidades únicas (por prioridade):', unidadeIds);
    
    // Buscar unidades de medida correspondentes mantendo a ordem de prioridade
    const unidadesRelacionadas = [];
    unidadeIds.forEach(unidadeId => {
      const unidade = unidadesMedida.find(u => u.id === unidadeId && u.ativo !== false);
      if (unidade) {
        unidadesRelacionadas.push(unidade);
      }
    });
    
    console.log('✅ Unidades relacionadas encontradas (ordenadas):', unidadesRelacionadas.length);
    
    return unidadesRelacionadas;
  };

  // Função para calcular quantidade convertida baseada na unidade de medida
  const calcularQuantidadeConvertida = (quantidade, unidadeUsadaId, produtoId) => {
    console.log('🧮 Calculando conversão:', { quantidade, unidadeUsadaId, produtoId });
    
    // Buscar unidades do produto
    const unidadesProduto = getUnidadesPorProduto(produtoId);
    if (unidadesProduto.length === 0) {
      console.log('⚠️ Nenhuma unidade encontrada para o produto');
      return quantidade;
    }
    
    // Unidade principal (primeira da lista ordenada por prioridade)
    const unidadePrincipal = unidadesProduto[0];
    console.log('🎯 Unidade principal:', unidadePrincipal.nome);
    
    // Se está usando a unidade principal, não precisa converter
    if (unidadeUsadaId === unidadePrincipal.id) {
      console.log('✅ Usando unidade principal, sem conversão');
      return quantidade;
    }
    
    // Buscar unidade usada
    const unidadeUsada = unidadesMedida.find(u => u.id === unidadeUsadaId);
    if (!unidadeUsada) {
      console.log('⚠️ Unidade usada não encontrada');
      return quantidade;
    }
    
    console.log('🔄 Unidade usada:', unidadeUsada.nome);
    
    // Calcular conversão baseada na quantidade da unidade
    // Exemplo: Se unidade principal é "Unidade" (quantidade=1) e usada é "Pacote" (quantidade=10)
    // 2 pacotes = 2 × 10 = 20 unidades
    // Se unidade principal é "Pacote" (quantidade=10) e usada é "Unidade" (quantidade=1)  
    // 20 unidades = 20 × (1/10) = 2 pacotes
    const quantidadeUnidadeUsada = unidadeUsada.quantidade || 1;
    const quantidadeUnidadePrincipal = unidadePrincipal.quantidade || 1;
    
    // Fórmula corrigida: quantidade × (quantidadeUnidadeUsada / quantidadeUnidadePrincipal)
    const quantidadeConvertida = quantidade * (quantidadeUnidadeUsada / quantidadeUnidadePrincipal);
    
    console.log('📊 Conversão calculada:', {
      quantidade,
      quantidadeUnidadeUsada,
      quantidadeUnidadePrincipal,
      formula: `${quantidade} × (${quantidadeUnidadeUsada}/${quantidadeUnidadePrincipal})`,
      resultado: quantidadeConvertida
    });
    
    return quantidadeConvertida;
  };

  const abrirModalDetalhado = (produto) => {
    console.log('🔍 Abrindo modal detalhado para produto:', produto.nome);
    
    setProdutoSelecionado(produto);
    setModalAberto(true);
    
    // Obter unidades relacionadas ao produto
    const unidadesProduto = getUnidadesPorProduto(produto.id);
    console.log('📦 Unidades do produto:', unidadesProduto.map(u => u.nome));
    
    // Definir unidade principal como default (primeira da lista)
    const unidadePrincipal = unidadesProduto.length > 0 ? unidadesProduto[0] : null;
    
    // Carregar contagem atual se existir
    const contagemAtualProduto = contagens[produto.id] || 0;
    if (contagemAtualProduto > 0 && unidadePrincipal) {
      // Mostrar valor atual como primeira linha (unidade principal)
      setContagemDetalhada([{
        id: 'atual',
        quantidade: contagemAtualProduto,
        unidade_id: unidadePrincipal.id,
        unidade_nome: unidadePrincipal.nome,
        observacao: 'Contagem atual',
        isExisting: true,
        quantidade_convertida: contagemAtualProduto
      }]);
    } else {
      setContagemDetalhada([]);
    }
    
    // Definir unidade principal como default para nova linha
    setNovaLinha({
      quantidade: 0,
      unidade_id: unidadePrincipal?.id || '',
      observacao: ''
    });
  };

  const adicionarLinhaDetalhada = () => {
    if (novaLinha.quantidade > 0 && novaLinha.unidade_id) {
      // Buscar dados da unidade selecionada
      const unidadeSelecionada = unidadesMedida.find(u => u.id === novaLinha.unidade_id);
      
      // Calcular quantidade convertida
      const quantidadeConvertida = calcularQuantidadeConvertida(
        Number(novaLinha.quantidade),
        novaLinha.unidade_id,
        produtoSelecionado.id
      );
      
      const novaLinhaCompleta = {
        ...novaLinha,
        id: Date.now(),
        quantidade: Number(novaLinha.quantidade),
        unidade_nome: unidadeSelecionada?.nome || 'Unidade',
        quantidade_convertida: quantidadeConvertida
      };
      
      console.log('➕ Adicionando linha detalhada:', novaLinhaCompleta);
      
      setContagemDetalhada(prev => [...prev, novaLinhaCompleta]);
      
      // Resetar nova linha mantendo unidade principal
      const unidadesProduto = getUnidadesPorProduto(produtoSelecionado?.id);
      const unidadePrincipal = unidadesProduto.length > 0 ? unidadesProduto[0] : null;
      
      setNovaLinha({ 
        quantidade: 0, 
        unidade_id: unidadePrincipal?.id || '', 
        observacao: '' 
      });
    }
  };

  const removerLinhaDetalhada = (id) => {
    setContagemDetalhada(prev => prev.filter(item => item.id !== id));
  };

  const calcularTotalDetalhado = () => {
    // Somar apenas as quantidades convertidas das linhas não existentes
    const total = contagemDetalhada.reduce((total, item) => {
      if (item.isExisting) return total; // Não contar a linha "atual"
      return total + (Number(item.quantidade_convertida) || 0);
    }, 0);
    
    console.log('🧮 Total detalhado calculado:', total);
    return total;
  };

  const salvarContagemDetalhada = async () => {
    console.log('💾 Salvando contagem detalhada');
    console.log('📋 Dados da contagem detalhada:', contagemDetalhada);
    console.log('🎯 Produto selecionado:', produtoSelecionado?.nome);
    console.log('📊 Contagem atual:', contagemAtual?.id);
    
    if (!contagemAtual || !produtoSelecionado) {
      console.error('❌ Dados insuficientes:', { contagemAtual: !!contagemAtual, produtoSelecionado: !!produtoSelecionado });
      toast({
        title: "Erro",
        description: "Dados insuficientes para salvar contagem detalhada",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há itens para salvar
    const itensParaSalvar = contagemDetalhada.filter(item => !item.isExisting);
    if (itensParaSalvar.length === 0) {
      console.log('⚠️ Nenhum item novo para salvar');
      toast({
        title: "Aviso",
        description: "Adicione pelo menos uma contagem antes de salvar",
        variant: "default",
      });
      return;
    }

    try {
      const total = calcularTotalDetalhado();
      console.log('📊 Total calculado para salvar:', total);
      console.log('📝 Itens que serão salvos:', itensParaSalvar);
      
      if (total <= 0) {
        console.log('⚠️ Total é zero ou negativo');
        toast({
          title: "Aviso",
          description: "O total da contagem deve ser maior que zero",
          variant: "default",
        });
        return;
      }
      
      // Salvar como contagem simples com o total calculado
      console.log('🔄 Chamando handleContagemSimples...');
      await handleContagemSimples(produtoSelecionado.id, total);
      
      console.log('✅ Contagem salva com sucesso');
      
      // Fechar modal
      setModalAberto(false);
      setProdutoSelecionado(null);
      setContagemDetalhada([]);
      
      toast({
        title: "Sucesso",
        description: `Contagem detalhada salva: ${total.toFixed(2)} unidades`,
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar contagem detalhada:', error);
      console.error('❌ Stack trace:', error.stack);
      
      toast({
        title: "Erro",
        description: `Erro ao salvar contagem detalhada: ${error.message || 'Erro desconhecido'}`,
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
    if (!categoria) return [];
    
    const hierarquia = [categoria];
    let categoriaAtual = categoria;
    
    while (categoriaAtual.id_categoria_pai) {
      const categoriaPai = categorias.find(c => c.id === categoriaAtual.id_categoria_pai);
      if (categoriaPai) {
        hierarquia.unshift(categoriaPai);
        categoriaAtual = categoriaPai;
      } else {
        break;
      }
    }
    
    return hierarquia;
  };

  const renderCategoriaComIndentacao = (hierarquia) => {
    return hierarquia.map((categoria, index) => (
      <span key={categoria.id}>
        {index > 0 && ' → '}
        {categoria.nome}
      </span>
    ));
  };

  // Agrupar produtos por setor e categoria (layout original)
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
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {/* Lista de Produtos por Setor/Categoria (Layout Original) */}
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
                  
                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Produto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Variações
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Contagem
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {categoriaData.produtos.map((produto) => {
                          const produtoVariacoes = getVariacoesPorProduto(produto.id);
                          const contagemAtualProduto = contagens[produto.id] || 0;
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
                                  value={contagemAtualProduto}
                                  onChange={(e) => handleContagemSimples(produto.id, e.target.value)}
                                  className="w-20 text-center"
                                  min="0"
                                  step="0.01"
                                  disabled={!contagemAtual || inicializandoContagem}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalDetalhado(produto)}
                                  className="flex items-center space-x-1"
                                  disabled={!contagemAtual || inicializandoContagem}
                                >
                                  <Calculator className="h-3 w-3" />
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
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
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={novaLinha.unidade_id}
                    onChange={(e) => setNovaLinha(prev => ({ ...prev, unidade_id: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione</option>
                    {getUnidadesPorProduto(produtoSelecionado.id).map((unidade, index) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome} {index === 0 && '(Principal)'}
                        {unidade.quantidade && unidade.quantidade !== 1 && ` - ${unidade.quantidade}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={adicionarLinhaDetalhada}
                    size="sm"
                    className="w-full"
                    disabled={!novaLinha.quantidade || novaLinha.quantidade <= 0 || !novaLinha.unidade_id}
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
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3">Contagens Registradas</h4>
                <div className="space-y-2">
                  {contagemDetalhada.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{item.quantidade} {item.unidade_nome}</span>
                          <span className="text-sm text-blue-600">
                            = {item.quantidade_convertida?.toFixed(2)} unidades principais
                          </span>
                          {item.isExisting && (
                            <Badge variant="secondary" className="text-xs">Atual</Badge>
                          )}
                        </div>
                        {item.observacao && (
                          <div className="text-sm text-gray-600 mt-1">{item.observacao}</div>
                        )}
                      </div>
                      {!item.isExisting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerLinhaDetalhada(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t bg-blue-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Convertido:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {calcularTotalDetalhado().toFixed(2)} unidades principais
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Este valor será salvo como contagem do produto
                  </div>
                </div>
              </div>
            )}

            {/* Botões do modal */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarContagemDetalhada}
                disabled={contagemDetalhada.filter(item => !item.isExisting).length === 0}
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
