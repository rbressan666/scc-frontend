import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, BarChart3, FileText } from 'lucide-react';

const AnaliseVariacaoPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const [analises, setAnalises] = useState([]);
  const [resumo, setResumo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnaliseData();
  }, [turnoId]);

  const fetchAnaliseData = async () => {
    try {
      // Simular dados para demonstração
      const mockAnalises = [
        {
          id: '1',
          variacao_id: '1',
          produto_nome: 'Heineken 600ml',
          quantidade_anterior: 20,
          quantidade_atual: 0,
          diferenca: -20,
          percentual_variacao: -100,
          tipo_variacao: 'zerado',
          alerta_gerado: true,
          categoria: 'Cervejas'
        },
        {
          id: '2',
          variacao_id: '2',
          produto_nome: 'Limão',
          quantidade_anterior: 20,
          quantidade_atual: 35,
          diferenca: 15,
          percentual_variacao: 75,
          tipo_variacao: 'aumento_suspeito',
          alerta_gerado: true,
          categoria: 'Frutas'
        },
        {
          id: '3',
          variacao_id: '3',
          produto_nome: 'Coca-Cola Lata',
          quantidade_anterior: 48,
          quantidade_atual: 32,
          diferenca: -16,
          percentual_variacao: -33.33,
          tipo_variacao: 'reducao_esperada',
          alerta_gerado: false,
          categoria: 'Refrigerantes'
        },
        {
          id: '4',
          variacao_id: '4',
          produto_nome: 'Vodka Premium',
          quantidade_anterior: 12,
          quantidade_atual: 2,
          diferenca: -10,
          percentual_variacao: -83.33,
          tipo_variacao: 'reducao_excessiva',
          alerta_gerado: true,
          categoria: 'Destilados'
        }
      ];

      const mockResumo = {
        total_produtos: 4,
        produtos_com_variacao: 4,
        alertas_gerados: 3,
        maior_aumento: { produto: 'Limão', percentual: 75 },
        maior_reducao: { produto: 'Heineken 600ml', percentual: -100 },
        categorias_afetadas: 4
      };

      setAnalises(mockAnalises);
      setResumo(mockResumo);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar análise de variação:', error);
      setLoading(false);
    }
  };

  const getTipoVariacaoBadge = (tipo) => {
    const configs = {
      normal: { color: 'bg-green-500', text: 'Normal', icon: null },
      aumento_suspeito: { color: 'bg-orange-500', text: 'Aumento Suspeito', icon: TrendingUp },
      reducao_esperada: { color: 'bg-blue-500', text: 'Redução Esperada', icon: TrendingDown },
      reducao_excessiva: { color: 'bg-red-500', text: 'Redução Excessiva', icon: TrendingDown },
      zerado: { color: 'bg-red-600', text: 'Zerado', icon: AlertTriangle }
    };
    
    const config = configs[tipo] || configs.normal;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center space-x-1`}>
        {IconComponent && <IconComponent className="h-3 w-3" />}
        <span>{config.text}</span>
      </Badge>
    );
  };

  const getVariacaoColor = (percentual) => {
    if (percentual > 50) return 'text-red-600';
    if (percentual > 0) return 'text-orange-600';
    if (percentual > -30) return 'text-blue-600';
    return 'text-red-600';
  };

  const getVariacaoIcon = (diferenca) => {
    if (diferenca > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (diferenca < 0) return <TrendingDown className="h-4 w-4 text-blue-600" />;
    return null;
  };

  const formatPercentual = (valor) => {
    return `${valor > 0 ? '+' : ''}${valor.toFixed(1)}%`;
  };

  const formatDiferenca = (valor) => {
    return `${valor > 0 ? '+' : ''}${valor}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análise...</p>
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
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Análise de Variação</h1>
                  <p className="text-sm text-gray-500">Turno: {turnoId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate(`/analise/${turnoId}/relatorio`)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Gerar Relatório</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Resumo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumo da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{resumo.total_produtos}</p>
                <p className="text-sm text-gray-500">Total de Produtos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{resumo.produtos_com_variacao}</p>
                <p className="text-sm text-gray-500">Com Variação</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{resumo.alertas_gerados}</p>
                <p className="text-sm text-gray-500">Alertas Gerados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatPercentual(resumo.maior_aumento?.percentual || 0)}</p>
                <p className="text-sm text-gray-500">Maior Aumento</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatPercentual(resumo.maior_reducao?.percentual || 0)}</p>
                <p className="text-sm text-gray-500">Maior Redução</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{resumo.categorias_afetadas}</p>
                <p className="text-sm text-gray-500">Categorias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Variações Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todas" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="alertas">Com Alertas</TabsTrigger>
                <TabsTrigger value="aumentos">Aumentos</TabsTrigger>
                <TabsTrigger value="reducoes">Reduções</TabsTrigger>
                <TabsTrigger value="zerados">Zerados</TabsTrigger>
              </TabsList>

              <TabsContent value="todas" className="mt-6">
                <div className="space-y-4">
                  {analises.map((analise) => (
                    <div
                      key={analise.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{analise.produto_nome}</h4>
                          <Badge variant="outline">{analise.categoria}</Badge>
                          {getTipoVariacaoBadge(analise.tipo_variacao)}
                          {analise.alerta_gerado && (
                            <Badge className="bg-red-500 text-white">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Alerta
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getVariacaoIcon(analise.diferenca)}
                          <span className={`font-bold ${getVariacaoColor(analise.percentual_variacao)}`}>
                            {formatPercentual(analise.percentual_variacao)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Quantidade Anterior:</span>
                          <p className="font-medium">{analise.quantidade_anterior}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantidade Atual:</span>
                          <p className="font-medium">{analise.quantidade_atual}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Diferença:</span>
                          <p className={`font-medium ${getVariacaoColor(analise.percentual_variacao)}`}>
                            {formatDiferenca(analise.diferenca)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Variação:</span>
                          <p className={`font-medium ${getVariacaoColor(analise.percentual_variacao)}`}>
                            {formatPercentual(analise.percentual_variacao)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="alertas" className="mt-6">
                <div className="space-y-4">
                  {analises.filter(a => a.alerta_gerado).map((analise) => (
                    <div
                      key={analise.id}
                      className="border rounded-lg p-4 bg-red-50 border-red-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h4 className="font-medium text-red-900">{analise.produto_nome}</h4>
                          {getTipoVariacaoBadge(analise.tipo_variacao)}
                        </div>
                        <span className="font-bold text-red-600">
                          {formatPercentual(analise.percentual_variacao)}
                        </span>
                      </div>
                      <p className="text-sm text-red-700">
                        Variação de {analise.quantidade_anterior} para {analise.quantidade_atual} unidades
                        ({formatDiferenca(analise.diferenca)} unidades)
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Outras abas seguiriam padrão similar */}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AnaliseVariacaoPage;
