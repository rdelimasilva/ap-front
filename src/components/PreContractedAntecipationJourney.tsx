import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle, ChevronDown, ChevronUp, Search, Upload, ArrowRight, Users, Calendar, Percent, DollarSign, Settings, TrendingUp } from 'lucide-react';
import { ImportClientsModal } from './ImportClientsModal';
import { NewClientModal } from './NewClientModal';
import { Client } from '../types';

interface PreContractedAntecipationJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  initialClient?: { id: string; name: string; document: string; collateralValue?: number; availableLimit?: number } | null;
}

type Step = 'client-selection' | 'contract-config' | 'simulation' | 'confirmation';

type Frequency = 'diaria' | 'semanal' | 'mensal';

interface PreContractClient {
  id: string;
  name: string;
  document: string;
  totalReceivables: number;
  availableAmount: number;
}

interface DiscountRateTier {
  id: string;
  daysFrom: number;
  daysTo: number;
  rate: number;
}

interface ContractConfig {
  frequency: Frequency;
  targetType: 'amount' | 'percentage';
  targetAmount: number;
  targetPercentage: number;
  startDate: string;
  endDate: string;
  acquirers: {
    Cielo: boolean;
    Rede: boolean;
    Stone: boolean;
    GetNet: boolean;
  };
  discountRates: DiscountRateTier[];
}

interface SimulationPeriod {
  period: string;
  grossAmount: number;
  discountRate: number;
  discountAmount: number;
  netAmount: number;
  receivablesCount: number;
}

const defaultDiscountRates: DiscountRateTier[] = [
  { id: '1', daysFrom: 1, daysTo: 30, rate: 1.5 },
  { id: '2', daysFrom: 31, daysTo: 60, rate: 2.0 },
  { id: '3', daysFrom: 61, daysTo: 90, rate: 2.5 },
  { id: '4', daysFrom: 91, daysTo: 120, rate: 3.0 },
  { id: '5', daysFrom: 121, daysTo: 180, rate: 3.5 },
  { id: '6', daysFrom: 181, daysTo: 270, rate: 4.0 },
  { id: '7', daysFrom: 271, daysTo: 365, rate: 4.5 },
];

const loadDiscountRatesFromStorage = (): DiscountRateTier[] => {
  const saved = localStorage.getItem('preContractDiscountRates');
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultDiscountRates;
};

const frequencyLabels: Record<Frequency, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

const generateSimulationData = (
  config: ContractConfig,
  client: PreContractClient
): SimulationPeriod[] => {
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  const periods: SimulationPeriod[] = [];

  let current = new Date(start);
  let periodIndex = 0;

  while (current <= end && periodIndex < 12) {
    let periodLabel: string;
    let nextDate: Date;

    if (config.frequency === 'diaria') {
      periodLabel = new Intl.DateTimeFormat('pt-BR').format(current);
      nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (config.frequency === 'semanal') {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      periodLabel = `${new Intl.DateTimeFormat('pt-BR').format(current)} - ${new Intl.DateTimeFormat('pt-BR').format(weekEnd)}`;
      nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      periodLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(current);
      nextDate = new Date(current);
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const baseAmount = config.targetType === 'amount'
      ? config.targetAmount
      : (client.availableAmount * config.targetPercentage) / 100;

    const variation = 0.85 + Math.random() * 0.3;
    const grossAmount = Math.round(baseAmount * variation);
    const receivablesCount = Math.floor(Math.random() * 15) + 3;

    const daysUntilDue = Math.floor((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const matchingRate = config.discountRates.find(
      (r) => daysUntilDue >= r.daysFrom && daysUntilDue <= r.daysTo
    );
    const discountRate = matchingRate?.rate || config.discountRates[config.discountRates.length - 1]?.rate || 3.0;
    const discountAmount = (grossAmount * discountRate * Math.max(daysUntilDue, 1)) / (30 * 100);
    const netAmount = grossAmount - discountAmount;

    periods.push({
      period: periodLabel,
      grossAmount,
      discountRate,
      discountAmount,
      netAmount,
      receivablesCount,
    });

    current = nextDate;
    periodIndex++;
  }

  return periods;
};

export const PreContractedAntecipationJourney: React.FC<PreContractedAntecipationJourneyProps> = ({ isOpen, onClose, initialClient }) => {
  const [currentStep, setCurrentStep] = useState<Step>('client-selection');
  const [selectedClient, setSelectedClient] = useState<PreContractClient | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Client management state
  const [importedClients, setImportedClients] = useState<PreContractClient[]>([]);
  const [optInAuthorizations, setOptInAuthorizations] = useState<Set<string>>(new Set());
  const [contractualConsents, setContractualConsents] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchClientModalOpen, setIsSearchClientModalOpen] = useState(false);

  // Contract config state
  const [contractConfig, setContractConfig] = useState<ContractConfig>({
    frequency: 'mensal',
    targetType: 'percentage',
    targetAmount: 100000,
    targetPercentage: 70,
    startDate: '',
    endDate: '',
    acquirers: {
      Cielo: true,
      Rede: true,
      Stone: true,
      GetNet: true,
    },
    discountRates: loadDiscountRatesFromStorage(),
  });

  const [expandedRates, setExpandedRates] = useState(false);

  const simulationData = useMemo(() => {
    if (!selectedClient || !contractConfig.startDate || !contractConfig.endDate) return [];
    return generateSimulationData(contractConfig, selectedClient);
  }, [selectedClient, contractConfig]);

  const simulationTotals = useMemo(() => {
    return simulationData.reduce(
      (acc, period) => ({
        grossAmount: acc.grossAmount + period.grossAmount,
        discountAmount: acc.discountAmount + period.discountAmount,
        netAmount: acc.netAmount + period.netAmount,
        receivablesCount: acc.receivablesCount + period.receivablesCount,
      }),
      { grossAmount: 0, discountAmount: 0, netAmount: 0, receivablesCount: 0 }
    );
  }, [simulationData]);

  useEffect(() => {
    if (isOpen && initialClient) {
      const preContractClient: PreContractClient = {
        id: initialClient.id,
        name: initialClient.name,
        document: initialClient.document,
        totalReceivables: initialClient.collateralValue || 500000,
        availableAmount: initialClient.availableLimit || 400000,
      };
      setSelectedClient(preContractClient);
      setImportedClients([preContractClient]);
      setOptInAuthorizations(new Set([initialClient.id]));
      setContractualConsents(new Set([initialClient.id]));
      setCurrentStep('contract-config');
    }
  }, [isOpen, initialClient]);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const handleCloseJourney = () => {
    setCurrentStep('client-selection');
    setSelectedClient(null);
    setImportedClients([]);
    setOptInAuthorizations(new Set());
    setContractualConsents(new Set());
    setContractConfig({
      frequency: 'mensal',
      targetType: 'percentage',
      targetAmount: 100000,
      targetPercentage: 70,
      startDate: '',
      endDate: '',
      acquirers: { Cielo: true, Rede: true, Stone: true, GetNet: true },
      discountRates: loadDiscountRatesFromStorage(),
    });
    onClose();
  };

  const handleClientSelection = (client: PreContractClient) => {
    if (!optInAuthorizations.has(client.id) || !contractualConsents.has(client.id)) {
      return;
    }
    setSelectedClient(client);
    setCurrentStep('contract-config');
  };

  const handleImportClients = (clients: Client[]) => {
    const mapped: PreContractClient[] = clients.map(c => ({
      id: c.id,
      name: c.name,
      document: c.document,
      totalReceivables: Math.floor(Math.random() * 20) + 5,
      availableAmount: Math.random() * 1500000 + 200000,
    }));
    setImportedClients(prev => [...prev, ...mapped]);
    setIsImportModalOpen(false);
  };

  const handleManualClientAdd = (client: Client | Client[]) => {
    const clientsToAdd = Array.isArray(client) ? client : [client];
    const mapped: PreContractClient[] = clientsToAdd.map(c => ({
      id: c.id,
      name: c.name,
      document: c.document,
      totalReceivables: Math.floor(Math.random() * 20) + 5,
      availableAmount: Math.random() * 1500000 + 200000,
    }));
    setImportedClients(prev => [...prev, ...mapped]);
  };

  const toggleOptInAuthorization = (clientId: string, event: React.SyntheticEvent) => {
    event.stopPropagation();
    setOptInAuthorizations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleContractualConsent = (clientId: string, event: React.SyntheticEvent) => {
    event.stopPropagation();
    setContractualConsents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleAllOptIns = () => {
    if (importedClients.every(c => optInAuthorizations.has(c.id))) {
      setOptInAuthorizations(new Set());
    } else {
      setOptInAuthorizations(new Set(importedClients.map(c => c.id)));
    }
  };

  const toggleAllContractualConsents = () => {
    if (importedClients.every(c => contractualConsents.has(c.id))) {
      setContractualConsents(new Set());
    } else {
      setContractualConsents(new Set(importedClients.map(c => c.id)));
    }
  };

  const isContractConfigValid = () => {
    return (
      contractConfig.startDate !== '' &&
      contractConfig.endDate !== '' &&
      contractConfig.startDate < contractConfig.endDate &&
      (contractConfig.targetType === 'amount' ? contractConfig.targetAmount > 0 : contractConfig.targetPercentage > 0) &&
      Object.values(contractConfig.acquirers).some(v => v) &&
      contractConfig.discountRates.length > 0
    );
  };

  const updateDiscountRate = (id: string, field: keyof DiscountRateTier, value: number) => {
    setContractConfig(prev => ({
      ...prev,
      discountRates: prev.discountRates.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  };

  const addDiscountRate = () => {
    const lastRate = contractConfig.discountRates[contractConfig.discountRates.length - 1];
    const newRate: DiscountRateTier = {
      id: String(Date.now()),
      daysFrom: lastRate ? lastRate.daysTo + 1 : 1,
      daysTo: lastRate ? lastRate.daysTo + 30 : 30,
      rate: lastRate ? lastRate.rate + 0.5 : 1.5,
    };
    setContractConfig(prev => ({
      ...prev,
      discountRates: [...prev.discountRates, newRate],
    }));
  };

  const removeDiscountRate = (id: string) => {
    if (contractConfig.discountRates.length <= 1) return;
    setContractConfig(prev => ({
      ...prev,
      discountRates: prev.discountRates.filter(r => r.id !== id),
    }));
  };

  // --- RENDER STEPS ---

  const renderClientSelectionStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 1: Adicionar Clientes</h3>
        <p className="text-gray-600">Escolha como adicionar os clientes para a antecipação automática pré-contratada</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setIsSearchClientModalOpen(true)}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Buscar Clientes</h4>
          <p className="text-sm text-gray-600">Pesquisar clientes já cadastrados</p>
        </button>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
              <Upload className="w-8 h-8 text-teal-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Importar Planilha</h4>
          <p className="text-sm text-gray-600">Upload de arquivo XLSX com múltiplos CNPJs</p>
        </button>
        <button
          onClick={() => setIsNewClientModalOpen(true)}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-green-500 hover:bg-green-50 transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Adicionar Manualmente</h4>
          <p className="text-sm text-gray-600">Cadastro individual de cliente</p>
        </button>
      </div>

      {importedClients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Clientes Adicionados ({importedClients.length})
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAllOptIns}
                className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Marcar opt-in para todos</span>
              </button>
              <button
                onClick={toggleAllContractualConsents}
                className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Marcar todas anuências</span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {importedClients.map((client) => {
              const hasOptInAuth = optInAuthorizations.has(client.id);
              const hasContConsent = contractualConsents.has(client.id);
              const hasAllAuthorizations = hasOptInAuth && hasContConsent;
              return (
                <div key={client.id} className="space-y-2">
                  <button
                    onClick={() => handleClientSelection(client)}
                    disabled={!hasAllAuthorizations}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      hasAllAuthorizations
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.document}</p>
                      {hasAllAuthorizations && (
                        <p className="text-xs text-blue-600 font-medium mt-1">Autorizações confirmadas - Clique para selecionar</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">URs Disponíveis</p>
                        <p className="text-sm font-bold text-blue-600">{client.totalReceivables}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Valor Total</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(client.availableAmount)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-5 h-5 ${hasAllAuthorizations ? 'text-blue-600' : 'text-gray-400'}`} />
                        <ArrowRight className={`w-5 h-5 ${hasAllAuthorizations ? 'text-gray-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </button>
                  <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-2">
                    <label
                      className="flex items-start space-x-3 cursor-pointer py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={hasOptInAuth}
                        onChange={(e) => toggleOptInAuthorization(client.id, e)}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">
                        Declaro que possuo autorização para consulta dos dados "Opt-in" deste cliente
                      </span>
                    </label>
                    <label
                      className="flex items-start space-x-3 cursor-pointer py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={hasContConsent}
                        onChange={(e) => toggleContractualConsent(client.id, e)}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">
                        Tenho anuência contratual para onerar as agendas deste estabelecimento comercial
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderContractConfigStep = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">Passo 2: Configurar Contrato Pré-Contratado</h3>
          <button
            onClick={() => {
              setCurrentStep('client-selection');
              setSelectedClient(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Trocar Cliente
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-2">
          <p className="text-sm text-gray-600">Cliente Selecionado:</p>
          <p className="font-semibold text-gray-900">{selectedClient?.name} - {selectedClient?.document}</p>
        </div>
        <p className="text-gray-600">Defina as regras automáticas para antecipação de recebíveis deste cliente.</p>
      </div>

      {/* Frequency Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Frequência da Antecipação</h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['diaria', 'semanal', 'mensal'] as Frequency[]).map((freq) => (
            <button
              key={freq}
              onClick={() => setContractConfig(prev => ({ ...prev, frequency: freq }))}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                contractConfig.frequency === freq
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
              }`}
            >
              <p className="font-semibold">{frequencyLabels[freq]}</p>
              <p className="text-xs text-gray-500 mt-1">
                {freq === 'diaria' && 'Antecipação todos os dias úteis'}
                {freq === 'semanal' && 'Antecipação uma vez por semana'}
                {freq === 'mensal' && 'Antecipação uma vez por mês'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Target Amount/Percentage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Meta de Antecipação</h4>
        </div>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setContractConfig(prev => ({ ...prev, targetType: 'percentage' }))}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
              contractConfig.targetType === 'percentage'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span className="font-medium">Percentual dos Recebíveis</span>
          </button>
          <button
            onClick={() => setContractConfig(prev => ({ ...prev, targetType: 'amount' }))}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
              contractConfig.targetType === 'amount'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Valor Fixo (R$)</span>
          </button>
        </div>

        {contractConfig.targetType === 'percentage' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Percentual dos recebíveis a antecipar automaticamente
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={contractConfig.targetPercentage}
                onChange={(e) => setContractConfig(prev => ({ ...prev, targetPercentage: Number(e.target.value) }))}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 min-w-[80px] text-center">
                <span className="text-2xl font-bold text-blue-600">{contractConfig.targetPercentage}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Estimativa: {formatCurrency((selectedClient?.availableAmount || 0) * contractConfig.targetPercentage / 100)} por período
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor fixo a antecipar por período ({frequencyLabels[contractConfig.frequency].toLowerCase()})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={contractConfig.targetAmount}
                onChange={(e) => setContractConfig(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100.000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contract Dates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Vigência do Contrato</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
            <input
              type="date"
              value={contractConfig.startDate}
              onChange={(e) => setContractConfig(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Término</label>
            <input
              type="date"
              value={contractConfig.endDate}
              onChange={(e) => setContractConfig(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {contractConfig.startDate && contractConfig.endDate && contractConfig.startDate >= contractConfig.endDate && (
          <p className="text-sm text-red-600 mt-2">A data de término deve ser posterior à data de início.</p>
        )}
      </div>

      {/* Acquirer Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Credenciadoras</h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">Selecione as credenciadoras cujos recebíveis serão antecipados automaticamente.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(contractConfig.acquirers) as Array<keyof typeof contractConfig.acquirers>).map((acquirer) => (
            <button
              key={acquirer}
              onClick={() =>
                setContractConfig(prev => ({
                  ...prev,
                  acquirers: { ...prev.acquirers, [acquirer]: !prev.acquirers[acquirer] },
                }))
              }
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                contractConfig.acquirers[acquirer]
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 mx-auto mb-2 flex items-center justify-center ${
                contractConfig.acquirers[acquirer]
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              }`}>
                {contractConfig.acquirers[acquirer] && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <p className={`font-semibold ${contractConfig.acquirers[acquirer] ? 'text-blue-700' : 'text-gray-600'}`}>
                {acquirer}
              </p>
            </button>
          ))}
        </div>
        {!Object.values(contractConfig.acquirers).some(v => v) && (
          <p className="text-sm text-red-600 mt-2">Selecione ao menos uma credenciadora.</p>
        )}
      </div>

      {/* Discount Rate Tiers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Faixas de Desconto</h4>
          </div>
          <button
            onClick={() => setExpandedRates(!expandedRates)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>{expandedRates ? 'Recolher' : 'Expandir'}</span>
            {expandedRates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {!expandedRates ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {contractConfig.discountRates.map((tier) => (
              <div key={tier.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">{tier.daysFrom}-{tier.daysTo} dias</p>
                <p className="text-lg font-bold text-blue-600">{tier.rate}% a.m.</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {contractConfig.discountRates.map((tier) => (
              <div key={tier.id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">De (dias)</label>
                    <input
                      type="number"
                      value={tier.daysFrom}
                      onChange={(e) => updateDiscountRate(tier.id, 'daysFrom', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Até (dias)</label>
                    <input
                      type="number"
                      value={tier.daysTo}
                      onChange={(e) => updateDiscountRate(tier.id, 'daysTo', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Taxa (% a.m.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.rate}
                      onChange={(e) => updateDiscountRate(tier.id, 'rate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeDiscountRate(tier.id)}
                  disabled={contractConfig.discountRates.length <= 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed mt-5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              onClick={addDiscountRate}
              className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              + Adicionar Faixa
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => {
            setCurrentStep('client-selection');
            setSelectedClient(null);
          }}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => setCurrentStep('simulation')}
          disabled={!isContractConfigValid()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continuar para Simulação
        </button>
      </div>
    </div>
  );

  const renderSimulationStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 3: Simulação da Antecipação Automática</h3>
        <p className="text-gray-600">Projeção dos valores que seriam antecipados automaticamente com as regras configuradas</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">Cliente:</p>
        <p className="font-semibold text-gray-900">{selectedClient?.name} - {selectedClient?.document}</p>
      </div>

      {/* Summary Cards */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Resumo da Simulação</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <span className="text-sm text-gray-600">Períodos Projetados</span>
            <p className="text-2xl font-bold text-blue-900">{simulationData.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <span className="text-sm text-gray-600">Valor Bruto Total</span>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(simulationTotals.grossAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <span className="text-sm text-gray-600">Desconto Total</span>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(simulationTotals.discountAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <span className="text-sm text-gray-600">Valor Líquido Total</span>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(simulationTotals.netAmount)}</p>
          </div>
        </div>
      </div>

      {/* Config Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-medium">Frequência</p>
          <p className="text-lg font-bold text-blue-600">{frequencyLabels[contractConfig.frequency]}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-medium">Meta por Período</p>
          <p className="text-lg font-bold text-blue-600">
            {contractConfig.targetType === 'percentage'
              ? `${contractConfig.targetPercentage}%`
              : formatCurrency(contractConfig.targetAmount)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-medium">Início</p>
          <p className="text-lg font-bold text-blue-600">{contractConfig.startDate ? formatDate(contractConfig.startDate) : '-'}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-medium">Término</p>
          <p className="text-lg font-bold text-blue-600">{contractConfig.endDate ? formatDate(contractConfig.endDate) : '-'}</p>
        </div>
      </div>

      {/* Detailed Periods Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-base font-semibold text-gray-900">Projeção por Período</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">URs Est.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Bruto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Desconto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {simulationData.map((period, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{period.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{period.receivablesCount}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(period.grossAmount)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {period.discountRate}% a.m.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600 text-right">-{formatCurrency(period.discountAmount)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">{formatCurrency(period.netAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-6 py-4 text-sm font-bold text-blue-900">Total</td>
                <td className="px-6 py-4 text-sm font-bold text-blue-900 text-right">{simulationTotals.receivablesCount}</td>
                <td className="px-6 py-4 text-sm font-bold text-blue-900 text-right">{formatCurrency(simulationTotals.grossAmount)}</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">-{formatCurrency(simulationTotals.discountAmount)}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">{formatCurrency(simulationTotals.netAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Nota sobre a Simulação</p>
            <p className="text-sm text-amber-700">
              Os valores apresentados são estimativas baseadas nas regras configuradas e no histórico de recebíveis do cliente.
              Os valores reais podem variar de acordo com o volume real de transações no período.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('contract-config')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => setShowApprovalModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Confirmar Pré-Contratação
        </button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 4: Contrato Pré-Contratado Ativado</h3>
        <p className="text-gray-600">A antecipação automática foi configurada com sucesso</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-900">Antecipação Automática Pré-Contratada Ativada</h4>
            <p className="text-sm text-blue-700">O contrato foi enviado para aprovação e entrará em vigor automaticamente</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-600">Cliente:</p>
          <p className="font-semibold text-gray-900">{selectedClient?.name} - {selectedClient?.document}</p>
        </div>

        {/* Contract Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Frequência</p>
            <p className="text-2xl font-bold text-blue-600">{frequencyLabels[contractConfig.frequency]}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Meta</p>
            <p className="text-2xl font-bold text-blue-600">
              {contractConfig.targetType === 'percentage'
                ? `${contractConfig.targetPercentage}%`
                : formatCurrency(contractConfig.targetAmount)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Valor Líquido Projetado</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(simulationTotals.netAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Períodos</p>
            <p className="text-2xl font-bold text-gray-900">{simulationData.length}</p>
          </div>
        </div>

        {/* Vigência */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Início da Vigência</p>
            <p className="text-lg font-bold text-gray-900">{contractConfig.startDate ? formatDate(contractConfig.startDate) : '-'}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Término da Vigência</p>
            <p className="text-lg font-bold text-gray-900">{contractConfig.endDate ? formatDate(contractConfig.endDate) : '-'}</p>
          </div>
        </div>

        {/* Acquirers */}
        <div className="bg-white rounded-lg p-4 border border-blue-200 mb-6">
          <p className="text-sm text-gray-600 mb-2">Credenciadoras Habilitadas</p>
          <div className="flex items-center space-x-3">
            {(Object.entries(contractConfig.acquirers) as [string, boolean][])
              .filter(([, enabled]) => enabled)
              .map(([name]) => (
                <span key={name} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {name}
                </span>
              ))}
          </div>
        </div>

        {/* Discount Rates Summary */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">Faixas de Desconto Aplicadas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {contractConfig.discountRates.map((tier) => (
              <div key={tier.id} className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{tier.daysFrom}-{tier.daysTo}d</p>
                <p className="text-sm font-bold text-blue-600">{tier.rate}% a.m.</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900 mb-1">Próximos Passos</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>- O contrato pré-contratado foi enviado para aprovação e pode ser acompanhado no <strong>menu de Operações</strong></li>
              <li>- Após aprovação, a antecipação automática iniciará na data configurada ({contractConfig.startDate ? formatDate(contractConfig.startDate) : '-'})</li>
              <li>- Os recebíveis serão antecipados automaticamente com frequência <strong>{frequencyLabels[contractConfig.frequency].toLowerCase()}</strong></li>
              <li>- Você receberá notificações a cada execução automática e poderá pausar ou cancelar a qualquer momento</li>
              <li>- O valor líquido projetado total é de {formatCurrency(simulationTotals.netAmount)}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCloseJourney}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>Finalizar</span>
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ['client-selection', 'contract-config', 'simulation', 'confirmation'];
    return steps.indexOf(step) + 1;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Antecipação Automática Pré-Contratada</h2>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-2 ${currentStep === 'client-selection' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStepNumber(currentStep) >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Clientes</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'contract-config' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStepNumber(currentStep) >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Configuração</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'simulation' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStepNumber(currentStep) >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    3
                  </div>
                  <span className="text-sm font-medium">Simulação</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStepNumber(currentStep) >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    4
                  </div>
                  <span className="text-sm font-medium">Confirmação</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseJourney}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {currentStep === 'client-selection' && renderClientSelectionStep()}
            {currentStep === 'contract-config' && renderContractConfigStep()}
            {currentStep === 'simulation' && renderSimulationStep()}
            {currentStep === 'confirmation' && renderConfirmationStep()}
          </div>
        </div>

        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Confirmar Pré-Contratação Automática
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <span className="font-semibold">Cliente:</span> {selectedClient?.name}
                  </p>
                  <p className="text-sm text-blue-900 mb-2">
                    <span className="font-semibold">Frequência:</span> {frequencyLabels[contractConfig.frequency]}
                  </p>
                  <p className="text-sm text-blue-900 mb-2">
                    <span className="font-semibold">Meta:</span>{' '}
                    {contractConfig.targetType === 'percentage'
                      ? `${contractConfig.targetPercentage}% dos recebíveis`
                      : formatCurrency(contractConfig.targetAmount)}
                  </p>
                  <p className="text-sm text-blue-900 mb-2">
                    <span className="font-semibold">Vigência:</span>{' '}
                    {contractConfig.startDate ? formatDate(contractConfig.startDate) : '-'} a{' '}
                    {contractConfig.endDate ? formatDate(contractConfig.endDate) : '-'}
                  </p>
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Valor líquido projetado:</span> {formatCurrency(simulationTotals.netAmount)}
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  Ao confirmar, o contrato de antecipação automática pré-contratada será enviado para análise e aprovação.
                  Após aprovação, os recebíveis serão antecipados automaticamente conforme as regras configuradas.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setCurrentStep('confirmation');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmar Pré-Contratação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportClients}
      />

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSave={handleManualClientAdd}
      />

      {isSearchClientModalOpen && (
        <PreContractSearchClientModal
          isOpen={isSearchClientModalOpen}
          onClose={() => setIsSearchClientModalOpen(false)}
          onSelectClients={(clients) => {
            const mapped: PreContractClient[] = clients.map(c => ({
              id: c.id,
              name: c.name,
              document: c.document,
              totalReceivables: Math.floor(Math.random() * 20) + 5,
              availableAmount: Math.random() * 1500000 + 200000,
            }));
            setImportedClients(prev => [...prev, ...mapped]);
            setIsSearchClientModalOpen(false);
          }}
        />
      )}
    </>
  );
};

// Search Client Modal for Pre-Contracted Anticipation Journey
interface PreContractSearchClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClients: (clients: Client[]) => void;
}

const PreContractSearchClientModal: React.FC<PreContractSearchClientModalProps> = ({ isOpen, onClose, onSelectClients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const mockSearchClients: Client[] = [
    {
      id: 'c1',
      name: 'ABC Comércio Ltda',
      document: '12.345.678/0001-90',
      email: 'contato@abc.com.br',
      phone: '(11) 98765-4321',
      address: 'Rua A, 123, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      totalLimit: 500000,
      usedLimit: 200000,
      availableLimit: 300000,
      collateralValue: 150000,
      status: 'active',
    },
    {
      id: 'c2',
      name: 'XYZ Varejo',
      document: '11.222.333/0001-44',
      email: 'financeiro@xyz.com.br',
      phone: '(11) 91234-5678',
      address: 'Av. B, 456, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02345-678',
      totalLimit: 1000000,
      usedLimit: 400000,
      availableLimit: 600000,
      collateralValue: 300000,
      status: 'active',
    },
    {
      id: 'c3',
      name: 'Tech Solutions Brasil',
      document: '98.765.432/0001-10',
      email: 'admin@techsolutions.com.br',
      phone: '(11) 99876-5432',
      address: 'Rua C, 789, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '03456-789',
      totalLimit: 750000,
      usedLimit: 250000,
      availableLimit: 500000,
      collateralValue: 200000,
      status: 'active',
    },
    {
      id: 'c4',
      name: 'Varejo Prime Ltda',
      document: '22.333.444/0001-55',
      email: 'contato@varejoprime.com.br',
      phone: '(11) 98888-7777',
      address: 'Av. D, 321, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04567-890',
      totalLimit: 600000,
      usedLimit: 150000,
      availableLimit: 450000,
      collateralValue: 180000,
      status: 'active',
    },
    {
      id: 'c5',
      name: 'Mega Store S.A.',
      document: '33.444.555/0001-66',
      email: 'vendas@megastore.com.br',
      phone: '(11) 97777-6666',
      address: 'Rua E, 654, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05678-901',
      totalLimit: 900000,
      usedLimit: 350000,
      availableLimit: 550000,
      collateralValue: 280000,
      status: 'active',
    },
    {
      id: 'c6',
      name: 'Distribuidora Central',
      document: '44.555.666/0001-77',
      email: 'contato@distcentral.com.br',
      phone: '(11) 96666-5555',
      address: 'Rua F, 987, São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '06789-012',
      totalLimit: 800000,
      usedLimit: 300000,
      availableLimit: 500000,
      collateralValue: 250000,
      status: 'active',
    },
  ];

  const filteredClients = mockSearchClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document.includes(searchTerm)
  );

  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const handleConfirm = () => {
    const selected = mockSearchClients.filter(client => selectedClients.has(client.id));
    if (selected.length > 0) {
      onSelectClients(selected);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Buscar Clientes</h2>
              <p className="text-sm text-gray-600">
                {selectedClients.size} cliente{selectedClients.size !== 1 ? 's' : ''} selecionado{selectedClients.size !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="overflow-y-auto max-h-96 space-y-2">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum cliente encontrado</p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClients.has(client.id);
                return (
                  <button
                    key={client.id}
                    onClick={() => toggleClientSelection(client.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-600">{client.document}</div>
                            <div className="text-xs text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          R$ {(client.availableLimit / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-gray-500">Disponível</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedClients.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Adicionar {selectedClients.size > 0 ? `${selectedClients.size} Cliente${selectedClients.size > 1 ? 's' : ''}` : 'Clientes'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
