import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera, Package, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState('intro'); // intro, scanning, form, success
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productData, setProductData] = useState(null);
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

  // Processar código escaneado
  const handleScan = async (eanCode) => {
    setScannerOpen(false);
    setLoading(true);
    
    try {
      // Buscar produto na API externa
      const response = await produtoService.lookupByEan({ ean_code: eanCode });
      
      if (response.success) {
        setProductData(response.data);
        setCurrentStep('form');
        
        if (response.data.found) {
          toast({
            title: "Produto encontrado!",
            description: "Dados pré-preenchidos com sucesso",
          });
        } else {
          toast({
            title: "Produto não encontrado",
            description: "Preencha os dados manualmente",
            variant: "default",
          });
        }
      } else {
        throw new Error(response.message || 'Erro na busca');
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      
      // Mesmo com erro, permitir cadastro manual
      setProductData({
        found: false,
        ean_code: eanCode,
        suggested_name: '',
        suggested_variation_name: '',
        suggested_category: null
      });
      setCurrentStep('form');
      
      toast({
        title: "Aviso",
        description: "Não foi possível buscar dados do produto. Preencha manualmente.",
        variant: "default",
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
        id_produto: produtoResponse.data.id
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

  // Voltar para produtos
  const goToProducts = () => {
    navigate('/produtos');
  };

  // Reiniciar processo
  const restart = () => {
    setCurrentStep('intro');
    setProductData(null);
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
                <p>• O sistema buscará informações do produto</p>
                <p>• Preencha os dados restantes</p>
                <p>• Finalize o cadastro</p>
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

      case 'success':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Produto Cadastrado!</CardTitle>
              <CardDescription>
                O produto foi cadastrado com sucesso no sistema
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

