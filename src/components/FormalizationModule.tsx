import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { NewFormalizationModal } from './NewFormalizationModal';
import { FormalizationDetail } from './FormalizationDetail';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileCheck,
  FileText,
  Target,
  X
} from 'lucide-react';

interface FormalizationModuleProps {
  clients: Client[];
}

interface ClientFormalizationStatus {
  clientId: string;
  clientName: string;
  document: string;
  optInStatus: 'pending' | 'approved' | 'rejected' | 'not_requested';
  optInRequestDate?: Date;
  optInApprovalDate?: Date;
  contractStatus: 'pending' | 'formalized' | 'rejected' | 'not_started';
  contractFormalizationDate?: Date;
  targetValue: number;
  currentValue: number;
  businessFlow: 'onboarding' | 'credit_analysis' | 'contract_negotiation' | 'active' | 'suspended';
  lastUpdate: Date;
}

const mockFormalizationData: ClientFormalizationStatus[] = [
  {
    clientId: '1',
    clientName: 'ABC Comércio S.A.',
    document: '12.345.678/0001-90',
    optInStatus: 'approved',
    optInRequestDate: new Date('2024-01-10'),
    optInApprovalDate: new Date('2024-01-12'),
    contractStatus: 'formalized',
    contractFormalizationDate: new Date('2024-01-15'),
    targetValue: 500000,
    currentValue: 450000,
    businessFlow: 'active',
    lastUpdate: new Date('2024-01-15')
  },
  {
    clientId: '2',
    clientName: 'Tech Solutions Brasil',
    document: '98.765.432/0001-10',
    optInStatus: 'approved',
    optInRequestDate: new Date('2024-01-12'),
    optInApprovalDate: new Date('2024-01-13'),
    contractStatus: 'pending',
    targetValue: 300000,
    currentValue: 0,
    businessFlow: 'contract_negotiation',
    lastUpdate: new Date('2024-01-14')
  },
  {
    clientId: '3',
    clientName: 'Varejo Prime Ltda.',
    document: '11.222.333/0001-44',
    optInStatus: 'pending',
    optInRequestDate: new Date('2024-01-14'),
    contractStatus: 'not_started',
    targetValue: 750000,
    currentValue: 0,
    businessFlow: 'onboarding',
    lastUpdate: new Date('2024-01-14')
  },
  {
    clientId: '4',
    clientName: 'Distribuidora XYZ',
    document: '55.666.777/0001-88',
    optInStatus: 'rejected',
    optInRequestDate: new Date('2024-01-08'),
    contractStatus: 'rejected',
    targetValue: 200000,
    currentValue: 0,
    businessFlow: 'suspended',
    lastUpdate: new Date('2024-01-09')
  },
  {
    clientId: '5',
    clientName: 'Indústria Beta S.A.',
    document: '22.333.444/0001-55',
    optInStatus: 'approved',
    optInRequestDate: new Date('2024-01-05'),
    optInApprovalDate: new Date('2024-01-07'),
    contractStatus: 'formalized',
    contractFormalizationDate: new Date('2024-01-10'),
    targetValue: 1000000,
    currentValue: 950000,
    businessFlow: 'active',
    lastUpdate: new Date('2024-01-10')
  },
  {
    clientId: '6',
    clientName: 'Serviços Delta Ltda.',
    document: '33.444.555/0001-66',
    optInStatus: 'not_requested',
    contractStatus: 'not_started',
    targetValue: 400000,
    currentValue: 0,
    businessFlow: 'credit_analysis',
    lastUpdate: new Date('2024-01-15')
  }
];

export const FormalizationModule: React.FC<FormalizationModuleProps> = ({ clients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientFormalizationStatus | null>(null);
  const [clientsData, setClientsData] = useState<ClientFormalizationStatus[]>(mockFormalizationData);
  const [filters, setFilters] = useState({
    optInStatus: '',
    contractStatus: '',
    businessFlow: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getOptInStatusInfo = (status: ClientFormalizationStatus['optInStatus']) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'rejected':
        return { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'not_requested':
        return { label: 'Não Solicitado', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  const getContractStatusInfo = (status: ClientFormalizationStatus['contractStatus']) => {
    switch (status) {
      case 'formalized':
        return { label: 'Formalizado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'rejected':
        return { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'not_started':
        return { label: 'Não Iniciado', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  const getBusinessFlowInfo = (flow: ClientFormalizationStatus['businessFlow']) => {
    switch (flow) {
      case 'onboarding':
        return { label: 'Onboarding', color: 'bg-blue-100 text-blue-800' };
      case 'credit_analysis':
        return { label: 'Análise de Crédito', color: 'bg-purple-100 text-purple-800' };
      case 'contract_negotiation':
        return { label: 'Negociação de Contrato', color: 'bg-orange-100 text-orange-800' };
      case 'active':
        return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
      case 'suspended':
        return { label: 'Suspenso', color: 'bg-red-100 text-red-800' };
    }
  };

  const updateClientData = (clientId: string, updates: Partial<ClientFormalizationStatus>) => {
    setClientsData(prevData =>
      prevData.map(client =>
        client.clientId === clientId
          ? { ...client, ...updates, lastUpdate: new Date() }
          : client
      )
    );

    if (selectedClient && selectedClient.clientId === clientId) {
      setSelectedClient(prev => prev ? { ...prev, ...updates, lastUpdate: new Date() } : null);
    }
  };

  const filteredData = useMemo(() => {
    return clientsData.filter(item => {
      const matchesSearch =
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.document.includes(searchTerm);

      const matchesOptIn = !filters.optInStatus || item.optInStatus === filters.optInStatus;
      const matchesContract = !filters.contractStatus || item.contractStatus === filters.contractStatus;
      const matchesFlow = !filters.businessFlow || item.businessFlow === filters.businessFlow;

      return matchesSearch && matchesOptIn && matchesContract && matchesFlow;
    });
  }, [searchTerm, filters, clientsData]);

  const clearFilters = () => {
    setFilters({
      optInStatus: '',
      contractStatus: '',
      businessFlow: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (selectedClient) {
    return (
      <FormalizationDetail
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onUpdateClient={updateClientData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80 h-8 text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center space-x-2 px-4 rounded-lg border transition-colors h-8 text-sm font-normal ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center space-x-2 px-3 text-gray-600 hover:text-gray-800 transition-colors h-8 text-sm font-normal"
              >
                <X className="w-4 h-4" />
                <span>Limpar</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filteredData.length} de {mockFormalizationData.length} clientes
            </span>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-teal-600 text-white px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center text-sm font-normal h-8"
            >
              Nova
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Opt-in</label>
              <select
                value={filters.optInStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, optInStatus: e.target.value }))}
                className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
              >
                <option value="">Todos</option>
                <option value="approved">Aprovado</option>
                <option value="pending">Pendente</option>
                <option value="rejected">Rejeitado</option>
                <option value="not_requested">Não Solicitado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Contrato</label>
              <select
                value={filters.contractStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, contractStatus: e.target.value }))}
                className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
              >
                <option value="">Todos</option>
                <option value="formalized">Formalizado</option>
                <option value="pending">Pendente</option>
                <option value="rejected">Rejeitado</option>
                <option value="not_started">Não Iniciado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fluxo de Negócio</label>
              <select
                value={filters.businessFlow}
                onChange={(e) => setFilters(prev => ({ ...prev, businessFlow: e.target.value }))}
                className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
              >
                <option value="">Todos</option>
                <option value="onboarding">Onboarding</option>
                <option value="credit_analysis">Análise de Crédito</option>
                <option value="contract_negotiation">Negociação de Contrato</option>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Client Status List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Status por Cliente</h3>
        </div>

        <div className="overflow-x-auto">
        {/* Table Header */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 min-w-[700px]">
          <div className="flex items-center justify-between">
            <div className="flex-1 grid grid-cols-6 gap-4">
              <div className="col-span-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
                Cliente
              </div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Status Opt-in
              </div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Status Contrato
              </div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Fluxo de Negócio
              </div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide text-right">
                Realização
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredData.map((client) => {
            const optInInfo = getOptInStatusInfo(client.optInStatus);
            const contractInfo = getContractStatusInfo(client.contractStatus);
            const flowInfo = getBusinessFlowInfo(client.businessFlow);
            const isExpanded = expandedClient === client.clientId;
            const achievementPercentage = (client.currentValue / client.targetValue) * 100;

            return (
              <div key={client.clientId} className="hover:bg-gray-50">
                <div className="px-6 py-4 min-w-[700px]">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 grid grid-cols-6 gap-4 items-center cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{client.clientName}</div>
                        <div className="text-sm text-gray-500">{client.document}</div>
                      </div>

                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${optInInfo.color}`}>
                          <optInInfo.icon className="w-3 h-3 mr-1" />
                          {optInInfo.label}
                        </span>
                      </div>

                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contractInfo.color}`}>
                          <contractInfo.icon className="w-3 h-3 mr-1" />
                          {contractInfo.label}
                        </span>
                      </div>

                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${flowInfo.color}`}>
                          {flowInfo.label}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {achievementPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(client.currentValue)} / {formatCurrency(client.targetValue)}
                        </div>
                      </div>
                    </div>

                    <button
                      className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedClient(isExpanded ? null : client.clientId);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Opt-in
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><span className="font-medium">Status:</span> {optInInfo.label}</div>
                          {client.optInRequestDate && (
                            <div><span className="font-medium">Solicitado em:</span> {formatDate(client.optInRequestDate)}</div>
                          )}
                          {client.optInApprovalDate && (
                            <div><span className="font-medium">Aprovado em:</span> {formatDate(client.optInApprovalDate)}</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-teal-600" />
                          Contrato
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><span className="font-medium">Status:</span> {contractInfo.label}</div>
                          {client.contractFormalizationDate && (
                            <div><span className="font-medium">Formalizado em:</span> {formatDate(client.contractFormalizationDate)}</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-orange-600" />
                          Valores
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><span className="font-medium">Valor Alvo:</span> {formatCurrency(client.targetValue)}</div>
                          <div><span className="font-medium">Valor Atual:</span> {formatCurrency(client.currentValue)}</div>
                          <div><span className="font-medium">Realização:</span> {achievementPercentage.toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">Nenhum cliente encontrado</div>
            <div className="text-sm text-gray-400">
              Tente ajustar os filtros ou termos de busca
            </div>
          </div>
        )}
        </div>
      </div>

      {/* New Formalization Modal */}
      <NewFormalizationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        clients={clients}
      />
    </div>
  );
};
