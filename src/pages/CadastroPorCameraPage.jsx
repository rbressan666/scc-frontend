import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera, Package, AlertCircle, CheckCircle, Edit, Search, Wifi, WifiOff, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BarcodeScanner from '@/components/BarcodeScanner';
import CadastroProdutoForm from '@/components/CadastroProdutoForm';
import { 
  produtoService, 
  variacaoService, 
  setorService, 
  categoriaService, 
  unidadeMedidaService 
} from '@/services/api';

const CadastroPorCameraPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados principais
  const [currentStep, setCurrentStep] = useState('intro'); // intro, scanning, form, success, edit
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productData, setProductData] = useState(null);
  const [existingProduct, setExistingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState(null); // 'searching', 'found', 'not_found', 'error'
  
  // Dados para o formulário
  const [setores, setSetores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);

  // Carregar dados necessários para o formulário
  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [setoresRes, categoriasRes, unidadesRes] = await Promise.all([
        setorService.getAll(),
        categoriaService.getAll(),
        unidadeMedidaService.getAll()
      ]);
      
      setSetores(setoresRes.data || []);
      setCategorias(categoriasRes.data || []);
      setUnidades(unidadesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados necessários",
        variant: "destructive",
      });
    }
  };

  // Iniciar processo de escaneamento
  const startScanning = () => {
    setCurrentStep('scanning');
    setScannerOpen(true);
    setSearchStatus(null);
  };

  // Verificar se produto já existe no sistema pelo código de barras
  const checkExistingProductByBarcode = async (eanCode) => {
    try {
      console.log('Verificando produto existente para código:', eanCode);
      
      // Buscar todas as variações
      const variacoesResponse = await variacaoService.getAll();
      
      if (variacoesResponse.success && variacoesResponse.data) {
        console.log('Total de variações encontradas:', variacoesResponse.data.length);
        
        // Procurar por variação com o mesmo código de barras
        // Verificar múltiplos campos possíveis onde o código pode estar armazenado
        const existingVariation = variacoesResponse.data.find(variacao => {
          const codigoVariacao = variacao.codigo_barras || variacao.ean_code || variacao.codigo_ean || variacao.barcode || variacao.ean;
          console.log(`Comparando ${eanCode} com ${codigoVariacao} (variação: ${variacao.nome})`);
          return codigoVariacao === eanCode;
        });
        
        if (existingVariation) {
          console.log('Produto existente encontrado:', existingVariation);
          
          // Buscar dados completos do produto
          const produtoResponse = await produtoService.getById(existingVariation.id_produto);
          if (produtoResponse.success) {
            return {
              exists: true,
              produto: produtoResponse.data,
              variacao: existingVariation
            };
          }
        } else {
          console.log('Nenhum produto encontrado com este código de barras');
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Erro ao verificar produto existente:', error);
      return { exists: false };
    }
  };

  // Simular pesquisa na internet (já que não temos acesso a APIs reais)
  const searchProductOnline = async (eanCode) => {
    try {
      setSearchStatus('searching');
      
      // Simular delay de pesquisa
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tentar usar o serviço existente
      const response = await produtoService.lookupByEan({ ean_code: eanCode });
      
      if (response.success) {
        if (response.data.found) {
          setSearchStatus('found');
          return {
            found: true,
            suggested_name: response.data.suggested_name || '',
            suggested_variation_name: response.data.suggested_variation_name || '',
            suggested_category: response.data.suggested_category || null,
            source: 'API Externa'
          };
        } else {
          setSearchStatus('not_found');
          return {
            found: false,
            source: 'API Externa'
          };
        }
      } else {
        throw new Error(response.message || 'Erro na API');
      }
    } catch (error) {
      console.error('Erro na pesquisa online:', error);
      setSearchStatus('error');
      
      // Retornar dados vazios em caso de erro
      return {
        found: false,
        error: error.message || 'Erro na consulta online',
        source: 'Erro'
      };
    }
  };

  // Processar código escaneado
  const handleScan = async (eanCode) => {
    setScannerOpen(false);
    setLoading(true);
    setSearchStatus(null);
    
    try {
      console.log('Processando código escaneado:', eanCode);
      
      // Primeiro verificar se o produto já existe no sistema
      const existingCheck = await checkExistingProductByBarcode(eanCode);
      
      if (existingCheck.exists) {
        console.log('Produto já existe no sistema');
        setExistingProduct(existingCheck);
        setProductData({
          found: true,
          ean_code: eanCode,
          existing: true,
          produto: existingCheck.produto,
          variacao: existingCheck.variacao
        });
        setCurrentStep('edit');
        
        toast({
          title: "Produto já cadastrado!",
          description: `Código ${eanCode} já existe no sistema. Você pode editar os dados.`,
          variant: "default",
        });
        
        return;
      }
      
      console.log('Produto não existe, pesquisando online...');
      
      // Se não existe, buscar na internet
      const onlineResult = await searchProductOnline(eanCode);
      
      setProductData({
        ...onlineResult,
        ean_code: eanCode,
        existing: false
      });
      setCurrentStep('form');
      
      // Mostrar resultado da pesquisa
      if (onlineResult.found) {
        toast({
          title: "Produto encontrado online!",
          description: `Dados encontrados na ${onlineResult.source}. Informações pré-preenchidas.`,
        });
      } else if (onlineResult.error) {
        toast({
          title: "Erro na pesquisa online",
          description: onlineResult.error + " Preencha os dados manualmente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Produto não encontrado online",
          description: `Código ${eanCode} não foi encontrado nas bases de dados online. Preencha os dados manualmente.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error('Erro geral no processamento:', error);
      
      // Em caso de erro geral, permitir cadastro manual
      setProductData({
        found: false,
        ean_code: eanCode,
        suggested_name: '',
        suggested_variation_name: '',
        suggested_category: null,
        existing: false,
        error: error.message
      });
      setCurrentStep('form');
      setSearchStatus('error');
      
      toast({
        title: "Erro no processamento",
        description: "Erro ao processar código. Preencha os dados manualmente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar produto
  const handleSaveProduct = async (productPayload) => {
    try {
      setLoading(true);
      
      // Primeiro criar o produto pai
      const produtoResponse = await produtoService.create(productPayload.produto);
      
      if (!produtoResponse.success) {
        throw new Error(produtoResponse.message || 'Erro ao criar produto');
      }
      
      // Depois criar a variação com o código de barras
      const variacaoData = {
        ...productPayload.variacao,
        id_produto: produtoResponse.data.id,
        codigo_barras: productData?.ean_code, // Salvar o código de barras
        ean_code: productData?.ean_code // Também em ean_code se existir o campo
      };
      
      const variacaoResponse = await variacaoService.create(variacaoData);
      
      if (!variacaoResponse.success) {
        throw new Error(variacaoResponse.message || 'Erro ao criar variação');
      }
      
      setCurrentStep('success');
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      throw error; // Re-throw para ser tratado no componente do formulário
    } finally {
      setLoading(false);
    }
  };

  // Atualizar produto existente
  const handleUpdateProduct = async (productPayload) => {
    try {
      setLoading(true);
      
      // Atualizar produto pai
      const produtoResponse = await produtoService.update(
        existingProduct.produto.id, 
        productPayload.produto
      );
      
      if (!produtoResponse.success) {
        throw new Error(produtoResponse.message || 'Erro ao atualizar produto');
      }
      
      // Atualizar variação
      const variacaoData = {
        ...productPayload.variacao,
        codigo_barras: productData?.ean_code, // Manter o código de barras
        ean_code: productData?.ean_code
      };
      
      const variacaoResponse = await variacaoService.update(
        existingProduct.variacao.id,
        variacaoData
      );
      
      if (!variacaoResponse.success) {
        throw new Error(variacaoResponse.message || 'Erro ao atualizar variação');
      }
      
      setCurrentStep('success');
      
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Voltar para produtos
  const goToProducts = () => {
    navigate('/produtos');
  };

  // Reiniciar processo
  const restart = () => {
    setCurrentStep('intro');
    setProductData(null);
    setExistingProduct(null);
    setScannerOpen(false);
    setSearchStatus(null);
  };

  // Renderizar status da pesquisa
  const renderSearchStatus = () => {
    if (!searchStatus) return null;
    
    const statusConfig = {
      searching: {
        icon: <Globe className="h-5 w-5 text-blue-600 animate-spin" />,
        title: "Pesquisando online...",
        description: "Consultando bases de dados de produtos na internet",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800"
      },
      found: {
        icon: <Wifi className="h-5 w-5 text-green-600" />,
        title: "Produto encontrado online!",
        description: "Dados pré-preenchidos com informações da internet",
        bgColor: "bg-green-50",
        textColor: "text-green-800"
      },
      not_found: {
        icon: <Search className="h-5 w-5 text-orange-600" />,
        title: "Produto não encontrado online",
        description: "Não foram encontradas informações na internet para este código",
        bgColor: "bg-orange-50",
        textColor: "text-orange-800"
      },
      error: {
        icon: <WifiOff className="h-5 w-5 text-red-600" />,
        title: "Erro na pesquisa online",
        description: "Não foi possível consultar as bases de dados online",
        bgColor: "bg-red-50",
        textColor: "text-red-800"
      }
    };
    
    const config = statusConfig[searchStatus];
    
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bgColor} mb-4`}>
        {config.icon}
        <div className={config.textColor}>
          <h4 className="font-medium mb-1">{config.title}</h4>
          <p className="text-sm">{config.description}</p>
        </div>
      </div>
    );
  };

  // Renderizar conteúdo baseado no step atual
  const renderContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Cadastrar Produto via Câmera</CardTitle>
              <CardDescription>
                Use a câmera do seu dispositivo para escanear o código de barras e cadastrar produtos rapidamente
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Aponte a câmera para o código de barras</p>
                <p>• O sistema verificará se o produto já existe</p>
                <p>• Buscará informações na internet se for novo</p>
                <p>• Preencha os dados restantes e finalize</p>
              </div>
              
              <Button onClick={startScanning} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Iniciar Scanner
              </Button>
            </CardContent>
          </Card>
        );

      case 'scanning':
        return (
          <div className="text-center">
            {loading && (
              <Card className="max-w-md mx-auto mb-4">
                <CardContent className="p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p>Processando código...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchStatus === 'searching' ? 'Pesquisando na internet...' : 'Verificando sistema local...'}
                  </p>
                </CardContent>
              </Card>
            )}
            {renderSearchStatus()}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-4">
            {renderSearchStatus()}
            <CadastroProdutoForm
              productData={productData}
              onSave={productData?.editing ? handleUpdateProduct : handleSaveProduct}
              onCancel={restart}
              setores={setores}
              categorias={categorias}
              unidades={unidades}
            />
          </div>
        );

      case 'edit':
        return (
          <div className="space-y-4">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Edit className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Produto Já Cadastrado</CardTitle>
                <CardDescription>
                  Este código de barras já existe no sistema
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                  <p><strong>Produto:</strong> {existingProduct?.produto?.nome}</p>
                  <p><strong>Variação:</strong> {existingProduct?.variacao?.nome}</p>
                  <p><strong>Código:</strong> {productData?.ean_code}</p>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      setCurrentStep('form');
                      setProductData({
                        ...productData,
                        editing: true,
                        found: true,
                        produto: existingProduct.produto,
                        variacao: existingProduct.variacao,
                        suggested_name: existingProduct.produto.nome,
                        suggested_variation_name: existingProduct.variacao.nome
                      });
                    }} 
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Produto
                  </Button>
                  
                  <Button onClick={restart} variant="outline" className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Escanear Outro Código
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'success':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>
                {existingProduct ? 'Produto Atualizado!' : 'Produto Cadastrado!'}
              </CardTitle>
              <CardDescription>
                {existingProduct 
                  ? 'O produto foi atualizado com sucesso no sistema'
                  : 'O produto foi cadastrado com sucesso no sistema'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button onClick={restart} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Cadastrar Outro Produto
                </Button>
                
                <Button onClick={goToProducts} variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Ver Todos os Produtos
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
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
              onClick={goToProducts}
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
                Cadastro por Câmera
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>

      {/* Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onScan={handleScan}
        onClose={() => {
          setScannerOpen(false);
          setCurrentStep('intro');
          setSearchStatus(null);
        }}
      />
    </div>
  );
};

export default CadastroPorCameraPage;

