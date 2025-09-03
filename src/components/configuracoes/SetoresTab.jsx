import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import { setorService } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const SetoresTab = () => {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState(null);
  const [formData, setFormData] = useState({ nome: '', ativo: true });
  const { toast } = useToast();

  useEffect(() => {
    loadSetores();
  }, []);

  const loadSetores = async () => {
    try {
      setLoading(true);
      const response = await setorService.getAll(true); // Incluir inativos
      setSetores(response.data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar setores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSetor) {
        await setorService.update(editingSetor.id, formData);
        toast({
          title: "Sucesso",
          description: "Setor atualizado com sucesso",
        });
      } else {
        await setorService.create(formData);
        toast({
          title: "Sucesso",
          description: "Setor criado com sucesso",
        });
      }
      
      setDialogOpen(false);
      setEditingSetor(null);
      setFormData({ nome: '', ativo: true });
      loadSetores();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar setor",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (setor) => {
    setEditingSetor(setor);
    setFormData({ nome: setor.nome, ativo: setor.ativo });
    setDialogOpen(true);
  };

  const handleDeactivate = async (setor) => {
    if (!confirm(`Tem certeza que deseja desativar o setor "${setor.nome}"?`)) {
      return;
    }

    try {
      await setorService.deactivate(setor.id);
      toast({
        title: "Sucesso",
        description: "Setor desativado com sucesso",
      });
      loadSetores();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar setor",
        variant: "destructive",
      });
    }
  };

  const handleReactivate = async (setor) => {
    try {
      await setorService.reactivate(setor.id);
      toast({
        title: "Sucesso",
        description: "Setor reativado com sucesso",
      });
      loadSetores();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reativar setor",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingSetor(null);
    setFormData({ nome: '', ativo: true });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4">Carregando setores...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Setores</h3>
          <p className="text-sm text-gray-500">
            Gerencie os setores do estabelecimento (Bar, Cozinha, etc.)
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSetor ? 'Editar Setor' : 'Novo Setor'}
              </DialogTitle>
              <DialogDescription>
                {editingSetor 
                  ? 'Edite as informações do setor' 
                  : 'Adicione um novo setor ao sistema'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Setor</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bar, Cozinha, Estoque"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSetor ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {setores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    Nenhum setor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                setores.map((setor) => (
                  <TableRow key={setor.id}>
                    <TableCell className="font-medium">{setor.nome}</TableCell>
                    <TableCell>
                      <Badge variant={setor.ativo ? "default" : "secondary"}>
                        {setor.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(setor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {setor.ativo ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(setor)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivate(setor)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetoresTab;

