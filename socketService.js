// services/socketService.js (CORRIGIDO)
import { io } from 'socket.io-client';

class QRCodeSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    console.log('🔌 Conectando ao WebSocket:', backendUrl);
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconectado após', attemptNumber, 'tentativas');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Erro ao reconectar WebSocket:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  async generateQRCode() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        this.connect();
      }

      // Timeout de 15 segundos (aumentado de 30 para 15)
      const timeout = setTimeout(() => {
        reject(new Error('trace - Timeout ao gerar QR Code'));
      }, 15000);

      this.socket.emit('generate-qr', (response) => {
        clearTimeout(timeout);
        
        if (response && response.success) {
          console.log('📱 QR Code gerado com sucesso:', response.sessionId);
          resolve(response);
        } else {
          console.error('❌ Erro ao gerar QR Code:', response);
          reject(new Error(response?.message || 'Erro ao gerar QR Code'));
        }
      });
    });
  }

  async validateQRCode(qrData, userCredentials) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        this.connect();
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao validar QR Code'));
      }, 10000);

      this.socket.emit('validate-qr', { qrData, userCredentials }, (response) => {
        clearTimeout(timeout);
        
        if (response && response.success) {
          console.log('✅ QR Code validado com sucesso');
          resolve(response);
        } else {
          console.error('❌ Erro ao validar QR Code:', response);
          reject(new Error(response?.message || 'Erro ao validar QR Code'));
        }
      });
    });
  }

  async confirmLogin(sessionId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        this.connect();
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao confirmar login'));
      }, 10000);

      this.socket.emit('confirm-login', { sessionId }, (response) => {
        clearTimeout(timeout);
        
        if (response && response.success) {
          console.log('🎉 Login confirmado com sucesso');
          resolve(response);
        } else {
          console.error('❌ Erro ao confirmar login:', response);
          reject(new Error(response?.message || 'Erro ao confirmar login'));
        }
      });
    });
  }

  cancelQRSession(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('cancel-qr', { sessionId });
      console.log('🚫 Sessão QR cancelada:', sessionId);
    }
  }

  // Listeners para eventos do servidor
  onQRScanned(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('qr-scanned', callback);
    this.listeners.set('qr-scanned', callback);
  }

  onLoginSuccess(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('login-success', callback);
    this.listeners.set('login-success', callback);
  }

  onQRExpired(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('qr-expired', callback);
    this.listeners.set('qr-expired', callback);
  }

  onQRCancelled(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('qr-cancelled', callback);
    this.listeners.set('qr-cancelled', callback);
  }

  removeAllListeners() {
    if (this.socket) {
      for (const [event, callback] of this.listeners.entries()) {
        this.socket.off(event, callback);
      }
      this.listeners.clear();
    }
  }

  // Método para verificar status da conexão
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  // Método para forçar reconexão
  forceReconnect() {
    if (this.socket) {
      this.disconnect();
    }
    return this.connect();
  }
}

// Exportar instância única
export const qrCodeSocket = new QRCodeSocketService();

// Auto-conectar quando o módulo é importado
qrCodeSocket.connect();

