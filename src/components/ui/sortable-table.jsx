import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X } from 'lucide-react';

const SortableTable = ({ 
  data = [], 
  columns = [], 
  searchable = true,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado",
  className = ""
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [showColumnFilters, setShowColumnFilters] = useState({});

  // Função para obter valores únicos de uma coluna
  const getUniqueValues = (columnKey) => {
    const values = data.map(item => item[columnKey]).filter(value => value !== null && value !== undefined);
    return [...new Set(values)].sort();
  };

  // Função para ordenar dados
  const sortedData = useMemo(() => {
    let sortableData = [...data];
    
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Tratamento para diferentes tipos de dados
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        // Números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Strings (case insensitive)
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableData;
  }, [data, sortConfig]);

  // Função para filtrar dados (busca global + filtros por coluna)
  const filteredData = useMemo(() => {
    let filtered = sortedData;
    
    // Filtro global (busca)
    if (searchTerm) {
      filtered = filtered.filter(item => {
        return columns.some(column => {
          const value = item[column.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    
    // Filtros por coluna
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        filtered = filtered.filter(item => {
          const value = item[columnKey];
          if (filterValue === 'true') return value === true;
          if (filterValue === 'false') return value === false;
          return String(value) === String(filterValue);
        });
      }
    });
    
    return filtered;
  }, [sortedData, searchTerm, columnFilters, columns]);

  // Função para lidar com ordenação
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar ícone de ordenação
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  // Função para toggle do filtro de coluna
  const toggleColumnFilter = (columnKey) => {
    setShowColumnFilters(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Função para limpar filtro de coluna
  const clearColumnFilter = (columnKey) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnKey];
      return newFilters;
    });
    setShowColumnFilters(prev => ({
      ...prev,
      [columnKey]: false
    }));
  };

  // Função para renderizar filtro de coluna
  const renderColumnFilter = (column) => {
    if (!column.filterable) return null;
    
    const uniqueValues = getUniqueValues(column.key);
    const hasFilter = columnFilters[column.key];
    
    return (
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleColumnFilter(column.key)}
          className={`h-6 w-6 p-0 ${hasFilter ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Filter className="h-3 w-3" />
        </Button>
        
        {showColumnFilters[column.key] && (
          <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg p-2 min-w-[150px]">
            <Select
              value={columnFilters[column.key] || 'all'}
              onValueChange={(value) => setColumnFilters(prev => ({
                ...prev,
                [column.key]: value === 'all' ? undefined : value
              }))}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Filtrar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {column.key === 'ativo' ? (
                  <>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </>
                ) : (
                  uniqueValues.map(value => (
                    <SelectItem key={value} value={String(value)}>
                      {String(value)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearColumnFilter(column.key)}
                className="h-6 w-6 p-0 mt-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de busca global */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className="relative"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className={`flex items-center space-x-2 ${
                        column.sortable !== false ? "cursor-pointer select-none hover:bg-gray-50 p-1 rounded" : ""
                      }`}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      {column.sortable !== false && getSortIcon(column.key)}
                    </div>
                    
                    {/* Filtro por coluna */}
                    {column.filterable && renderColumnFilter(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className || ""}>
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SortableTable;

