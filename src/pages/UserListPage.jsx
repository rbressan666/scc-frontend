import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { userService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Loader2,
  RotateCcw,
  Eye
} from 'lucide-react';

const UserListPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  // Estados
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Verificar permissões
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getAll();
      
      if (response.success) {
        setUsers(response.data);
      } else {
        setError('Erro ao carregar usuários');
      }
    } catch (error) {
      setError(error.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários baseado na busca
  const filteredUsers = users.filter(user =>
    user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Desativar usuário
  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await userService.deactivate(selectedUser.id);
      
      if (response.success) {
        await loadUsers(); // Recarregar lista
        setShowDeleteDialog(false);
        setSelectedUser(null);
      } else {
        setError('Erro ao desativar usuário');
      }
    } catch (error) {
      setError(error.message || 'Erro ao carregar usuários');
    } finally {
      setActionLoading(false);
    }
  };

  // Reativar usuário
  const handleReactivateUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await userService.reactivate(selectedUser.id);
      
      if (response.success) {
        await loadUsers(); // Recarregar lista
        setShowReactivateDialog(false);
        setSelectedUser(null);
      } else {
        setError('Erro ao reativar usuário');
      }
    } catch (error) {
      setError(error.message || 'Erro ao carregar usuários');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir dialog de confirmação
  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openReactivateDialog = (user) => {
    setSelectedUser(user);
    setShowReactivateDialog(true);
  };

  // Navegar para edição
  const handleEditUser = (user) => {
    navigate(`/usuarios/${user.id}/editar`);
  };

  // Navegar para visualização
  const handleViewUser = (user) => {
    navigate(`/usuarios/${user.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Usuários do Sistema
              </h1>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/usuarios/convidar')}>
                <Plus className="h-4 w-4 mr-2" />
                Convidar Usuário
              </Button>
              <Button onClick={() => navigate('/usuarios/novo')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Lista de Usuários
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredUsers.length} usuário(s) encontrado(s)
                  </p>
                </div>

                {/* Busca */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.nome_completo}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.perfil === 'admin' ? 'default' : 'secondary'}
                            >
                              {user.perfil}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.ativo ? 'success' : 'destructive'}
                              className={user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {user.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewUser(user)}
                                title="Visualizar cadastro completo do usuário"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              {user.ativo ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(user)}
                                  disabled={user.id === currentUser?.id}
                                  title={user.id === currentUser?.id ? "Não é possível desativar sua própria conta" : "Desativar"}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openReactivateDialog(user)}
                                  title="Reativar"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog de Confirmação - Desativar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar o usuário <strong>{selectedUser?.nome_completo}</strong>?
              <br />
              O usuário não poderá mais fazer login no sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeactivateUser}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                'Desativar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação - Reativar */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja reativar o usuário <strong>{selectedUser?.nome_completo}</strong>?
              <br />
              O usuário poderá fazer login no sistema novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReactivateDialog(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleReactivateUser}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reativando...
                </>
              ) : (
                'Reativar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserListPage;

