// pages/CadastroViaFotoPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Search, Package } from 'lucide-react';
import { Sidebar as Layout } from '../components/ui/sidebar';
import PhotoCapture from '../components/PhotoCapture';
import PhotoSearchResults from '../components/PhotoSearchResults';
import CadastroProdutoForm from '../components/CadastroProdutoForm';
import { produtoService } from '../services/api';

const CadastroViaFotoPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('intro'); // intro, photo, search, form, success
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dados para pré-preenchimento do formulário
  const [prefilledData, setPrefilledData] = useState({});

  // Etapa 1: Capturar foto
  const handlePhotoCapture = (photo) => {
    setCapturedPhoto(photo);
    setCurrentStep('search');
    performPhotoSearch(photo);
  };

  // Etapa 2: Buscar na internet
  const performPhotoSearch = async (photo) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/photos/search-by-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          image: photo,
          search_terms: [] // Deixar vazio para extração automática
        })
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data.results || []);
      } else {
        setError(result.message || 'Erro na busca por foto');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Erro de conexão com o servidor');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 3: Selecionar imagem e ir para formulário
  const handleImageSelect = async (image) => {
    setSelectedImage(image);
    
    // Preparar dados para pré-preenchimento
    const prefilled = {
      nome: image.title || '',
      imagem_principal_url: image.url,
      descricao: `Produto importado da internet: ${image.title}`,
      // Tentar extrair categoria baseada no título
      categoria_sugerida: extractCategoryFromTitle(image.title)
    };

    setPrefilledData(prefilled);
    setCurrentStep('form');
  };

  // Função auxiliar para extrair categoria do título
  const extractCategoryFromTitle = (title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('cerveja') || titleLower.includes('beer')) {
      return 'Cervejas';
    } else if (titleLower.includes('refrigerante') || titleLower.includes('coca') || titleLower.includes('pepsi')) {
      return 'Refrigerantes';
    } else if (titleLower.includes('whisky') || titleLower.includes('vodka') || titleLower.includes('gin')) {
      return 'Destilados';
    } else if (titleLower.includes('bebida')) {
      return 'Bebidas';
    } else if (titleLower.includes('comida') || titleLower.includes('alimento')) {
      return 'Alimentos';
    }
    
    return null;
  };

  // Etapa 4: Produto criado com sucesso
  const handleProductCreated = (produto) => {
    setCurrentStep('success');
    
    // Salvar imagem selecionada da internet para o produto
    if (selectedImage && produto.id) {
      saveInternetImage(produto.id, selectedImage);
    }
  };

  // Salvar imagem da internet para o produto
  const saveInternetImage = async (productId, image) => {
    try {
      await fetch(`/api/photos/products/${productId}/save-from-internet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          image_url: image.url,
          tipo_imagem: 'principal',
          descricao: `Imagem principal: ${image.title}`
        })
      });
    } catch (error) {
      console.error('Erro ao salvar imagem da internet:', error);
    }
  };

  // Voltar etapa
  const goBack = () => {
    switch (currentStep) {
      case 'photo':
        setCurrentStep('intro');
        break;
      case 'search':
        setCurrentStep('photo');
        break;
      case 'form':
        setCurrentStep('search');
        break;
      default:
        navigate('/produtos');
    }
  };

  // Reiniciar processo
  const restart = () => {
    setCapturedPhoto(null);
    setSearchResults([]);
    setSelectedImage(null);
    setPrefilledData({});
    setError(null);
    setCurrentStep('intro');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cadastro via Foto
            </h1>
            <p className="text-gray-600">
              Tire uma foto do produto e encontre informações na internet
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'intro', label: 'Início', icon: Package },
              { key: 'photo', label: 'Foto', icon: Camera },
              { key: 'search', label: 'Busca', icon: Search },
              { key: 'form', label: 'Cadastro', icon: Package }
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = ['intro', 'photo', 'search', 'form'].indexOf(currentStep) > index;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center gap-2 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conteúdo baseado na etapa */}
        {currentStep === 'intro' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Camera className="mx-auto mb-6 text-blue-600" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cadastro Inteligente de Produtos
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Tire uma foto do produto e nosso sistema buscará automaticamente informações 
              na internet para facilitar o cadastro. Você poderá escolher entre até 5 opções 
              encontradas e editar os dados antes de salvar.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="text-blue-600" size={24} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">1. Fotografe</h3>
                <p className="text-sm text-gray-600">
                  Tire uma foto clara do produto com boa iluminação
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="text-green-600" size={24} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">2. Busque</h3>
                <p className="text-sm text-gray-600">
                  Sistema busca produtos similares na internet
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="text-purple-600" size={24} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">3. Cadastre</h3>
                <p className="text-sm text-gray-600">
                  Complete os dados e salve o produto
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep('photo')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Começar Cadastro
            </button>
          </div>
        )}

        {currentStep === 'photo' && (
          <PhotoCapture
            title="Fotografar Produto"
            subtitle="Posicione o produto no centro e tire uma foto clara"
            onPhotoCapture={handlePhotoCapture}
            onCancel={() => setCurrentStep('intro')}
          />
        )}

        {currentStep === 'search' && (
          <PhotoSearchResults
            results={searchResults}
            isLoading={isLoading}
            error={error}
            onSelectImage={handleImageSelect}
            onRetry={() => performPhotoSearch(capturedPhoto)}
          />
        )}

        {currentStep === 'form' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Finalizar Cadastro
              </h2>
              <p className="text-gray-600">
                Complete os dados do produto. Alguns campos foram pré-preenchidos baseados na imagem selecionada.
              </p>
            </div>

            {/* Preview da imagem selecionada */}
            {selectedImage && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3">Imagem selecionada:</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedImage.thumbnailUrl || selectedImage.url}
                    alt={selectedImage.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium text-blue-900">{selectedImage.title}</p>
                    <p className="text-sm text-blue-700">Fonte: {selectedImage.source}</p>
                    <p className="text-sm text-blue-700">
                      Confiança: {Math.round(selectedImage.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CadastroProdutoForm
              initialData={prefilledData}
              onSuccess={handleProductCreated}
              onCancel={() => setCurrentStep('search')}
            />
          </div>
        )}

        {currentStep === 'success' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="text-green-600" size={32} />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Produto cadastrado com sucesso!
            </h2>
            
            <p className="text-gray-600 mb-8">
              O produto foi criado e a imagem da internet foi salva como referência.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restart}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cadastrar Outro Produto
              </button>
              
              <button
                onClick={() => navigate('/produtos')}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Ver Lista de Produtos
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CadastroViaFotoPage;

