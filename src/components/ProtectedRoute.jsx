import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se requer permissões de admin
  if (requireAdmin && !isAdmin()) {
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

  return children;
};

export default ProtectedRoute;

