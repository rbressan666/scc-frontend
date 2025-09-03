import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import SortableTable from '../ui/sortable-table';
import { categoriaService } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const CategoriasTab = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [formData, setFormData] = useState({ nome: '', id_categoria_pai: '', ativo: true });
  const { toast } = useToast();

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const response = await categoriaService.getAll(true); // Incluir inativos
      setCategorias(response.data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const dataToSend = {
        ...formData,
        id_categoria_pai: formData.id_categoria_pai || null
      };

      if (editingCategoria) {
        await categoriaService.update(editingCategoria.id, dataToSend);
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        });
      } else {
        await categoriaService.create(dataToSend);
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        });
      }
      
      setDialogOpen(false);
      setEditingCategoria(null);
      setFormData({ nome: '', id_categoria_pai: '', ativo: true });
      loadCategorias();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setFormData({ 
      nome: categoria.nome, 
      id_categoria_pai: categoria.id_categoria_pai || '',
      ativo: categoria.ativo 
    });
    setDialogOpen(true);
  };

  const handleDeactivate = async (categoria) => {
    if (!confirm(`Tem certeza que deseja desativar a categoria "${categoria.nome}"?`)) {
      return;
    }

    try {
      await categoriaService.deactivate(categoria.id);
      toast({
        title: "Sucesso",
        description: "Categoria desativada com sucesso",
      });
      loadCategorias();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar categoria",
        variant: "destructive",
      });
    }
  };

  const handleReactivate = async (categoria) => {
    try {
      await categoriaService.reactivate(categoria.id);
      toast({
        title: "Sucesso",
        description: "Categoria reativada com sucesso",
      });
      loadCategorias();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reativar categoria",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingCategoria(null);
    setFormData({ nome: '', id_categoria_pai: '', ativo: true });
    setDialogOpen(true);
  };

  // Filtrar categorias ativas para o select de categoria pai
  const categoriasAtivas = categorias.filter(cat => cat.ativo && cat.id !== editingCategoria?.id);

  if (loading) {
    return <div className="text-center py-4">Carregando categorias...</div>;
  }

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'categoria_pai_nome',
      label: 'Categoria Pai',
      render: (value) => value || '-'
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      sortable: false,
      className: 'text-right',
      render: (_, categoria) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(categoria)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {categoria.ativo ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeactivate(categoria)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReactivate(categoria)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Categorias</h3>
          <p className="text-sm text-gray-500">
            Gerencie as categorias e subcategorias de produtos
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] cursor-move">
            <div className="cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategoria 
                    ? 'Edite as informações da categoria' 
                    : 'Adicione uma nova categoria ao sistema'
                  }
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bebidas, Cervejas, Destilados"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="categoria_pai">Categoria Pai (Opcional)</Label>
                  <Select 
                    value={formData.id_categoria_pai} 
                    onValueChange={(value) => setFormData({ ...formData, id_categoria_pai: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria pai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (Categoria raiz)</SelectItem>
                      {categoriasAtivas.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    editingCategoria ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <SortableTable
            data={categorias}
            columns={columns}
            searchPlaceholder="Buscar categorias..."
            emptyMessage="Nenhuma categoria encontrada"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriasTab;

