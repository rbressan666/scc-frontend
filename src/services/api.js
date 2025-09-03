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
  },

  // Atualizar perfil do usuário logado
  async updateProfile(userData) {
    return await api.put('/api/usuarios/profile', userData);
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

  async updateStock(id, estoqueAtual) {
    return await api.put(`/api/variacoes/${id}/estoque`, { estoque_atual: estoqueAtual });
  },

  async deactivate(id) {
    return await api.delete(`/api/variacoes/${id}`);
  },

  async reactivate(id) {
    return await api.put(`/api/variacoes/${id}/reactivate`);
  }
};

// Serviços de Fatores de Conversão
export const conversaoService = {
  async getByVariacao(idVariacao) {
    return await api.get(`/api/conversoes/por-variacao/${idVariacao}`);
  },

  async getById(id) {
    return await api.get(`/api/conversoes/${id}`);
  },

  async create(conversaoData) {
    return await api.post('/api/conversoes', conversaoData);
  },

  async createMultiple(fatores) {
    return await api.post('/api/conversoes/multiplos', { fatores });
  },

  async update(id, conversaoData) {
    return await api.put(`/api/conversoes/${id}`, conversaoData);
  },

  async delete(id) {
    return await api.delete(`/api/conversoes/${id}`);
  },

  async convertQuantity(idVariacao, quantidade, idUnidadeOrigem, idUnidadeDestino) {
    return await api.post(`/api/conversoes/converter/${idVariacao}`, {
      quantidade,
      id_unidade_origem: idUnidadeOrigem,
      id_unidade_destino: idUnidadeDestino
    });
  }
};

