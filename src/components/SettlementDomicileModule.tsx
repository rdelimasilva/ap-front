import React, { useState } from 'react';
import {
  Save,
  Plus,
  Edit,
  Trash2,
  Building2,
  CreditCard,
  Search,
  X,
  Check,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { showToast } from '../hooks/useToast';
import { useData } from '../context/DataContext';

interface MasterAccount {
  id: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  agency: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'escrow';
  accountHolder: string;
  document: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TransitoryAccount {
  id: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  agency: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'escrow';
  accountHolder: string;
  document: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  'checking': 'Conta Corrente',
  'savings': 'Conta Poupança',
  'escrow': 'Conta Escrow'
};

export const SettlementDomicileModule: React.FC = () => {
  const { clients } = useData();
  const [activeTab, setActiveTab] = useState<'master' | 'transitory'>('master');

  const [masterAccount, setMasterAccount] = useState<MasterAccount>({
    id: 'master-1',
    accountName: 'Conta Master - Liquidação',
    bankName: 'Banco do Brasil',
    bankCode: '001',
    agency: '1234-5',
    accountNumber: '12345678-9',
    accountType: 'escrow',
    accountHolder: 'GCR Gestão de Crédito Ltda.',
    document: '12.345.678/0001-90',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  });

  const [transitoryAccounts, setTransitoryAccounts] = useState<TransitoryAccount[]>([
    {
      id: 'trans-1',
      clientId: '1',
      clientName: 'ABC Comércio S.A.',
      clientDocument: '12.345.678/0001-90',
      accountName: 'Conta Transitória - ABC Comércio',
      bankName: 'Itaú Unibanco',
      bankCode: '341',
      agency: '5678',
      accountNumber: '87654321-0',
      accountType: 'checking',
      accountHolder: 'ABC Comércio S.A.',
      document: '12.345.678/0001-90',
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: 'trans-2',
      clientId: '2',
      clientName: 'XYZ Indústria Ltda.',
      clientDocument: '23.456.789/0001-01',
      accountName: 'Conta Transitória - XYZ Indústria',
      bankName: 'Santander',
      bankCode: '033',
      agency: '9876',
      accountNumber: '11223344-5',
      accountType: 'checking',
      accountHolder: 'XYZ Indústria Ltda.',
      document: '23.456.789/0001-01',
      isActive: true,
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-12')
    },
    {
      id: 'trans-3',
      clientId: '4',
      clientName: 'Varejo Prime Ltda.',
      clientDocument: '45.678.901/0001-23',
      accountName: 'Conta Transitória - Varejo Prime',
      bankName: 'Bradesco',
      bankCode: '237',
      agency: '4321',
      accountNumber: '99887766-1',
      accountType: 'checking',
      accountHolder: 'Varejo Prime Ltda.',
      document: '45.678.901/0001-23',
      isActive: false,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-15')
    }
  ]);

  const [showTransitoryForm, setShowTransitoryForm] = useState(false);
  const [editingTransitory, setEditingTransitory] = useState<TransitoryAccount | null>(null);
  const [editingMaster, setEditingMaster] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState<string | null>(null);
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null);

  const [masterFormData, setMasterFormData] = useState({
    accountName: '',
    bankName: '',
    bankCode: '',
    agency: '',
    accountNumber: '',
    accountType: 'escrow' as 'checking' | 'savings' | 'escrow',
    accountHolder: '',
    document: ''
  });

  const [transitoryFormData, setTransitoryFormData] = useState({
    clientId: '',
    accountName: '',
    bankName: '',
    bankCode: '',
    agency: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings' | 'escrow',
    accountHolder: '',
    document: ''
  });

  const activeClients = clients.filter(c => c.status === 'active');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    const visiblePart = accountNumber.slice(-4);
    const maskedPart = '*'.repeat(accountNumber.length - 4);
    return maskedPart + visiblePart;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- Master account handlers ---
  const handleEditMaster = () => {
    setMasterFormData({
      accountName: masterAccount.accountName,
      bankName: masterAccount.bankName,
      bankCode: masterAccount.bankCode,
      agency: masterAccount.agency,
      accountNumber: masterAccount.accountNumber,
      accountType: masterAccount.accountType,
      accountHolder: masterAccount.accountHolder,
      document: masterAccount.document
    });
    setEditingMaster(true);
  };

  const handleUpdateMaster = () => {
    if (masterFormData.accountName && masterFormData.bankName && masterFormData.bankCode &&
        masterFormData.agency && masterFormData.accountNumber && masterFormData.accountHolder &&
        masterFormData.document) {
      setMasterAccount(prev => ({
        ...prev,
        ...masterFormData,
        updatedAt: new Date()
      }));
      setEditingMaster(false);
      setHasChanges(true);
      showToast('success', 'Conta Master atualizada com sucesso');
    }
  };

  const handleCancelMasterEdit = () => {
    setEditingMaster(false);
  };

  // --- Transitory account handlers ---
  const handleClientSelect = (clientId: string) => {
    const client = activeClients.find(c => c.id === clientId);
    if (client) {
      setTransitoryFormData(prev => ({
        ...prev,
        clientId,
        accountHolder: client.name,
        document: client.document
      }));
    } else {
      setTransitoryFormData(prev => ({
        ...prev,
        clientId: '',
        accountHolder: '',
        document: ''
      }));
    }
  };

  const handleAddTransitory = () => {
    if (transitoryFormData.clientId && transitoryFormData.bankName && transitoryFormData.bankCode &&
        transitoryFormData.agency && transitoryFormData.accountNumber && transitoryFormData.accountHolder &&
        transitoryFormData.document) {
      const client = activeClients.find(c => c.id === transitoryFormData.clientId);
      if (!client) return;

      const newAccount: TransitoryAccount = {
        id: `trans-${Date.now()}`,
        clientId: transitoryFormData.clientId,
        clientName: client.name,
        clientDocument: client.document,
        accountName: transitoryFormData.accountName || `Conta Transitória - ${client.name}`,
        bankName: transitoryFormData.bankName,
        bankCode: transitoryFormData.bankCode,
        agency: transitoryFormData.agency,
        accountNumber: transitoryFormData.accountNumber,
        accountType: transitoryFormData.accountType,
        accountHolder: transitoryFormData.accountHolder,
        document: transitoryFormData.document,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setTransitoryAccounts(prev => [...prev, newAccount]);
      handleCancelTransitoryForm();
      setHasChanges(true);
      showToast('success', 'Conta transitória adicionada com sucesso');
    }
  };

  const handleEditTransitory = (account: TransitoryAccount) => {
    setEditingTransitory(account);
    setTransitoryFormData({
      clientId: account.clientId,
      accountName: account.accountName,
      bankName: account.bankName,
      bankCode: account.bankCode,
      agency: account.agency,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      accountHolder: account.accountHolder,
      document: account.document
    });
    setShowTransitoryForm(true);
  };

  const handleUpdateTransitory = () => {
    if (editingTransitory && transitoryFormData.bankName && transitoryFormData.bankCode &&
        transitoryFormData.agency && transitoryFormData.accountNumber && transitoryFormData.accountHolder &&
        transitoryFormData.document) {
      setTransitoryAccounts(prev => prev.map(account =>
        account.id === editingTransitory.id
          ? {
              ...account,
              accountName: transitoryFormData.accountName || account.accountName,
              bankName: transitoryFormData.bankName,
              bankCode: transitoryFormData.bankCode,
              agency: transitoryFormData.agency,
              accountNumber: transitoryFormData.accountNumber,
              accountType: transitoryFormData.accountType,
              accountHolder: transitoryFormData.accountHolder,
              document: transitoryFormData.document,
              updatedAt: new Date()
            }
          : account
      ));
      handleCancelTransitoryForm();
      setHasChanges(true);
      showToast('success', 'Conta transitória atualizada com sucesso');
    }
  };

  const handleDeleteTransitory = (accountId: string) => {
    setConfirmDeleteAccountId(accountId);
  };

  const confirmDeleteAccount = () => {
    if (!confirmDeleteAccountId) return;
    setTransitoryAccounts(prev => prev.filter(account => account.id !== confirmDeleteAccountId));
    setHasChanges(true);
    showToast('success', 'Conta transitória excluída com sucesso');
    setConfirmDeleteAccountId(null);
  };

  const handleToggleTransitoryActive = (accountId: string) => {
    setTransitoryAccounts(prev => prev.map(account =>
      account.id === accountId
        ? { ...account, isActive: !account.isActive, updatedAt: new Date() }
        : account
    ));
    setHasChanges(true);
  };

  const handleCancelTransitoryForm = () => {
    setShowTransitoryForm(false);
    setEditingTransitory(null);
    setTransitoryFormData({
      clientId: '',
      accountName: '',
      bankName: '',
      bankCode: '',
      agency: '',
      accountNumber: '',
      accountType: 'checking',
      accountHolder: '',
      document: ''
    });
  };

  const handleSave = () => {
    console.log('Saving master account:', masterAccount);
    console.log('Saving transitory accounts:', transitoryAccounts);
    setHasChanges(false);
    showToast('success', 'Alterações salvas com sucesso');
  };

  const isTransitoryFormValid = () => {
    return transitoryFormData.clientId && transitoryFormData.bankName && transitoryFormData.bankCode &&
           transitoryFormData.agency && transitoryFormData.accountNumber && transitoryFormData.accountHolder &&
           transitoryFormData.document;
  };

  const isMasterFormValid = () => {
    return masterFormData.accountName && masterFormData.bankName && masterFormData.bankCode &&
           masterFormData.agency && masterFormData.accountNumber && masterFormData.accountHolder &&
           masterFormData.document;
  };

  const filteredTransitoryAccounts = transitoryAccounts.filter(account => {
    const matchesSearch = account.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountNumber.includes(searchTerm) ||
                         account.clientDocument.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && account.isActive) ||
                         (statusFilter === 'inactive' && !account.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 font-medium">Alterações não salvas</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Você tem alterações não salvas. Clique em "Salvar" para aplicá-las.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('master')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'master'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Conta Master
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transitory')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transitory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Contas Transitórias
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'transitory' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {transitoryAccounts.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* ===== MASTER TAB ===== */}
        {activeTab === 'master' && (
          <div className="p-6">
            {editingMaster ? (
              /* Master Edit Form */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Editar Conta Master</h3>
                  <button
                    onClick={handleCancelMasterEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Nome da Conta *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.accountName}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="Ex: Conta Master - Liquidação"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Banco *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.bankName}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Ex: Banco do Brasil"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Código do Banco *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.bankCode}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, bankCode: e.target.value }))}
                      placeholder="Ex: 001"
                      maxLength={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Agência *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.agency}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, agency: e.target.value }))}
                      placeholder="Ex: 1234-5"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Número da Conta *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.accountNumber}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Ex: 12345678-9"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Tipo de Conta *
                    </label>
                    <select
                      value={masterFormData.accountType}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, accountType: e.target.value as 'checking' | 'savings' | 'escrow' }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    >
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Conta Poupança</option>
                      <option value="escrow">Conta Escrow</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Titular da Conta *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.accountHolder}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                      placeholder="Ex: GCR Gestão de Crédito Ltda."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      CNPJ/CPF *
                    </label>
                    <input
                      type="text"
                      value={masterFormData.document}
                      onChange={(e) => setMasterFormData(prev => ({ ...prev, document: e.target.value }))}
                      placeholder="Ex: 12.345.678/0001-90"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancelMasterEdit}
                    className="px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors h-8 flex items-center justify-center text-sm font-normal"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateMaster}
                    disabled={!isMasterFormValid()}
                    className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
                  >
                    Atualizar Conta Master
                  </button>
                </div>
              </div>
            ) : (
              /* Master Account Card */
              <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{masterAccount.accountName}</h4>
                      <p className="text-sm text-gray-500">Conta principal de liquidação</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      masterAccount.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {masterAccount.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                    <button
                      onClick={handleEditMaster}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-100"
                      title="Editar conta master"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Banco</p>
                    <p className="font-medium text-gray-900">{masterAccount.bankName} ({masterAccount.bankCode})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Agência / Conta</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {masterAccount.agency} / {showAccountDetails === masterAccount.id ? masterAccount.accountNumber : maskAccountNumber(masterAccount.accountNumber)}
                      </p>
                      <button
                        onClick={() => setShowAccountDetails(showAccountDetails === masterAccount.id ? null : masterAccount.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showAccountDetails === masterAccount.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(masterAccount.accountNumber, `account-${masterAccount.id}`)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copiar número da conta"
                      >
                        {copiedField === `account-${masterAccount.id}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium text-gray-900">{ACCOUNT_TYPE_LABELS[masterAccount.accountType]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Titular</p>
                    <p className="font-medium text-gray-900">{masterAccount.accountHolder}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CNPJ/CPF</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{masterAccount.document}</p>
                      <button
                        onClick={() => copyToClipboard(masterAccount.document, `document-${masterAccount.id}`)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copiar documento"
                      >
                        {copiedField === `document-${masterAccount.id}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div />
                </div>

                <div className="text-xs text-gray-500 pt-3 border-t border-blue-200">
                  Criada em {formatDate(masterAccount.createdAt)}
                  {masterAccount.updatedAt.getTime() !== masterAccount.createdAt.getTime() && (
                    <span> • Atualizada em {formatDate(masterAccount.updatedAt)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TRANSITORY TAB ===== */}
        {activeTab === 'transitory' && (
          <div className="p-6">

            {/* Transitory Form */}
            {showTransitoryForm && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingTransitory ? 'Editar Conta Transitória' : 'Nova Conta Transitória'}
                  </h3>
                  <button
                    onClick={handleCancelTransitoryForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Client Selector */}
                <div className="mb-6">
                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Cliente *
                    </label>
                    <select
                      value={transitoryFormData.clientId}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      disabled={!!editingTransitory}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione um cliente...</option>
                      {activeClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} — {client.document}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Nome da Conta
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.accountName}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="Ex: Conta Transitória - Cliente"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Banco *
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.bankName}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Ex: Itaú Unibanco"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Código do Banco *
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.bankCode}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, bankCode: e.target.value }))}
                      placeholder="Ex: 341"
                      maxLength={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Agência *
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.agency}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, agency: e.target.value }))}
                      placeholder="Ex: 5678"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Número da Conta *
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.accountNumber}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Ex: 87654321-0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Tipo de Conta *
                    </label>
                    <select
                      value={transitoryFormData.accountType}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, accountType: e.target.value as 'checking' | 'savings' | 'escrow' }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    >
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Conta Poupança</option>
                      <option value="escrow">Conta Escrow</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      Titular da Conta *
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.accountHolder}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                      placeholder="Preenchido ao selecionar cliente"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="text-[15px] font-medium text-gray-700 w-32 flex-shrink-0 whitespace-nowrap">
                      CNPJ/CPF *
                    </label>
                    <input
                      type="text"
                      value={transitoryFormData.document}
                      onChange={(e) => setTransitoryFormData(prev => ({ ...prev, document: e.target.value }))}
                      placeholder="Preenchido ao selecionar cliente"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-[14px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancelTransitoryForm}
                    className="px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors h-8 flex items-center justify-center text-sm font-normal"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingTransitory ? handleUpdateTransitory : handleAddTransitory}
                    disabled={!isTransitoryFormValid()}
                    className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
                  >
                    {editingTransitory ? 'Atualizar Conta' : 'Adicionar Conta'}
                  </button>
                </div>
              </div>
            )}

            {/* Header with search, filters, and buttons */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contas Transitórias</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, banco..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-60 h-9 text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-9 text-sm"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativas</option>
                  <option value="inactive">Inativas</option>
                </select>
                <button
                  onClick={() => { setShowTransitoryForm(true); setEditingTransitory(null); }}
                  className="px-5 py-2 h-9 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm hover:shadow-md flex items-center space-x-2 text-sm font-medium whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Conta</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-5 py-2 h-9 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center space-x-2 text-sm font-medium whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>

            {/* Transitory Accounts Table */}
            {filteredTransitoryAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Banco</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Agência / Conta</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Titular</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransitoryAccounts.map((account) => (
                      <tr key={account.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!account.isActive ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{account.clientName}</p>
                            <p className="text-xs text-gray-500">{account.clientDocument}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{account.bankName}</p>
                          <p className="text-xs text-gray-500">Cód. {account.bankCode}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900">
                              {account.agency} / {showAccountDetails === account.id ? account.accountNumber : maskAccountNumber(account.accountNumber)}
                            </p>
                            <button
                              onClick={() => setShowAccountDetails(showAccountDetails === account.id ? null : account.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showAccountDetails === account.id ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(account.accountNumber, `account-${account.id}`)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copiar número da conta"
                            >
                              {copiedField === `account-${account.id}` ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {ACCOUNT_TYPE_LABELS[account.accountType]}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{account.accountHolder}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            account.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {account.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleToggleTransitoryActive(account.id)}
                              className={`transition-colors p-1.5 rounded-lg ${
                                account.isActive
                                  ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              }`}
                              title={account.isActive ? 'Desativar conta' : 'Ativar conta'}
                            >
                              {account.isActive ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditTransitory(account)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                              title="Editar conta"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransitory(account.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                              title="Excluir conta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-2">
                  {transitoryAccounts.length === 0 ? 'Nenhuma conta transitória cadastrada' : 'Nenhuma conta encontrada'}
                </div>
                <div className="text-sm text-gray-400">
                  {transitoryAccounts.length === 0
                    ? 'Adicione contas transitórias vinculadas a clientes'
                    : 'Tente ajustar os filtros de busca'
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Informações sobre Domicílio de Liquidação</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• <strong>Conta Master:</strong> Conta principal de liquidação da operação (escrow). Recebe todos os valores antes da distribuição.</li>
              <li>• <strong>Contas Transitórias:</strong> Contas vinculadas individualmente a cada cliente para repasse dos valores liquidados.</li>
              <li>• <strong>Segurança:</strong> Números de conta são mascarados por padrão para proteção dos dados.</li>
              <li>• <strong>Validação:</strong> Todas as contas passam por validação antes da ativação.</li>
              <li>• <strong>Auditoria:</strong> Todas as alterações são registradas com data e hora.</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteAccountId}
        title="Excluir conta transitória"
        message={`Tem certeza que deseja excluir a conta transitória vinculada a "${transitoryAccounts.find(a => a.id === confirmDeleteAccountId)?.clientName || ''}"?`}
        confirmText="Excluir"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setConfirmDeleteAccountId(null)}
      />
    </div>
  );
};
