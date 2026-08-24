import React from 'react';
import { Client } from '../types';
import { Calendar, Filter, X, CreditCard, Building2, CalendarDays, Lock, Unlock, FileText } from 'lucide-react';
import { showToast } from '../hooks/useToast';

interface ClientDetailTestProps {
  client: Client;
  onBack: () => void;
}

interface UR {
  id: string;
  flag: string;
  acquirer: string;
  value: number;
  settlementDate: Date;
  status: 'livre' | 'bloqueada';
  transactionDate?: Date;
  installments?: number;
  merchantName?: string;
  nsu?: string;
}

const mockURs: UR[] = [
  { id: 'UR-001', flag: 'Mastercard', acquirer: 'Dock', value: 12500, settlementDate: new Date('2024-01-15'), status: 'livre', transactionDate: new Date('2024-01-10'), installments: 1, merchantName: 'Loja ABC', nsu: '123456789' },
  { id: 'UR-002', flag: 'Visa', acquirer: 'Cielo', value: 8300, settlementDate: new Date('2024-01-16'), status: 'bloqueada', transactionDate: new Date('2024-01-11'), installments: 3, merchantName: 'Mercado XYZ', nsu: '987654321' },
  { id: 'UR-003', flag: 'Elo', acquirer: 'Dock', value: 15200, settlementDate: new Date('2024-01-17'), status: 'livre', transactionDate: new Date('2024-01-12'), installments: 1, merchantName: 'Restaurante Bom Sabor', nsu: '456789123' },
  { id: 'UR-004', flag: 'Mastercard', acquirer: 'Stone', value: 9800, settlementDate: new Date('2024-01-18'), status: 'bloqueada', transactionDate: new Date('2024-01-13'), installments: 2, merchantName: 'Farmácia Saúde', nsu: '789123456' },
  { id: 'UR-005', flag: 'Visa', acquirer: 'Dock', value: 22100, settlementDate: new Date('2024-01-19'), status: 'livre', transactionDate: new Date('2024-01-14'), installments: 1, merchantName: 'Posto de Combustível', nsu: '321654987' },
  { id: 'UR-006', flag: 'Elo', acquirer: 'PagSeguro', value: 6700, settlementDate: new Date('2024-01-20'), status: 'bloqueada', transactionDate: new Date('2024-01-15'), installments: 4, merchantName: 'Livraria Central', nsu: '654987321' },
  { id: 'UR-007', flag: 'Mastercard', acquirer: 'Dock', value: 18900, settlementDate: new Date('2024-01-21'), status: 'livre', transactionDate: new Date('2024-01-16'), installments: 1, merchantName: 'Academia Fitness', nsu: '147258369' },
  { id: 'UR-008', flag: 'Hipercard', acquirer: 'Rede', value: 5400, settlementDate: new Date('2024-01-22'), status: 'bloqueada', transactionDate: new Date('2024-01-17'), installments: 6, merchantName: 'Padaria Pão Quente', nsu: '963852741' },
  { id: 'UR-009', flag: 'Visa', acquirer: 'Dock', value: 31200, settlementDate: new Date('2024-01-23'), status: 'livre', transactionDate: new Date('2024-01-18'), installments: 1, merchantName: 'Supermercado Extra', nsu: '258369147' },
  { id: 'UR-010', flag: 'Mastercard', acquirer: 'Cielo', value: 14500, settlementDate: new Date('2024-01-24'), status: 'bloqueada', transactionDate: new Date('2024-01-19'), installments: 2, merchantName: 'Pet Shop Amigo', nsu: '852741963' },
  { id: 'UR-011', flag: 'Elo', acquirer: 'Dock', value: 9200, settlementDate: new Date('2024-01-25'), status: 'livre', transactionDate: new Date('2024-01-20'), installments: 1, merchantName: 'Ótica Visão', nsu: '369147258' },
  { id: 'UR-012', flag: 'Visa', acquirer: 'Stone', value: 27800, settlementDate: new Date('2024-01-26'), status: 'bloqueada', transactionDate: new Date('2024-01-21'), installments: 3, merchantName: 'Eletrônicos Tech', nsu: '741963852' },
  { id: 'UR-013', flag: 'Mastercard', acquirer: 'Dock', value: 19600, settlementDate: new Date('2024-01-27'), status: 'livre', transactionDate: new Date('2024-01-22'), installments: 1, merchantName: 'Boutique Moda', nsu: '159357246' },
  { id: 'UR-014', flag: 'Elo', acquirer: 'PagSeguro', value: 11300, settlementDate: new Date('2024-01-28'), status: 'bloqueada', transactionDate: new Date('2024-01-23'), installments: 5, merchantName: 'Joalheria Premium', nsu: '753159486' },
  { id: 'UR-015', flag: 'Visa', acquirer: 'Dock', value: 24700, settlementDate: new Date('2024-01-29'), status: 'livre', transactionDate: new Date('2024-01-24'), installments: 1, merchantName: 'Clínica Médica', nsu: '486753159' },
];

export const ClientDetailTest: React.FC<ClientDetailTestProps> = ({ client, onBack }) => {
  const [startDate, setStartDate] = React.useState('2024-01-01');
  const [endDate, setEndDate] = React.useState('2024-12-31');
  const [urStatusFilter, setUrStatusFilter] = React.useState<'all' | 'livre' | 'bloqueada'>('all');
  const [selectedUR, setSelectedUR] = React.useState<UR | null>(null);
  const [selectedURsForContract, setSelectedURsForContract] = React.useState<Set<string>>(new Set());
  const [showCreateContractModal, setShowCreateContractModal] = React.useState(false);
  const [contractData, setContractData] = React.useState({
    contractId: '',
    companyName: client.name,
    companyCNPJ: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    contactPerson: '',
    effectType: '',
    accountHolderName: '',
    accountHolderCPFCNPJ: '',
    accountType: '',
    ispbCompe: '',
    agency: '',
    accountNumber: ''
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

  const filteredURs = mockURs.filter(ur => {
    if (urStatusFilter !== 'all' && ur.status !== urStatusFilter) {
      return false;
    }

    const settlementDate = ur.settlementDate;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (settlementDate < start || settlementDate > end) {
      return false;
    }

    return true;
  });

  const handleURCheckboxToggle = (urId: string) => {
    const newSelected = new Set(selectedURsForContract);
    if (newSelected.has(urId)) {
      newSelected.delete(urId);
    } else {
      newSelected.add(urId);
    }
    setSelectedURsForContract(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedURsForContract.size === filteredURs.length) {
      setSelectedURsForContract(new Set());
    } else {
      setSelectedURsForContract(new Set(filteredURs.map(ur => ur.id)));
    }
  };

  const handleCreateContract = () => {
    const newContractId = `CONT-${Date.now().toString().slice(-8)}`;
    setContractData({
      ...contractData,
      contractId: newContractId
    });
    setShowCreateContractModal(true);
  };

  const handleConfirmContract = () => {
    const selectedURsList = filteredURs.filter(ur => selectedURsForContract.has(ur.id));
    const totalValue = selectedURsList.reduce((sum, ur) => sum + ur.value, 0);
    showToast('success', 'Contrato criado com sucesso!', `${contractData.contractId} — ${selectedURsList.length} URs, ${formatCurrency(totalValue)}`);
    setShowCreateContractModal(false);
    setSelectedURsForContract(new Set());
  };

  const totalSelectedValue = filteredURs
    .filter(ur => selectedURsForContract.has(ur.id))
    .reduce((sum, ur) => sum + ur.value, 0);

  const allSelected = filteredURs.length > 0 && selectedURsForContract.size === filteredURs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors h-8 flex items-center justify-center text-sm font-normal"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo das Agendas</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-medium text-gray-900">Volume Total de Agendas</p>
            </div>
            <p className="text-lg font-bold text-gray-900">R$ 450.000,00</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm font-medium text-gray-900">Agendas Bloqueadas</p>
            </div>
            <p className="text-lg font-bold text-gray-900">R$ 210.000,00</p>
          </div>

          <div className="pl-6 space-y-2">
            <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                <p className="text-xs font-medium text-gray-800">Agenda travada para esse Usuário</p>
              </div>
              <p className="text-sm font-bold text-gray-900">R$ 125.000,00</p>
            </div>

            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <p className="text-xs font-medium text-gray-800">Agenda travada outros</p>
              </div>
              <p className="text-sm font-bold text-gray-900">R$ 85.000,00</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-medium text-gray-900">Agendas Livres</p>
            </div>
            <p className="text-lg font-bold text-gray-900">R$ 240.000,00</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros de Período</h3>
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={urStatusFilter}
                onChange={(e) => {
                  setUrStatusFilter(e.target.value as 'all' | 'livre' | 'bloqueada');
                  setSelectedURsForContract(new Set());
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Todas as URs</option>
                <option value="livre">URs Livres</option>
                <option value="bloqueada">URs Bloqueadas</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm text-gray-700">Data Início:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedURsForContract(new Set());
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm text-gray-700">Data Fim:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedURsForContract(new Set());
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando URs de <span className="font-medium text-gray-900">{new Intl.DateTimeFormat('pt-BR').format(new Date(startDate))}</span> até <span className="font-medium text-gray-900">{new Intl.DateTimeFormat('pt-BR').format(new Date(endDate))}</span>
              </p>
              <p className="text-sm font-medium text-gray-900">
                {filteredURs.length} UR{filteredURs.length !== 1 ? 's' : ''} encontrada{filteredURs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento por UR</h3>

        {urStatusFilter === 'livre' && selectedURsForContract.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedURsForContract.size} UR{selectedURsForContract.size > 1 ? 's' : ''} selecionada{selectedURsForContract.size > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-600">
                Valor total: {formatCurrency(totalSelectedValue)}
              </p>
            </div>
            <button
              onClick={handleCreateContract}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Criar Contrato
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {urStatusFilter === 'livre' && (
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">UR ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bandeira</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Credenciadora</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Data de Liquidação</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredURs.map((ur) => (
                <tr
                  key={ur.id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                >
                  {urStatusFilter === 'livre' && (
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedURsForContract.has(ur.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleURCheckboxToggle(ur.id);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td
                    onClick={() => setSelectedUR(ur)}
                    className="py-3 px-4 text-sm text-gray-900 font-medium cursor-pointer"
                  >
                    {ur.id}
                  </td>
                  <td
                    onClick={() => setSelectedUR(ur)}
                    className="py-3 px-4 text-sm text-gray-700 cursor-pointer"
                  >
                    {ur.flag}
                  </td>
                  <td
                    onClick={() => setSelectedUR(ur)}
                    className="py-3 px-4 text-sm text-gray-700 cursor-pointer"
                  >
                    {ur.acquirer}
                  </td>
                  <td
                    onClick={() => setSelectedUR(ur)}
                    className="py-3 px-4 text-sm text-gray-900 font-medium text-right cursor-pointer"
                  >
                    {formatCurrency(ur.value)}
                  </td>
                  <td
                    onClick={() => setSelectedUR(ur)}
                    className="py-3 px-4 text-sm text-gray-700 text-center cursor-pointer"
                  >
                    {formatDate(ur.settlementDate)}
                  </td>
                  <td
                    onClick={() => setSelectedUR(ur)}
                    className="py-3 px-4 text-center cursor-pointer"
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      ur.status === 'livre'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ur.status === 'livre' ? 'Livre' : 'Bloqueada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredURs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma UR encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      {selectedUR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes da UR</h2>
                <p className="text-sm text-gray-600">{selectedUR.id}</p>
              </div>
              <button
                onClick={() => setSelectedUR(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {selectedUR.status === 'livre' ? (
                    <Unlock className="w-8 h-8 text-green-600" />
                  ) : (
                    <Lock className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`text-lg font-bold ${
                      selectedUR.status === 'livre' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {selectedUR.status === 'livre' ? 'Livre' : 'Bloqueada'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedUR.value)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">Bandeira</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedUR.flag}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-medium text-gray-700">Credenciadora</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedUR.acquirer}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <CalendarDays className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-gray-700">Data de Liquidação</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedUR.settlementDate)}</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <p className="text-sm font-medium text-gray-700">Data da Transação</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedUR.transactionDate ? formatDate(selectedUR.transactionDate) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Estabelecimento</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedUR.merchantName || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">NSU</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedUR.nsu || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Parcelas</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedUR.installments ? `${selectedUR.installments}x` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedUR(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Criar Novo Contrato</h2>
                <p className="text-sm text-gray-600">ID: {contractData.contractId}</p>
              </div>
              <button
                onClick={() => setShowCreateContractModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedURsForContract.size} UR{selectedURsForContract.size > 1 ? 's' : ''} selecionada{selectedURsForContract.size > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600">
                      Valor total do contrato: {formatCurrency(totalSelectedValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Dados da Empresa</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={contractData.companyName}
                      onChange={(e) => setContractData({ ...contractData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={contractData.companyCNPJ}
                      onChange={(e) => setContractData({ ...contractData, companyCNPJ: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pessoa de Contato
                    </label>
                    <input
                      type="text"
                      value={contractData.contactPerson}
                      onChange={(e) => setContractData({ ...contractData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={contractData.companyAddress}
                      onChange={(e) => setContractData({ ...contractData, companyAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Endereço completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={contractData.companyPhone}
                      onChange={(e) => setContractData({ ...contractData, companyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contractData.companyEmail}
                      onChange={(e) => setContractData({ ...contractData, companyEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Tipo de Efeito</span>
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-600">*</span> Tipo efeito:
                  </label>
                  <select
                    value={contractData.effectType}
                    onChange={(e) => setContractData({ ...contractData, effectType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o tipo de efeito</option>
                    <option value="troca-titularidade">Troca de Titularidade</option>
                    <option value="cessao-fiduciaria">Cessão Fiduciária</option>
                    <option value="onus-outros">Ônus - Outros</option>
                    <option value="bloqueio-judicial">Bloqueio Judicial</option>
                    <option value="promessa-cessao">Promessa de Cessão</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Dados de Pagamento</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome titular:
                    </label>
                    <input
                      type="text"
                      value={contractData.accountHolderName}
                      onChange={(e) => setContractData({ ...contractData, accountHolderName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do titular da conta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-600">*</span> CPF/CNPJ titular:
                    </label>
                    <input
                      type="text"
                      value={contractData.accountHolderCPFCNPJ}
                      onChange={(e) => setContractData({ ...contractData, accountHolderCPFCNPJ: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-600">*</span> Tipo conta:
                    </label>
                    <select
                      value={contractData.accountType}
                      onChange={(e) => setContractData({ ...contractData, accountType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione o tipo de conta</option>
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                      <option value="pagamento">Conta Pagamento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-600">*</span> ISPB/COMPE:
                    </label>
                    <input
                      type="text"
                      value={contractData.ispbCompe}
                      onChange={(e) => setContractData({ ...contractData, ispbCompe: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Código do banco"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-600">*</span> Agência:
                    </label>
                    <input
                      type="text"
                      value={contractData.agency}
                      onChange={(e) => setContractData({ ...contractData, agency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-600">*</span> Número da conta:
                    </label>
                    <input
                      type="text"
                      value={contractData.accountNumber}
                      onChange={(e) => setContractData({ ...contractData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>URs Selecionadas</span>
                </h3>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">UR ID</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Bandeira</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Credenciadora</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Valor</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Liquidação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredURs
                          .filter(ur => selectedURsForContract.has(ur.id))
                          .map((ur) => (
                            <tr key={ur.id} className="border-t border-gray-100">
                              <td className="py-2 px-3 text-xs text-gray-900 font-medium">{ur.id}</td>
                              <td className="py-2 px-3 text-xs text-gray-700">{ur.flag}</td>
                              <td className="py-2 px-3 text-xs text-gray-700">{ur.acquirer}</td>
                              <td className="py-2 px-3 text-xs text-gray-900 font-medium text-right">
                                {formatCurrency(ur.value)}
                              </td>
                              <td className="py-2 px-3 text-xs text-gray-700 text-center">
                                {formatDate(ur.settlementDate)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Valor Total das URs</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSelectedValue)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateContractModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmContract}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Confirmar e Criar Contrato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
