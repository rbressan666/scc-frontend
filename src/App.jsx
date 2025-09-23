// App.jsx - Versão atualizada com funcionalidades de foto
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserListPage from './pages/UserListPage';
import UserViewPage from './pages/UserViewPage';
import UserEditPage from './pages/UserEditPage';
import UserCreatePage from './pages/UserCreatePage';
import ProfilePage from './pages/ProfilePage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import ProdutosPage from './pages/ProdutosPage';
import CadastroPorCameraPage from './pages/CadastroPorCameraPage';
import CadastroViaFotoPage from './pages/CadastroViaFotoPage';
import ReconhecimentoProdutoPage from './pages/ReconhecimentoProdutoPage';
import './App.css';

// Componente 404 separado para usar useNavigate
const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-600 text-2xl">404</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Página Não Encontrada
        </h2>
        <p className="text-gray-600 mb-4">
          A página que você está procurando não existe.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-700 font-medium underline"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
        <div className="App">
          <Routes>
            {/* Rota pública - Login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rotas protegidas */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Rotas de usuários - apenas admin */}
            <Route path="/usuarios" element={
              <ProtectedRoute requireAdmin={true}>
                <UserListPage />
              </ProtectedRoute>
            } />
            <Route path="/usuarios/novo" element={
              <ProtectedRoute requireAdmin={true}>
                <UserCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/usuarios/:id" element={
              <ProtectedRoute requireAdmin={true}>
                <UserViewPage />
              </ProtectedRoute>
            } />
            <Route path="/usuarios/:id/editar" element={
              <ProtectedRoute requireAdmin={true}>
                <UserEditPage />
              </ProtectedRoute>
            } />
            
            {/* Rota de perfil - todos os usuários */}
            <Route path="/perfil" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Rotas de configurações - apenas admin */}
            <Route path="/configuracoes" element={
              <ProtectedRoute requireAdmin={true}>
                <ConfiguracoesPage />
              </ProtectedRoute>
            } />
            
            {/* Rotas de produtos */}
            <Route path="/produtos" element={
              <ProtectedRoute>
                <ProdutosPage />
              </ProtectedRoute>
            } />
            
            {/* Rotas de cadastro de produtos */}
            <Route path="/produtos/cadastro-camera" element={
              <ProtectedRoute requireAdmin={true}>
                <CadastroPorCameraPage />
              </ProtectedRoute>
            } />
            
            {/* NOVAS ROTAS - Funcionalidades de Foto */}
            <Route path="/produtos/cadastro-via-foto" element={
              <ProtectedRoute requireAdmin={true}>
                <CadastroViaFotoPage />
              </ProtectedRoute>
            } />
            
            <Route path="/produtos/reconhecimento" element={
              <ProtectedRoute>
                <ReconhecimentoProdutoPage />
              </ProtectedRoute>
            } />
            
            {/* Rota padrão - redirecionar para dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;

