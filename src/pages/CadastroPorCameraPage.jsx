import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera, Package, AlertCircle, CheckCircle, Edit, Search } from 'lucide-react';
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
  };

  // Verificar se produto já existe no sistema
  const checkExistingProduct = async (eanCode) => {
    try {
      // Buscar todas as variações para verificar se o EAN já existe
      const variacoesResponse = await variacaoService.getAll();
      
      if (variacoesResponse.success && variacoesResponse.data) {
        // Procurar por variação com o mesmo EAN (assumindo que o EAN está armazenado em algum campo)
        // Como não vejo campo EAN na estrutura, vou simular a busca por nome ou outro identificador
        const existingVariation = variacoesResponse.data.find(variacao => 
          variacao.ean_code === eanCode || 
          variacao.codigo_barras === eanCode ||
          variacao.codigo === eanCode
        );
        
        if (existingVariation) {
          // Buscar dados completos do produto
          const produtoResponse = await produtoService.getById(existingVariation.id_produto);
          if (produtoResponse.success) {
            return {
              exists: true,
              produto: produtoResponse.data,
              variacao: existingVariation
            };
          }
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Erro ao verificar produto existente:', error);
      return { exists: false };
    }
  };

  // Processar código escaneado
  const handleScan = async (eanCode) => {
    setScannerOpen(false);
    setLoading(true);
    
    try {
      // Primeiro verificar se o produto já existe no sistema
      const existingCheck = await checkExistingProduct(eanCode);
      
      if (existingCheck.exists) {
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
          description: "Este código já existe no sistema. Você pode editar os dados.",
          variant: "default",
        });
        
        return;
      }
      
      // Se não existe, buscar na API externa
      const response = await produtoService.lookupByEan({ ean_code: eanCode });
      
      if (response.success) {
        setProductData({
          ...response.data,
          existing: false
        });
        setCurrentStep('form');
        
        if (response.data.found) {
          toast({
            title: "Produto encontrado na internet!",
            description: "Dados pré-preenchidos com informações encontradas online",
          });
        } else {
          toast({
            title: "Produto não encontrado na internet",
            description: "Não foram encontradas informações online para este código. Preencha os dados manualmente.",
            variant: "default",
          });
        }
      } else {
        throw new Error(response.message || 'Erro na busca online');
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      
      // Mesmo com erro, permitir cadastro manual
      setProductData({
        found: false,
        ean_code: eanCode,
        suggested_name: '',
        suggested_variation_name: '',
        suggested_category: null,
        existing: false
      });
      setCurrentStep('form');
      
      // Mensagem mais específica sobre o erro
      let errorMessage = "Não foi possível buscar dados do produto na internet.";
      if (error.message && error.message.includes('timeout')) {
        errorMessage = "Timeout na consulta online. Verifique sua conexão.";
      } else if (error.message && error.message.includes('network')) {
        errorMessage = "Erro de rede na consulta online.";
      } else if (error.message) {
        errorMessage = `Erro na consulta online: ${error.message}`;
      }
      
      toast({
        title: "Erro na pesquisa online",
        description: errorMessage + " Preencha os dados manualmente.",
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
      
      // Depois criar a variação
      const variacaoData = {
        ...productPayload.variacao,
        id_produto: produtoResponse.data.id,
        ean_code: productData?.ean_code // Adicionar o código EAN à variação
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
      const variacaoResponse = await variacaoService.update(
        existingProduct.variacao.id,
        productPayload.variacao
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
                  <p className="text-sm text-gray-500 mt-1">Verificando sistema e pesquisando online</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'form':
        return (
          <CadastroProdutoForm
            productData={productData}
            onSave={handleSaveProduct}
            onCancel={restart}
            setores={setores}
            categorias={categorias}
            unidades={unidades}
          />
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
                <div className="space-y-2 text-sm">
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
                        produto: existingProduct.produto,
                        variacao: existingProduct.variacao
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
        }}
      />
    </div>
  );
};

export default CadastroPorCameraPage;

