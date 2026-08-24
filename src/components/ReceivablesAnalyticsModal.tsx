import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Receivable } from '../types';
import { saveContestacao, getContestacaoMotivo, hasContestacao } from '../utils/contestacaoStorage';

const CONTEST_REASON_OPTIONS = [
  { value: 'valor_a_menor', label: 'Valor a menor' },
  { value: 'maiores_informacoes', label: 'Maiores informações' },
  { value: 'outros', label: 'Outros' },
] as const;

interface ReceivablesAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractNumber: string;
  receivables: Receivable[];
}

interface DailyReceivables {
  date: Date;
  receivables: Receivable[];
  totalValue: number;
  totalEncumbered: number;
  count: number;
}

export const ReceivablesAnalyticsModal: React.FC<ReceivablesAnalyticsModalProps> = ({
  isOpen,
  onClose,
  contractNumber,
  receivables
}) => {
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [operationTypeFilter, setOperationTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [contestingReceivable, setContestingReceivable] = useState<Receivable | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [showContestacaoMotivo, setShowContestacaoMotivo] = useState<{ urId: string; motivo: string } | null>(null);
  const [valueMismatchFilter, setValueMismatchFilter] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const filteredReceivables = receivables.filter(r => {
    if (operationTypeFilter !== 'all' && r.operationType !== operationTypeFilter) return false;
    if (valueMismatchFilter && r.encumberedValue >= r.originalValue) return false;
    return true;
  });

  const totalValue = filteredReceivables.reduce((sum, r) => sum + r.originalValue, 0);
  const totalEncumberedValue = filteredReceivables.reduce((sum, r) => sum + r.encumberedValue, 0);

  const groupReceivablesByDate = (): DailyReceivables[] => {
    const groupedMap = new Map<string, DailyReceivables>();

    filteredReceivables.forEach(receivable => {
      const dateKey = receivable.settlementDate.toISOString().split('T')[0];

      if (!groupedMap.has(dateKey)) {
        groupedMap.set(dateKey, {
          date: receivable.settlementDate,
          receivables: [],
          totalValue: 0,
          totalEncumbered: 0,
          count: 0
        });
      }

      const group = groupedMap.get(dateKey)!;
      group.receivables.push(receivable);
      group.totalValue += receivable.originalValue;
      group.totalEncumbered += receivable.encumberedValue;
      group.count += 1;
    });

    return Array.from(groupedMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const dailyReceivables = groupReceivablesByDate();

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const getSettlementAccount = (receivableId: string) => {
    const accounts = [
      { bank: 'Banco do Brasil', code: '001', agency: '1234-5', account: '12345678-9', holder: 'ABC Comércio S.A.' },
      { bank: 'Itaú Unibanco', code: '341', agency: '5678-0', account: '98765432-1', holder: 'XYZ Ltda.' },
      { bank: 'Bradesco', code: '237', agency: '3456-7', account: '45678901-2', holder: 'Loja Exemplo ME' },
      { bank: 'Santander', code: '033', agency: '7890-1', account: '23456789-0', holder: 'Comercial Silva S.A.' },
      { bank: 'Caixa Econômica Federal', code: '104', agency: '2345-6', account: '56789012-3', holder: 'Empresa ABC Ltda.' },
    ];
    const hash = receivableId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return accounts[hash % accounts.length];
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Analítico de URs</h2>
              <p className="text-gray-600">Contrato: {contractNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors h-8 flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Total de URs</p>
                <p className="text-2xl font-bold text-gray-900">{filteredReceivables.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Valor Esperado</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Valor Bloqueado</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalEncumberedValue)}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center space-x-5">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Tipo:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setOperationTypeFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    operationTypeFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setOperationTypeFilter('credit')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    operationTypeFilter === 'credit'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Crédito
                </button>
                <button
                  onClick={() => setOperationTypeFilter('debit')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    operationTypeFilter === 'debit'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Débito
                </button>
              </div>
            </div>
            <div className="h-5 w-px bg-gray-300"></div>
            <button
              onClick={() => setValueMismatchFilter(!valueMismatchFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                valueMismatchFilter
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Valor a liquidar menor que esperado
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Liquidação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade URs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Esperado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor a Liquidar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contestação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {dailyReceivables.map((daily) => {
                  const dateKey = daily.date.toISOString().split('T')[0];
                  const isExpanded = expandedDates.has(dateKey);

                  return (
                    <React.Fragment key={dateKey}>
                      <tr
                        className="hover:bg-gray-50 transition-colors border-b border-gray-200 cursor-pointer"
                        onClick={() => toggleDateExpansion(dateKey)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <span>{formatDate(daily.date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {daily.count} URs
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(daily.totalValue)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(daily.totalEncumbered)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(() => {
                            const creditCount = daily.receivables.filter(r => r.operationType === 'credit').length;
                            const debitCount = daily.receivables.filter(r => r.operationType === 'debit').length;
                            return (
                              <div className="flex items-center space-x-2">
                                {creditCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {creditCount} Crédito
                                  </span>
                                )}
                                {debitCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                    {debitCount} Débito
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(() => {
                            const contestedCount = daily.receivables.filter(r => hasContestacao(r.id)).length;
                            return (
                              <span className="text-xs text-gray-400">
                                {contestedCount}/{daily.receivables.length} contestadas
                              </span>
                            );
                          })()}
                        </td>
                      </tr>

                      {isExpanded && daily.receivables.map((receivable) => (
                        <tr key={receivable.id} className="bg-gray-50 border-b border-gray-100">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 pl-12">
                            <div className="text-xs text-gray-500">{receivable.acquirer} • {receivable.cardBrand}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {receivable.settledAt ? (
                              <span className="text-green-600 font-medium text-xs">
                                Liquidado em {formatDate(receivable.settledAt)}
                              </span>
                            ) : (
                              <span className="text-yellow-600 font-medium text-xs">Pendente</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(receivable.originalValue)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(receivable.encumberedValue)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {receivable.operationType === 'credit' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Crédito
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Débito
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {hasContestacao(receivable.id) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const motivo = getContestacaoMotivo(receivable.id);
                                  if (motivo) setShowContestacaoMotivo({ urId: receivable.id, motivo });
                                }}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                              >
                                Contestado
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContestingReceivable(receivable);
                                  setSelectedReason('');
                                }}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                Contestar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {contestingReceivable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Contestar UR</h3>
              <button
                onClick={() => setContestingReceivable(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">UR (NSU)</p>
                <p className="font-medium text-gray-900">{contestingReceivable.nsu}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Esperado</p>
                  <p className="font-medium text-gray-900">{formatCurrency(contestingReceivable.originalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor a Liquidar</p>
                  <p className="font-medium text-green-600">{formatCurrency(contestingReceivable.encumberedValue)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Motivo da contestação</p>
                <div className="space-y-2">
                  {CONTEST_REASON_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedReason === option.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="contestReason"
                        value={option.value}
                        checked={selectedReason === option.value}
                        onChange={() => setSelectedReason(option.value)}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setContestingReceivable(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedReason) {
                    const motivo = CONTEST_REASON_OPTIONS.find(o => o.value === selectedReason)?.label ?? selectedReason;
                    saveContestacao(contestingReceivable.id, motivo);
                    setContestingReceivable(null);
                  }
                }}
                disabled={!selectedReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Contestação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal exibir motivo da contestação */}
      {showContestacaoMotivo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Motivo da contestação</h3>
              <button
                onClick={() => setShowContestacaoMotivo(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-2">UR {showContestacaoMotivo.urId}</p>
              <p className="text-gray-900">{showContestacaoMotivo.motivo}</p>
            </div>
          </div>
        </div>
      )}

      {selectedReceivable && (() => {
        const account = getSettlementAccount(selectedReceivable.id);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Conta de Liquidação</h3>
                <button
                  onClick={() => setSelectedReceivable(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">UR (NSU)</p>
                  <p className="font-medium text-gray-900">{selectedReceivable.nsu}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Banco</p>
                  <p className="font-medium text-gray-900">{account.bank}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Código do Banco</p>
                  <p className="font-medium text-gray-900 font-mono">{account.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Agência</p>
                  <p className="font-medium text-gray-900 font-mono">{account.agency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Conta Corrente</p>
                  <p className="font-medium text-gray-900 font-mono">{account.account}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tipo de Conta</p>
                  <p className="font-medium text-gray-900">Conta Corrente</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Titular da Conta</p>
                  <p className="font-medium text-gray-900">{account.holder}</p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">Conta Verificada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
