import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Package, Plus, Minus, Trash2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { contagensService, produtoService, variacaoService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ContagemPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const { user, isAdmin } = useAuth();
  const [contagem, setContagem] = useState(null);
  const [itens, setItens] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [variacoes, setVariacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduto, setSelectedProduto] = useState('');
  const [selectedVariacao, setSelectedVariacao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [parecerOperador, setParecerOperador] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (turnoId) {
      fetchContagemData();
    }
  }, [turnoId]);

  const fetchContagemData = async () => {
    try {
      setError(null);
      
      // Buscar contagem existente ou criar nova
      const contagensRes = await contagensService.getByTurno(turnoId);
      let contagemAtual = null;
      
      if (contagensRes.data && contagensRes.data.length > 0) {
        // Usar contagem existente
        contagemAtual = contagensRes.data.find(c => c.status === 'em_andamento') || contagensRes.data[0];
      } else {
        // Criar nova contagem
        const novaContagem = await contagensService.create({
          turno_id: turnoId,
          tipo_contagem: 'inicial'
        });
        contagemAtual = novaContagem.data;
      }

      setContagem(contagemAtual);

      // Buscar itens da contagem
      if (contagemAtual) {
        const itensRes = await contagensService.getItens(contagemAtual.id);
        setItens(itensRes.data || []);
      }

      // Buscar produtos e variações
      const [produtosRes, variacoesRes] = await Promise.allSettled([
        produtoService.getAll(),
        variacaoService.getAll()
      ]);

      if (produtosRes.status === 'fulfilled') {
        setProdutos(produtosRes.value.data || []);
      }

      if (variacoesRes.status === 'fulfilled') {
        setVariacoes(variacoesRes.value.data || []);
      }

    } catch (error) {
      console.error('Erro ao buscar dados da contagem:', error);
      setError('Erro ao carregar dados da contagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedVariacao || !quantidade) {
      alert('Selecione uma variação e informe a quantidade.');
      return;
    }

    try {
      setSaving(true);
      const novoItem = {
        variacao_id: selectedVariacao,
        quantidade_contada: parseFloat(quantidade),
        observacoes: ''
      };

      const response = await contagensService.addItem(contagem.id, novoItem);
      
      if (response.success) {
        await fetchContagemData(); // Recarregar dados
        setSelectedProduto('');
        setSelectedVariacao('');
        setQuantidade('');
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert(error.message || 'Erro ao adicionar item.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (itemId, novaQuantidade) => {
    try {
      const response = await contagensService.updateItem(contagem.id, itemId, {
        quantidade_contada: parseFloat(novaQuantidade)
      });
      
      if (response.success) {
        await fetchContagemData();
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      alert(error.message || 'Erro ao atualizar item.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) {
      return;
    }

    try {
      const response = await contagensService.removeItem(contagem.id, itemId);
      
      if (response.success) {
        await fetchContagemData();
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert(error.message || 'Erro ao remover item.');
    }
  };

  const handlePreClose = async () => {
    if (!parecerOperador.trim()) {
      alert('Por favor, informe o parecer do operador antes de pré-fechar a contagem.');
      return;
    }

    try {
      const response = await contagensService.preClose(contagem.id, {
        parecer_operador: parecerOperador
      });
      
      if (response.success) {
        alert('Contagem pré-fechada com sucesso!');
        await fetchContagemData();
      }
    } catch (error) {
      console.error('Erro ao pré-fechar contagem:', error);
      alert(error.message || 'Erro ao pré-fechar contagem.');
    }
  };

  const handleClose = async () => {
    if (!isAdmin()) {
      alert('Apenas administradores podem fechar contagens.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja fechar esta contagem?')) {
      return;
    }

    try {
      const response = await contagensService.close(contagem.id);
      
      if (response.success) {
        alert('Contagem fechada com sucesso!');
        await fetchContagemData();
      }
    } catch (error) {
      console.error('Erro ao fechar contagem:', error);
      alert(error.message || 'Erro ao fechar contagem.');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      em_andamento: { color: 'bg-blue-500', text: 'Em Andamento' },
      pre_fechada: { color: 'bg-yellow-500', text: 'Pré-fechada' },
      fechada: { color: 'bg-green-500', text: 'Fechada' },
      reaberta: { color: 'bg-orange-500', text: 'Reaberta' }
    };
    
    const config = configs[status] || configs.em_andamento;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const filteredVariacoes = variacoes.filter(v => 
    !selectedProduto || v.produto_id === selectedProduto
  );

  const getVariacaoNome = (variacaoId) => {
    const variacao = variacoes.find(v => v.id === variacaoId);
    const produto = produtos.find(p => p.id === variacao?.produto_id);
    return variacao && produto ? `${produto.nome} - ${variacao.nome}` : 'Produto não encontrado';
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
                onClick={() => navigate(`/turnos/${turnoId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contagem de Produtos</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {contagem && (
                      <>
                        <span>Tipo: {contagem.tipo_contagem}</span>
                        <span>•</span>
                        <span>Itens: {itens.length}</span>
                        <span>•</span>
                        {getStatusBadge(contagem.status)}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adicionar Item */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Adicionar Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produto
                </label>
                <select
                  value={selectedProduto}
                  onChange={(e) => {
                    setSelectedProduto(e.target.value);
                    setSelectedVariacao('');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variação
                </label>
                <select
                  value={selectedVariacao}
                  onChange={(e) => setSelectedVariacao(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!selectedProduto}
                >
                  <option value="">Selecione uma variação</option>
                  {filteredVariacoes.map((variacao) => (
                    <option key={variacao.id} value={variacao.id}>
                      {variacao.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <Input
                  type="number"
                  step="0.001"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0.000"
                />
              </div>

              <Button
                onClick={handleAddItem}
                disabled={saving || !selectedVariacao || !quantidade}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving ? 'Adicionando...' : 'Adicionar Item'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Itens */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Itens Contados ({itens.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {itens.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum item contado ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{getVariacaoNome(item.variacao_id)}</h4>
                        <p className="text-sm text-gray-500">
                          Contado em: {new Date(item.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.001"
                          value={item.quantidade_contada}
                          onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                          className="w-24"
                        />
                        <Button
                          onClick={() => handleRemoveItem(item.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Parecer do Operador e Ações */}
        {contagem && contagem.status === 'em_andamento' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Finalizar Contagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parecer do Operador
                </label>
                <Textarea
                  value={parecerOperador}
                  onChange={(e) => setParecerOperador(e.target.value)}
                  placeholder="Informe observações sobre a contagem..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handlePreClose}
                  disabled={!parecerOperador.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Pré-fechar Contagem
                </Button>
                
                {isAdmin() && (
                  <Button
                    onClick={handleClose}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Fechar Contagem
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ContagemPage;
