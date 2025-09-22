// pages/ReconhecimentoProdutoPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, Search, Package, BarChart3 } from 'lucide-react';
import Layout from '../components/ui/layout';
import PhotoCapture from '../components/PhotoCapture';
import ProductRecognition from '../components/ProductRecognition';

const ReconhecimentoProdutoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar se veio de uma página de contagem
  const fromCounting = location.state?.fromCounting || false;
  const countingSession = location.state?.countingSession || null;

  const [currentStep, setCurrentStep] = useState('intro'); // intro, photo, recognition, selected
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [recognitionResults, setRecognitionResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Etapa 1: Capturar foto
  const handlePhotoCapture = (photo) => {
    setCapturedPhoto(photo);
    setCurrentStep('recognition');
    performProductRecognition(photo);
  };

  // Etapa 2: Reconhecer produto
  const performProductRecognition = async (photo) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/photos/recognize-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          image: photo
        })
      });

      const result = await response.json();

      if (result.success) {
        setRecognitionResults(result.data.candidates || []);
      } else {
        setError(result.message || 'Erro no reconhecimento');
        setRecognitionResults([]);
      }
    } catch (error) {
      console.error('Erro no reconhecimento:', error);
      setError('Erro de conexão com o servidor');
      setRecognitionResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 3: Produto selecionado
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentStep('selected');

    // Se veio de contagem, redirecionar de volta com o produto selecionado
    if (fromCounting && countingSession) {
      navigate('/contagem', {
        state: {
          session: countingSession,
          selectedProduct: product,
          recognizedByPhoto: true
        }
      });
    }
  };

  // Enviar feedback sobre reconhecimento
  const handleFeedback = async (feedbackData) => {
    try {
      await fetch('/api/photos/recognition-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(feedbackData)
      });
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  // Voltar etapa
  const goBack = () => {
    switch (currentStep) {
      case 'photo':
        setCurrentStep('intro');
        break;
      case 'recognition':
        setCurrentStep('photo');
        break;
      case 'selected':
        setCurrentStep('recognition');
        break;
      default:
        if (fromCounting) {
          navigate('/contagem', { state: { session: countingSession } });
        } else {
          navigate('/produtos');
        }
    }
  };

  // Reiniciar processo
  const restart = () => {
    setCapturedPhoto(null);
    setRecognitionResults([]);
    setSelectedProduct(null);
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
              Reconhecimento de Produto
            </h1>
            <p className="text-gray-600">
              {fromCounting 
                ? 'Identifique o produto para continuar a contagem'
                : 'Identifique produtos cadastrados no sistema'
              }
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'intro', label: 'Início', icon: Package },
              { key: 'photo', label: 'Foto', icon: Camera },
              { key: 'recognition', label: 'Reconhecimento', icon: Search },
              { key: 'selected', label: fromCounting ? 'Contagem' : 'Selecionado', icon: fromCounting ? BarChart3 : Package }
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = ['intro', 'photo', 'recognition', 'selected'].indexOf(currentStep) > index;
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
            <Search className="mx-auto mb-6 text-blue-600" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reconhecimento Inteligente
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {fromCounting 
                ? 'Tire uma foto do produto que você está contando e nosso sistema identificará automaticamente qual produto é, facilitando o processo de contagem.'
                : 'Tire uma foto de qualquer produto cadastrado no sistema e nosso algoritmo identificará automaticamente qual produto é, comparando com as imagens de referência.'
              }
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="text-blue-600" size={24} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">1. Fotografe</h3>
                <p className="text-sm text-gray-600">
                  Tire uma foto clara do produto
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="text-green-600" size={24} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">2. Reconheça</h3>
                <p className="text-sm text-gray-600">
                  Sistema compara com produtos cadastrados
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  {fromCounting ? (
                    <BarChart3 className="text-purple-600" size={24} />
                  ) : (
                    <Package className="text-purple-600" size={24} />
                  )}
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  3. {fromCounting ? 'Continue' : 'Selecione'}
                </h3>
                <p className="text-sm text-gray-600">
                  {fromCounting 
                    ? 'Continue a contagem do produto identificado'
                    : 'Confirme o produto reconhecido'
                  }
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-yellow-800 text-sm">
                <strong>Dica:</strong> Quanto mais imagens de referência um produto tiver, 
                melhor será o reconhecimento. Adicione fotos de diferentes ângulos na galeria do produto.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep('photo')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Iniciar Reconhecimento
            </button>
          </div>
        )}

        {currentStep === 'photo' && (
          <PhotoCapture
            title="Fotografar para Reconhecimento"
            subtitle="Posicione o produto no centro para melhor reconhecimento"
            onPhotoCapture={handlePhotoCapture}
            onCancel={() => setCurrentStep('intro')}
          />
        )}

        {currentStep === 'recognition' && (
          <ProductRecognition
            candidates={recognitionResults}
            isLoading={isLoading}
            error={error}
            onSelectProduct={handleProductSelect}
            onRetry={() => performProductRecognition(capturedPhoto)}
            onFeedback={handleFeedback}
          />
        )}

        {currentStep === 'selected' && selectedProduct && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="text-green-600" size={32} />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Produto Reconhecido!
            </h2>
            
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                {selectedProduct.imageUrl && (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.productName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">
                    {selectedProduct.productName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Similaridade: {Math.round(selectedProduct.similarity * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Confiança: {Math.round(selectedProduct.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              {!fromCounting && (
                <>
                  <button
                    onClick={restart}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reconhecer Outro
                  </button>
                  
                  <button
                    onClick={() => navigate(`/produtos/${selectedProduct.productId}`)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Ver Produto
                  </button>
                </>
              )}
              
              <button
                onClick={() => navigate('/produtos')}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Lista de Produtos
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReconhecimentoProdutoPage;

