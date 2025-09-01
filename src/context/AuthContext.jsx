import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService, apiUtils } from '../services/api';

// Criar contexto
const AuthContext = createContext();

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider do contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    checkAuth();
  }, []);

  // Função para verificar se o usuário está autenticado
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Verificar se há token nos cookies
      if (!apiUtils.isAuthenticated()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Obter dados do usuário dos cookies
      const userData = apiUtils.getCurrentUser();
      
      if (userData) {
        // Verificar se o token ainda é válido
        try {
          const response = await authService.verifyToken();
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            throw new Error('Token inválido');
          }
        } catch (error) {
          // Token inválido, limpar dados
          await logout();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Função de login
  const login = async (email, senha, token = null) => {
    try {
      let response;
      
      // Se token foi fornecido (login via QR Code), usar diretamente
      if (token) {
        // Simular resposta para login via QR Code
        response = {
          success: true,
          data: {
            token: token,
            user: await getUserFromToken(token)
          }
        };
      } else {
        // Login normal com email e senha
        response = await authService.login(email, senha);
      }
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        message: apiUtils.formatError(error) 
      };
    }
  };

  // Função auxiliar para obter dados do usuário a partir do token
  const getUserFromToken = async (token) => {
    // Salvar token temporariamente para fazer a verificação
    const originalToken = apiUtils.getToken();
    Cookies.set('scc_token', token, { expires: 1 });
    
    const response = await authService.verifyToken();
    
    if (response.success) {
      // Salvar dados do usuário nos cookies
      Cookies.set('scc_user', JSON.stringify(response.data.user), { expires: 1 });
      return response.data.user;
    } else {
      // Restaurar token original se falhou
      if (originalToken) {
        Cookies.set('scc_token', originalToken, { expires: 1 });
      } else {
        Cookies.remove('scc_token');
      }
      throw new Error('Token inválido');
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = (userData) => {
    setUser(userData);
    // Atualizar também nos cookies
    if (userData) {
      const userCookie = JSON.stringify(userData);
      document.cookie = `scc_user=${userCookie}; path=/; max-age=${24 * 60 * 60}`;
    }
  };

  // Função para alterar senha
  const changePassword = async (senhaAtual, novaSenha, confirmarSenha) => {
    try {
      const response = await authService.changePassword(senhaAtual, novaSenha, confirmarSenha);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { 
        success: false, 
        message: apiUtils.formatError(error) 
      };
    }
  };

  // Verificar se usuário é admin
  const isAdmin = () => {
    return user?.perfil === 'admin';
  };

  // Verificar se usuário está ativo
  const isActive = () => {
    return user?.ativo === true;
  };

  // Valor do contexto
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    changePassword,
    checkAuth,
    isAdmin,
    isActive
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

