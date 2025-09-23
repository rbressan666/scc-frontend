// services/api.js - Versão atualizada com funcionalidades de foto
import axios from 'axios';
import Cookies from 'js-cookie';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentado para 30s devido às operações de foto
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('scc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Se token expirou ou é inválido, limpar cookies e redirecionar
    if (error.response?.status === 401) {
      Cookies.remove('scc_token');
      Cookies.remove('scc_user');
      
      // Redirecionar para login se não estiver na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Retornar erro estruturado com mensagem específica
    let errorMessage = 'Erro de conexão com o servidor';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Tratar erros de validação
      errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Serviços de Foto
export const photoService = {
  // Buscar produtos por foto na internet
  async searchByPhoto(imageBase64, searchTerms = []) {
    return await api.post('/api/photos/search-by-photo', {
      image: imageBase64,
      search_terms: searchTerms
    });
  },

  // Reconhecer produto existente por foto
  async recognizeProduct(imageBase64) {
    return await api.post('/api/photos/recognize-product', {
      image: imageBase64
    });
  },

  // Enviar feedback sobre reconhecimento
  async sendRecognitionFeedback(feedbackData) {
    return await api.post('/api/photos/recognition-feedback', feedbackData);
  },

  // Upload de imagem para produto
  async uploadImage(productId, imageData) {
    return await api.post(`/api/photos/products/${productId}/upload`, imageData);
  },

  // Salvar imagem da internet
  async saveFromInternet(productId, imageData) {
    return await api.post(`/api/photos/products/${productId}/save-from-internet`, imageData);
  },

  // Listar imagens de um produto
  async getProductImages(productId, includeInactive = false) {
    return await api.get(`/api/photos/products/${productId}/images?include_inactive=${includeInactive}`);
  },

  // Definir imagem principal
  async setPrincipalImage(productId, imageId) {
    return await api.put(`/api/photos/products/${productId}/images/${imageId}/set-principal`);
  },

  // Atualizar imagem
  async updateImage(imageId, updateData) {
    return await api.put(`/api/photos/images/${imageId}`, updateData);
  },

  // Deletar imagem
  async deleteImage(imageId) {
    return await api.delete(`/api/photos/images/${imageId}`);
  },

  // Obter estatísticas de imagens
  async getStats() {
    return await api.get('/api/photos/stats');
  }
};

// Serviços de Autenticação
export const authService = {
  // Login
  async login(email, senha) {
    const response = await api.post('/api/auth/login', { email, senha });
    
    if (response.success && response.token) {
      // Salvar token e dados do usuário nos cookies
      Cookies.set('scc_token', response.token, { expires: 1 }); // 1 dia
      Cookies.set('scc_user', JSON.stringify(response.user), { expires: 1 });
    }
    
    return {
      success: response.success,
      message: response.message,
      data: {
        token: response.token,
        user: response.user
      }
    };
  },

  // Logout
  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Sempre limpar cookies localmente
      Cookies.remove('scc_token');
      Cookies.remove('scc_user');
    }
  },

  // Verificar se está autenticado
  isAuthenticated() {
    return !!Cookies.get('scc_token');
  },

  // Obter usuário atual
  getCurrentUser() {
    const userCookie = Cookies.get('scc_user');
    return userCookie ? JSON.parse(userCookie) : null;
  },

  // Verificar se é admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.perfil === 'admin';
  },

  // Verificar validade do token
  async verifyToken() {
    return await api.get("/api/auth/verify");
  }
};

// Serviços de Usuários
export const userService = {
  async getAll(includeInactive = false) {
    return await api.get(`/api/users?includeInactive=${includeInactive}`);
  },

  async getById(id) {
    return await api.get(`/api/users/${id}`);
  },

  async create(userData) {
    return await api.post('/api/users', userData);
  },

  async update(id, userData) {
    return await api.put(`/api/users/${id}`, userData);
  },

  async deactivate(id) {
    return await api.delete(`/api/users/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/users/${id}/reactivate`);
  },

  async changePassword(passwordData) {
    return await api.put('/api/users/change-password', passwordData);
  },

  async resetPassword(id) {
    return await api.put(`/api/users/${id}/reset-password`);
  },

  async getProfile() {
    return await api.get('/api/users/profile');
  },

  async updateProfile(profileData) {
    return await api.put('/api/users/profile', profileData);
  }
};

// Serviços de QR Code
export const qrService = {
  async generateLoginQR() {
    return await api.get('/api/qr/login');
  },

  async generateCountingQR(sessionId) {
    return await api.get(`/api/qr/counting/${sessionId}`);
  }
};

// Serviços de WebSocket
export const socketService = {
  // Implementação do WebSocket será feita em arquivo separado
  // Este serviço apenas expõe métodos para interagir com o socket
};

export default api;

// Serviços de Setores
export const setorService = {
  async getAll(includeInactive = false) {
    return await api.get(`/api/setores?includeInactive=${includeInactive}`);
  },

  async getById(id) {
    return await api.get(`/api/setores/${id}`);
  },

  async create(setorData) {
    return await api.post('/api/setores', setorData);
  },

  async update(id, setorData) {
    return await api.put(`/api/setores/${id}`, setorData);
  },

  async deactivate(id) {
    return await api.delete(`/api/setores/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/setores/${id}/reactivate`);
  }
};

// Serviços de Categorias
export const categoriaService = {
  async getAll(includeInactive = false, tree = false) {
    return await api.get(`/api/categorias?includeInactive=${includeInactive}&tree=${tree}`);
  },

  async getById(id) {
    return await api.get(`/api/categorias/${id}`);
  },

  async create(categoriaData) {
    return await api.post('/api/categorias', categoriaData);
  },

  async update(id, categoriaData) {
    return await api.put(`/api/categorias/${id}`, categoriaData);
  },

  async deactivate(id) {
    return await api.delete(`/api/categorias/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/categorias/${id}/reactivate`);
  }
};

// Serviços de Unidades de Medida
export const unidadeMedidaService = {
  async getAll(includeInactive = false) {
    return await api.get(`/api/unidades-medida?includeInactive=${includeInactive}`);
  },

  async getById(id) {
    return await api.get(`/api/unidades-medida/${id}`);
  },

  async create(unidadeData) {
    return await api.post('/api/unidades-medida', unidadeData);
  },

  async update(id, unidadeData) {
    return await api.put(`/api/unidades-medida/${id}`, unidadeData);
  },

  async deactivate(id) {
    return await api.delete(`/api/unidades-medida/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/unidades-medida/${id}/reactivate`);
  }
};

// Serviços de Produtos
export const produtoService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.includeInactive) params.append('includeInactive', 'true');
    if (filters.setor) params.append('setor', filters.setor);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.nome) params.append('nome', filters.nome);
    
    return await api.get(`/api/produtos?${params.toString()}`);
  },

  async getById(id) {
    return await api.get(`/api/produtos/${id}`);
  },

  async create(produtoData) {
    return await api.post('/api/produtos', produtoData);
  },

  async update(id, produtoData) {
    return await api.put(`/api/produtos/${id}`, produtoData);
  },

  async deactivate(id) {
    return await api.delete(`/api/produtos/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/produtos/${id}/reactivate`);
  },

  // Método existente para busca por EAN
  async lookupByEan(eanData) {
    return await api.post('/api/produtos/lookup-by-ean', eanData);
  }
};

// Serviços de Variações de Produto
export const variacaoService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.includeInactive) params.append('includeInactive', 'true');
    if (filters.setor) params.append('setor', filters.setor);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.nome) params.append('nome', filters.nome);
    if (filters.estoque_baixo) params.append('estoque_baixo', 'true');
    
    return await api.get(`/api/variacoes?${params.toString()}`);
  },

  async getById(id) {
    return await api.get(`/api/variacoes/${id}`);
  },

  async getByProduct(idProduto) {
    return await api.get(`/api/variacoes/produto/${idProduto}`);
  },

  async getLowStock() {
    return await api.get('/api/variacoes/estoque-baixo');
  },

  async create(variacaoData) {
    return await api.post('/api/variacoes', variacaoData);
  },

  async update(id, variacaoData) {
    return await api.put(`/api/variacoes/${id}`, variacaoData);
  },

  async deactivate(id) {
    return await api.delete(`/api/variacoes/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/variacoes/${id}/reactivate`);
  },

  async updateStock(id, stockData) {
    return await api.put(`/api/variacoes/${id}/estoque`, stockData);
  }
};

// Serviços de Fatores de Conversão
export const fatorConversaoService = {
  async getAll() {
    return await api.get('/api/fatores-conversao');
  },

  async getByVariacao(idVariacao) {
    return await api.get(`/api/fatores-conversao/variacao/${idVariacao}`);
  },

  async create(fatorData) {
    return await api.post('/api/fatores-conversao', fatorData);
  },

  async createMultiple(fatoresData) {
    return await api.post('/api/fatores-conversao/multiple', fatoresData);
  },

  async update(id, fatorData) {
    return await api.put(`/api/fatores-conversao/${id}`, fatorData);
  },

  async delete(id) {
    return await api.delete(`/api/fatores-conversao/${id}`);
  },

  async convertQuantity(conversionData) {
    return await api.post('/api/fatores-conversao/convert', conversionData);
  }
};

