import React, { useState, useEffect } from 'react';
import { X, ShieldX, Save, Clock, DollarSign } from 'lucide-react';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';
import { NonAcceptanceCriteria, STORAGE_PREFIX, defaultCriteria, loadCriteria } from '../utils/nonAcceptanceCriteria';

interface NonAcceptanceCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (criteria: NonAcceptanceCriteria) => void;
  clientId: string;
  clientName: string;
}

export const NonAcceptanceCriteriaModal: React.FC<NonAcceptanceCriteriaModalProps> = ({ isOpen, onClose, onSave, clientId, clientName }) => {
  const [criteria, setCriteria] = useState<NonAcceptanceCriteria>(defaultCriteria);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEscapeKey(() => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    if (isOpen && clientId) {
      setCriteria(loadCriteria(clientId));
      setErrors({});
    }
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrencyValue = (formatted: string): number => {
    if (!formatted) return 0;
    const clean = formatted.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const handleCurrencyChange = (field: 'minValue' | 'maxValue', value: string) => {
    const formatted = formatCurrencyInput(value);
    setCriteria(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleTermChange = (field: 'minTerm' | 'maxTerm', value: string) => {
    const numbers = value.replace(/\D/g, '');
    setCriteria(prev => ({ ...prev, [field]: numbers }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!criteria.termEnabled && !criteria.valueEnabled) {
      newErrors.general = 'Ative pelo menos um critério de não aceite';
      setErrors(newErrors);
      return false;
    }

    if (criteria.termEnabled) {
      if (!criteria.minTerm && !criteria.maxTerm) {
        newErrors.minTerm = 'Informe ao menos um dos prazos';
      }
      if (criteria.minTerm && parseInt(criteria.minTerm) <= 0) {
        newErrors.minTerm = 'Prazo deve ser maior que zero';
      }
      if (criteria.maxTerm && parseInt(criteria.maxTerm) <= 0) {
        newErrors.maxTerm = 'Prazo deve ser maior que zero';
      }
      if (criteria.minTerm && criteria.maxTerm && parseInt(criteria.minTerm) >= parseInt(criteria.maxTerm)) {
        newErrors.maxTerm = 'Prazo máximo deve ser maior que o mínimo';
      }
    }

    if (criteria.valueEnabled) {
      if (!criteria.minValue && !criteria.maxValue) {
        newErrors.minValue = 'Informe ao menos um dos valores';
      }
      const minVal = parseCurrencyValue(criteria.minValue);
      const maxVal = parseCurrencyValue(criteria.maxValue);
      if (criteria.minValue && minVal <= 0) {
        newErrors.minValue = 'Valor deve ser maior que zero';
      }
      if (criteria.maxValue && maxVal <= 0) {
        newErrors.maxValue = 'Valor deve ser maior que zero';
      }
      if (minVal > 0 && maxVal > 0 && minVal >= maxVal) {
        newErrors.maxValue = 'Valor máximo deve ser maior que o mínimo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const toSave: NonAcceptanceCriteria = {
      ...criteria,
      minTerm: criteria.termEnabled ? criteria.minTerm : '',
      maxTerm: criteria.termEnabled ? criteria.maxTerm : '',
      minValue: criteria.valueEnabled ? criteria.minValue : '',
      maxValue: criteria.valueEnabled ? criteria.maxValue : '',
    };

    localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(toSave));
    onSave(toSave);
    onClose();
  };

  const hasSummary = (criteria.termEnabled && (criteria.minTerm || criteria.maxTerm)) ||
    (criteria.valueEnabled && (criteria.minValue || criteria.maxValue));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <ShieldX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Critérios de Não Aceite</h2>
              <p className="text-sm text-gray-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Prazo */}
          <div className={`rounded-xl border-2 transition-all ${criteria.termEnabled ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}>
            <label className="flex items-center justify-between p-4 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${criteria.termEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Clock className={`w-5 h-5 ${criteria.termEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Prazo</p>
                  <p className="text-xs text-gray-500">Rejeitar URs fora da faixa de prazo de vencimento</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={criteria.termEnabled}
                  onChange={(e) => setCriteria(prev => ({ ...prev, termEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>

            {criteria.termEnabled && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prazo Mínimo (dias)</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={criteria.minTerm}
                        onChange={(e) => handleTermChange('minTerm', e.target.value)}
                        placeholder="Ex: 30"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-sm ${
                          errors.minTerm ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">dias</span>
                    </div>
                    {errors.minTerm && <p className="text-red-500 text-xs mt-1">{errors.minTerm}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prazo Máximo (dias)</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={criteria.maxTerm}
                        onChange={(e) => handleTermChange('maxTerm', e.target.value)}
                        placeholder="Ex: 360"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-sm ${
                          errors.maxTerm ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">dias</span>
                    </div>
                    {errors.maxTerm && <p className="text-red-500 text-xs mt-1">{errors.maxTerm}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Valor */}
          <div className={`rounded-xl border-2 transition-all ${criteria.valueEnabled ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
            <label className="flex items-center justify-between p-4 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${criteria.valueEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <DollarSign className={`w-5 h-5 ${criteria.valueEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Valor</p>
                  <p className="text-xs text-gray-500">Rejeitar URs fora da faixa de valor de captura</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={criteria.valueEnabled}
                  onChange={(e) => setCriteria(prev => ({ ...prev, valueEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </div>
            </label>

            {criteria.valueEnabled && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor Mínimo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={criteria.minValue}
                        onChange={(e) => handleCurrencyChange('minValue', e.target.value)}
                        placeholder="0,00"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                          errors.minValue ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.minValue && <p className="text-red-500 text-xs mt-1">{errors.minValue}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor Máximo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={criteria.maxValue}
                        onChange={(e) => handleCurrencyChange('maxValue', e.target.value)}
                        placeholder="0,00"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                          errors.maxValue ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.maxValue && <p className="text-red-500 text-xs mt-1">{errors.maxValue}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumo */}
          {hasSummary && !Object.keys(errors).length && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Resumo dos Critérios</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {criteria.termEnabled && criteria.minTerm && (
                  <li>URs com prazo inferior a <strong>{criteria.minTerm} dias</strong> serão rejeitadas</li>
                )}
                {criteria.termEnabled && criteria.maxTerm && (
                  <li>URs com prazo superior a <strong>{criteria.maxTerm} dias</strong> serão rejeitadas</li>
                )}
                {criteria.valueEnabled && criteria.minValue && (
                  <li>URs com valor inferior a <strong>R$ {criteria.minValue}</strong> serão rejeitadas</li>
                )}
                {criteria.valueEnabled && criteria.maxValue && (
                  <li>URs com valor superior a <strong>R$ {criteria.maxValue}</strong> serão rejeitadas</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Critérios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
