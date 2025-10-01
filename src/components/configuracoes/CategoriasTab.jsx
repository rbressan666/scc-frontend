import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import SortableTable from '../ui/sortable-table';
import { categoriaService } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const CategoriasTab = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [formData, setFormData] = useState({ nome: '', id_categoria_pai: 'none' });
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
        id_categoria_pai: formData.id_categoria_pai === 'none' ? null : formData.id_categoria_pai
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
      resetForm();
      await loadCategorias();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
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
      id_categoria_pai: categoria.id_categoria_pai || 'none'
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (categoria) => {
    try {
      if (categoria.ativo) {
        await categoriaService.deactivate(categoria.id);
      } else {
        await categoriaService.reactivate(categoria.id);
      }
      
      await loadCategorias();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status da categoria",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingCategoria(null);
    setFormData({ nome: '', id_categoria_pai: 'none' });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getCategoriaPaiNome = (categoria) => {
    if (!categoria.id_categoria_pai) return '-';
    const pai = categorias.find(c => c.id === categoria.id_categoria_pai);
    return pai ? pai.nome : 'Categoria não encontrada';
  };

  const getCategoriasDisponiveis = () => {
    return categorias.filter(c => 
      c.ativo && 
      (!editingCategoria || c.id !== editingCategoria.id)
    );
  };

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      filterable: true,
      render: (categoria) => (
        <div className="font-medium text-gray-900">{categoria.nome}</div>
      )
    },
    {
      key: 'categoria_pai',
      label: 'Categoria Pai',
      sortable: true,
      filterable: true,
      render: (categoria) => (
        <div className="text-gray-600">{getCategoriaPaiNome(categoria)}</div>
      )
    },
    {
      key: 'ativo',
      label: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'all', label: 'Todos' },
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' }
      ],
      render: (categoria) => (
        <Badge variant={categoria.ativo ? "success" : "secondary"}>
          {categoria.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (categoria) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(categoria)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(categoria)}
            className={categoria.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
          >
            {categoria.ativo ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Categorias</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
              <DialogDescription>
                {editingCategoria 
                  ? 'Edite as informações da categoria abaixo.'
                  : 'Preencha as informações para criar uma nova categoria.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Cigarros"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria_pai">Categoria Pai</Label>
                  <Select
                    value={formData.id_categoria_pai}
                    onValueChange={(value) => setFormData({ ...formData, id_categoria_pai: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (categoria raiz)</SelectItem>
                      {getCategoriasDisponiveis().map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingCategoria ? 'Atualizar' : 'Criar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
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
