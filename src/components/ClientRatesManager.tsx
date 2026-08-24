import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, Check } from 'lucide-react';

interface DiscountRate {
  daysFrom: number;
  daysTo: number;
  rate: number;
}

interface ClientRatesManagerProps {
  clientId?: string;
  clientName: string;
  onSave?: (rates: DiscountRate[]) => void;
}

export const ClientRatesManager: React.FC<ClientRatesManagerProps> = ({
  clientId,
  clientName,
  onSave,
}) => {
  const [rates, setRates] = useState<DiscountRate[]>([{ daysFrom: 1, daysTo: 30, rate: 2.5 }]);
  const [hasCustomRates, setHasCustomRates] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  React.useEffect(() => {
    if (clientId) {
      const saved = localStorage.getItem(`clientDiscountRates_${clientId}`);
      if (saved) {
        const savedRates = JSON.parse(saved) as DiscountRate[];
        if (savedRates && savedRates.length > 0) {
          setRates(savedRates.map((r) => ({
            daysFrom: r.daysFrom,
            daysTo: r.daysTo,
            rate: r.rate,
          })));
          setHasCustomRates(true);
        }
      }
    }
  }, [clientId]);

  const addNewRate = () => {
    const lastRate = rates[rates.length - 1];
    const newRate: DiscountRate = {
      daysFrom: lastRate ? lastRate.daysTo + 1 : 1,
      daysTo: lastRate ? lastRate.daysTo + 30 : 30,
      rate: 2.5,
    };
    setRates([...rates, newRate]);
  };

  const removeRate = (index: number) => {
    if (rates.length > 1) {
      setRates(rates.filter((_, i) => i !== index));
    }
  };

  const updateRate = (index: number, field: keyof DiscountRate, value: number) => {
    const newRates = [...rates];
    newRates[index][field] = value;
    setRates(newRates);
  };

  const handleSave = () => {
    if (hasCustomRates) {
      const ratesToSave = rates.map((rate, index) => ({
        id: String(index + 1),
        daysFrom: rate.daysFrom,
        daysTo: rate.daysTo,
        rate: rate.rate,
      }));
      localStorage.setItem(`clientDiscountRates_${clientId}`, JSON.stringify(ratesToSave));
      if (onSave) {
        onSave(rates);
      }
    } else {
      localStorage.removeItem(`clientDiscountRates_${clientId}`);
      if (onSave) {
        onSave([]);
      }
    }

    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const toggleCustomRates = () => {
    setHasCustomRates(!hasCustomRates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Taxas de Desconto Personalizadas
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure taxas específicas para {clientName}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <input
          type="checkbox"
          id="useCustomRates"
          checked={hasCustomRates}
          onChange={toggleCustomRates}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="useCustomRates" className="text-sm font-medium text-gray-900 cursor-pointer">
          Utilizar taxas personalizadas para este cliente
        </label>
      </div>

      {!hasCustomRates && (
        <div className="flex items-start space-x-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Usando taxas globais padrão</p>
            <p className="mt-1">
              Este cliente utilizará as taxas configuradas em Configurações → Parâmetros de Operação.
            </p>
          </div>
        </div>
      )}

      {hasCustomRates && (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dias De
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dias Até
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa (%a.m.)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.map((rate, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={rate.daysFrom}
                        onChange={(e) => updateRate(index, 'daysFrom', Number(e.target.value))}
                        min="0"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={rate.daysTo}
                        onChange={(e) => updateRate(index, 'daysTo', Number(e.target.value))}
                        min={rate.daysFrom}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={rate.rate}
                        onChange={(e) => updateRate(index, 'rate', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeRate(index)}
                        disabled={rates.length === 1}
                        className={`p-1.5 rounded-lg transition-colors ${
                          rates.length === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={rates.length === 1 ? 'Deve haver pelo menos uma faixa' : 'Remover faixa'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addNewRate}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Adicionar Nova Faixa</span>
          </button>
        </>
      )}

      {onSave && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {showSavedMessage && (
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Taxas salvas com sucesso!</span>
            </div>
          )}
          {!showSavedMessage && <div />}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Salvar Taxas
          </button>
        </div>
      )}
    </div>
  );
};
