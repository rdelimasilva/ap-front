import React, { useState } from 'react';
import { X, Zap, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface BatchAdvancedConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AdvancedOperationConfig) => void;
  clientName: string;
  clientId: string;
  initialConfig?: AdvancedOperationConfig;
}

export interface AdvancedOperationConfig {
  startDate: string;
  endDate: string;
  captureStrategy: 'fast' | 'diluted';
  pauseOnTargetReached: boolean;
  cardBrands: string[];
  acquirers: string[];
}

const defaultConfig: AdvancedOperationConfig = {
  startDate: '',
  endDate: '',
  captureStrategy: 'fast',
  pauseOnTargetReached: true,
  cardBrands: [],
  acquirers: []
};

export function BatchAdvancedConfigModal({
  isOpen,
  onClose,
  onSave,
  clientName,
  clientId: _clientId,
  initialConfig
}: BatchAdvancedConfigModalProps) {
  const [formData, setFormData] = useState<AdvancedOperationConfig>(
    initialConfig || defaultConfig
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const availableCardBrands = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'];
  const availableAcquirers = ['Cielo', 'Rede', 'Stone', 'GetNet', 'PagSeguro', 'SafraPay'];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'Data de término deve ser posterior à data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleClose = () => {
    setFormData(initialConfig || defaultConfig);
    setErrors({});
    setShowAdvanced(false);
    onClose();
  };

  const toggleCardBrand = (brand: string) => {
    setFormData(prev => ({
      ...prev,
      cardBrands: prev.cardBrands.includes(brand)
        ? prev.cardBrands.filter(b => b !== brand)
        : [...prev.cardBrands, brand]
    }));
  };

  const toggleAcquirer = (acquirer: string) => {
    setFormData(prev => ({
      ...prev,
      acquirers: prev.acquirers.includes(acquirer)
        ? prev.acquirers.filter(a => a !== acquirer)
        : [...prev.acquirers, acquirer]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configurações Avançadas</h2>
              <p className="text-sm text-gray-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Término
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estratégia de Captura
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, captureStrategy: 'fast' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.captureStrategy === 'fast'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Rápida</div>
                  <div className="text-xs text-gray-600">Captura o valor alvo o mais rápido possível</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, captureStrategy: 'diluted' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.captureStrategy === 'diluted'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Diluída</div>
                  <div className="text-xs text-gray-600">Distribui as capturas ao longo do período</div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">Pausar ao atingir valor alvo</div>
                <div className="text-sm text-gray-600">Interrompe capturas automáticas quando o objetivo for alcançado</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pauseOnTargetReached}
                  onChange={(e) => setFormData(prev => ({ ...prev, pauseOnTargetReached: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-gray-900">Filtros Avançados (Opcional)</span>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Bandeiras de Cartão
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCardBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleCardBrand(brand)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.cardBrands.includes(brand)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.cardBrands.length === 0
                      ? 'Nenhuma bandeira selecionada (todas serão consideradas)'
                      : `${formData.cardBrands.length} bandeira(s) selecionada(s)`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Adquirentes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableAcquirers.map((acquirer) => (
                      <button
                        key={acquirer}
                        type="button"
                        onClick={() => toggleAcquirer(acquirer)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.acquirers.includes(acquirer)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {acquirer}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.acquirers.length === 0
                      ? 'Nenhum adquirente selecionado (todos serão considerados)'
                      : `${formData.acquirers.length} adquirente(s) selecionado(s)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
