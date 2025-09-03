import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import SortableTable from '../ui/sortable-table';
import { unidadeMedidaService } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const UnidadesTab = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [formData, setFormData] = useState({ nome: '', sigla: '', ativo: true });
  const { toast } = useToast();

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      const response = await unidadeMedidaService.getAll(true); // Incluir inativos
      setUnidades(response.data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar unidades de medida",
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
      
      if (editingUnidade) {
        await unidadeMedidaService.update(editingUnidade.id, formData);
        toast({
          title: "Sucesso",
          description: "Unidade de medida atualizada com sucesso",
        });
      } else {
        await unidadeMedidaService.create(formData);
        toast({
          title: "Sucesso",
          description: "Unidade de medida criada com sucesso",
        });
      }
      
      setDialogOpen(false);
      setEditingUnidade(null);
      setFormData({ nome: '', sigla: '', ativo: true });
      loadUnidades();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar unidade de medida",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (unidade) => {
    setEditingUnidade(unidade);
    setFormData({ nome: unidade.nome, sigla: unidade.sigla, ativo: unidade.ativo });
    setDialogOpen(true);
  };

  const handleDeactivate = async (unidade) => {
    if (!confirm(`Tem certeza que deseja desativar a unidade "${unidade.nome}"?`)) {
      return;
    }

    try {
      await unidadeMedidaService.deactivate(unidade.id);
      toast({
        title: "Sucesso",
        description: "Unidade de medida desativada com sucesso",
      });
      loadUnidades();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar unidade de medida",
        variant: "destructive",
      });
    }
  };

  const handleReactivate = async (unidade) => {
    try {
      await unidadeMedidaService.reactivate(unidade.id);
      toast({
        title: "Sucesso",
        description: "Unidade de medida reativada com sucesso",
      });
      loadUnidades();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reativar unidade de medida",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingUnidade(null);
    setFormData({ nome: '', sigla: '', ativo: true });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4">Carregando unidades de medida...</div>;
  }

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      filterable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'sigla',
      label: 'Sigla',
      filterable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'ativo',
      label: 'Status',
      filterable: true,
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
      filterable: false,
      className: 'text-right',
      render: (_, unidade) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(unidade)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {unidade.ativo ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeactivate(unidade)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReactivate(unidade)}
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
          <h3 className="text-lg font-medium">Unidades de Medida</h3>
          <p className="text-sm text-gray-500">
            Gerencie as unidades de medida utilizadas no sistema (UN, CX, L, KG, etc.)
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUnidade ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
              </DialogTitle>
              <DialogDescription>
                {editingUnidade 
                  ? 'Edite as informações da unidade de medida' 
                  : 'Adicione uma nova unidade de medida ao sistema'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Unidade</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Unidade, Caixa com 12, Litro"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sigla">Sigla</Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                    placeholder="Ex: UN, CX-12, L"
                    required
                    maxLength={10}
                  />
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
                    editingUnidade ? 'Atualizar' : 'Criar'
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
            data={unidades}
            columns={columns}
            searchPlaceholder="Buscar unidades de medida..."
            emptyMessage="Nenhuma unidade de medida encontrada"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UnidadesTab;

