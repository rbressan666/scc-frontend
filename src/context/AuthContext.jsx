import React, { createContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services/api';
import { initPush } from '../services/pushClient';

// Criar contexto
const AuthContext = createContext();

// Hook useAuth movido para arquivo separado (useAuth.js) para evitar conflito com Fast Refresh

// Provider do contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função de logout (definida antes para evitar TDZ em checkAuth)
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout error
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      try {
        if (window.localStorage.getItem('scc_debug_nav') === '1') {
          console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'logout', hadUser: !!user });
        }
      } catch { /* ignore */ }
    }
  }, [user]);

  // Função auxiliar para obter dados do usuário a partir do token (antes de login/checkAuth)
  const getUserFromToken = async (token) => {
    const originalToken = Cookies.get('scc_token');
    Cookies.set('scc_token', token, { expires: 1 });
    const response = await authService.verifyToken();
    if (response.success) {
      Cookies.set('scc_user', JSON.stringify(response.data.user), { expires: 1 });
      return response.data.user;
    } else {
      if (originalToken) { Cookies.set('scc_token', originalToken, { expires: 1 }); } else { Cookies.remove('scc_token'); }
      throw new Error('Token inválido');
    }
  };

  // Função para verificar se o usuário está autenticado
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      try {
        if (window.localStorage.getItem('scc_debug_nav') === '1') {
          console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:start' });
        }
      } catch { /* ignore */ }
      
      // Verificar se há token nos cookies
      if (!authService.isAuthenticated()) {
        setUser(null);
        setIsAuthenticated(false);
        try {
          if (window.localStorage.getItem('scc_debug_nav') === '1') {
            console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:no-token' });
          }
        } catch { /* ignore */ }
        return;
      }

      // Obter dados do usuário dos cookies
      const userData = authService.getCurrentUser();
      
      if (userData) {
        // Verificar se o token ainda é válido
        try {
          const response = await authService.verifyToken();
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            try {
              if (window.localStorage.getItem('scc_debug_nav') === '1') {
                console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:valid', userId: response.data.user?.id });
              }
            } catch { /* ignore */ }
          } else {
            throw new Error('Token inválido');
          }
        } catch {
          // Token inválido, limpar dados
          await logout();
          try {
            if (window.localStorage.getItem('scc_debug_nav') === '1') {
              console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:token-invalid' });
            }
          } catch { /* ignore */ }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        try {
          if (window.localStorage.getItem('scc_debug_nav') === '1') {
            console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:no-user-cookie' });
          }
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setUser(null);
      setIsAuthenticated(false);
      try {
        if (window.localStorage.getItem('scc_debug_nav') === '1') {
          console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:error', message: err?.message });
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
      try {
        if (window.localStorage.getItem('scc_debug_nav') === '1') {
          console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'checkAuth:end', isAuth: isAuthenticated });
        }
      } catch { /* ignore */ }
    }
  }, [logout, isAuthenticated]);

  // Verificar autenticação ao carregar a aplicação (depois que checkAuth foi definido)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Função de login
  const login = async (email, senha, token = null) => {
    try {
      try {
        if (window.localStorage.getItem('scc_debug_nav') === '1') {
          console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'login:begin', mode: token ? 'qr' : 'standard', email });
        }
      } catch { /* ignore */ }
      let response;
      
      // Se token foi fornecido (login via QR Code), usar diretamente
      if (token) {
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
    // Try to register push subscription for this user
    try { await initPush(); } catch { /* ignore */ }
        try {
          if (window.localStorage.getItem('scc_debug_nav') === '1') {
            console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'login:success', userId: response.data.user?.id });
          }
        } catch { /* ignore */ }
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      try {
        if (window.localStorage.getItem('scc_debug_nav') === '1') {
          console.log('[AUTH DEBUG]', { ts: new Date().toISOString(), ctx: 'login:error', message: error?.message });
        }
      } catch { /* ignore */ }
      return { 
        success: false, 
        message: error.message || 'Erro no login' 
      };
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
        message: error.message || 'Erro no login' 
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

