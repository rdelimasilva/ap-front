import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, ArrowRight, Radar, Search, Users, Lock } from 'lucide-react';
import { ImportClientsModal } from './ImportClientsModal';
import { NewClientModal } from './NewClientModal';
import { NewContractModal } from './NewContractModal';
import { ClientRadar } from './ClientRadar';
import { BatchReceivablesTable } from './BatchReceivablesTable';
import { BatchAdvancedConfigModal, AdvancedOperationConfig } from './BatchAdvancedConfigModal';
import { MassLockConfirmation } from './MassLockConfirmation';
import { OperationConfirmationModal } from './OperationConfirmationModal';
import { Client, ClientReceivables } from '../types';

interface GuaranteesJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  initialClient?: Client | null;
}

type Step = 'upload' | 'radar' | 'batch' | 'summary';

export const GuaranteesJourney: React.FC<GuaranteesJourneyProps> = ({ isOpen, onClose, initialClient }) => {
  const [currentStep, setCurrentStep] = useState<Step>(initialClient ? 'radar' : 'upload');
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient || null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
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

  const handleFinishAndLock = () => {
    setIsNewContractModalOpen(true);
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

  const handleContractCreated = () => {
    if (selectedClient) {
      setClientsWithContracts(prev => new Set([...prev, selectedClient.id]));
      setConfirmedClientName(selectedClient.name);
    }
    setIsNewContractModalOpen(false);
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


  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 1: Adicionar Clientes</h3>
        <p className="text-gray-600">Escolha como adicionar os clientes para garantias</p>
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
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-green-500 hover:bg-green-50 transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
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
              Clientes Adicionados ({clientsWithContracts.size}/{importedClients.length} com contrato)
            </h4>
            <div className="flex items-center gap-3">
              {importedClients.filter(c => !clientsWithContracts.has(c.id)).length > 0 && (
                <>
                  <button
                    onClick={toggleAllOptIns}
                    className="flex items-center space-x-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar opt-in para todos</span>
                  </button>
                  <button
                    onClick={toggleAllContractualConsents}
                    className="flex items-center space-x-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar todas anuências</span>
                  </button>
                </>
              )}
              {importedClients.filter(c => optInAuthorizations.has(c.id) && contractualConsents.has(c.id) && !clientsWithContracts.has(c.id)).length > 1 && (
                <button
                  onClick={handleBatchModeToggle}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Executar Operações</span>
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
            {importedClients.map((client, _index) => {
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
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.document}</p>
                      {hasContract && (
                        <p className="text-xs text-green-600 font-medium mt-1">Contrato criado</p>
                      )}
                      {!hasContract && hasAllAuthorizations && (
                        <p className="text-xs text-green-600 font-medium mt-1">Autorizações confirmadas</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 ${hasContract ? 'text-green-600' : hasAllAuthorizations ? 'text-green-600' : 'text-gray-400'}`} />
                      <ArrowRight className={`w-5 h-5 ${hasAllAuthorizations || hasContract ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                  </button>
                  {!hasContract && (
                    <div className="ml-4 pl-4 border-l-2 border-green-200 space-y-2">
                      <label
                        className="flex items-start space-x-3 cursor-pointer py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={hasOptInAuth}
                          onChange={(e) => toggleOptInAuthorization(client.id, e)}
                          className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
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
                          className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
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

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Passo 2: Verificar Agendas e Registrar Operação
            </h3>
            <p className="text-gray-600">
              {selectedClient.name} {hasContract && <span className="text-green-600 font-medium">(Contrato Criado)</span>}
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
                onClick={handleFinishAndLock}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>Registrar Operação</span>
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
              Executar Operações - Recebíveis
            </h3>
            <p className="text-gray-600">
              Configure os valores a serem travados para cada cliente
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>Travar Selecionados ({selectedForBatch.size})</span>
            </button>
          </div>
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Passo 3: Resumo das Garantias</h3>
        <p className="text-gray-600">Processo de garantias concluído com sucesso</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-900">Contratos Aguardando Aprovação</h4>
            <p className="text-sm text-blue-700">As operações foram registradas com sucesso e aguardam aprovação</p>
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
              <li>• As garantias foram formalizadas. Acompanhe o status e aprovação em Operações</li>
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
              <h2 className="text-2xl font-bold text-gray-900">Garantias</h2>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'upload' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Clientes</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'radar' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'radar' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Agendas</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'summary' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'summary' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
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

      <NewContractModal
        isOpen={isNewContractModalOpen}
        onClose={() => {
          setIsNewContractModalOpen(false);
        }}
        onSave={handleContractCreated}
        clientName={selectedClient?.name || ''}
      />

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
          selectedCount={selectedForBatch.size}
          totalAmount={Array.from(selectedForBatch).reduce((sum, clientId) => {
            return sum + (lockOperations.get(clientId) || 0);
          }, 0)}
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
