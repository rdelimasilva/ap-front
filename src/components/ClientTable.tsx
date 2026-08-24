import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X, Users } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
  showScheduleRequest?: boolean;
  onScheduleRequest?: (client: Client) => void;
  onRadarClick?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
}

type SortField = keyof Client | 'none';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onClientClick,
  showScheduleRequest = false,
  onScheduleRequest,
  onRadarClick,
  onEditClient
}) => {
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number, total: number) => {
    if (!total || total <= 0) return '0,0';
    return ((value / total) * 100).toFixed(1).replace('.', ',');
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Client['status']) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'pending': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const clearSearch = () => {
    setFilters({ search: '' });
  };

  const filteredAndSortedClients = useMemo(() => {
    const filtered = clients.filter(client => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const documentClean = client.document.replace(/\D/g, '');
        const searchClean = filters.search.replace(/\D/g, '');
        const matchesName = client.name.toLowerCase().includes(searchLower);
        const matchesDocument = client.document.toLowerCase().includes(searchLower) ||
          (searchClean && documentClean.includes(searchClean));
        if (!matchesName && !matchesDocument) return false;
      }
      return true;
    });

    // Sort
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        const aValue = a[sortField] as unknown;
        const bValue = b[sortField] as unknown;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const aStr = aValue.toLowerCase();
          const bStr = bValue.toLowerCase();
          const cmp = aStr.localeCompare(bStr);
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const cmp = aValue - bValue;
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        return 0;
      });
    }

    return filtered;
  }, [clients, filters, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Nome ou Documento</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Digite o nome ou CNPJ do cliente..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {filters.search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 pb-2.5 whitespace-nowrap">
            {filteredAndSortedClients.length} de {clients.length} clientes
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Cliente</span>
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('document')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Documento</span>
                    {getSortIcon('document')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('totalLimit')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Limite Total</span>
                    {getSortIcon('totalLimit')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('usedLimit')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Utilizado</span>
                    {getSortIcon('usedLimit')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('collateralValue')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Garantia</span>
                    {getSortIcon('collateralValue')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => onClientClick(client)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {client.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.document}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                      {getStatusLabel(client.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.totalLimit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(client.usedLimit)}
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        ({formatPercent(client.usedLimit, client.totalLimit)}%)
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.collateralValue)}
                  </td>
                </tr>
              ))}
              {showScheduleRequest && (
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td colSpan={6} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Total em garantia</span>
                      <span className="text-sm font-bold text-blue-900">
                        {formatCurrency(
                          filteredAndSortedClients.reduce((sum, client) => sum + client.availableLimit, 0)
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">Nenhum cliente encontrado</div>
            <div className="text-sm text-gray-400">
              Tente ajustar os filtros ou termos de busca
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
