import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, RotateCcw } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose, isOpen }) => {
  const webcamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const codeReaderRef = useRef(null);

  // Inicializar o leitor de código de barras
  useEffect(() => {
    if (isOpen) {
      codeReaderRef.current = new BrowserMultiFormatReader();
      getVideoDevices();
    }
    
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [isOpen]);

  // Obter dispositivos de vídeo disponíveis
  const getVideoDevices = async () => {
    try {
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(videoDevices);
      
      if (videoDevices.length > 0) {
        // Preferir câmera traseira se disponível
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        setSelectedDevice(backCamera || videoDevices[0]);
      }
    } catch (err) {
      console.error('Erro ao obter dispositivos de vídeo:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  // Iniciar escaneamento
  const startScanning = useCallback(async () => {
    if (!selectedDevice || !codeReaderRef.current) return;

    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);

      // Configurar constraints da câmera
      const constraints = {
        video: {
          deviceId: selectedDevice.deviceId,
          facingMode: { ideal: 'environment' }, // Preferir câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Iniciar decodificação contínua
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        'barcode-video',
        (result, error) => {
          if (result) {
            const code = result.getText();
            console.log('Código detectado:', code);
            setScanResult(code);
            setIsScanning(false);
            
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
      setError('Erro ao iniciar a câmera. Tente novamente.');
      setIsScanning(false);
    }
  }, [selectedDevice, onScan]);

  // Parar escaneamento
  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
    setScanResult(null);
  }, []);

  // Trocar câmera
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
    if (selectedDevice) {
      startScanning();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
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
          {/* Área do vídeo */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                <Camera className="h-12 w-12 mb-2 opacity-50" />
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

          {/* Controles */}
          <div className="flex gap-2">
            {!isScanning && !scanResult && !error && (
              <Button onClick={startScanning} className="flex-1" disabled={!selectedDevice}>
                <Camera className="h-4 w-4 mr-2" />
                Iniciar Scanner
              </Button>
            )}
            
            {isScanning && (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                Parar Scanner
              </Button>
            )}
            
            {devices.length > 1 && (
              <Button onClick={switchCamera} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Informações */}
          <div className="text-xs text-gray-500 text-center">
            {devices.length > 0 && (
              <p>Câmera: {selectedDevice?.label || 'Padrão'}</p>
            )}
            <p>Suporta códigos EAN-13, UPC-A, Code-128 e outros formatos</p>
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

