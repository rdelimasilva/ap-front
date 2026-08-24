import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, ArrowRight, Radar, Search, Users, CreditCard, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { ImportClientsModal } from './ImportClientsModal';
import { NewClientModal } from './NewClientModal';
import { ClientRadar } from './ClientRadar';
import { BatchReceivablesTable } from './BatchReceivablesTable';
import { BatchAdvancedConfigModal, AdvancedOperationConfig } from './BatchAdvancedConfigModal';
import { MassLockConfirmation } from './MassLockConfirmation';
import { OperationConfirmationModal } from './OperationConfirmationModal';
import { Client, ClientReceivables } from '../types';

interface PrepaymentJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  initialClient?: Client | null;
}

type Step = 'upload' | 'radar' | 'batch' | 'summary';

export const PrepaymentJourney: React.FC<PrepaymentJourneyProps> = ({ isOpen, onClose, initialClient }) => {
  const [currentStep, setCurrentStep] = useState<Step>(initialClient ? 'radar' : 'upload');
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient || null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchClientModalOpen, setIsSearchClientModalOpen] = useState(false);
  const [importedClients, setImportedClients] = useState<Client[]>(initialClient ? [initialClient] : []);
  const [_currentClientIndex, setCurrentClientIndex] = useState(0);
  const [clientsWithContracts, setClientsWithContracts] = useState<Set<string>>(new Set());
  const [optInAuthorizations, setOptInAuthorizations] = useState<Set<string>>(new Set());
  const [contractualConsents, setContractualConsents] = useState<Set<string>>(new Set());
  const [lockOperations, setLockOperations] = useState<Map<string, number>>(new Map());
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
  const [showMassLockConfirmation, setShowMassLockConfirmation] = useState(false);
  const [advancedConfigClient, setAdvancedConfigClient] = useState<string | null>(null);
  const [advancedConfigs, setAdvancedConfigs] = useState<Map<string, AdvancedOperationConfig>>(new Map());
  const [batchMode, setBatchMode] = useState(false);
  const [clientsReceivables, setClientsReceivables] = useState<ClientReceivables[]>([]);
  const [showOperationConfirmation, setShowOperationConfirmation] = useState(false);
  const [confirmedClientName, setConfirmedClientName] = useState<string>('');

  // Pre-payment specific: OR selection for payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (isOpen && initialClient) {
      setSelectedClient(initialClient);
      setImportedClients([initialClient]);
      setCurrentStep('radar');

      const receivables: ClientReceivables[] = [{
        clientId: initialClient.id,
        clientName: initialClient.name,
        clientDocument: initialClient.document,
        totalReceivables: Math.random() * 500000 + 100000,
        availableReceivables: Math.random() * 400000 + 80000,
        lockedReceivables: Math.random() * 100000,
        lastUpdate: new Date().toISOString(),
      }];
      setClientsReceivables(receivables);
      setOptInAuthorizations(new Set([initialClient.id]));
      setContractualConsents(new Set([initialClient.id]));
    }
  }, [isOpen, initialClient]);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleImportClients = (clients: Client[]) => {
    setImportedClients(clients);
    setIsImportModalOpen(false);

    const receivables: ClientReceivables[] = clients.map(client => ({
      clientId: client.id,
      clientName: client.name,
      clientDocument: client.document,
      totalReceivables: Math.random() * 500000 + 100000,
      availableReceivables: Math.random() * 400000 + 80000,
      lockedReceivables: Math.random() * 100000,
      lastUpdate: new Date().toISOString(),
      receivablesByAcquirer: [
        { acquirer: 'Cielo', total: Math.random() * 100000 + 20000, locked: Math.random() * 20000, available: Math.random() * 80000 + 20000 },
        { acquirer: 'Rede', total: Math.random() * 100000 + 20000, locked: Math.random() * 20000, available: Math.random() * 80000 + 20000 },
        { acquirer: 'Stone', total: Math.random() * 80000 + 10000, locked: Math.random() * 15000, available: Math.random() * 60000 + 10000 },
        { acquirer: 'GetNet', total: Math.random() * 60000 + 10000, locked: Math.random() * 10000, available: Math.random() * 50000 + 10000 },
      ],
    }));

    setClientsReceivables(receivables);

    if (clients.length > 0) {
      setSelectedClient(clients[0]);
      setCurrentClientIndex(0);
      setCurrentStep('radar');
    }
  };

  const handleManualClientAdd = (client: Client | Client[]) => {
    const clientsToAdd = Array.isArray(client) ? client : [client];

    setImportedClients(prev => [...prev, ...clientsToAdd]);

    const newReceivables: ClientReceivables[] = clientsToAdd.map(c => ({
      clientId: c.id,
      clientName: c.name,
      clientDocument: c.document,
      totalReceivables: Math.random() * 500000 + 100000,
      availableReceivables: Math.random() * 400000 + 80000,
      lockedReceivables: Math.random() * 100000,
      lastUpdate: new Date().toISOString(),
      receivablesByAcquirer: [
        { acquirer: 'Cielo', total: Math.random() * 100000 + 20000, locked: Math.random() * 20000, available: Math.random() * 80000 + 20000 },
        { acquirer: 'Rede', total: Math.random() * 100000 + 20000, locked: Math.random() * 20000, available: Math.random() * 80000 + 20000 },
        { acquirer: 'Stone', total: Math.random() * 80000 + 10000, locked: Math.random() * 15000, available: Math.random() * 60000 + 10000 },
      ],
    }));

    setClientsReceivables(prev => [...prev, ...newReceivables]);
  };

  const handleClientSelect = (client: Client) => {
    if (!optInAuthorizations.has(client.id) || !contractualConsents.has(client.id)) {
      return;
    }
    const index = importedClients.findIndex(c => c.id === client.id);
    setSelectedClient(client);
    setCurrentClientIndex(index);
    setCurrentStep('radar');
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

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setSelectedClient(null);
  };

  const toggleAllOptIns = () => {
    const eligibleClients = importedClients.filter(
      client => !clientsWithContracts.has(client.id)
    );

    if (eligibleClients.every(c => optInAuthorizations.has(c.id))) {
      eligibleClients.forEach(c => optInAuthorizations.delete(c.id));
      setOptInAuthorizations(new Set(optInAuthorizations));
    } else {
      eligibleClients.forEach(c => optInAuthorizations.add(c.id));
      setOptInAuthorizations(new Set(optInAuthorizations));
    }
  };

  const toggleAllContractualConsents = () => {
    const eligibleClients = importedClients.filter(
      client => !clientsWithContracts.has(client.id)
    );

    if (eligibleClients.every(c => contractualConsents.has(c.id))) {
      eligibleClients.forEach(c => contractualConsents.delete(c.id));
      setContractualConsents(new Set(contractualConsents));
    } else {
      eligibleClients.forEach(c => contractualConsents.add(c.id));
      setContractualConsents(new Set(contractualConsents));
    }
  };

  const handleSelectORsForPayment = () => {
    setShowPaymentModal(true);
  };

  const handleCloseJourney = () => {
    setImportedClients([]);
    setSelectedClient(null);
    setCurrentClientIndex(0);
    setClientsWithContracts(new Set());
    setOptInAuthorizations(new Set());
    setContractualConsents(new Set());
    setCurrentStep('upload');
    onClose();
  };

  const handlePaymentConfirmed = () => {
    if (selectedClient) {
      setClientsWithContracts(prev => new Set([...prev, selectedClient.id]));
      setConfirmedClientName(selectedClient.name);
    }
    setShowPaymentModal(false);
    setShowOperationConfirmation(true);
  };

  const handleOperationConfirmationClose = () => {
    setShowOperationConfirmation(false);

    const allHaveContracts = importedClients.every(client =>
      clientsWithContracts.has(client.id)
    );

    if (allHaveContracts) {
      setCurrentStep('summary');
    } else {
      setCurrentStep('upload');
    }
  };

  const handleBatchModeToggle = () => {
    if (!batchMode && importedClients.length > 0) {
      const eligibleClients = importedClients.filter(
        client => optInAuthorizations.has(client.id) && contractualConsents.has(client.id) && !clientsWithContracts.has(client.id)
      );
      setSelectedForBatch(new Set(eligibleClients.map(c => c.id)));
      setCurrentStep('batch');
    }
    setBatchMode(!batchMode);
  };

  const handleLockAmountChange = (clientId: string, amount: number) => {
    setLockOperations(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, amount);
      return newMap;
    });
  };

  const handleToggleClientForBatch = (clientId: string) => {
    setSelectedForBatch(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleMassLockConfirm = () => {
    selectedForBatch.forEach(clientId => {
      clientsWithContracts.add(clientId);
    });
    setClientsWithContracts(new Set(clientsWithContracts));
    setShowMassLockConfirmation(false);
    setCurrentStep('summary');
  };

  const handleBatchOperationConfirmationClose = () => {
    setShowOperationConfirmation(false);
    setCurrentStep('summary');
  };

  const handleOpenAdvancedConfig = (clientId: string) => {
    setAdvancedConfigClient(clientId);
  };

  const handleSaveAdvancedConfig = (config: AdvancedOperationConfig) => {
    if (advancedConfigClient) {
      setAdvancedConfigs(prev => {
        const newMap = new Map(prev);
        newMap.set(advancedConfigClient, config);
        return newMap;
      });
    }
    setAdvancedConfigClient(null);
  };

  // Get receivables data for the selected client
  const getClientReceivablesData = () => {
    if (!selectedClient) return null;
    return clientsReceivables.find(r => r.clientId === selectedClient.id);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 1: Adicionar Clientes</h3>
        <p className="text-gray-600">Escolha como adicionar os clientes para pré-pagamentos</p>
      </div>

      {/* Info box explaining the pre-payment flow */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <CreditCard className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900 mb-1">Pré-pagamento com Recebíveis</p>
          <p className="text-sm text-amber-800">
            Selecione ORs (Ordens de Recebíveis) <strong>livres</strong> dentro da janela mensal e utilize-as como pagamento antecipado. Somente ORs disponíveis (não oneradas) podem ser selecionadas.
          </p>
        </div>
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
              Clientes Adicionados ({clientsWithContracts.size}/{importedClients.length} com pagamento)
            </h4>
            <div className="flex items-center gap-3">
              {importedClients.filter(c => !clientsWithContracts.has(c.id)).length > 0 && (
                <>
                  <button
                    onClick={toggleAllOptIns}
                    className="flex items-center space-x-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar opt-in para todos</span>
                  </button>
                  <button
                    onClick={toggleAllContractualConsents}
                    className="flex items-center space-x-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar todas anuências</span>
                  </button>
                </>
              )}
              {importedClients.filter(c => optInAuthorizations.has(c.id) && contractualConsents.has(c.id) && !clientsWithContracts.has(c.id)).length > 1 && (
                <button
                  onClick={handleBatchModeToggle}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Selecionar ORs em Lote</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {importedClients.length > 0 && clientsWithContracts.size === importedClients.length && (
                <button
                  onClick={() => setCurrentStep('summary')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>Ver Resumo</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {importedClients.map((client) => {
              const hasContract = clientsWithContracts.has(client.id);
              const hasOptInAuth = optInAuthorizations.has(client.id);
              const hasContractualConsent = contractualConsents.has(client.id);
              const hasAllAuthorizations = hasOptInAuth && hasContractualConsent;
              return (
                <div key={client.id} className="space-y-2">
                  <button
                    onClick={() => handleClientSelect(client)}
                    disabled={!hasAllAuthorizations && !hasContract}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      hasContract
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : hasAllAuthorizations
                        ? 'bg-teal-50 border-teal-200 hover:bg-teal-100'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.document}</p>
                      {hasContract && (
                        <p className="text-xs text-green-600 font-medium mt-1">Pagamento registrado</p>
                      )}
                      {!hasContract && hasAllAuthorizations && (
                        <p className="text-xs text-teal-600 font-medium mt-1">Autorizações confirmadas - clique para ver ORs livres</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 ${hasContract ? 'text-green-600' : hasAllAuthorizations ? 'text-teal-600' : 'text-gray-400'}`} />
                      <ArrowRight className={`w-5 h-5 ${hasAllAuthorizations || hasContract ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                  </button>
                  {!hasContract && (
                    <div className="ml-4 pl-4 border-l-2 border-teal-200 space-y-2">
                      <label
                        className="flex items-start space-x-3 cursor-pointer py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={hasOptInAuth}
                          onChange={(e) => toggleOptInAuthorization(client.id, e)}
                          className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
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
                          checked={hasContractualConsent}
                          onChange={(e) => toggleContractualConsent(client.id, e)}
                          className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-xs text-gray-700">
                          Tenho anuência contratual para onerar as agendas deste estabelecimento comercial
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderRadarStep = () => {
    if (!selectedClient) return null;

    const hasContract = clientsWithContracts.has(selectedClient.id);
    const allHaveContracts = importedClients.every(client => clientsWithContracts.has(client.id));
    const receivablesData = getClientReceivablesData();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Passo 2: Selecionar ORs Livres para Pagamento
            </h3>
            <p className="text-gray-600">
              {selectedClient.name} {hasContract && <span className="text-green-600 font-medium">(Pagamento Registrado)</span>}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Ver Lista de Clientes</span>
            </button>
            {!hasContract && (
              <button
                onClick={handleSelectORsForPayment}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                <span>Utilizar ORs para Pagamento</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {hasContract && allHaveContracts && (
              <button
                onClick={() => setCurrentStep('summary')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>Ver Resumo</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Window info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Janela Mensal Ativa</p>
            <p className="text-sm text-blue-800">
              Somente ORs <strong>livres</strong> (não oneradas) dentro da janela mensal corrente são elegíveis para pré-pagamento.
              Verifique os recebíveis disponíveis abaixo e selecione o valor desejado para utilizar como pagamento.
            </p>
          </div>
        </div>

        {/* Available ORs summary for payment */}
        {receivablesData && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">ORs Disponíveis na Janela</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total de Recebíveis</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(receivablesData.totalReceivables)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-green-700 mb-1">ORs Livres (Disponíveis)</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(receivablesData.availableReceivables)}</p>
                <p className="text-xs text-green-600 mt-1">Elegíveis para pré-pagamento</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-xs text-red-700 mb-1">ORs Oneradas (Bloqueadas)</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(receivablesData.lockedReceivables)}</p>
                <p className="text-xs text-red-600 mt-1">Não disponíveis</p>
              </div>
            </div>
          </div>
        )}

        <ClientRadar client={selectedClient} onBack={handleBackToUpload} />
      </div>
    );
  };

  const renderBatchStep = () => {
    const eligibleClients = clientsReceivables.filter(client =>
      optInAuthorizations.has(client.clientId) && contractualConsents.has(client.clientId) && !clientsWithContracts.has(client.clientId)
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Selecionar ORs Livres para Pagamento
            </h3>
            <p className="text-gray-600">
              Defina o valor das ORs livres a utilizar como pagamento para cada cliente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentStep('upload')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Voltar para Lista
            </button>
            <button
              onClick={() => setShowMassLockConfirmation(true)}
              disabled={selectedForBatch.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>Confirmar Pagamentos ({selectedForBatch.size})</span>
            </button>
          </div>
        </div>

        {/* Info about window-based ORs */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Apenas ORs <strong>livres dentro da janela mensal</strong> são exibidas. ORs oneradas ou fora da janela não estão disponíveis para seleção.
          </p>
        </div>

        <BatchReceivablesTable
          clients={eligibleClients}
          lockOperations={lockOperations}
          onLockAmountChange={handleLockAmountChange}
          onToggleClient={handleToggleClientForBatch}
          selectedClients={selectedForBatch}
          onOpenAdvancedConfig={handleOpenAdvancedConfig}
          advancedConfigs={advancedConfigs}
        />
      </div>
    );
  };

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 3: Resumo dos Pré-pagamentos</h3>
        <p className="text-gray-600">Pré-pagamentos registrados com sucesso</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-900">Pagamentos Aguardando Aprovação</h4>
            <p className="text-sm text-blue-700">As ORs selecionadas foram vinculadas como pagamento e aguardam aprovação</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
            <p className="text-2xl font-bold text-gray-900">{importedClients.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Aguardando Aprovação</p>
            <p className="text-2xl font-bold text-blue-600">{clientsWithContracts.size}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Taxa de Sucesso</p>
            <p className="text-2xl font-bold text-green-600">100%</p>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Clientes Processados:</h5>
          {importedClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-600">{client.document}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Aguardando Aprovação</span>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Radar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Próximos Passos</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• A operação foi enviada para aprovação e pode ser acompanhada no <strong>menu de Operações</strong></li>
              <li>• As ORs livres selecionadas serão utilizadas como pagamento após aprovação</li>
              <li>• Acompanhe o status dos recebíveis no módulo de Monitoramento</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => {
            setCurrentStep('radar');
            setSelectedClient(importedClients[importedClients.length - 1]);
            setCurrentClientIndex(importedClients.length - 1);
          }}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          Voltar para Agendas
        </button>
        <button
          onClick={handleCloseJourney}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>Finalizar e Fechar</span>
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pré-pagamentos</h2>
              <p className="text-sm text-gray-500 mt-0.5">Selecione ORs livres dentro da janela para utilizar como pagamento</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-teal-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'upload' ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Clientes</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'radar' ? 'text-teal-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'radar' ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">ORs Livres</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'summary' ? 'text-teal-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'summary' ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
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
            {currentStep === 'upload' && renderUploadStep()}
            {currentStep === 'radar' && renderRadarStep()}
            {currentStep === 'batch' && renderBatchStep()}
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

      {/* Payment modal - select free ORs for payment */}
      {showPaymentModal && selectedClient && (
        <PrepaymentORSelectionModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentConfirmed}
          clientName={selectedClient.name}
          availableReceivables={getClientReceivablesData()?.availableReceivables || 0}
          receivablesByAcquirer={getClientReceivablesData()?.receivablesByAcquirer || []}
        />
      )}

      {isSearchClientModalOpen && (
        <SearchClientModal
          isOpen={isSearchClientModalOpen}
          onClose={() => setIsSearchClientModalOpen(false)}
          onSelectClients={(clients) => {
            handleManualClientAdd(clients);
            setIsSearchClientModalOpen(false);
          }}
        />
      )}

      {showMassLockConfirmation && (
        <MassLockConfirmation
          isOpen={showMassLockConfirmation}
          onClose={() => setShowMassLockConfirmation(false)}
          onConfirm={handleMassLockConfirm}
          clients={clientsReceivables.filter(c => selectedForBatch.has(c.clientId))}
          lockOperations={lockOperations}
          selectedClients={selectedForBatch}
        />
      )}

      {advancedConfigClient && (
        <BatchAdvancedConfigModal
          isOpen={!!advancedConfigClient}
          onClose={() => setAdvancedConfigClient(null)}
          onSave={handleSaveAdvancedConfig}
          clientId={advancedConfigClient}
          clientName={importedClients.find(c => c.id === advancedConfigClient)?.name || ''}
          currentConfig={advancedConfigs.get(advancedConfigClient)}
        />
      )}

      <OperationConfirmationModal
        isOpen={showOperationConfirmation}
        onClose={currentStep === 'batch' ? handleBatchOperationConfirmationClose : handleOperationConfirmationClose}
        clientName={confirmedClientName}
      />
    </>
  );
};

// ========== Payment OR Selection Modal ==========

interface PrepaymentORSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  availableReceivables: number;
  receivablesByAcquirer: { acquirer: string; total: number; locked: number; available: number }[];
}

const PrepaymentORSelectionModal: React.FC<PrepaymentORSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  availableReceivables,
  receivablesByAcquirer,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedAcquirers, setSelectedAcquirers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const formatCurrencyValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/[^\d,]/g, '');
    if (numbers.includes(',')) {
      const [integer, decimal] = numbers.split(',');
      const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedInteger},${decimal.slice(0, 2)}`;
    }
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseCurrencyToNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleValueChange = (value: string) => {
    setPaymentAmount(formatCurrency(value));
  };

  const numericAmount = parseCurrencyToNumber(paymentAmount);
  const isValidAmount = numericAmount > 0 && numericAmount <= availableReceivables;

  const toggleAcquirer = (acquirer: string) => {
    setSelectedAcquirers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(acquirer)) {
        newSet.delete(acquirer);
      } else {
        newSet.add(acquirer);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirm();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pré-pagamento com ORs Livres</h2>
              <p className="text-sm text-gray-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Selecionar ORs para Pagamento</h3>
            </div>

            {/* Available ORs display */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">ORs Livres na Janela Mensal</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrencyValue(availableReceivables)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Payment value input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor para Pagamento *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder="0,00"
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg ${
                    paymentAmount && !isValidAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {paymentAmount && numericAmount > availableReceivables && (
                <p className="text-red-500 text-xs mt-1">Valor excede o total de ORs livres disponíveis</p>
              )}
              {isValidAmount && (
                <p className="text-green-600 text-xs mt-1">
                  {((numericAmount / availableReceivables) * 100).toFixed(1)}% das ORs livres disponíveis
                </p>
              )}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  As ORs livres selecionadas dentro da janela mensal serão utilizadas como pagamento antecipado.
                  Somente recebíveis disponíveis (não onerados) podem ser utilizados.
                </p>
              </div>
            </div>
          </div>

          {/* Acquirer breakdown */}
          {receivablesByAcquirer.length > 0 && (
            <div className="border border-gray-200 rounded-xl">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <span>ORs Livres por Credenciadora</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="px-6 pb-6 space-y-3 border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500">Selecione credenciadoras específicas para filtrar as ORs (opcional - todas são incluídas por padrão)</p>
                  {receivablesByAcquirer.map((acq) => (
                    <button
                      key={acq.acquirer}
                      type="button"
                      onClick={() => toggleAcquirer(acq.acquirer)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedAcquirers.size === 0 || selectedAcquirers.has(acq.acquirer)
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-200 bg-white opacity-60'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{acq.acquirer}</p>
                        <p className="text-xs text-gray-500">Total: {formatCurrencyValue(acq.total)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-700">{formatCurrencyValue(acq.available)}</p>
                        <p className="text-xs text-green-600">disponível</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How it works */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-green-800 mb-4">Como funciona o Pré-pagamento</h4>
            <div className="space-y-3">
              {[
                'Você seleciona ORs livres (não oneradas) dentro da janela mensal corrente',
                'O valor selecionado é utilizado como forma de pagamento antecipado',
                'As ORs são marcadas e o crédito é gerado ao estabelecimento',
                'Ao final da janela, ORs liquidadas completam o ciclo de pagamento',
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-200 text-green-800 text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-green-800">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount}
              className={`px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center ${
                isSubmitting || !isValidAmount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
              {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== Search Client Modal ==========

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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600'
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
