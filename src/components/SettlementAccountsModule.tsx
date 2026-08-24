import React, { useState } from 'react';
import { 
  Building2, 
  Eye, 
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  CreditCard,
  X
} from 'lucide-react';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  agency: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  balance: number;
  isActive: boolean;
  lastUpdate: Date;
}

interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  reference: string;
  category: 'settlement' | 'fee' | 'chargeback' | 'transfer' | 'other';
}

type SortField = keyof Transaction | 'none';
type SortDirection = 'asc' | 'desc';

export const SettlementAccountsModule: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Mock data - in real app this would come from API
  const accounts: BankAccount[] = [
    {
      id: '1',
      accountName: 'Conta Principal - Operações',
      bankName: 'Banco do Brasil',
      bankCode: '001',
      agency: '1234-5',
      accountNumber: '12345678-9',
      accountType: 'escrow',
      balance: 2850000,
      isActive: true,
      lastUpdate: new Date('2024-01-15T14:30:00')
    },
    {
      id: '2',
      accountName: 'Conta Quitação',
      bankName: 'Itaú Unibanco',
      bankCode: '341',
      agency: '5678',
      accountNumber: '87654321-0',
      accountType: 'checking',
      balance: 1250000,
      isActive: true,
      lastUpdate: new Date('2024-01-15T12:15:00')
    },
    {
      id: '3',
      accountName: 'Conta Antecipação',
      bankName: 'Santander',
      bankCode: '033',
      agency: '9876',
      accountNumber: '11223344-5',
      accountType: 'checking',
      balance: 850000,
      isActive: false,
      lastUpdate: new Date('2024-01-14T16:45:00')
    }
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      accountId: '1',
      date: new Date('2024-01-15T14:30:00'),
      description: 'Liquidação URs - Contrato CTR-2024-001',
      type: 'credit',
      amount: 125000,
      balance: 2850000,
      reference: 'CTR-2024-001',
      category: 'settlement'
    },
    {
      id: '2',
      accountId: '1',
      date: new Date('2024-01-15T10:20:00'),
      description: 'Taxa de processamento',
      type: 'debit',
      amount: 2500,
      balance: 2725000,
      reference: 'FEE-001',
      category: 'fee'
    },
    {
      id: '3',
      accountId: '1',
      date: new Date('2024-01-14T16:45:00'),
      description: 'Chargeback - Transação contestada',
      type: 'debit',
      amount: 8000,
      balance: 2727500,
      reference: 'CB-2024-001',
      category: 'chargeback'
    },
    {
      id: '4',
      accountId: '1',
      date: new Date('2024-01-14T09:15:00'),
      description: 'Liquidação URs - Contrato CTR-2024-002',
      type: 'credit',
      amount: 85000,
      balance: 2735500,
      reference: 'CTR-2024-002',
      category: 'settlement'
    },
    {
      id: '5',
      accountId: '2',
      date: new Date('2024-01-15T12:15:00'),
      description: 'Quitação de dívida - Cliente ABC',
      type: 'credit',
      amount: 95000,
      balance: 1250000,
      reference: 'QD-2024-001',
      category: 'settlement'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryColor = (category: Transaction['category']) => {
    switch (category) {
      case 'settlement': return 'bg-green-100 text-green-800';
      case 'fee': return 'bg-yellow-100 text-yellow-800';
      case 'chargeback': return 'bg-red-100 text-red-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: Transaction['category']) => {
    switch (category) {
      case 'settlement': return 'Liquidação';
      case 'fee': return 'Taxa';
      case 'chargeback': return 'Chargeback';
      case 'transfer': return 'Transferência';
      case 'other': return 'Outros';
      default: return 'Outros';
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

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedAccount && transaction.accountId !== selectedAccount.id) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.reference.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (transactionType !== 'all' && transaction.type !== transactionType) return false;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (transaction.date < fromDate) return false;
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (transaction.date > toDate) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortField === 'none') return 0;
    
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

  const handleAccountClick = (account: BankAccount) => {
    setSelectedAccount(account);
  };

  const handleBackToAccounts = () => {
    setSelectedAccount(null);
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setTransactionType('all');
  };

  const handleExport = () => {
    console.log('Exportando extrato...');
  };

  // Calculate statistics for selected account
  const accountStats = selectedAccount ? {
    totalCredits: filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalDebits: filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: filteredTransactions.length,
    balance: selectedAccount.balance
  } : null;

  if (selectedAccount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToAccounts}
              className="text-gray-600 hover:text-gray-800 transition-colors h-8 flex items-center justify-center text-sm font-normal"
            >
              ← Voltar às Contas
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition-colors h-8 flex items-center justify-center text-sm font-normal"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            <button className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors h-8 flex items-center justify-center text-sm font-normal">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Banco</p>
              <p className="font-medium text-gray-900">{selectedAccount.bankName}</p>
              <p className="text-sm text-gray-500">Código: {selectedAccount.bankCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Agência / Conta</p>
              <p className="font-medium text-gray-900">{selectedAccount.agency}</p>
              <p className="text-sm text-gray-500">{selectedAccount.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Saldo Atual</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedAccount.balance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Última Atualização</p>
              <p className="font-medium text-gray-900">{formatDateTime(selectedAccount.lastUpdate)}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {accountStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Créditos</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(accountStats.totalCredits)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Débitos</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(accountStats.totalDebits)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transações</p>
                  <p className="text-xl font-bold text-blue-600">{accountStats.transactionCount}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saldo</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(accountStats.balance)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
              />
            </div>

            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm flex items-center"
            >
              <option value="all">Todos os tipos</option>
              <option value="credit">Créditos</option>
              <option value="debit">Débitos</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
              placeholder="Data inicial"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
              placeholder="Data final"
            />

            <button
              onClick={() => {
                setSearchTerm('');
                setDateFrom('');
                setDateTo('');
                setTransactionType('all');
              }}
              className="flex items-center justify-center space-x-2 px-3 text-gray-600 hover:text-gray-800 transition-colors h-8 text-sm font-normal"
            >
              <X className="w-4 h-4" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Extrato de Movimentação ({filteredTransactions.length} transações)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Data/Hora</span>
                      {getSortIcon('date')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('description')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Descrição</span>
                      {getSortIcon('description')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Tipo</span>
                      {getSortIcon('type')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Valor</span>
                      {getSortIcon('amount')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('balance')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Saldo</span>
                      {getSortIcon('balance')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referência
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                        {getCategoryLabel(transaction.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? 'Crédito' : 'Débito'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-2">Nenhuma transação encontrada</div>
                <div className="text-sm text-gray-400">
                  Tente ajustar os filtros ou período de busca
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors h-8 flex items-center justify-center text-sm font-normal">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar Saldos
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Contas</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contas Ativas</p>
              <p className="text-2xl font-bold text-green-600">{accounts.filter(a => a.isActive).length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Movimentações Hoje</p>
              <p className="text-2xl font-bold text-purple-600">
                {transactions.filter(t => {
                  const today = new Date();
                  return t.date.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Contas Disponíveis</h3>
        
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountClick(account)}
              className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                account.isActive 
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-md' 
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{account.accountName}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      account.accountType === 'checking' 
                        ? 'bg-blue-100 text-blue-800' 
                        : account.accountType === 'escrow'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.accountType === 'checking' ? 'Conta Corrente' : 
                       account.accountType === 'savings' ? 'Conta Poupança' : 'Conta Escrow'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Banco</p>
                      <p className="font-medium text-gray-900">{account.bankName} ({account.bankCode})</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Agência / Conta</p>
                      <p className="font-medium text-gray-900">{account.agency} / {account.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Saldo Atual</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(account.balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Última Atualização</p>
                      <p className="font-medium text-gray-900">{formatDateTime(account.lastUpdate)}</p>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    account.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">Nenhuma conta encontrada</div>
            <div className="text-sm text-gray-400">
              Configure contas de liquidação para visualizar os extratos
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
