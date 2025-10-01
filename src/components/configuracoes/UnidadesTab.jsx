import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, ToggleLeft, ToggleRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { unidadeMedidaService } from '../../services/api';

const UnidadesTab = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });
  
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    quantidade: 1
  });

  useEffect(() => {
    carregarUnidades();
  }, []);

  const carregarUnidades = async () => {
    try {
      setLoading(true);
      // Sempre incluir inativos (true)
      const response = await unidadeMedidaService.getAll(true);
      setUnidades(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      alert('Erro ao carregar unidades de medida');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar unidades
  const unidadesFiltradas = useMemo(() => {
    let filtered = unidades.filter(unidade => {
      // Filtro de busca
      const matchesSearch = unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           unidade.sigla.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de status
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && unidade.ativo) ||
                           (statusFilter === 'inactive' && !unidade.ativo);
      
      return matchesSearch && matchesStatus;
    });

    // Ordenação
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Tratamento especial para diferentes tipos
        if (sortConfig.key === 'quantidade') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        } else if (sortConfig.key === 'ativo') {
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [unidades, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingUnidade) {
        await unidadeMedidaService.update(editingUnidade.id, formData);
        alert('Unidade de medida atualizada com sucesso!');
      } else {
        await unidadeMedidaService.create(formData);
        alert('Unidade de medida criada com sucesso!');
      }
      
      setShowForm(false);
      setEditingUnidade(null);
      setFormData({ nome: '', sigla: '', quantidade: 1 });
      await carregarUnidades();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      alert('Erro ao salvar unidade de medida');
    } finally {
      setLoading(false);
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
      setLoading(true);
      
      if (unidade.ativo) {
        await unidadeMedidaService.deactivate(unidade.id);
        alert('Unidade de medida desativada com sucesso!');
      } else {
        await unidadeMedidaService.reactivate(unidade.id);
        alert('Unidade de medida reativada com sucesso!');
      }
      
      await carregarUnidades();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da unidade de medida');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUnidade(null);
    setFormData({ nome: '', sigla: '', quantidade: 1 });
  };

  if (loading && unidades.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando unidades de medida...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Unidades de Medida</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Unidade
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>

          {/* Contador */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">{unidadesFiltradas.length}</span>
            <span className="ml-1">de {unidades.length} unidades</span>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nome')}
                >
                  <div className="flex items-center gap-2">
                    Nome
                    {getSortIcon('nome')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sigla')}
                >
                  <div className="flex items-center gap-2">
                    Sigla
                    {getSortIcon('sigla')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantidade')}
                >
                  <div className="flex items-center gap-2">
                    Quantidade
                    {getSortIcon('quantidade')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ativo')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('ativo')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unidadesFiltradas.map((unidade) => (
                <tr key={unidade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {unidade.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unidade.sigla}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unidade.quantidade || 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      unidade.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {unidade.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(unidade)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(unidade)}
                        className={`${unidade.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={unidade.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {unidade.ativo ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {unidadesFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma unidade encontrada com os filtros aplicados' 
                : 'Nenhuma unidade de medida cadastrada'
              }
            </div>
          </div>
        )}
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUnidade ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Ex: Quilograma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sigla *
                </label>
                <input
                  type="text"
                  value={formData.sigla}
                  onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Ex: KG"
                  maxLength="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantidade que esta unidade representa (ex: Caixa = 24, Litro = 1000ml)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingUnidade ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadesTab;
