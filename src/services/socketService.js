import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Conectar ao servidor WebSocket
  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Event listeners básicos
    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado do WebSocket:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  // Desconectar do servidor
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Adicionar listener para evento
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on(event, callback);
    
    // Armazenar referência para poder remover depois
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remover listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }

    // Remover da lista de listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emitir evento
  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }

    if (this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket não conectado. Tentando reconectar...');
      this.socket.connect();
      
      // Tentar emitir novamente após conexão
      this.socket.once('connect', () => {
        this.socket.emit(event, data);
      });
    }
  }

  // Verificar se está conectado
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Classe específica para QR Code
export class QRCodeSocketService extends SocketService {
  constructor() {
    super();
    this.currentSession = null;
  }

  // Gerar QR Code para login
  generateQRCode() {
    return new Promise((resolve, reject) => {
      if (!this.isSocketConnected()) {
        this.connect();
      }

      // Timeout para a operação
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao gerar QR Code - trace'));
      }, 10000);

      // Listener para QR Code gerado
      const onQRGenerated = (data) => {
        clearTimeout(timeout);
        this.currentSession = data.sessionId;
        this.off('qr-generated', onQRGenerated);
        this.off('qr-error', onQRError);
        resolve(data);
      };

      // Listener para erro
      const onQRError = (error) => {
        clearTimeout(timeout);
        this.off('qr-generated', onQRGenerated);
        this.off('qr-error', onQRError);
        reject(new Error(error.message || 'Erro ao gerar QR Code'));
      };

      // Registrar listeners
      this.on('qr-generated', onQRGenerated);
      this.on('qr-error', onQRError);

      // Solicitar geração do QR Code
      this.emit('generate-qr', {});
    });
  }

  // Validar QR Code escaneado
  validateQRCode(sessionId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao validar QR Code'));
      }, 10000);

      const onValidationResult = (data) => {
        clearTimeout(timeout);
        this.off('qr-validation-result', onValidationResult);
        
        if (data.success) {
          resolve(data);
        } else {
          reject(new Error(data.message));
        }
      };

      this.on('qr-validation-result', onValidationResult);
      this.emit('validate-qr', { sessionId });
    });
  }

  // Confirmar login via mobile
  confirmLogin(sessionId, token, user) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao confirmar login'));
      }, 10000);

      const onConfirmationResult = (data) => {
        clearTimeout(timeout);
        this.off('login-confirmation-result', onConfirmationResult);
        
        if (data.success) {
          resolve(data);
        } else {
          reject(new Error(data.message));
        }
      };

      this.on('login-confirmation-result', onConfirmationResult);
      this.emit('confirm-login', { sessionId, token, user });
    });
  }

  // Cancelar sessão QR
  cancelQRSession(sessionId) {
    if (sessionId || this.currentSession) {
      this.emit('cancel-qr', { sessionId: sessionId || this.currentSession });
      this.currentSession = null;
    }
  }

  // Listeners para eventos específicos do QR Code
  onQRScanned(callback) {
    this.on('qr-scanned', callback);
  }

  onLoginSuccess(callback) {
    this.on('login-success', callback);
  }

  onQRExpired(callback) {
    this.on('qr-expired', callback);
  }

  onQRCancelled(callback) {
    this.on('qr-cancelled', callback);
  }

  // Limpar listeners específicos
  removeQRListeners() {
    const events = ['qr-scanned', 'login-success', 'qr-expired', 'qr-cancelled'];
    events.forEach(event => {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(callback => {
          this.off(event, callback);
        });
      }
    });
  }
}

// Instância singleton do serviço de QR Code
export const qrCodeSocket = new QRCodeSocketService();

export default SocketService;


