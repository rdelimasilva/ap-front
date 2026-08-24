import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, ArrowRight, Search, Users, RefreshCw, Zap, Target, Calendar, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { ImportClientsModal } from './ImportClientsModal';
import { NewClientModal } from './NewClientModal';
import { OperationConfirmationModal } from './OperationConfirmationModal';
import { Client } from '../types';

interface OwnershipTransferJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  initialClient?: Client | null;
}

type Step = 'clients' | 'automation' | 'summary';

interface PurchaseAutomationConfig {
  monthlyLimit: string;
  minURValue: string;
  maxURValue: string;
  scheduleMode: 'fixed' | 'monthly';
  startDate: string;
  endDate: string;
  pauseOnLimitReached: boolean;
  cardBrands: string[];
  credentiators: string[];
  functions: string[];
}

const defaultAutomationConfig: PurchaseAutomationConfig = {
  monthlyLimit: '',
  minURValue: '',
  maxURValue: '',
  scheduleMode: 'monthly',
  startDate: '',
  endDate: '',
  pauseOnLimitReached: true,
  cardBrands: [],
  credentiators: [],
  functions: [],
};

const availableCardBrands = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'];
const availableCredentiators = ['Cielo', 'Rede', 'Stone', 'GetNet', 'PagSeguro', 'SafraPay'];
const availableFunctions = ['Débito', 'Crédito', 'Ambos'];

export const OwnershipTransferJourney: React.FC<OwnershipTransferJourneyProps> = ({ isOpen, onClose, initialClient }) => {
  const [currentStep, setCurrentStep] = useState<Step>(initialClient ? 'automation' : 'clients');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchClientModalOpen, setIsSearchClientModalOpen] = useState(false);
  const [importedClients, setImportedClients] = useState<Client[]>(initialClient ? [initialClient] : []);
  const [optInAuthorizations, setOptInAuthorizations] = useState<Set<string>>(new Set());
  const [contractualConsents, setContractualConsents] = useState<Set<string>>(new Set());
  const [automationConfigs, setAutomationConfigs] = useState<Map<string, PurchaseAutomationConfig>>(new Map());
  const [showAdvanced, setShowAdvanced] = useState<Set<string>>(new Set());
  const [showOperationConfirmation, setShowOperationConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && initialClient) {
      setImportedClients([initialClient]);
      setOptInAuthorizations(new Set([initialClient.id]));
      setContractualConsents(new Set([initialClient.id]));
      setCurrentStep('automation');
    }
  }, [isOpen, initialClient]);

  if (!isOpen) return null;

  const clientsWithOptIn = importedClients.filter(c => optInAuthorizations.has(c.id) && contractualConsents.has(c.id));

  const handleImportClients = (clients: Client[]) => {
    setImportedClients(prev => [...prev, ...clients]);
    setIsImportModalOpen(false);
  };

  const handleManualClientAdd = (client: Client | Client[]) => {
    const clientsToAdd = Array.isArray(client) ? client : [client];
    setImportedClients(prev => [...prev, ...clientsToAdd]);
  };

  const toggleOptInAuthorization = (clientId: string) => {
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

  const toggleContractualConsent = (clientId: string) => {
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

  const toggleAll = () => {
    const allMarked = importedClients.every(c => optInAuthorizations.has(c.id) && contractualConsents.has(c.id));
    if (allMarked) {
      setOptInAuthorizations(new Set());
      setContractualConsents(new Set());
    } else {
      setOptInAuthorizations(new Set(importedClients.map(c => c.id)));
      setContractualConsents(new Set(importedClients.map(c => c.id)));
    }
  };

  const getAutomationConfig = (clientId: string): PurchaseAutomationConfig => {
    return { ...defaultAutomationConfig, ...automationConfigs.get(clientId) };
  };

  const updateAutomationConfig = (clientId: string, updates: Partial<PurchaseAutomationConfig>) => {
    setAutomationConfigs(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(clientId) || { ...defaultAutomationConfig };
      newMap.set(clientId, { ...current, ...updates });
      return newMap;
    });
  };

  const toggleAdvanced = (clientId: string) => {
    setShowAdvanced(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleCardBrand = (clientId: string, brand: string) => {
    const config = getAutomationConfig(clientId);
    const brands = config.cardBrands.includes(brand)
      ? config.cardBrands.filter(b => b !== brand)
      : [...config.cardBrands, brand];
    updateAutomationConfig(clientId, { cardBrands: brands });
  };

  const toggleCredentiator = (clientId: string, credentiator: string) => {
    const config = getAutomationConfig(clientId);
    const credentiators = config.credentiators.includes(credentiator)
      ? config.credentiators.filter(a => a !== credentiator)
      : [...config.credentiators, credentiator];
    updateAutomationConfig(clientId, { credentiators });
  };

  const selectFunction = (clientId: string, fn: string) => {
    updateAutomationConfig(clientId, { functions: [fn] });
  };

  const isClientConfigured = (clientId: string) => {
    const config = getAutomationConfig(clientId);
    return config.monthlyLimit && parseFloat(config.monthlyLimit) > 0;
  };

  const handleActivateAll = () => {
    const allValid = clientsWithOptIn.every(c => isClientConfigured(c.id));
    if (allValid) {
      setShowOperationConfirmation(true);
    }
  };

  const handleConfirmOperations = () => {
    setShowOperationConfirmation(false);
    setCurrentStep('summary');
  };

  const handleCloseJourney = () => {
    setImportedClients([]);
    setOptInAuthorizations(new Set());
    setContractualConsents(new Set());
    setAutomationConfigs(new Map());
    setShowAdvanced(new Set());
    setCurrentStep('clients');
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderClientsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 1: Adicionar Clientes e Confirmar Opt-in</h3>
        <p className="text-gray-600">Adicione os clientes e confirme a autorização de opt-in para ativar a compra automática de URs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setIsSearchClientModalOpen(true)}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Search className="w-8 h-8 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Buscar Clientes</h4>
          <p className="text-sm text-gray-600">Pesquisar clientes já cadastrados</p>
        </button>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
              Clientes Adicionados ({clientsWithOptIn.length}/{importedClients.length} com opt-in)
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="flex items-center space-x-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Marcar todos</span>
              </button>
              {clientsWithOptIn.length > 0 && (
                <button
                  onClick={() => setCurrentStep('automation')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Configurar Compra Automática</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {importedClients.map((client) => {
              const hasOptIn = optInAuthorizations.has(client.id);
              const hasConsent = contractualConsents.has(client.id);
              const isReady = hasOptIn && hasConsent;
              return (
                <div key={client.id} className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isReady
                        ? 'bg-purple-50 border-purple-200'
                        : hasOptIn || hasConsent
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.document}</p>
                      {isReady && (
                        <p className="text-xs text-purple-600 font-medium mt-1">Opt-in e anuência confirmados</p>
                      )}
                      {hasOptIn && !hasConsent && (
                        <p className="text-xs text-yellow-600 font-medium mt-1">Falta anuência contratual</p>
                      )}
                      {!hasOptIn && hasConsent && (
                        <p className="text-xs text-yellow-600 font-medium mt-1">Falta opt-in</p>
                      )}
                    </div>
                    <CheckCircle className={`w-5 h-5 ${isReady ? 'text-purple-600' : 'text-gray-300'}`} />
                  </div>
                  <div className="ml-4 pl-4 border-l-2 border-purple-200 space-y-2">
                    <label className="flex items-start space-x-3 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={hasOptIn}
                        onChange={() => toggleOptInAuthorization(client.id)}
                        className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-xs text-gray-700">
                        Declaro que possuo autorização para consulta dos dados "Opt-in" deste cliente
                      </span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={hasConsent}
                        onChange={() => toggleContractualConsent(client.id)}
                        className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
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

  const renderAutomationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 2: Configurar Compra Automática de URs</h3>
          <p className="text-gray-600">Defina o limite mensal de compras, faixa de valor de UR e o tipo de rotina para cada cliente</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentStep('clients')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          {clientsWithOptIn.every(c => isClientConfigured(c.id)) && (
            <button
              onClick={handleActivateAll}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Ativar Compras ({clientsWithOptIn.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {clientsWithOptIn.map((client) => {
          const config = getAutomationConfig(client.id);
          const isAdvancedOpen = showAdvanced.has(client.id);
          const configured = isClientConfigured(client.id);

          return (
            <div key={client.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-500">{client.document}</p>
                    </div>
                  </div>
                  {configured && (
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                      Configurado
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Limite mensal de compras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite Mensal de Compras (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="text"
                      value={config.monthlyLimit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.,]/g, '');
                        updateAutomationConfig(client.id, { monthlyLimit: val });
                      }}
                      placeholder="Ex: 20.000,00"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Valor máximo total que será comprado por mês para este cliente</p>
                </div>

                {/* Faixa de valor de UR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faixa de Valor por UR
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor Mínimo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                        <input
                          type="text"
                          value={config.minURValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d.,]/g, '');
                            updateAutomationConfig(client.id, { minURValue: val });
                          }}
                          placeholder="0,00"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor Máximo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                        <input
                          type="text"
                          value={config.maxURValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d.,]/g, '');
                            updateAutomationConfig(client.id, { maxURValue: val });
                          }}
                          placeholder="0,00"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Somente URs dentro desta faixa de valor serão compradas automaticamente</p>
                </div>

                {/* Tipo de rotina */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Rotina
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateAutomationConfig(client.id, { scheduleMode: 'monthly' })}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        config.scheduleMode === 'monthly'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 text-sm">Rotina Mensal</div>
                      <div className="text-xs text-gray-600">Compra recorrente todo mês, sem data de término</div>
                    </button>
                    <button
                      onClick={() => updateAutomationConfig(client.id, { scheduleMode: 'fixed' })}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        config.scheduleMode === 'fixed'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 text-sm">Período Fixo</div>
                      <div className="text-xs text-gray-600">Define data de início e fim da automação</div>
                    </button>
                  </div>
                </div>

                {/* Janela de tempo - só aparece no período fixo */}
                {config.scheduleMode === 'fixed' && (
                  <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Período da automação</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data de Início</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="date"
                            value={config.startDate}
                            onChange={(e) => updateAutomationConfig(client.id, { startDate: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data de Término</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="date"
                            value={config.endDate}
                            onChange={(e) => updateAutomationConfig(client.id, { endDate: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pausar ao atingir limite */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Pausar ao atingir limite mensal</div>
                    <div className="text-xs text-gray-600">Interrompe compras automáticas quando o limite do mês for alcançado</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.pauseOnLimitReached}
                      onChange={(e) => updateAutomationConfig(client.id, { pauseOnLimitReached: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Configurações Avançadas */}
                <button
                  onClick={() => toggleAdvanced(client.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700 text-sm">Configurações Avançadas</span>
                  </div>
                  {isAdvancedOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {isAdvancedOpen && (
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    {/* Bandeiras */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bandeiras</label>
                      <div className="flex flex-wrap gap-2">
                        {availableCardBrands.map((brand) => (
                          <button
                            key={brand}
                            onClick={() => toggleCardBrand(client.id, brand)}
                            className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                              config.cardBrands.includes(brand)
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-300 text-gray-700 hover:border-purple-300'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {config.cardBrands.length === 0 ? 'Todas as bandeiras' : `${config.cardBrands.length} selecionada(s)`}
                      </p>
                    </div>

                    {/* Credenciadoras */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Credenciadoras</label>
                      <div className="flex flex-wrap gap-2">
                        {availableCredentiators.map((credentiator) => (
                          <button
                            key={credentiator}
                            onClick={() => toggleCredentiator(client.id, credentiator)}
                            className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                              config.credentiators.includes(credentiator)
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-300 text-gray-700 hover:border-purple-300'
                            }`}
                          >
                            {credentiator}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {config.credentiators.length === 0 ? 'Todas as credenciadoras' : `${config.credentiators.length} selecionada(s)`}
                      </p>
                    </div>

                    {/* Função */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                      <div className="flex flex-wrap gap-2">
                        {availableFunctions.map((fn) => (
                          <button
                            key={fn}
                            onClick={() => selectFunction(client.id, fn)}
                            className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                              config.functions[0] === fn
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-300 text-gray-700 hover:border-purple-300'
                            }`}
                          >
                            {fn}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSummaryStep = () => {
    const totalMonthlyVolume = clientsWithOptIn.reduce((sum, c) => {
      const config = getAutomationConfig(c.id);
      return sum + (parseFloat(config.monthlyLimit.replace(',', '.')) || 0);
    }, 0);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 3: Resumo da Compra Automática</h3>
          <p className="text-gray-600">Automações de compra de URs ativadas com sucesso</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-600 p-3 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-purple-900">Compras Automáticas Ativadas</h4>
              <p className="text-sm text-purple-700">As automações de compra de URs foram configuradas e estão ativas</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clientsWithOptIn.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Limite Mensal Total</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMonthlyVolume)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Automações Ativas</p>
              <p className="text-2xl font-bold text-green-600">{clientsWithOptIn.length}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Clientes com Compra Ativa:</h5>
            {clientsWithOptIn.map((client) => {
              const config = getAutomationConfig(client.id);
              return (
                <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-600">{client.document}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-600">
                        R$ {config.monthlyLimit || '0'}/mês
                      </p>
                      <p className="text-xs text-gray-500">
                        {config.scheduleMode === 'monthly' ? 'Rotina mensal' : 'Período fixo'}
                        {config.minURValue && ` • UR min R$ ${config.minURValue}`}
                        {config.maxURValue && ` • UR max R$ ${config.maxURValue}`}
                      </p>
                    </div>
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">Próximos Passos</p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• A operação foi enviada para aprovação e pode ser acompanhada no <strong>menu de Operações</strong></li>
                <li>• As automações irão comprar URs disponíveis dentro dos limites configurados</li>
                <li>• A titularidade será transferida automaticamente após cada compra</li>
                <li>• Acompanhe o progresso no módulo de Monitoramento</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4">
          <button
            onClick={handleCloseJourney}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span>Finalizar e Fechar</span>
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Troca de Titularidade Automática</h2>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-2 ${currentStep === 'clients' ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'clients' ? 'bg-purple-600 text-white' : currentStep === 'automation' || currentStep === 'summary' ? 'bg-purple-200 text-purple-700' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Clientes & Opt-in</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'automation' ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'automation' ? 'bg-purple-600 text-white' : currentStep === 'summary' ? 'bg-purple-200 text-purple-700' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Automação</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'summary' ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'summary' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    3
                  </div>
                  <span className="text-sm font-medium">Resumo</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {currentStep === 'clients' && renderClientsStep()}
            {currentStep === 'automation' && renderAutomationStep()}
            {currentStep === 'summary' && renderSummaryStep()}
          </div>
        </div>
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
        <SearchClientModal
          isOpen={isSearchClientModalOpen}
          onClose={() => setIsSearchClientModalOpen(false)}
          onSelectClients={(clients) => {
            const clientsToAdd = Array.isArray(clients) ? clients : [clients];
            setImportedClients(prev => [...prev, ...clientsToAdd]);
            setIsSearchClientModalOpen(false);
          }}
        />
      )}

      <OperationConfirmationModal
        isOpen={showOperationConfirmation}
        onClose={handleConfirmOperations}
        clientName={`${clientsWithOptIn.length} clientes`}
      />
    </>
  );
};

interface SearchClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClients: (clients: Client | Client[]) => void;
}

const SearchClientModal: React.FC<SearchClientModalProps> = ({ isOpen, onClose, onSelectClients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const mockClients: Client[] = [
    {
      id: '1',
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
      id: '2',
      name: 'XYZ Indústria S.A.',
      document: '98.765.432/0001-10',
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
      id: '3',
      name: 'Tech Solutions Brasil',
      document: '11.222.333/0001-44',
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
      id: '4',
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
      id: '5',
      name: 'Distribuidora Nacional',
      document: '33.444.555/0001-66',
      email: 'vendas@distribuidoranacional.com.br',
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
  ];

  const filteredClients = mockClients.filter(client =>
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

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleConfirm = () => {
    const selected = mockClients.filter(client => selectedClients.has(client.id));
    if (selected.length > 0) {
      onSelectClients(selected);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {filteredClients.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Selecionar todos ({filteredClients.length})
                </span>
              </label>
            </div>
          )}

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
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClientSelection(client.id)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-600">{client.document}</div>
                        <div className="text-xs text-gray-500">{client.email}</div>
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
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Adicionar {selectedClients.size > 0 ? `${selectedClients.size} Cliente${selectedClients.size > 1 ? 's' : ''}` : 'Clientes'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
