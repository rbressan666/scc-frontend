// components/PhotoCapture.jsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, X } from 'lucide-react';

const PhotoCapture = ({ 
  onPhotoCapture, 
  onCancel, 
  title = "Capturar Foto",
  subtitle = "Posicione o produto no centro da tela e tire a foto"
}) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' para frontal, 'environment' para traseira
  const [error, setError] = useState(null);

  // Configurações da webcam
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  // Capturar foto
  const capture = useCallback(() => {
    setIsCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsCapturing(false);
  }, [webcamRef]);

  // Confirmar foto
  const confirmPhoto = () => {
    if (capturedImage && onPhotoCapture) {
      onPhotoCapture(capturedImage);
    }
  };

  // Tirar nova foto
  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
  };

  // Alternar câmera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  // Cancelar
  const handleCancel = () => {
    setCapturedImage(null);
    if (onCancel) {
      onCancel();
    }
  };

  // Tratar erro da webcam
  const handleUserMediaError = (error) => {
    console.error('Erro ao acessar câmera:', error);
    setError('Não foi possível acessar a câmera. Verifique as permissões.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-blue-100 text-sm">{subtitle}</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {error ? (
            // Erro
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <Camera size={48} className="mx-auto" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : capturedImage ? (
            // Foto capturada - preview
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Foto capturada"
                  className="w-full h-auto rounded-lg shadow-md"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                  Foto Capturada
                </div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={retakePhoto}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={16} />
                  Tirar Nova Foto
                </button>
                <button
                  onClick={confirmPhoto}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={16} />
                  Confirmar Foto
                </button>
              </div>
            </div>
          ) : (
            // Webcam ativa
            <div className="space-y-4">
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  onUserMediaError={handleUserMediaError}
                  className="w-full h-auto rounded-lg shadow-md"
                />
                
                {/* Overlay com mira */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed w-64 h-64 rounded-lg opacity-50"></div>
                </div>
                
                {/* Indicador de carregamento */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-lg">Capturando...</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={switchCamera}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={16} />
                  Trocar Câmera
                </button>
                <button
                  onClick={capture}
                  disabled={isCapturing}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Camera size={16} />
                  {isCapturing ? 'Capturando...' : 'Tirar Foto'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer com dicas */}
        <div className="bg-gray-50 p-3 text-sm text-gray-600">
          <p className="text-center">
            💡 Dica: Mantenha o produto bem iluminado e centralizado para melhor reconhecimento
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;

