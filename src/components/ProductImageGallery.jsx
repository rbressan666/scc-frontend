// components/ProductImageGallery.jsx
import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Star, 
  Trash2, 
  Edit3, 
  Plus, 
  Image as ImageIcon,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import PhotoCapture from './PhotoCapture';

const ProductImageGallery = ({ 
  productId, 
  productName,
  images = [], 
  onImagesChange,
  canEdit = true 
}) => {
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Separar imagem principal das demais
  const principalImage = images.find(img => img.tipo_imagem === 'principal');
  const otherImages = images.filter(img => img.tipo_imagem !== 'principal');

  // Upload de arquivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      handleImageUpload(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload de imagem (base64)
  const handleImageUpload = async (imageBase64) => {
    if (!canEdit) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/photos/products/${productId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          image: imageBase64,
          tipo_imagem: 'referencia',
          origem: 'upload',
          descricao: `Imagem de ${productName}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (onImagesChange) {
          onImagesChange([...images, result.data]);
        }
      } else {
        alert('Erro ao fazer upload: ' + result.message);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setIsLoading(false);
      setShowPhotoCapture(false);
      setShowUpload(false);
    }
  };

  // Definir como imagem principal
  const setPrincipalImage = async (imageId) => {
    if (!canEdit) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/photos/products/${productId}/images/${imageId}/set-principal`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar lista de imagens
        const updatedImages = images.map(img => ({
          ...img,
          tipo_imagem: img.id === imageId ? 'principal' : 'referencia'
        }));
        
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
      } else {
        alert('Erro ao definir imagem principal: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao definir imagem principal:', error);
      alert('Erro ao definir imagem principal');
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar imagem
  const deleteImage = async (imageId) => {
    if (!canEdit) return;
    
    if (!confirm('Tem certeza que deseja deletar esta imagem?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/photos/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedImages = images.filter(img => img.id !== imageId);
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
      } else {
        alert('Erro ao deletar imagem: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      alert('Erro ao deletar imagem');
    } finally {
      setIsLoading(false);
    }
  };

  // Editar descrição da imagem
  const updateImageDescription = async (imageId, newDescription) => {
    if (!canEdit) return;

    try {
      const response = await fetch(`/api/photos/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          descricao: newDescription
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedImages = images.map(img => 
          img.id === imageId ? { ...img, descricao: newDescription } : img
        );
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
        setEditingImage(null);
      } else {
        alert('Erro ao atualizar descrição: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      alert('Erro ao atualizar descrição');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Galeria de Imagens
        </h3>
        
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowPhotoCapture(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              disabled={isLoading}
            >
              <Camera size={16} />
              Tirar Foto
            </button>
            
            <label className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm cursor-pointer">
              <Upload size={16} />
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Imagem Principal */}
      {principalImage ? (
        <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-yellow-500" size={20} />
            <h4 className="font-medium text-gray-900">Imagem Principal</h4>
          </div>
          
          <ImageCard
            image={principalImage}
            isPrincipal={true}
            canEdit={canEdit}
            isLoading={isLoading}
            onSetPrincipal={setPrincipalImage}
            onDelete={deleteImage}
            onEdit={setEditingImage}
            editingImage={editingImage}
            onUpdateDescription={updateImageDescription}
          />
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 mb-2">Nenhuma imagem principal definida</p>
          {canEdit && (
            <p className="text-sm text-gray-500">
              Adicione uma imagem e defina como principal
            </p>
          )}
        </div>
      )}

      {/* Outras Imagens */}
      {otherImages.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Imagens de Referência ({otherImages.length})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isPrincipal={false}
                canEdit={canEdit}
                isLoading={isLoading}
                onSetPrincipal={setPrincipalImage}
                onDelete={deleteImage}
                onEdit={setEditingImage}
                editingImage={editingImage}
                onUpdateDescription={updateImageDescription}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {images.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma imagem cadastrada
          </h3>
          <p className="text-gray-600 mb-4">
            Adicione imagens para melhorar o reconhecimento do produto
          </p>
          {canEdit && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPhotoCapture(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera size={16} />
                Tirar Foto
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de captura de foto */}
      {showPhotoCapture && (
        <PhotoCapture
          title="Adicionar Foto ao Produto"
          subtitle={`Fotografe ${productName} para adicionar à galeria`}
          onPhotoCapture={handleImageUpload}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}
    </div>
  );
};

// Componente para cada imagem
const ImageCard = ({ 
  image, 
  isPrincipal, 
  canEdit, 
  isLoading,
  onSetPrincipal, 
  onDelete, 
  onEdit,
  editingImage,
  onUpdateDescription 
}) => {
  const [newDescription, setNewDescription] = useState(image.descricao || '');

  const handleSaveDescription = () => {
    onUpdateDescription(image.id, newDescription);
  };

  const handleCancelEdit = () => {
    setNewDescription(image.descricao || '');
    onEdit(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Imagem */}
      <div className="aspect-square bg-gray-100 relative">
        <img
          src={image.url_imagem}
          alt={image.descricao || 'Imagem do produto'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=Erro+ao+Carregar';
          }}
        />
        
        {isPrincipal && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            Principal
          </div>
        )}

        {/* Overlay de ações */}
        {canEdit && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex gap-2">
              {!isPrincipal && (
                <button
                  onClick={() => onSetPrincipal(image.id)}
                  className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-colors"
                  title="Definir como principal"
                  disabled={isLoading}
                >
                  <Star size={16} />
                </button>
              )}
              
              <button
                onClick={() => onEdit(image.id)}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                title="Editar descrição"
                disabled={isLoading}
              >
                <Edit3 size={16} />
              </button>
              
              <button
                onClick={() => onDelete(image.id)}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                title="Deletar imagem"
                disabled={isLoading}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="p-3">
        {editingImage === image.id ? (
          // Modo de edição
          <div className="space-y-2">
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição da imagem"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveDescription}
                className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              >
                <Check size={12} />
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
              >
                <X size={12} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          // Modo de visualização
          <div>
            <p className="text-sm text-gray-900 mb-1">
              {image.descricao || 'Sem descrição'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {image.origem}
              </span>
              
              {image.largura && image.altura && (
                <span>{image.largura}x{image.altura}</span>
              )}
            </div>

            {image.confianca_score && (
              <div className="mt-1 text-xs text-gray-500">
                Confiança: {Math.round(image.confianca_score * 100)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageGallery;

