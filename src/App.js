// src/App.js (VERSÃO COM LAYOUT RESTAURADO)

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ProductsPage from './pages/ProductsPage';
import ProductScanner from './components/ProductScanner'; // Componente novo
import ProductForm from './components/ProductForm';   // Componente novo
import './App.css';

// Componente para proteger rotas que exigem autenticação
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Componente que agrupa o layout principal com a barra lateral
function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rotas protegidas que usam o layout principal */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <UsersPage />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ProductsPage />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            {/* Novas rotas para o fluxo de cadastro inteligente */}
            <Route 
              path="/products/scanner" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ProductScanner />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/products/new" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ProductForm />
                  </MainLayout>
                </PrivateRoute>
              } 
            />

            {/* Rota de fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

