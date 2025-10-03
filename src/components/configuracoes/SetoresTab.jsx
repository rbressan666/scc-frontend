import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import SortableTable from '../ui/sortable-table';
import { setorService } from '../../services/api';
import { useToast } from '@/hooks/use-toast';

const SetoresTab = () => {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState(null);
  const [formData, setFormData] = useState({ nome: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadSetores();
  }, []);

  const loadSetores = async () => {
    try {
      setLoading(true);
      const response = await setorService.getAll(true); // Incluir inativos
      
      // Extrair dados da resposta
      const setoresData = response?.data || [];
      
      // Validar e limpar dados
      const setoresValidados = setoresData
        .filter(setor => setor && typeof setor === 'object' && setor.id)
        .map(setor => ({
          id: setor.id,
          nome: setor.nome || 'Nome não informado',
          ativo: setor.ativo === true || setor.ativo === 'true' || setor.ativo === 1
        }));
      
      setSetores(setoresValidados);
      
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores",
        variant: "destructive",
      });
      setSetores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
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
      resetForm();
      await loadSetores();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar setor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (setor) => {
    if (!setor || !setor.id) return;
    
    setEditingSetor(setor);
    setFormData({
      nome: setor.nome || ''
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (setor) => {
    if (!setor || !setor.id) return;
    
    try {
      if (setor.ativo) {
        await setorService.deactivate(setor.id);
      } else {
        await setorService.reactivate(setor.id);
      }
      
      await loadSetores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do setor",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingSetor(null);
    setFormData({ nome: '' });
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
      render: (value, setor) => (
        <div className="font-medium text-gray-900">
          {setor?.nome || value || 'Nome não disponível'}
        </div>
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
      render: (value, setor) => {
        const isAtivo = setor?.ativo === true || value === true;
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
      render: (value, setor) => {
        if (!setor || !setor.id) {
          return <div className="text-gray-400">-</div>;
        }
        
        const isAtivo = setor.ativo === true;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(setor)}
              className="text-blue-600 hover:text-blue-900"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(setor)}
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
        <div className="text-gray-500">Carregando setores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Setores</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingSetor ? 'Editar Setor' : 'Novo Setor'}
              </DialogTitle>
              <DialogDescription>
                {editingSetor 
                  ? 'Edite as informações do setor abaixo.'
                  : 'Preencha as informações para criar um novo setor.'
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
                    placeholder="Ex: Bebidas"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingSetor ? 'Atualizar' : 'Criar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <SortableTable
            data={setores}
            columns={columns}
            searchPlaceholder="Buscar setores..."
            emptyMessage="Nenhum setor encontrado"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SetoresTab;
