import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserListPage from './pages/UserListPage';
import UserViewPage from './pages/UserViewPage';
import UserEditPage from './pages/UserEditPage';
import UserCreatePage from './pages/UserCreatePage';
import UserInvitePage from './pages/UserInvitePage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import ProdutosPage from './pages/ProdutosPage';
import CadastroPorCameraPage from './pages/CadastroPorCameraPage';
import TurnosPage from './pages/TurnosPage';
import ContagemPage from './pages/ContagemPage';
import AlertasPage from './pages/AlertasPage';
import DashboardContagemPage from './pages/DashboardContagemPage';
import AnaliseVariacaoPage from './pages/AnaliseVariacaoPage';
import ChecklistEntradaPage from './pages/ChecklistEntradaPage';
import ChecklistSaidaPage from './pages/ChecklistSaidaPage';
import AdminDiagnosticsPage from './pages/AdminDiagnosticsPage';
import PlanningPageV2 from './pages/PlanningPageV2';
import NotificationsAdminPage from './pages/NotificationsAdminPage';
import UpdatesPage from './pages/UpdatesPage';
import ProfilePage from './pages/ProfilePage';
import StatuteWizardPage from './pages/StatuteWizardPage';
import ConfirmSignupPage from './pages/ConfirmSignupPage';
import SetPasswordPage from './pages/SetPasswordPage';
import './App.css';

// Componente 404 separado para usar useNavigate
const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-600 text-2xl">404</span>
        </div>
        <h2 className="text-gray-600 mb-4">
          A página que você está procurando não existe.
        </h2>
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rota pública - Login */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/confirmar" element={<ConfirmSignupPage />} />
            <Route path="/definir-senha" element={<SetPasswordPage />} />
            
            {/* Rotas protegidas */}
            <Route
              path="/termos"
              element={
                <ProtectedRoute>
                  <StatuteWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/atualizacoes"
              element={
                <ProtectedRoute>
                  <UpdatesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            
            {/* Rotas de usuários - apenas para admin */}
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserListPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/usuarios/novo"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios/convidar"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserInvitePage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/usuarios/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserViewPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/usuarios/:id/editar"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserEditPage />
                </ProtectedRoute>
              }
            />
            
            {/* Rotas de configurações - apenas para admin */}
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ConfiguracoesPage />
                </ProtectedRoute>
              }
            />

            {/* Diagnósticos e Planejamento - apenas admin */}
            <Route
              path="/admin/diagnosticos"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDiagnosticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NotificationsAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planejamento"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PlanningPageV2 />
                </ProtectedRoute>
              }
            />
            
            {/* Rotas de produtos - apenas para admin */}
            <Route
              path="/produtos"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProdutosPage />
                </ProtectedRoute>
              }
            />
            
            {/* Nova rota de cadastro por câmera - apenas para admin */}
            <Route
              path="/produtos/cadastro-camera"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CadastroPorCameraPage />
                </ProtectedRoute>
              }
            />
            
            {/* Rotas do MVP3 - Sistema de Contagem por Turno */}
            <Route
              path="/turnos"
              element={
                <ProtectedRoute>
                  <TurnosPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/turnos/:id"
              element={
                <ProtectedRoute>
                  <DashboardContagemPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/contagem/:turnoId"
              element={
                <ProtectedRoute>
                  <ContagemPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/alertas"
              element={
                <ProtectedRoute>
                  <AlertasPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analise/:turnoId"
              element={
                <ProtectedRoute>
                  <AnaliseVariacaoPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/checklist-entrada/:turnoId"
              element={
                <ProtectedRoute>
                  <ChecklistEntradaPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/checklist-saida/:turnoId"
              element={
                <ProtectedRoute>
                  <ChecklistSaidaPage />
                </ProtectedRoute>
              }
            />

            {/* Perfil do usuário */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            
            {/* Rota padrão - redirecionar para dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rota 404 - página não encontrada */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

