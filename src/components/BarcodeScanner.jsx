import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, RotateCcw, AlertCircle, Info, SwitchCamera } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose, isOpen }) => {
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [showInstructions, setShowInstructions] = useState(false);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);

  // Resetar estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      // Resetar todos os estados
      setIsScanning(false);
      setError(null);
      setScanResult(null);
      setShowInstructions(false);
      setPermissionState('prompt');
      setDevices([]);
      setSelectedDevice(null);
      
      // Inicializar
      codeReaderRef.current = new BrowserMultiFormatReader();
      checkCameraPermission();
    } else {
      // Limpar quando fechar
      cleanup();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Limpeza de recursos
  const cleanup = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Verificar permissão da câmera
  const checkCameraPermission = async () => {
    try {
      // Verificar se a API de permissões está disponível
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setPermissionState(permission.state);
        
        permission.onchange = () => {
          setPermissionState(permission.state);
        };
      }
      
      // Tentar obter dispositivos (isso pode solicitar permissão)
      await getVideoDevices();
    } catch (err) {
      console.error('Erro ao verificar permissões:', err);
      setError('Erro ao verificar permissões da câmera');
    }
  };

  // Obter dispositivos de vídeo disponíveis
  const getVideoDevices = async () => {
    try {
      // Primeiro, solicitar acesso à câmera para obter a lista completa de dispositivos
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Parar o stream temporário
      stream.getTracks().forEach(track => track.stop());
      
      // Agora obter a lista de dispositivos
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === 'videoinput');
      
      setDevices(cameras);
      setPermissionState('granted');
      
      if (cameras.length > 0) {
        // Preferir câmera traseira se disponível
        const backCamera = cameras.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('traseira')
        );
        setSelectedDevice(backCamera || cameras[0]);
      } else {
        setError('Nenhuma câmera encontrada no dispositivo');
      }
    } catch (err) {
      console.error('Erro ao obter dispositivos de vídeo:', err);
      
      if (err.name === 'NotAllowedError') {
        setPermissionState('denied');
        setError('Permissão de câmera negada. Clique no ícone da câmera na barra de endereços e permita o acesso.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo');
      } else if (err.name === 'NotSupportedError') {
        setError('Câmera não suportada neste navegador');
      } else {
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    }
  };

  // Solicitar permissão explicitamente
  const requestCameraPermission = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Parar o stream temporário
      stream.getTracks().forEach(track => track.stop());
      
      // Recarregar dispositivos
      await getVideoDevices();
    } catch (err) {
      console.error('Erro ao solicitar permissão:', err);
      
      if (err.name === 'NotAllowedError') {
        setPermissionState('denied');
        setError('Permissão de câmera negada. Verifique as configurações do navegador.');
        setShowInstructions(true);
      } else {
        setError('Erro ao acessar a câmera: ' + err.message);
      }
    }
  };

  // Iniciar escaneamento
  const startScanning = useCallback(async () => {
    if (!selectedDevice || !codeReaderRef.current) {
      await requestCameraPermission();
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);

      // Configurar constraints da câmera
      const constraints = {
        video: {
          deviceId: selectedDevice.deviceId ? { exact: selectedDevice.deviceId } : undefined,
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Obter stream da câmera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Configurar elemento de vídeo
      const videoElement = document.getElementById('barcode-video');
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
      }

      // Iniciar decodificação contínua
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        'barcode-video',
        (result, error) => {
          if (result) {
            const code = result.getText();
            console.log('Código detectado:', code);
            setScanResult(code);
            setIsScanning(false);
            
            // Parar stream
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            
            // Chamar callback com o código encontrado
            if (onScan) {
              onScan(code);
            }
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Erro na decodificação:', error);
          }
        }
      );
    } catch (err) {
      console.error('Erro ao iniciar escaneamento:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Clique no ícone da câmera na barra de endereços e permita o acesso.');
        setShowInstructions(true);
      } else if (err.name === 'NotFoundError') {
        setError('Câmera não encontrada. Verifique se há uma câmera conectada.');
      } else {
        setError('Erro ao iniciar a câmera: ' + err.message);
      }
      setIsScanning(false);
    }
  }, [selectedDevice, onScan]);

  // Parar escaneamento
  const stopScanning = useCallback(() => {
    cleanup();
    setIsScanning(false);
    setScanResult(null);
  }, [cleanup]);

  // Trocar câmera (ícone correto para mobile)
  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice?.deviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDevice(devices[nextIndex]);
      
      if (isScanning) {
        stopScanning();
        setTimeout(() => {
          startScanning();
        }, 500);
      }
    }
  };

  // Tentar novamente
  const retry = () => {
    setError(null);
    setScanResult(null);
    setShowInstructions(false);
    requestCameraPermission();
  };

  // Renderizar instruções de permissão
  const renderPermissionInstructions = () => (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-900 mb-2">Como permitir acesso à câmera:</h4>
          <div className="space-y-2 text-blue-800">
            <p><strong>No computador (Chrome/Edge):</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Clique no ícone da câmera na barra de endereços</li>
              <li>Selecione "Sempre permitir" ou "Permitir"</li>
              <li>Recarregue a página se necessário</li>
            </ul>
            
            <p className="mt-3"><strong>No celular:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Toque no ícone da câmera na barra de endereços</li>
              <li>Selecione "Permitir" quando solicitado</li>
              <li>Nas configurações do navegador, permita acesso à câmera para este site</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scanner de Código de Barras
              </CardTitle>
              <CardDescription>
                Aponte a câmera para o código de barras do produto
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Instruções de permissão */}
          {showInstructions && renderPermissionInstructions()}
          
          {/* Área do vídeo */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                <AlertCircle className="h-12 w-12 mb-2 text-red-400" />
                <p className="text-sm mb-4">{error}</p>
                <Button variant="secondary" size="sm" onClick={retry}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : scanResult ? (
              <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                <div className="bg-green-600 rounded-full p-3 mb-3">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="text-sm mb-2">Código detectado:</p>
                <p className="font-mono text-lg font-bold mb-4">{scanResult}</p>
                <p className="text-xs opacity-75">Processando...</p>
              </div>
            ) : (
              <div className="relative h-full">
                <video
                  id="barcode-video"
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Overlay de mira */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white rounded-lg w-64 h-32 relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                  </div>
                </div>
                
                {/* Linha de escaneamento animada */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-32 relative overflow-hidden">
                      <div className="absolute w-full h-0.5 bg-red-500 animate-pulse" 
                           style={{
                             animation: 'scan 2s linear infinite',
                             top: '50%'
                           }}>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status da permissão */}
          {permissionState === 'denied' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-800 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Permissão de câmera negada. Clique em "Tentar Novamente" e permita o acesso.</span>
            </div>
          )}

          {/* Controles */}
          <div className="flex gap-2">
            {!isScanning && !scanResult && (
              <Button 
                onClick={startScanning} 
                className="flex-1" 
                disabled={permissionState === 'denied' && !selectedDevice}
              >
                <Camera className="h-4 w-4 mr-2" />
                {selectedDevice ? 'Iniciar Scanner' : 'Permitir Câmera'}
              </Button>
            )}
            
            {isScanning && (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                Parar Scanner
              </Button>
            )}
            
            {devices.length > 1 && selectedDevice && (
              <Button onClick={switchCamera} variant="outline" size="sm" title="Trocar Câmera">
                <SwitchCamera className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Informações */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            {devices.length > 0 && selectedDevice && (
              <p>Câmera: {selectedDevice.label || 'Padrão'}</p>
            )}
            <p>Suporta códigos EAN-13, UPC-A, Code-128 e outros formatos</p>
            {devices.length === 0 && permissionState !== 'denied' && (
              <p className="text-orange-600">Aguardando permissão da câmera...</p>
            )}
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;

