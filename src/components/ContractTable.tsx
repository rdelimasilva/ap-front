import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Contract, Client } from '../types';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, FileText, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface ContractTableProps {
  contracts: Contract[];
  onContractClick: (contract: Contract) => void;
  productType?: string;
  clients?: Client[];
  showApprovalButton?: boolean;
  onApproveContracts?: (contractIds: string[]) => void;
  simpleFilter?: boolean;
}

type SortField = keyof Contract | 'none';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  clientId: string;
}

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onContractClick,
  _productType = 'guarantee',
  clients = [],
  showApprovalButton = false,
  onApproveContracts,
  simpleFilter = false
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    clientId: '',
  });
  const [showClosed, setShowClosed] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState<boolean>(false);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Contract['status']) => {
    switch (status) {
      case 'pending_approval': return 'Pendente de Aprovação';
      case 'active': return 'Ativo';
      case 'closed': return 'Encerrado';
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

  const clearFilters = () => {
    setFilters({
      status: '',
      clientId: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || clientSearchTerm !== '';

  const filteredClientOptions = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredAndSortedContracts = useMemo(() => {
    const filtered = contracts.filter(contract => {
      if (simpleFilter) {
        if (!showClosed && contract.status === 'closed') return false;
        return true;
      }

      if (filters.status && contract.status !== filters.status) {
        return false;
      }

      if (clientSearchTerm) {
        const client = clients.find(c => c.id === contract.clientId);
        if (!client || !client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Sort
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        const aValue = a[sortField] as unknown;
        const bValue = b[sortField] as unknown;

        if (aValue instanceof Date && bValue instanceof Date) {
          const cmp = aValue.getTime() - bValue.getTime();
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const cmp = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
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
  }, [contracts, filters, sortField, sortDirection, clientSearchTerm, clients, simpleFilter, showClosed]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const getClientDocument = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.document || '';
  };

  const handleSelectContract = (contractId: string) => {
    setSelectedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedContracts.size === filteredAndSortedContracts.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(filteredAndSortedContracts.map(c => c.id)));
    }
  };

  const handleApproveContracts = () => {
    if (onApproveContracts) {
      onApproveContracts(Array.from(selectedContracts));
    }
    setShowApprovalModal(false);
    setSelectedContracts(new Set());
  };

  const closedCount = contracts.filter(c => c.status === 'closed').length;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      {simpleFilter ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowClosed(!showClosed)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                showClosed
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {showClosed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showClosed ? 'Ocultar encerrados' : `Mostrar encerrados (${closedCount})`}
            </button>
            <span className="text-sm text-gray-500">
              {filteredAndSortedContracts.length} contratos
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <div className="relative w-full sm:w-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    ref={clientInputRef}
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-64"
                  />
                  {clientSearchTerm && (
                    <button
                      onClick={() => {
                        setClientSearchTerm('');
                        setShowClientDropdown(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showClientDropdown && filteredClientOptions.length > 0 && (
                  <div
                    ref={clientDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredClientOptions.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setClientSearchTerm(client.name);
                          setShowClientDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm transition-colors"
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos os Status</option>
                <option value="pending_approval">Pendente de Aprovação</option>
                <option value="active">Ativo</option>
                <option value="closed">Encerrado</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    clearFilters();
                    setClientSearchTerm('');
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {showApprovalButton && (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={selectedContracts.size === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      selectedContracts.size > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {selectedContracts.size > 0
                        ? `Aprovar Contratos (${selectedContracts.size})`
                        : 'Selecione contratos para aprovar'}
                    </span>
                  </button>
                )}
              <div className="text-sm text-gray-600">
                {filteredAndSortedContracts.length} de {contracts.length} contratos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContracts.size === filteredAndSortedContracts.length && filteredAndSortedContracts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('contractNumber')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Contrato</span>
                    {getSortIcon('contractNumber')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('clientId')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Cliente</span>
                    {getSortIcon('clientId')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Data Criação</span>
                    {getSortIcon('createdAt')}
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
                    onClick={() => handleSort('requestedValue')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Valor Solicitado</span>
                    {getSortIcon('requestedValue')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('encumberedValue')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Valor Onerado</span>
                    {getSortIcon('encumberedValue')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('endDate')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Dt. Vencimento</span>
                    {getSortIcon('endDate')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('actualSettlementValue')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Valor Liquidado</span>
                    {getSortIcon('actualSettlementValue')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedContracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedContracts.has(contract.id)}
                      onChange={() => handleSelectContract(contract.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onContractClick(contract)}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contract.contractNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={() => onContractClick(contract)}>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{getClientName(contract.clientId)}</div>
                      <div className="text-sm text-gray-500">{getClientDocument(contract.clientId)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={() => onContractClick(contract)}>
                    <div>
                      <div>{formatDate(contract.createdAt)}</div>
                      {contract.closedAt && (
                        <div className="text-xs text-gray-500">
                          Encerrado: {formatDate(contract.closedAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onContractClick(contract)}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                      {getStatusLabel(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={() => onContractClick(contract)}>
                    {formatCurrency(contract.requestedValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onContractClick(contract)}>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(contract.encumberedValue)}
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        ({formatPercent(contract.encumberedValue, contract.requestedValue)}%)
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={() => onContractClick(contract)}>
                    {contract.endDate ? formatDate(contract.endDate) : 'â€”'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onContractClick(contract)}>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(contract.actualSettlementValue)}
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        ({formatPercent(contract.actualSettlementValue, contract.requestedValue)}%)
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">Nenhum contrato encontrado</div>
            <div className="text-sm text-gray-400">
              Tente ajustar os filtros ou termos de busca
            </div>
          </div>
        )}

        {/* Summary Footer */}
        {filteredAndSortedContracts.length > 0 && (
          <div className="bg-blue-50 border-t-2 border-blue-200 px-6 py-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Total Solicitado:</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(
                    filteredAndSortedContracts.reduce((sum, contract) => sum + contract.requestedValue, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Total Onerado:</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(
                    filteredAndSortedContracts.reduce((sum, contract) => sum + contract.encumberedValue, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Total Liquidado:</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(
                    filteredAndSortedContracts.reduce((sum, contract) => sum + contract.actualSettlementValue, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Taxa de Sucesso:</span>
                <span className="font-bold text-blue-900">
                  {formatPercent(
                    filteredAndSortedContracts.reduce((sum, contract) => sum + contract.encumberedValue, 0),
                    filteredAndSortedContracts.reduce((sum, contract) => sum + contract.requestedValue, 0)
                  )}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Aprovar Contratos</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Aprovação de Contratos
                </h4>
                <p className="text-gray-600 mb-4">
                  Você está prestes a aprovar {selectedContracts.size} contrato(s). Esta ação irá ativar os contratos selecionados.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-blue-900 mb-3">Contratos Selecionados:</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Array.from(selectedContracts).map(contractId => {
                    const contract = contracts.find(c => c.id === contractId);
                    if (!contract) return null;
                    return (
                      <div key={contractId} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{contract.contractNumber}</div>
                            <div className="text-xs text-gray-600">{getClientName(contract.clientId)}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(contract.requestedValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-orange-900 mb-1">Atenção</h5>
                    <p className="text-sm text-orange-800">
                      Após a Aprovação, os contratos serão ativados e as garantias correspondentes serão efetivadas. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApproveContracts}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
