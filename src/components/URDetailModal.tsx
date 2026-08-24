import React from 'react';
import { X, Calendar, CreditCard, DollarSign, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ContaCorrenteEvento } from '../types/contaCorrente';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

const EVENTO_LABELS: Record<ContaCorrenteEvento, string> = {
  contrato_criado: 'Contrato criado',
  liquidacao_total: 'Liquidação total',
  liquidacao_parcial: 'Liquidação parcial',
  nao_liquidada_na_data: 'Não liquidada na data',
  chargeback: 'Chargeback',
  liquidacao_prevista: 'Liquidação prevista',
  liquidacao_prevista_com_chargeback: 'Liquidação prevista com chargeback',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  encumbered: 'Onerado',
  settled: 'Liquidado',
  chargeback: 'Chargeback',
  pending: 'Pendente',
};

interface URDetailModalProps {
  urId: string;
  onClose: () => void;
}

export const URDetailModal: React.FC<URDetailModalProps> = ({ urId, onClose }) => {
  const { receivables, contracts, contaCorrenteEntries } = useData();

  const receivable = receivables.find((r) => r.id === urId);
  const contract = receivable ? contracts.find((c) => c.id === receivable.contractId) : null;
  const entries = contaCorrenteEntries.filter((e) => e.urId === urId);

  const displayDate = (d: Date | undefined, fallback: Date) =>
    d ? formatDate(d) : formatDate(fallback);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 font-mono">{urId}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {receivable && contract ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    Contrato
                  </div>
                  <p className="font-medium text-gray-900">{contract.contractNumber}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard className="w-4 h-4" />
                    Credenciadora / Bandeira
                  </div>
                  <p className="font-medium text-gray-900">
                    {receivable.acquirer} / {receivable.cardBrand}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    Valor original
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(receivable.originalValue)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    Valor atual
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(receivable.encumberedValue)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-xs font-medium uppercase">Status</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {STATUS_LABELS[receivable.status] ?? receivable.status}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Data transação
                  </div>
                  <p className="font-medium text-gray-900">{formatDate(receivable.transactionDate)}</p>
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-xs font-medium uppercase">Merchant ID</span>
                  </div>
                  <p className="font-mono text-sm text-gray-700">{receivable.merchantId}</p>
                </div>
                {receivable.chargebackDate && (
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                      Chargeback
                    </div>
                    <p className="text-sm text-gray-700">
                      {formatDate(receivable.chargebackDate)}
                      {receivable.chargebackReason && ` — ${receivable.chargebackReason}`}
                    </p>
                  </div>
                )}
              </div>

              {entries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Eventos na conta corrente</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Evento</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Débito</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Crédito</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e) => (
                          <tr key={e.id} className="border-t border-gray-100">
                            <td className="py-2 px-3 text-gray-900">
                              {EVENTO_LABELS[e.evento]}
                              {e.isParcial && (
                                <span className="ml-1 text-xs text-teal-600">parcial</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              {displayDate(e.dataEfetiva, e.dataEsperada)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums">
                              {e.debito > 0 ? formatCurrency(e.debito) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums">
                              {e.credito > 0 ? formatCurrency(e.credito) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : entries.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                UR encontrada na conta corrente. Dados do estabelecimento:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Contrato</p>
                  <p className="font-medium">{entries[0].contractNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estabelecimento</p>
                  <p className="font-medium">{entries[0].nomeEstabelecimento}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Credenciadora / Bandeira</p>
                  <p className="font-medium">
                    {entries[0].acquirer} / {entries[0].cardBrand}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Eventos</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Evento</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Débito</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Crédito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id} className="border-t border-gray-100">
                          <td className="py-2 px-3">{EVENTO_LABELS[e.evento]}</td>
                          <td className="py-2 px-3">{displayDate(e.dataEfetiva, e.dataEsperada)}</td>
                          <td className="py-2 px-3 text-right">
                            {e.debito > 0 ? formatCurrency(e.debito) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {e.credito > 0 ? formatCurrency(e.credito) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum dado encontrado para esta UR.</p>
          )}
        </div>
      </div>
    </div>
  );
};
