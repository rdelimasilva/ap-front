import React from 'react';
import { X, CreditCard, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { ClientReceivables } from '../types';

interface MassLockConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clients: ClientReceivables[];
  lockOperations: Map<string, number>;
  selectedClients: Set<string>;
}

export function MassLockConfirmation({
  isOpen,
  onClose,
  onConfirm,
  clients,
  lockOperations,
  selectedClients
}: MassLockConfirmationProps) {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const operations = clients
    .filter(client => selectedClients.has(client.clientId))
    .map(client => {
      const lockAmount = lockOperations.get(client.clientId) || 0;
      const hasAmount = lockAmount > 0;
      const isAboveAvailable = lockAmount > client.availableReceivables;
      return {
        client,
        lockAmount,
        hasAmount,
        isAboveAvailable
      };
    });

  const operationsWithAmount = operations.filter(op => op.hasAmount);
  const operationsWithoutAmount = operations.filter(op => !op.hasAmount);
  const operationsAboveLimit = operations.filter(op => op.isAboveAvailable && op.hasAmount);

  const totalToLock = operationsWithAmount.reduce((sum, op) => sum + op.lockAmount, 0);
  const totalAvailable = operationsWithAmount.reduce((sum, op) => sum + op.client.availableReceivables, 0);

  const canProceed = operationsWithAmount.length > 0 && operationsWithoutAmount.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirmar Pagamentos</h2>
              <p className="text-sm text-gray-600">Revise as ORs livres selecionadas para pagamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700 mb-1">Total de Operações</div>
              <div className="text-3xl font-bold text-blue-900">{operationsWithAmount.length}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700 mb-1">Valor Total para Pagamento</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(totalToLock)}</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="text-sm text-indigo-700 mb-1">Utilização</div>
              <div className="text-2xl font-bold text-indigo-900">
                {totalAvailable > 0 ? ((totalToLock / totalAvailable) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {operationsWithoutAmount.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Atenção: {operationsWithoutAmount.length} cliente(s) sem valor definido
                  </h3>
                  <div className="space-y-2">
                    {operationsWithoutAmount.map(op => (
                      <div key={op.client.clientId} className="text-sm text-red-800">
                        <span className="font-medium">{op.client.clientName}</span>
                        {' - '}
                        <span>Valor não definido</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-red-700">
                    Defina valores para prosseguir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {operationsAboveLimit.length > 0 && operationsWithoutAmount.length === 0 && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    Aviso: {operationsAboveLimit.length} operação(ões) acima do disponível
                  </h3>
                  <div className="space-y-2">
                    {operationsAboveLimit.map(op => (
                      <div key={op.client.clientId} className="text-sm text-orange-800">
                        <span className="font-medium">{op.client.clientName}</span>
                        {' - '}
                        <span>
                          Valor de {formatCurrency(op.lockAmount)} excede o disponível de{' '}
                          {formatCurrency(op.client.availableReceivables)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-orange-700">
                    Você pode prosseguir, mas esteja ciente de que esses valores excedem os recebíveis disponíveis.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg">
              Pagamentos a Serem Registrados
            </h3>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Disponível
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Para Pagamento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Utilização
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {operations.map(op => {
                    const utilizationPercentage = op.client.availableReceivables > 0
                      ? (op.lockAmount / op.client.availableReceivables) * 100
                      : 0;

                    return (
                      <tr key={op.client.clientId} className={!op.hasAmount ? 'bg-red-50' : op.isAboveAvailable ? 'bg-orange-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{op.client.clientName}</div>
                          <div className="text-xs text-gray-500">{op.client.clientDocument}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(op.client.availableReceivables)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-semibold ${
                            !op.hasAmount ? 'text-red-600' : op.isAboveAvailable ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(op.lockAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${
                            utilizationPercentage > 100 ? 'text-orange-600' : utilizationPercentage > 80 ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {utilizationPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!op.hasAmount ? (
                            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
                          ) : op.isAboveAvailable ? (
                            <AlertTriangle className="w-5 h-5 text-orange-600 mx-auto" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {canProceed && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Próximos Passos</h4>
                  <p className="text-sm text-blue-800">
                    Após confirmar, <strong>{operationsWithAmount.length} pagamentos</strong> serão registrados utilizando
                    as ORs livres selecionadas dentro da janela mensal. As ORs serão vinculadas ao pagamento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (canProceed) {
                onConfirm();
                onClose();
              }
            }}
            disabled={!canProceed}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {canProceed ? (
              <span>Confirmar {operationsWithAmount.length} Pagamentos</span>
            ) : (
              <span>Defina Valores para Continuar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
