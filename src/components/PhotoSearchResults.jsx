// components/PhotoSearchResults.jsx
import React, { useState } from 'react';
import { Check, ExternalLink, Search, AlertCircle, Loader } from 'lucide-react';

const PhotoSearchResults = ({ 
  results = [], 
  isLoading = false, 
  error = null,
  onSelectImage,
  onRetry,
  searchTerms = []
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleConfirmSelection = () => {
    if (selectedImage && onSelectImage) {
      onSelectImage(selectedImage);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Buscando produtos na internet...
          </h3>
          <p className="text-gray-600">
            Analisando a foto e procurando produtos similares
          </p>
          {searchTerms.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Termos de busca:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {searchTerms.map((term, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
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
            Erro na busca
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

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Search className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Não encontramos produtos similares na internet. Você pode cadastrar manualmente.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Nova Busca
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Produtos encontrados na internet
        </h3>
        <p className="text-gray-600">
          Selecione o produto que mais se parece com o fotografado ({results.length} opções encontradas)
        </p>
      </div>

      {/* Grid de resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {results.map((image) => (
          <div
            key={image.id}
            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedImage?.id === image.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleImageSelect(image)}
          >
            {/* Imagem */}
            <div className="aspect-square bg-gray-100">
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=Imagem+Indisponível';
                }}
              />
            </div>

            {/* Overlay de seleção */}
            {selectedImage?.id === image.id && (
              <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                <div className="bg-blue-600 text-white rounded-full p-2">
                  <Check size={24} />
                </div>
              </div>
            )}

            {/* Informações */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                {image.title}
              </h4>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {image.source}
                </span>
                <span className="flex items-center gap-1">
                  {Math.round(image.confidence * 100)}% confiança
                </span>
              </div>

              {/* Link externo */}
              {image.contextLink && (
                <a
                  href={image.contextLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={12} />
                  Ver original
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Nova Busca
          </button>
        )}
        
        <button
          onClick={handleConfirmSelection}
          disabled={!selectedImage}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedImage ? 'Usar Esta Imagem' : 'Selecione uma Imagem'}
        </button>
      </div>

      {/* Informações adicionais */}
      {selectedImage && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Imagem selecionada:</h4>
          <p className="text-blue-800 text-sm mb-1">{selectedImage.title}</p>
          <div className="flex gap-4 text-xs text-blue-600">
            <span>Fonte: {selectedImage.source}</span>
            <span>Confiança: {Math.round(selectedImage.confidence * 100)}%</span>
            {selectedImage.width && selectedImage.height && (
              <span>Tamanho: {selectedImage.width}x{selectedImage.height}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoSearchResults;

