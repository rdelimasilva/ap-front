import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Settings } from 'lucide-react';
import { ClientReceivables } from '../types';
import { ReceivablesIndicator } from './ReceivablesIndicator';
import { LockAmountInput } from './LockAmountInput';

interface BatchReceivablesTableProps {
  clients: ClientReceivables[];
  lockOperations: Map<string, number>;
  onLockAmountChange: (clientId: string, amount: number) => void;
  onToggleClient: (clientId: string) => void;
  selectedClients: Set<string>;
  onOpenAdvancedConfig?: (clientId: string) => void;
  advancedConfigs?: Map<string, unknown>;
}

export function BatchReceivablesTable({
  clients,
  lockOperations,
  onLockAmountChange,
  onToggleClient,
  selectedClients,
  onOpenAdvancedConfig,
  advancedConfigs
}: BatchReceivablesTableProps) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const summary = useMemo(() => {
    let totalAvailable = 0;
    let totalToLock = 0;
    let validCount = 0;
    let invalidCount = 0;

    clients.forEach(client => {
      totalAvailable += client.availableReceivables;
      const lockAmount = lockOperations.get(client.clientId) || 0;

      if (selectedClients.has(client.clientId)) {
        totalToLock += lockAmount;
        if (lockAmount > 0 && lockAmount <= client.availableReceivables) {
          validCount++;
        } else {
          invalidCount++;
        }
      }
    });

    const utilizationPercentage = totalAvailable > 0 ? (totalToLock / totalAvailable) * 100 : 0;

    return {
      totalAvailable,
      totalToLock,
      validCount,
      invalidCount,
      utilizationPercentage,
      selectedCount: selectedClients.size
    };
  }, [clients, lockOperations, selectedClients]);


  const getClientStatus = (client: ClientReceivables) => {
    const lockAmount = lockOperations.get(client.clientId) || 0;
    const isSelected = selectedClients.has(client.clientId);

    if (!isSelected) {
      return { icon: null, color: 'text-gray-400', label: 'Não selecionado' };
    }

    if (client.availableReceivables === 0) {
      return { icon: XCircle, color: 'text-red-600', label: 'Sem recebíveis' };
    }

    if (lockAmount === 0) {
      return { icon: AlertTriangle, color: 'text-orange-600', label: 'Valor não definido' };
    }

    if (lockAmount > client.availableReceivables) {
      return { icon: AlertTriangle, color: 'text-red-600', label: 'Acima do disponível' };
    }

    return { icon: CheckCircle, color: 'text-green-600', label: 'Pronto' };
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Total de Clientes</div>
            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Selecionados</div>
            <div className="text-2xl font-bold text-blue-600">{summary.selectedCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Disponível Total</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalAvailable)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Para Pagamento</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalToLock)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Utilização</div>
            <div className="text-lg font-bold text-indigo-600">{summary.utilizationPercentage.toFixed(1)}%</div>
          </div>
        </div>

        {summary.invalidCount > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-orange-100 border border-orange-300 rounded text-sm text-orange-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              {summary.invalidCount} cliente(s) com problemas. Revise os valores antes de prosseguir.
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedClients.size === clients.length && clients.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        clients.forEach(c => selectedClients.add(c.clientId));
                      } else {
                        selectedClients.clear();
                      }
                      onToggleClient('');
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Recebíveis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Valor para Pagamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => {
                const status = getClientStatus(client);
                const StatusIcon = status.icon;
                const isExpanded = expandedClient === client.clientId;
                const lockAmount = lockOperations.get(client.clientId) || 0;
                const suggestedAmount = Math.floor(client.availableReceivables * 0.3);
                const remainingAfterLock = client.availableReceivables - lockAmount;

                return (
                  <React.Fragment key={client.clientId}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedClients.has(client.clientId)}
                          onChange={() => onToggleClient(client.clientId)}
                          disabled={client.availableReceivables === 0}
                          className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{client.clientName}</div>
                          <div className="text-sm text-gray-500">{client.clientDocument}</div>
                          {client.optInConfirmed && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Opt-in confirmado
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2 min-w-[250px]">
                          <ReceivablesIndicator
                            total={client.totalReceivables}
                            locked={client.lockedReceivables}
                            available={client.availableReceivables}
                            size="sm"
                            showLabels={false}
                          />
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">
                              Disponível: <span className="font-semibold text-gray-900">{formatCurrency(client.availableReceivables)}</span>
                            </span>
                            <button
                              onClick={() => setExpandedClient(isExpanded ? null : client.clientId)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {isExpanded ? 'Ocultar' : 'Detalhes'}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[200px]">
                          <LockAmountInput
                            available={client.availableReceivables}
                            suggested={suggestedAmount}
                            value={lockAmount}
                            onChange={(value) => onLockAmountChange(client.clientId, value)}
                            disabled={!selectedClients.has(client.clientId) || client.availableReceivables === 0}
                          />
                          {lockAmount > 0 && lockAmount <= client.availableReceivables && (
                            <div className="mt-1 text-xs text-gray-600">
                              Restante: {formatCurrency(remainingAfterLock)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {StatusIcon && <StatusIcon className={`w-5 h-5 ${status.color}`} />}
                          <span className={`text-sm font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => onOpenAdvancedConfig?.(client.clientId)}
                            disabled={!selectedClients.has(client.clientId)}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                              advancedConfigs?.has(client.clientId)
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:hover:text-gray-600'
                            }`}
                            title={
                              advancedConfigs?.has(client.clientId)
                                ? 'Configurações avançadas definidas'
                                : 'Configurações avançadas'
                            }
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              Distribuição por Adquirente
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {client.receivablesByAcquirer.map((acquirer) => (
                                <div
                                  key={acquirer.acquirer}
                                  className="bg-white p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="font-medium text-gray-900 mb-2">{acquirer.acquirer}</div>
                                  <ReceivablesIndicator
                                    total={acquirer.total}
                                    locked={acquirer.locked}
                                    available={acquirer.available}
                                    size="sm"
                                    showLabels={false}
                                  />
                                  <div className="mt-2 text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total:</span>
                                      <span className="font-medium">{formatCurrency(acquirer.total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Disponível:</span>
                                      <span className="font-medium text-green-600">{formatCurrency(acquirer.available)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
