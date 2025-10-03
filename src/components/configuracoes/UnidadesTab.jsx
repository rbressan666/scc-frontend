import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import SortableTable from '../ui/sortable-table';
import { unidadeMedidaService } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const UnidadesTab = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [formData, setFormData] = useState({ nome: '', sigla: '', quantidade: 1 });
  const { toast } = useToast();

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      const response = await unidadeMedidaService.getAll(true); // Incluir inativos
      
      // Extrair dados da resposta
      const unidadesData = response?.data || [];
      
      // Validar e limpar dados
      const unidadesValidadas = unidadesData
        .filter(unidade => unidade && typeof unidade === 'object' && unidade.id)
        .map(unidade => ({
          id: unidade.id,
          nome: unidade.nome || 'Nome não informado',
          sigla: unidade.sigla || 'N/A',
          quantidade: unidade.quantidade || 1,
          ativo: unidade.ativo === true || unidade.ativo === 'true' || unidade.ativo === 1
        }));
      
      setUnidades(unidadesValidadas);
      
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar unidades de medida",
        variant: "destructive",
      });
      setUnidades([]);
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
      resetForm();
      await loadUnidades();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar unidade de medida",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (unidade) => {
    if (!unidade || !unidade.id) return;
    
    setEditingUnidade(unidade);
    setFormData({
      nome: unidade.nome || '',
      sigla: unidade.sigla || '',
      quantidade: unidade.quantidade || 1
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (unidade) => {
    if (!unidade || !unidade.id) return;
    
    try {
      if (unidade.ativo) {
        await unidadeMedidaService.deactivate(unidade.id);
      } else {
        await unidadeMedidaService.reactivate(unidade.id);
      }
      
      await loadUnidades();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da unidade de medida",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingUnidade(null);
    setFormData({ nome: '', sigla: '', quantidade: 1 });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      filterable: true,
      render: (value, unidade) => (
        <div className="font-medium text-gray-900">
          {unidade?.nome || value || 'Nome não disponível'}
        </div>
      )
    },
    {
      key: 'sigla',
      label: 'Sigla',
      sortable: true,
      filterable: true,
      render: (value, unidade) => (
        <div className="text-gray-600">{unidade?.sigla || value || '-'}</div>
      )
    },
    {
      key: 'quantidade',
      label: 'Quantidade',
      sortable: true,
      filterable: true,
      render: (value, unidade) => (
        <div className="text-gray-600">{unidade?.quantidade || value || 1}</div>
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
      render: (value, unidade) => {
        const isAtivo = unidade?.ativo === true || value === true;
        return (
          <Badge variant={isAtivo ? "success" : "secondary"}>
            {isAtivo ? 'Ativo' : 'Inativo'}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      sortable: false,
      filterable: false,
      render: (value, unidade) => {
        if (!unidade || !unidade.id) {
          return <div className="text-gray-400">-</div>;
        }
        
        const isAtivo = unidade.ativo === true;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(unidade)}
              className="text-blue-600 hover:text-blue-900"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(unidade)}
              className={isAtivo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
              title={isAtivo ? 'Desativar' : 'Ativar'}
            >
              {isAtivo ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando unidades de medida...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Unidades de Medida</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
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
                  ? 'Edite as informações da unidade de medida abaixo.'
                  : 'Preencha as informações para criar uma nova unidade de medida.'
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
                    placeholder="Ex: Quilograma"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sigla">Sigla *</Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                    placeholder="Ex: KG"
                    maxLength="10"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 1 })}
                    placeholder="1"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Quantidade que esta unidade representa (ex: Caixa = 24, Litro = 1000ml)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingUnidade ? 'Atualizar' : 'Criar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
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
