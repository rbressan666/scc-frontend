import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import {
  Plus,
  Search,
  Edit,
  Save,
  X,
  Package,
  Loader2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { unidadeMedidaService } from '../../services/api';

const UnidadesTab = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    quantidade: 1
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      const response = await unidadeMedidaService.getAll();
      setUnidades(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const unidadeData = {
        nome: formData.nome,
        sigla: formData.sigla,
        quantidade: parseFloat(formData.quantidade) || 1
      };

      if (editingUnidade) {
        await unidadeMedidaService.update(editingUnidade.id, unidadeData);
      } else {
        await unidadeMedidaService.create(unidadeData);
      }

      // Recarregar dados
      await loadUnidades();
      
      // Resetar formulário
      resetForm();
      setShowForm(false);
      setEditingUnidade(null);
      
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      alert('Erro ao salvar unidade: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (unidade) => {
    setEditingUnidade(unidade);
    setFormData({
      nome: unidade.nome,
      sigla: unidade.sigla,
      quantidade: unidade.quantidade || 1
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (unidade) => {
    try {
      if (unidade.ativo) {
        await unidadeMedidaService.deactivate(unidade.id);
      } else {
        await unidadeMedidaService.activate(unidade.id);
      }
      
      // Recarregar dados
      await loadUnidades();
    } catch (error) {
      console.error('Erro ao alterar status da unidade:', error);
      alert('Erro ao alterar status da unidade: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      sigla: '',
      quantidade: 1
    });
  };

  const filteredUnidades = unidades.filter(unidade =>
    unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando unidades...</p>
        </div>
      </div>
    );
  }

  // Tela de loading durante salvamento
  if (saving) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Salvando unidade...</p>
          <p className="text-gray-500 text-sm">Por favor, aguarde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Unidades de Medida</span>
              </CardTitle>
              <CardDescription>
                Gerencie as unidades de medida utilizadas nos produtos
              </CardDescription>
            </div>
            
            {!showForm && (
              <Button
                onClick={() => {
                  resetForm();
                  setEditingUnidade(null);
                  setShowForm(true);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Unidade</span>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {showForm ? (
            /* Formulário de Unidade */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {editingUnidade ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUnidade(null);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Unidade *
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Quilograma"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nome completo da unidade de medida
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sigla *
                    </label>
                    <Input
                      value={formData.sigla}
                      onChange={(e) => setFormData(prev => ({ ...prev, sigla: e.target.value.toUpperCase() }))}
                      placeholder="Ex: KG"
                      required
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Abreviação da unidade (máx. 10 caracteres)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade *
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.quantidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 1 }))}
                      placeholder="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantidade que esta unidade representa (padrão: 1)
                    </p>
                  </div>
                </div>

                {/* Exemplos de uso */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Exemplos de Quantidade:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Unidade simples:</strong> Litro = 1 (representa 1 litro)</p>
                    <p><strong>Múltiplos:</strong> Caixa = 24 (representa 24 unidades)</p>
                    <p><strong>Frações:</strong> Mililitro = 0.001 (representa 0,001 litro)</p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUnidade(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingUnidade ? 'Atualizar' : 'Salvar'} Unidade
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* Lista de Unidades */
            <div className="space-y-4">
              {/* Filtro de Busca */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar unidades..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tabela de Unidades */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sigla</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnidades.map((unidade) => (
                      <TableRow key={unidade.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {unidade.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {unidade.sigla}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {Number(unidade.quantidade || 1).toLocaleString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={unidade.ativo ? 'default' : 'secondary'}>
                            {unidade.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(unidade)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(unidade)}
                              className={unidade.ativo ? 'text-orange-600 border-orange-600 hover:bg-orange-50' : 'text-green-600 border-green-600 hover:bg-green-50'}
                              title={unidade.ativo ? 'Desativar unidade' : 'Ativar unidade'}
                            >
                              {unidade.ativo ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUnidades.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma unidade encontrada</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnidadesTab;
