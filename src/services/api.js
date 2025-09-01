import axios from 'axios';
import Cookies from 'js-cookie';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    
    // Retornar erro estruturado
    const errorMessage = error.response?.data?.message || 'Erro de conexão com o servidor';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

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
    
    return response;
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

  // Verificar token
  async verifyToken() {
    return await api.get('/api/auth/verify');
  },

  // Alterar senha
  async changePassword(senhaAtual, novaSenha, confirmarSenha) {
    return await api.put('/api/auth/change-password', {
      senhaAtual,
      novaSenha,
      confirmarSenha
    });
  }
};

// Serviços de Usuários
export const userService = {
  // Listar todos os usuários
  async getAll() {
    return await api.get('/api/usuarios');
  },

  // Buscar usuário por ID
  async getById(id) {
    return await api.get(`/api/usuarios/${id}`);
  },

  // Criar novo usuário
  async create(userData) {
    return await api.post('/api/usuarios', userData);
  },

  // Atualizar usuário
  async update(id, userData) {
    return await api.put(`/api/usuarios/${id}`, userData);
  },

  // Desativar usuário
  async deactivate(id) {
    return await api.delete(`/api/usuarios/${id}`);
  },

  // Reativar usuário
  async reactivate(id) {
    return await api.put(`/api/usuarios/${id}/reactivate`);
  },

  // Obter perfil do usuário logado
  async getProfile() {
    return await api.get('/api/usuarios/profile');
  }
};

// Utilitários
export const apiUtils = {
  // Verificar se usuário está logado
  isAuthenticated() {
    return !!Cookies.get('scc_token');
  },

  // Obter dados do usuário dos cookies
  getCurrentUser() {
    const userCookie = Cookies.get('scc_user');
    return userCookie ? JSON.parse(userCookie) : null;
  },

  // Obter token dos cookies
  getToken() {
    return Cookies.get('scc_token');
  },

  // Verificar se usuário é admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.perfil === 'admin';
  },

  // Formatar erros da API
  formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.data?.errors) {
      return error.data.errors.map(err => err.msg).join(', ');
    }
    
    return 'Erro desconhecido';
  }
};

export default api;

