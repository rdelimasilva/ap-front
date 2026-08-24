import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MetricCard } from './MetricCard';
import { ContractTable } from './ContractTable';
import { NewOperationModal } from './NewOperationModal';
import { Product, Client, Contract } from '../types';
import {
  mockGuaranteeProblems,
  mockCreditProblems,
  mockDebtSettlementProblems,
  mockAnticipationProblems
} from '../data/mockData';
import { DollarSign, Shield, TrendingDown, Building2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataContext';

const LazyContractDetail = React.lazy(() =>
  import('./ContractDetail').then(module => ({ default: module.ContractDetail }))
);

interface ProductModuleProps {
  product: Product;
  clients: Client[];
  onClientClick: (client: Client) => void;
  onProblemCardClick: (problemType: string) => void;
}

export const ProductModule: React.FC<ProductModuleProps> = ({ product, clients, onClientClick: _onClientClick, onProblemCardClick }) => {
  const { contracts: dataContracts } = useData();
  const [contracts, setContracts] = useState(dataContracts);
  useEffect(() => { setContracts(dataContracts); }, [dataContracts]);
  const [selectedContract, setSelectedContract] = React.useState<Contract | null>(null);
  const [showNewOperationModal, setShowNewOperationModal] = React.useState(false);
  const { addToast } = useToast();

  const getProductColor = (type: Product['type']) => {
    switch (type) {
      case 'guarantee': return 'text-green-600';
      case 'extra-limit': return 'text-purple-600';
      case 'debt-settlement': return 'text-red-600';
      case 'anticipation': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filterContractsByProduct = useCallback((contract: Contract) => {
    switch (product.type) {
      case 'guarantee':
        return !contract.contractNumber.includes('-QD-') &&
               !contract.contractNumber.includes('-ANT-') &&
               !contract.contractNumber.includes('-CP-');
      case 'extra-limit':
        return contract.contractNumber.includes('-CP-') ||
               (!contract.contractNumber.includes('-QD-') &&
                !contract.contractNumber.includes('-ANT-') &&
                contract.id === '2');
      case 'debt-settlement':
        return contract.contractNumber.includes('-QD-');
      case 'anticipation':
        return contract.contractNumber.includes('-ANT-');
      default:
        return true;
    }
  }, [product.type]);

  const productContracts = useMemo(() => contracts.filter(filterContractsByProduct), [contracts, filterContractsByProduct]);
  const pendingContracts = useMemo(() => productContracts.filter(c => c.status === 'pending_approval'), [productContracts]);
  const activeContracts = useMemo(() => productContracts.filter(c => c.status === 'active'), [productContracts]);

  const handleContractClick = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setSelectedContract(contract);
    }
  };

  const handleBackToProduct = () => {
    setSelectedContract(null);
  };

  const handleApproveContracts = (contractIds: string[]) => {
    setContracts(prevContracts =>
      prevContracts.map(contract =>
        contractIds.includes(contract.id)
          ? { ...contract, status: 'active' as const }
          : contract
      )
    );
    addToast(
      'success',
      `${contractIds.length} contrato${contractIds.length > 1 ? 's aprovados' : ' aprovado'} com sucesso!`
    );
  };

  // If a contract is selected, show contract detail
  if (selectedContract) {
    return (
      <React.Suspense fallback={<div>Carregando...</div>}>
        <LazyContractDetail contract={selectedContract} onBack={handleBackToProduct} />
      </React.Suspense>
    );
  }

  // Get problems for current product type
  const getProblemsForProduct = () => {
    switch (product.type) {
      case 'guarantee':
        return mockGuaranteeProblems;
      case 'extra-limit':
        return mockCreditProblems;
      case 'debt-settlement':
        return mockDebtSettlementProblems;
      case 'anticipation':
        return mockAnticipationProblems;
      default:
        return [];
    }
  };

  const problems = getProblemsForProduct();

  // Calculate problem statistics
  const problemStats = {
    total: problems.length,
    pending: problems.filter(p => p.status === 'pending').length,
    inProgress: problems.filter(p => p.status === 'in_progress').length,
    critical: problems.filter(p => p.severity === 'critical').length,
    totalValue: problems.reduce((sum, p) => {
      return sum + (p.details.missingValue || p.details.chargebackValue || p.details.settlementValue || 0);
    }, 0)
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
        </div>
        <button 
          onClick={() => setShowNewOperationModal(true)}
          className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-normal h-8"
        >
          Nova Operação
        </button>
      </div>

      {/* Product Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
        <MetricCard
          title="Clientes Ativos"
          value={product.clientsCount}
          color={getProductColor(product.type)}
        />
        <MetricCard
          title="Valor Total"
          value={formatCurrency(product.totalValue)}
          color={getProductColor(product.type)}
        />
        <MetricCard
          title="Operações Ativas"
          value={product.activeOperations}
          color={getProductColor(product.type)}
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(product.totalValue / product.clientsCount)}
          color={getProductColor(product.type)}
        />
      </div>

      {/* Problem Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-yellow-300 cursor-pointer transition-all duration-200"
          onClick={() => onProblemCardClick('lock')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trava não aplicada</p>
              <p className="text-2xl font-bold text-gray-900">{problemStats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-red-300 cursor-pointer transition-all duration-200"
          onClick={() => onProblemCardClick('chargeback')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chargeback</p>
              <p className="text-2xl font-bold text-yellow-600">{problemStats.pending}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 cursor-pointer transition-all duration-200"
          onClick={() => onProblemCardClick('domicile')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Troca de Domicílio não Acatada</p>
              <p className="text-2xl font-bold text-blue-600">{problemStats.inProgress}</p>
            </div>
            <Building2 className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Impactado</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(problemStats.totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Pending Approval Contracts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Contratos para Aprovação</h2>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {pendingContracts.length} pendentes
          </span>
        </div>
        <ContractTable
          contracts={pendingContracts}
          onContractClick={(contract) => handleContractClick(contract.id)}
          productType={product.type}
          clients={clients}
          showApprovalButton={true}
          onApproveContracts={handleApproveContracts}
        />
      </div>

      {/* Active Contracts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Contratos em Andamento</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {activeContracts.length} ativos
          </span>
        </div>
        <ContractTable
          contracts={activeContracts}
          onContractClick={(contract) => handleContractClick(contract.id)}
          productType={product.type}
          clients={clients}
          showApprovalButton={false}
        />
      </div>

      {/* New Operation Modal */}
      <NewOperationModal
        isOpen={showNewOperationModal}
        onClose={() => setShowNewOperationModal(false)}
        product={product}
        clients={clients}
      />
    </div>
  );
};
