import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';
import { statutesService } from '../services/api';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();
  const [gateLoading, setGateLoading] = useState(false);
  const [hasPendingStatutes, setHasPendingStatutes] = useState(false);

  // Helper para debug de navegação (ativar com localStorage.setItem('scc_debug_nav','1'))
  const debugNav = useMemo(() => (reason, target) => {
    try {
      if (window.localStorage.getItem('scc_debug_nav') === '1') {
        console.log('[NAV DEBUG]', {
          ts: new Date().toISOString(),
          from: location.pathname,
          reason,
          target
        });
      }
    } catch {/* ignore */}
  }, [location.pathname]);

  // Gating: verificar termos pendentes para não-admins
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (loading || !isAuthenticated) return;
  if (requireAdmin) return; // rota exige admin, gating de estatutos não interfere aqui
  if (isAdmin()) return; // admins não precisam reconhecer estatutos
      if (location.pathname === '/termos') return; // já está no wizard
      try {
        setGateLoading(true);
        const resp = await statutesService.getPending();
        if (!cancelled) {
          const has = Array.isArray(resp.data) && resp.data.length > 0;
          setHasPendingStatutes(has);
          if (has) debugNav('pending-statutes-detected', '/termos');
        }
      } catch {
        // Em caso de falha, não bloquear navegação
        if (!cancelled) setHasPendingStatutes(false);
      } finally {
        if (!cancelled) setGateLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [loading, isAuthenticated, requireAdmin, isAdmin, location.pathname, debugNav]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    debugNav('not-authenticated', '/login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se requer permissões de admin
  if (requireAdmin && !isAdmin()) {
    debugNav('access-denied-non-admin', null);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página. 
            Apenas administradores podem visualizar este conteúdo.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Redirecionar para wizard de termos se houver pendências
  if (!requireAdmin && !isAdmin() && gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando termos obrigatórios...</p>
        </div>
      </div>
    );
  }
  if (!requireAdmin && !isAdmin() && hasPendingStatutes && location.pathname !== '/termos') {
    debugNav('redirect-to-termos', '/termos');
    return <Navigate to="/termos" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

