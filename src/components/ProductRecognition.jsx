// components/ProductRecognition.jsx
import React, { useState } from 'react';
import { Check, Search, AlertCircle, Loader, Star, Package } from 'lucide-react';

const ProductRecognition = ({ 
  candidates = [], 
  isLoading = false, 
  error = null,
  onSelectProduct,
  onRetry,
  onFeedback
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct && onSelectProduct) {
      onSelectProduct(selectedProduct);
      
      // Enviar feedback positivo
      if (onFeedback) {
        onFeedback({
          productId: selectedProduct.productId,
          feedback: 'correto',
          confidence: selectedProduct.confidence
        });
      }
      setFeedbackGiven(true);
    }
  };

  const handleNoMatch = () => {
    if (onFeedback) {
      onFeedback({
        productId: null,
        feedback: 'nao_encontrado',
        confidence: 0
      });
    }
    setFeedbackGiven(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Reconhecendo produto...
          </h3>
          <p className="text-gray-600">
            Comparando com produtos cadastrados no sistema
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro no reconhecimento
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Produto não reconhecido
          </h3>
          <p className="text-gray-600 mb-4">
            Não encontramos produtos similares no sistema. Este pode ser um produto novo.
          </p>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Tentar Novamente
              </button>
            )}
            <button
              onClick={handleNoMatch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cadastrar Novo Produto
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Produtos similares encontrados
        </h3>
        <p className="text-gray-600">
          Selecione o produto que corresponde à foto ({candidates.length} candidatos)
        </p>
      </div>

      {/* Lista de candidatos */}
      <div className="space-y-3 mb-6">
        {candidates.map((candidate) => (
          <div
            key={candidate.productId}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedProduct?.productId === candidate.productId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleProductSelect(candidate)}
          >
            <div className="flex items-center gap-4">
              {/* Imagem do produto */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {candidate.imageUrl ? (
                  <img
                    src={candidate.imageUrl}
                    alt={candidate.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/64x64?text=Sem+Imagem';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={24} />
                  </div>
                )}
              </div>

              {/* Informações do produto */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {candidate.productName}
                </h4>
                
                <div className="flex items-center gap-4 mt-1">
                  {/* Score de similaridade */}
                  <div className="flex items-center gap-1">
                    <Star 
                      size={14} 
                      className={`${
                        candidate.similarity > 0.8 
                          ? 'text-green-500' 
                          : candidate.similarity > 0.6 
                          ? 'text-yellow-500' 
                          : 'text-red-500'
                      }`}
                    />
                    <span className="text-sm text-gray-600">
                      {Math.round(candidate.similarity * 100)}% similar
                    </span>
                  </div>

                  {/* Confiança */}
                  <div className="text-sm text-gray-500">
                    Confiança: {Math.round(candidate.confidence * 100)}%
                  </div>
                </div>

                {/* Detalhes da correspondência */}
                {candidate.matchDetails && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="flex gap-4">
                      {candidate.matchDetails.histogram && (
                        <span>Cor: {Math.round(candidate.matchDetails.histogram * 100)}%</span>
                      )}
                      {candidate.matchDetails.edges && (
                        <span>Forma: {Math.round(candidate.matchDetails.edges * 100)}%</span>
                      )}
                      {candidate.matchDetails.texture && (
                        <span>Textura: {Math.round(candidate.matchDetails.texture * 100)}%</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Indicador de seleção */}
              {selectedProduct?.productId === candidate.productId && (
                <div className="text-blue-600">
                  <Check size={24} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={handleNoMatch}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Nenhum Corresponde
        </button>
        
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Nova Foto
            </button>
          )}
          
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedProduct}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedProduct ? 'Confirmar Produto' : 'Selecione um Produto'}
          </button>
        </div>
      </div>

      {/* Informações do produto selecionado */}
      {selectedProduct && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Produto selecionado:</h4>
          <p className="text-blue-800 text-sm mb-1">{selectedProduct.productName}</p>
          <div className="flex gap-4 text-xs text-blue-600">
            <span>Similaridade: {Math.round(selectedProduct.similarity * 100)}%</span>
            <span>Confiança: {Math.round(selectedProduct.confidence * 100)}%</span>
          </div>
        </div>
      )}

      {/* Feedback enviado */}
      {feedbackGiven && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ Obrigado pelo feedback! Isso nos ajuda a melhorar o reconhecimento.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductRecognition;

