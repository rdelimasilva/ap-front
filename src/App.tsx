import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProductModule } from './components/ProductModule';
import { ClientDetail } from './components/ClientDetail';
import { ClientDetailTest } from './components/ClientDetailTest';
import { ClientRadar } from './components/ClientRadar';
import { ScheduleView } from './components/ScheduleView';
import { ReportsModule } from './components/ReportsModule';
import { ClientTable } from './components/ClientTable';
import { EditClientModal } from './components/EditClientModal';
import { ContractTable } from './components/ContractTable';
import { ContractApprovalBoard } from './components/ContractApprovalBoard';
import { FormalizationModule } from './components/FormalizationModule';

import { OptInModule } from './components/OptInModule';
import { ContratosCercModule } from './components/ContratosCercModule';

import { PartnerRegistrationModule } from './components/PartnerRegistrationModule';
import { OverviewModule } from './components/OverviewModule';
import { NewClientModal } from './components/NewClientModal';
import { ImportClientsModal } from './components/ImportClientsModal';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { OptInSignature } from './components/OptInSignature';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { GlobalSearch } from './components/GlobalSearch';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import {
  mockProducts,
  mockReceivableReports,
} from './data/mockData';
import { Client, Contract } from './types';
import { useData } from './context/DataContext';
import { LoadingSpinner } from './components/LoadingSpinner';

const LazyContractDetail = React.lazy(() =>
  import('./components/ContractDetail').then(module => ({ default: module.ContractDetail }))
);

// Módulos de Acompanhamento, Configurações e Gestão de acessos — seções ocultas por hora.
// Mantidos como lazy imports para não pesar o bundle inicial mas continuar reativáveis rapidamente.
const LazyDailyMonitoringDashboard = React.lazy(() =>
  import('./components/DailyMonitoringDashboard').then(module => ({ default: module.DailyMonitoringDashboard }))
);
const LazyLiquidationProblemModule = React.lazy(() =>
  import('./components/LiquidationProblemModule').then(module => ({ default: module.LiquidationProblemModule }))
);
const LazyChargebackMonitoringModule = React.lazy(() =>
  import('./components/ChargebackMonitoringModule').then(module => ({ default: module.ChargebackMonitoringModule }))
);
const LazySettlementControlModule = React.lazy(() =>
  import('./components/SettlementControlModule').then(module => ({ default: module.SettlementControlModule }))
);
const LazyReceivablesLedgerModule = React.lazy(() =>
  import('./components/ReceivablesLedgerModule').then(module => ({ default: module.ReceivablesLedgerModule }))
);
const LazyDisputesModule = React.lazy(() =>
  import('./components/DisputesModule').then(module => ({ default: module.DisputesModule }))
);
const LazyFinancialModule = React.lazy(() =>
  import('./components/FinancialModule').then(module => ({ default: module.FinancialModule }))
);
const LazySettlementDomicileModule = React.lazy(() =>
  import('./components/SettlementDomicileModule').then(module => ({ default: module.SettlementDomicileModule }))
);
const LazyNotificationsModule = React.lazy(() =>
  import('./components/NotificationsModule').then(module => ({ default: module.NotificationsModule }))
);
const LazyMenuSetupModule = React.lazy(() =>
  import('./components/MenuSetupModule').then(module => ({ default: module.MenuSetupModule }))
);
const LazyAccessManagementModule = React.lazy(() =>
  import('./components/AccessManagementModule').then(module => ({ default: module.AccessManagementModule }))
);

function App() {
  const { clients: appClients, contracts: appContractsData, isLoading: _dataLoading, updateClient, retry: reloadClients } = useData();
  const isSignaturePage = window.location.pathname.startsWith('/optin-signature/');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [showRegister, setShowRegister] = useState(false);
  const [activeSection, setActiveSection] = useState('partner-registration');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientTest, setSelectedClientTest] = useState<Client | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [previousSection, setPreviousSection] = useState<string>('contracts');
  const [selectedClientForRadar, setSelectedClientForRadar] = useState<Client | null>(null);
  const [, setControlPanelOpenSection] = useState<string | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showImportClientsModal, setShowImportClientsModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [appContracts, setAppContracts] = useState(appContractsData);

  useEffect(() => {
    setAppContracts(appContractsData);
  }, [appContractsData]);

  const { toasts, removeToast, addToast } = useToast();

  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => {
        if (activeSection === 'clients' || activeSection === 'clients-test') {
          setShowNewClientModal(true);
        }
      },
      description: 'Abrir modal de novo cliente',
    },
    {
      key: 'k',
      ctrl: true,
      callback: () => {
        setShowGlobalSearch(true);
      },
      description: 'Busca global',
    },
    {
      key: '?',
      callback: () => {
        setShowShortcutsModal(true);
      },
      description: 'Mostrar atalhos de teclado',
    },
  ]);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setActiveSection('client-detail');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setActiveSection('clients');
  };

  const handleClientTestClick = (client: Client) => {
    setSelectedClientTest(client);
    setActiveSection('client-detail-test');
  };

  const handleBackToClientsTest = () => {
    setSelectedClientTest(null);
    setActiveSection('clients-test');
  };

  const handleProblemCardClick = (problemType: string) => {
    setControlPanelOpenSection(problemType);
    setActiveSection('control-panel');
  };

  const handleContractClick = (contract: Contract, fromSection?: string) => {
    setSelectedContract(contract);
    if (fromSection) {
      setPreviousSection(fromSection);
    }
    setActiveSection('contract-detail');
  };

  const handleBackToContracts = () => {
    setSelectedContract(null);
    setActiveSection(previousSection);
    setPreviousSection('contracts');
  };

  const handleRadarClick = (client: Client) => {
    setSelectedClientForRadar(client);
    setActiveSection('client-radar');
  };

  const handleBackFromRadar = () => {
    setSelectedClientForRadar(null);
    setActiveSection('clients');
  };

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  const handleLogin = (_email: string, _password: string) => {
    setIsAuthenticated(true);
  };

  const handleRegister = (_name: string, _email: string, _password: string) => {
    setIsAuthenticated(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowRegister(false);
    localStorage.removeItem('isAuthenticated');
  };

  if (isSignaturePage) {
    return <OptInSignature />;
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // Nomes mock de aprovadores para simular usuários distintos
  const mockApprovers = [
    { name: 'Ana Silva', role: 'Gerente de Operações' },
    { name: 'Ricardo Souza', role: 'Diretor Financeiro' },
  ];

  const addApprovalToContract = (contract: typeof appContracts[0]) => {
    const approverIndex = contract.approvals.length % mockApprovers.length;
    const approver = mockApprovers[approverIndex];
    const newApproval = {
      id: `apv-${contract.id}-${contract.approvals.length + 1}`,
      approverName: approver.name,
      approverRole: approver.role,
      approvedAt: new Date(),
    };
    const updatedApprovals = [...contract.approvals, newApproval];
    const isFullyApproved = updatedApprovals.length >= contract.requiredApprovals;
    return {
      ...contract,
      approvals: updatedApprovals,
      status: isFullyApproved ? 'active' as const : contract.status,
    };
  };

  const handleApproveContracts = (contractIds: string[]) => {
    let fullyApproved = 0;
    let partiallyApproved = 0;
    setAppContracts(prev =>
      prev.map(c => {
        if (!contractIds.includes(c.id)) return c;
        const updated = addApprovalToContract(c);
        if (updated.status === 'active') fullyApproved++;
        else partiallyApproved++;
        return updated;
      })
    );
    if (fullyApproved > 0 && partiallyApproved > 0) {
      addToast('success', `${fullyApproved} contrato${fullyApproved > 1 ? 's aprovados' : ' aprovado'}, ${partiallyApproved} aguardando 2ª aprovação`);
    } else if (fullyApproved > 0) {
      addToast('success', `${fullyApproved} contrato${fullyApproved > 1 ? 's aprovados' : ' aprovado'} com sucesso!`);
    } else {
      addToast('info', `${partiallyApproved} contrato${partiallyApproved > 1 ? 's' : ''} com 1ª aprovação registrada. Aguardando 2ª aprovação.`);
    }
  };

  const handleApproveSingleContract = (contractId: string) => {
    let wasFullyApproved = false;
    setAppContracts(prev =>
      prev.map(c => {
        if (c.id !== contractId) return c;
        const updated = addApprovalToContract(c);
        wasFullyApproved = updated.status === 'active';
        return updated;
      })
    );
    if (wasFullyApproved) {
      addToast('success', 'Contrato aprovado com sucesso!');
    } else {
      addToast('info', '1ª aprovação registrada. Aguardando 2ª aprovação para ativar o contrato.');
    }
  };

  const handleRejectContract = (contractId: string) => {
    setAppContracts(prev =>
      prev.map(c => c.id === contractId ? { ...c, status: 'closed' as const } : c)
    );
    addToast('error', 'Contrato reprovado', 'O contrato foi reprovado e encerrado.');
  };

  const pendingApprovalContracts = appContracts.filter(c => c.status === 'pending_approval');

  const pageTitleMap: Record<string, string> = {
    'overview': 'Captura de recebíveis',
    'guarantee': 'Garantia',
    'extra-limit': 'Crédito Pontual',
    'debt-settlement': 'Quitação',
    'anticipation': 'Antecipação',
    'clients': 'Clientes',
    'clients-test': 'Clientes',
    'client-detail': selectedClient?.name || 'Detalhe do Cliente',
    'client-detail-test': selectedClientTest?.name || 'Detalhe do Cliente',
    'client-radar': selectedClientForRadar?.name || 'Radar do Cliente',
    'contract-detail': selectedContract?.contractNumber || 'Detalhe do Contrato',
    'schedule-view': 'Agendas',
    'contracts-menu': 'Operações',
    'contract-approval': 'Aprovação de Contratos',
    'contracts': 'Contratos',
    'contratos-cerc': 'Registro CERC',
    'formalization': 'Formalização',
    'contracts-monitoring': 'Contratos',
    'settlement-control': 'Liquidações',
    'receivables-ledger': 'Conta corrente das URs',
    'optin-control': 'Opt-in',
    'reports': 'Relatórios',

    'opt-in': 'Opt-in',
    'notifications': 'Notificações',
    'settlement-domicile': 'Domicílio de Liquidação',
    'menu-setup': 'Configuração de Menus',
    'financial': 'Financeiro',
    'partner-registration': 'Cadastro',

    'reconciliation': 'Conciliação',
    'disputes': 'Contestações Abertas',
    'chargeback-monitoring': 'Chargeback',
    'liquidation-problems': 'Problemas de liquidação',
    'user-management': 'Gerenciamento de Usuários',
    'role-permissions': 'Perfis e Permissões',
    'access-logs': 'Logs de Acesso',
  };

  const pageTitle = pageTitleMap[activeSection] || 'Captura de recebíveis';

  const renderContent = () => {
    if (activeSection === 'client-radar' && selectedClientForRadar) {
      return <ClientRadar client={selectedClientForRadar} onBack={handleBackFromRadar} />;
    }

    if (activeSection === 'client-detail' && selectedClient) {
      return <ClientDetail client={selectedClient} onBack={handleBackToClients} />;
    }

    if (activeSection === 'client-detail-test' && selectedClientTest) {
      return <ClientDetailTest client={selectedClientTest} onBack={handleBackToClientsTest} />;
    }

    if (activeSection === 'contract-detail' && selectedContract) {
      return (
        <React.Suspense fallback={<LoadingSpinner size="lg" text="Carregando detalhes do contrato..." fullScreen />}>
          <LazyContractDetail contract={selectedContract} onBack={handleBackToContracts} />
        </React.Suspense>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewModule />;
      case 'guarantee':
        return (
          <ProductModule
            product={mockProducts[0]}
            clients={appClients.filter(c => c.status === 'active')}
            onClientClick={handleClientClick}
            onProblemCardClick={handleProblemCardClick}
          />
        );
      case 'extra-limit':
        return (
          <ProductModule
            product={mockProducts[1]}
            clients={appClients.filter(c => c.status === 'active')}
            onClientClick={handleClientClick}
            onProblemCardClick={handleProblemCardClick}
          />
        );
      case 'debt-settlement':
        return (
          <ProductModule
            product={mockProducts[2]}
            clients={appClients.filter(c => c.status === 'active')}
            onClientClick={handleClientClick}
            onProblemCardClick={handleProblemCardClick}
          />
        );
      case 'anticipation':
        return (
          <ProductModule
            product={mockProducts[3]}
            clients={appClients.filter(c => c.status === 'active')}
            onClientClick={handleClientClick}
            onProblemCardClick={handleProblemCardClick}
          />
        );
      case 'clients':
        return (
          <ClientTable
            clients={appClients}
            showScheduleRequest={false}
            onClientClick={handleClientClick}
            onRadarClick={handleRadarClick}
            onEditClient={(client) => setEditingClient(client)}
          />
        );
      case 'clients-test':
        return (
          <ClientTable
            clients={appClients}
            showScheduleRequest={false}
            onClientClick={handleClientTestClick}
            onRadarClick={handleRadarClick}
            onEditClient={(client) => setEditingClient(client)}
          />
        );
      case 'schedule-view':
        return <ScheduleView clients={appClients} />;
      case 'contracts-menu':
        return (
          <ContractTable
            contracts={appContracts.filter(c => c.status !== 'pending_approval')}
            onContractClick={handleContractClick}
            clients={appClients}
            simpleFilter={true}
          />
        );
      case 'contract-approval':
        return (
          <ContractApprovalBoard
            contracts={pendingApprovalContracts}
            clients={appClients}
            onApprove={handleApproveSingleContract}
            onApproveBatch={handleApproveContracts}
            onReject={handleRejectContract}
          />
        );
      case 'contracts':
        return (
          <ClientTable
            clients={appClients}
            showScheduleRequest={false}
            onClientClick={handleClientClick}
            onRadarClick={handleRadarClick}
            onEditClient={(client) => setEditingClient(client)}
          />
        );
      case 'contratos-cerc':
        return <ContratosCercModule />;
      case 'formalization':
        return <FormalizationModule clients={appClients} />;
      case 'contracts-monitoring':
        return <LazyDailyMonitoringDashboard onContractClick={(contract) => handleContractClick(contract, 'monitoring')} />;
      case 'settlement-control':
        return <LazySettlementControlModule />;
      case 'optin-control':
        return <OptInModule />;
      case 'reports':
        return <ReportsModule reports={mockReceivableReports} />;

      case 'opt-in':
        return <OptInModule />;
      case 'notifications':
        return <LazyNotificationsModule />;
      case 'settlement-domicile':
        return <LazySettlementDomicileModule />;
      case 'menu-setup':
        return <LazyMenuSetupModule />;
      case 'financial':
        return <LazyFinancialModule />;
      case 'partner-registration':
        return <PartnerRegistrationModule />;

      case 'reconciliation':
        return <LazySettlementControlModule />;
      case 'chargeback-monitoring':
        return <LazyChargebackMonitoringModule />;
      case 'liquidation-problems':
        return <LazyLiquidationProblemModule />;
      case 'receivables-ledger':
        return <LazyReceivablesLedgerModule />;
      case 'disputes':
        return <LazyDisputesModule />;
      case 'user-management':
        return <LazyAccessManagementModule section="user-management" />;
      case 'role-permissions':
        return <LazyAccessManagementModule section="role-permissions" />;
      case 'access-logs':
        return <LazyAccessManagementModule section="access-logs" />;
      default:
        return <OverviewModule />;
    }
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onHelpClick={() => setShowShortcutsModal(true)}
        />
        <Header
          onLogout={handleLogout}
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={pageTitle}
          onSearchClick={() => setShowGlobalSearch(true)}
        />
        <button
          onClick={() => setSidebarCollapsed(false)}
          className={`fixed top-[18px] sm:top-[18px] left-3 sm:left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-700 ${sidebarCollapsed ? 'lg:flex' : 'lg:hidden'} flex`}
          title="Abrir menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className={`ml-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} px-3 sm:px-4 md:px-6 pb-6 pt-[72px] sm:pt-[88px] transition-all duration-300`}>
          <React.Suspense fallback={<LoadingSpinner size="lg" text="Carregando..." fullScreen />}>
            {renderContent()}
          </React.Suspense>
        </div>
        <NewClientModal
          isOpen={showNewClientModal}
          onClose={() => { reloadClients(); setShowNewClientModal(false); }}
          onSave={(clientData) => {
            const nomes = Array.isArray(clientData) ? clientData.map(c => c.name).join(', ') : clientData.name;
            addToast('success', 'Cliente criado!', `${nomes} foi adicionado com sucesso`);
            reloadClients();
            setShowNewClientModal(false);
          }}
        />
        <ImportClientsModal
          isOpen={showImportClientsModal}
          onClose={() => setShowImportClientsModal(false)}
          onImport={(clients) => {
            addToast('success', 'Importação concluída', `${clients.length} clientes importados`);
          }}
        />
        {editingClient && (
          <EditClientModal
            isOpen={!!editingClient}
            onClose={() => setEditingClient(null)}
            client={editingClient}
            onSave={(clientId, data) => {
              updateClient(clientId, data)
                .then(() => {
                  addToast('success', 'Cliente atualizado com sucesso!');
                  setEditingClient(null);
                })
                .catch((err) => {
                  addToast('error', 'Erro ao atualizar cliente', err instanceof Error ? err.message : undefined);
                });
            }}
          />
        )}
        <GlobalSearch
          isOpen={showGlobalSearch}
          onClose={() => setShowGlobalSearch(false)}
          clients={appClients}
          contracts={appContracts}
          onNavigate={(type, id) => {
            if (type === 'section') {
              setActiveSection(id);
            } else if (type === 'client') {
              const client = appClients.find(c => c.id === id);
              if (client) {
                handleClientClick(client);
              }
            } else if (type === 'contract') {
              const contract = appContracts.find(c => c.id === id);
              if (contract) {
                setSelectedContract(contract);
                setActiveSection('contract-detail');
              }
            }
          }}
        />
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;
