import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  TrendingDown,
  Shield,
  DollarSign,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Eye,
  X,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { RegistryProblem } from '../types';

interface RegistryProblemDetailProps {
  problemType: RegistryProblem['type'];
  acquirer: string;
  registry: string;
  problems: RegistryProblem[];
  onBack: () => void;
}

interface ProblemItem {
  id: string;
  contractNumber: string;
  clientName: string;
  receivableId: string;
  value: number;
  date: Date;
  status: 'pending' | 'investigating' | 'resolved' | 'failed';
  description: string;
  details: {
    merchantId?: string;
    terminalId?: string;
    nsu?: string;
    authCode?: string;
    rejectionReason?: string;
    chargebackReason?: string;
    lockFailureReason?: string;
  };
}

export const RegistryProblemDetail: React.FC<RegistryProblemDetailProps> = ({
  problemType,
  acquirer,
  registry,
  problems: _problems,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<ProblemItem | null>(null);

  // Mock detailed problem items - in real app this would come from API
  const mockProblemItems: ProblemItem[] = [
    {
      id: '1',
      contractNumber: 'CTR-2024-001',
      clientName: 'ABC Comércio S.A.',
      receivableId: 'UR-2024-001234',
      value: 2500.00,
      date: new Date('2024-01-15T13:30:00'),
      status: 'pending',
      description: problemType === 'domicile_change_rejected' 
        ? 'Troca de domicílio rejeitada pela credenciadora'
        : problemType === 'chargeback'
        ? 'Chargeback por transação não reconhecida'
        : 'Falha na aplicação de trava - UR não disponível',
      details: {
        merchantId: 'MERCH001',
        terminalId: 'TERM001',
        nsu: 'NSU123456',
        authCode: 'AUTH789012',
        rejectionReason: problemType === 'domicile_change_rejected' ? 'Dados bancários inválidos' : undefined,
        chargebackReason: problemType === 'chargeback' ? 'Transação não reconhecida pelo portador' : undefined,
        lockFailureReason: problemType === 'lock_application_failed' ? 'UR já onerada por outro processo' : undefined
      }
    },
    {
      id: '2',
      contractNumber: 'CTR-2024-002',
      clientName: 'XYZ Indústria Ltda.',
      receivableId: 'UR-2024-001235',
      value: 1800.00,
      date: new Date('2024-01-15T12:45:00'),
      status: 'investigating',
      description: problemType === 'domicile_change_rejected' 
        ? 'Troca de domicílio rejeitada pela credenciadora'
        : problemType === 'chargeback'
        ? 'Chargeback por fraude'
        : 'Falha na aplicação de trava - timeout na comunicação',
      details: {
        merchantId: 'MERCH002',
        terminalId: 'TERM002',
        nsu: 'NSU234567',
        authCode: 'AUTH890123',
        rejectionReason: problemType === 'domicile_change_rejected' ? 'Conta corrente inexistente' : undefined,
        chargebackReason: problemType === 'chargeback' ? 'Suspeita de fraude' : undefined,
        lockFailureReason: problemType === 'lock_application_failed' ? 'Timeout na comunicação com registradora' : undefined
      }
    },
    {
      id: '3',
      contractNumber: 'CTR-2024-003',
      clientName: 'Tech Solutions Brasil',
      receivableId: 'UR-2024-001236',
      value: 3200.00,
      date: new Date('2024-01-15T11:20:00'),
      status: 'resolved',
      description: problemType === 'domicile_change_rejected' 
        ? 'Troca de domicílio rejeitada pela credenciadora - Resolvido'
        : problemType === 'chargeback'
        ? 'Chargeback contestado com sucesso'
        : 'Falha na aplicação de trava - Resolvido com nova tentativa',
      details: {
        merchantId: 'MERCH003',
        terminalId: 'TERM003',
        nsu: 'NSU345678',
        authCode: 'AUTH901234',
        rejectionReason: problemType === 'domicile_change_rejected' ? 'Dados corrigidos e reenviados' : undefined,
        chargebackReason: problemType === 'chargeback' ? 'Contestação aceita pela operadora' : undefined,
        lockFailureReason: problemType === 'lock_application_failed' ? 'Resolvido com nova tentativa' : undefined
      }
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

  const getProblemTypeLabel = (type: RegistryProblem['type']) => {
    switch (type) {
      case 'domicile_change_rejected': return 'Troca de Domicílio Não Acatada';
      case 'chargeback': return 'Chargebacks';
      case 'lock_application_failed': return 'Aplicação de Trava Falhada';
      default: return 'Problema Desconhecido';
    }
  };

  const getProblemTypeIcon = (type: RegistryProblem['type']) => {
    switch (type) {
      case 'domicile_change_rejected': return <Building2 className="w-6 h-6 text-orange-600" />;
      case 'chargeback': return <TrendingDown className="w-6 h-6 text-red-600" />;
      case 'lock_application_failed': return <Shield className="w-6 h-6 text-yellow-600" />;
      default: return <AlertTriangle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProblemItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ProblemItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'investigating': return <Eye className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: ProblemItem['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'investigating': return 'Investigando';
      case 'resolved': return 'Resolvido';
      case 'failed': return 'Falhou';
      default: return 'Desconhecido';
    }
  };

  const filteredItems = mockProblemItems.filter(item => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.contractNumber.toLowerCase().includes(searchLower) ||
        item.clientName.toLowerCase().includes(searchLower) ||
        item.receivableId.toLowerCase().includes(searchLower) ||
        (item.details.merchantId && item.details.merchantId.toLowerCase().includes(searchLower)) ||
        (item.details.nsu && item.details.nsu.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    return true;
  });

  // Calculate statistics
  const stats = {
    total: filteredItems.length,
    pending: filteredItems.filter(i => i.status === 'pending').length,
    investigating: filteredItems.filter(i => i.status === 'investigating').length,
    resolved: filteredItems.filter(i => i.status === 'resolved').length,
    failed: filteredItems.filter(i => i.status === 'failed').length,
    totalValue: filteredItems.reduce((sum, i) => sum + i.value, 0)
  };

  const handleExport = () => {
    // Export problem details implementation
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors h-8 text-sm font-normal"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-100">
              {getProblemTypeIcon(problemType)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getProblemTypeLabel(problemType)}</h1>
              <p className="text-gray-600">{acquirer} • {registry}</p>
            </div>
          </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Investigando</p>
              <p className="text-2xl font-bold text-blue-600">{stats.investigating}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolvidos</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Falhados</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por contrato, cliente, UR, merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8 text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="investigating">Investigando</option>
            <option value="resolved">Resolvido</option>
            <option value="failed">Falhou</option>
          </select>
          <div className="text-sm text-gray-600">
            {filteredItems.length} de {mockProblemItems.length} itens
          </div>
        </div>
      </div>

      {/* Problem Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Itens com Problema</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.contractNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.receivableId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{getStatusLabel(item.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>{item.description}</div>
                      {item.details.merchantId && (
                        <div className="text-xs text-gray-500">Merchant: {item.details.merchantId}</div>
                      )}
                      {item.details.nsu && (
                        <div className="text-xs text-gray-500">NSU: {item.details.nsu}</div>
                      )}
                      {item.details.rejectionReason && (
                        <div className="text-xs text-red-600">Motivo: {item.details.rejectionReason}</div>
                      )}
                      {item.details.chargebackReason && (
                        <div className="text-xs text-red-600">Motivo: {item.details.chargebackReason}</div>
                      )}
                      {item.details.lockFailureReason && (
                        <div className="text-xs text-red-600">Motivo: {item.details.lockFailureReason}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {item.status === 'pending' && (
                        <button
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Tentar novamente"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">Nenhum item encontrado</div>
              <div className="text-sm text-gray-400">
                Tente ajustar os filtros ou termos de busca
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Problema</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
                  <p className="text-gray-900">{selectedItem.contractNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <p className="text-gray-900">{selectedItem.clientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UR</label>
                  <p className="text-gray-900">{selectedItem.receivableId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <p className="text-gray-900">{formatCurrency(selectedItem.value)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora</label>
                  <p className="text-gray-900">{formatDateTime(selectedItem.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                    {getStatusIcon(selectedItem.status)}
                    <span className="ml-1">{getStatusLabel(selectedItem.status)}</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedItem.description}</p>
              </div>

              {selectedItem.details.merchantId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                    <p className="text-gray-900">{selectedItem.details.merchantId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terminal ID</label>
                    <p className="text-gray-900">{selectedItem.details.terminalId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NSU</label>
                    <p className="text-gray-900">{selectedItem.details.nsu}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Autorização</label>
                    <p className="text-gray-900">{selectedItem.details.authCode}</p>
                  </div>
                </div>
              )}

              {(selectedItem.details.rejectionReason || selectedItem.details.chargebackReason || selectedItem.details.lockFailureReason) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo do Problema</label>
                  <p className="text-red-600 bg-red-50 p-3 rounded-lg">
                    {selectedItem.details.rejectionReason || selectedItem.details.chargebackReason || selectedItem.details.lockFailureReason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors h-8 flex items-center justify-center text-sm font-normal"
              >
                Fechar
              </button>
              {selectedItem.status === 'pending' && (
                <button className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-8 flex items-center justify-center text-sm font-normal">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};