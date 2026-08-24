import React, { useState } from 'react';
import { X, DollarSign, Building2, AlertTriangle, Play } from 'lucide-react';
import { Contract } from '../types';
import { showToast } from '../hooks/useToast';

interface ExecuteURsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
}

export const ExecuteURsModal: React.FC<ExecuteURsModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  const [executionValue, setExecutionValue] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parseValue = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const formatInputValue = (value: string) => {
    // Remove tudo exceto números e vírgula
    const numbers = value.replace(/[^\d,]/g, '');
    
    // Se tem vírgula, formata com decimais
    if (numbers.includes(',')) {
      const [integer, decimal] = numbers.split(',');
      const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedInteger},${decimal.slice(0, 2)}`;
    }
    
    // Formata apenas a parte inteira
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value);
    setExecutionValue(formatted);
  };

  const handleExecute = async () => {
    const value = parseValue(executionValue);
    
    if (value <= 0) {
      showToast('warning', 'Valor inválido', 'Por favor, insira um valor válido para execução.');
      return;
    }

    if (value > contract.encumberedValue) {
      showToast('warning', 'Valor excedido', 'O valor de execução não pode ser maior que o valor travado.');
      return;
    }

    setIsExecuting(true);
    
    try {
      // Simular execução
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast('success', 'Execução realizada!', `Valor: ${formatCurrency(value)}`);
      onClose();
    } catch {
      showToast('error', 'Erro ao executar URs', 'Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  const isFormValid = () => {
    const value = parseValue(executionValue);
    return value > 0 && value <= contract.encumberedValue;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Executar URs</h2>
              <p className="text-gray-600">Contrato: {contract.contractNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors h-8 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Valor Travado */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Valor Travado</h3>
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrency(contract.encumberedValue)}
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Valor disponível para execução de URs
            </p>
          </div>

          {/* Dados da Conta de Liquidação */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados da Conta de Liquidação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Banco</p>
                <p className="font-medium text-gray-900">Banco do Brasil</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Código do Banco</p>
                <p className="font-medium text-gray-900 font-mono">001</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Agência</p>
                <p className="font-medium text-gray-900 font-mono">1234-5</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Conta Corrente</p>
                <p className="font-medium text-gray-900 font-mono">12345678-9</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Titular da Conta</p>
                <p className="font-medium text-gray-900">ABC Comércio S.A.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Conta Verificada</span>
              </div>
            </div>
          </div>

          {/* Valor da Execução */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Execução *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="text"
                value={executionValue}
                onChange={handleValueChange}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                Valor máximo: {formatCurrency(contract.encumberedValue)}
              </p>
              {executionValue && (
                <p className="text-sm text-blue-600 font-medium">
                  Valor digitado: {formatCurrency(parseValue(executionValue))}
                </p>
              )}
            </div>
          </div>

          {/* Validação */}
          {executionValue && parseValue(executionValue) > contract.encumberedValue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">Valor inválido</p>
              </div>
              <p className="text-red-700 text-sm mt-1">
                O valor de execução não pode ser maior que o valor travado.
              </p>
            </div>
          )}

          {/* Resumo da Operação */}
          {executionValue && isFormValid() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Play className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Resumo da Execução</p>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <p>• Valor a ser executado: <strong>{formatCurrency(parseValue(executionValue))}</strong></p>
                <p>• Valor restante travado: <strong>{formatCurrency(contract.encumberedValue - parseValue(executionValue))}</strong></p>
                <p>• As URs serão liquidadas na conta informada acima</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
          >
            Cancelar
          </button>
          <button
            onClick={handleExecute}
            disabled={!isFormValid() || isExecuting}
            className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Executando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Executar URs
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};