import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  Settings,
  DollarSign,
  Shield,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  TrendingDown
} from 'lucide-react';

interface DiscountRate {
  id: string;
  daysFrom: number;
  daysTo: number;
  rate: number;
}

interface OperationParameters {
  guaranteeSecurityPercentage: number;
  guaranteeDaysToRelease: number;
  creditSecurityPercentage: number;
  settlementSecurityPercentage: number;
  anticipationSecurityPercentage: number;
  favoriteCredenciadora: string;
  autoRetryEnabled: boolean;
  notificationEnabled: boolean;
  maxDailyOperations: number;
  operationTimeout: number;
}

const loadDiscountRates = (): DiscountRate[] => {
  const saved = localStorage.getItem('discountRates');
  if (saved) {
    return JSON.parse(saved);
  }
  return [
    { id: '1', daysFrom: 1, daysTo: 30, rate: 1.5 },
    { id: '2', daysFrom: 31, daysTo: 60, rate: 2.0 },
    { id: '3', daysFrom: 61, daysTo: 90, rate: 2.5 },
    { id: '4', daysFrom: 91, daysTo: 120, rate: 3.0 },
    { id: '5', daysFrom: 121, daysTo: 180, rate: 3.5 },
    { id: '6', daysFrom: 181, daysTo: 270, rate: 4.0 },
    { id: '7', daysFrom: 271, daysTo: 365, rate: 4.5 },
  ];
};

const saveDiscountRates = (rates: DiscountRate[]) => {
  localStorage.setItem('discountRates', JSON.stringify(rates));
};

export const OperationParametersModule: React.FC = () => {
  const [parameters, setParameters] = useState<OperationParameters>({
    // Garantias
    guaranteeSecurityPercentage: 15.0, // % de segurança
    guaranteeDaysToRelease: 30, // Dias do vencimento para liberação da UR

    // Crédito Pontual
    creditSecurityPercentage: 20.0, // % de segurança

    // Quitação
    settlementSecurityPercentage: 10.0, // % de segurança

    // Antecipação
    anticipationSecurityPercentage: 12.0, // % de segurança

    // Credenciadora Favorita
    favoriteCredenciadora: 'Dock - 58', // Credenciadora para dar destaque

    // Configurações Gerais
    autoRetryEnabled: true,
    notificationEnabled: true,
    maxDailyOperations: 1000,
    operationTimeout: 300, // seconds
  });

  const [discountRates, setDiscountRates] = useState<DiscountRate[]>(loadDiscountRates());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    saveDiscountRates(discountRates);
  }, [discountRates]);

  const handleParameterChange = <K extends keyof OperationParameters>(key: K, value: OperationParameters[K]) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleDiscountRateChange = (id: string, field: keyof Omit<DiscountRate, 'id'>, value: number) => {
    setDiscountRates(prev => prev.map(rate =>
      rate.id === id ? { ...rate, [field]: value } : rate
    ));
    setHasChanges(true);
  };

  const handleAddDiscountRate = () => {
    const maxId = Math.max(...discountRates.map(r => parseInt(r.id)), 0);
    const lastRate = discountRates[discountRates.length - 1];
    const newRate: DiscountRate = {
      id: (maxId + 1).toString(),
      daysFrom: lastRate ? lastRate.daysTo + 1 : 1,
      daysTo: lastRate ? lastRate.daysTo + 30 : 30,
      rate: lastRate ? lastRate.rate + 0.5 : 1.5
    };
    setDiscountRates(prev => [...prev, newRate]);
    setHasChanges(true);
  };

  const handleRemoveDiscountRate = (id: string) => {
    if (discountRates.length > 1) {
      setDiscountRates(prev => prev.filter(rate => rate.id !== id));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    saveDiscountRates(discountRates);
    console.log('Saving parameters:', parameters);
    console.log('Saving discount rates:', discountRates);
    setHasChanges(false);
  };

  const handleReset = () => {
    setHasChanges(false);
  };

  // Lista de credenciadoras disponíveis
  const availableCredenciadoras = [
    'Dock - 58',
    'Cielo - 34', 
    'PagSeguro - 46',
    'Stone - 71',
    'Rede - 12',
    'GetNet - 02',
    'Safrapay - 44',
    'Mercado Pago - 09'
  ];

  const ParameterCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    color?: string;
  }> = ({ title, icon, children, color = 'text-blue-600' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InputField: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
  }> = ({ label, value, onChange, suffix, min, max, step = 1 }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const ToggleField: React.FC<{
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    description?: string;
  }> = ({ label, value, onChange, description }) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          value ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={handleReset}
          className="bg-gray-100 text-gray-700 px-4 rounded-lg hover:bg-gray-200 transition-colors h-8 flex items-center justify-center text-sm font-normal"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Resetar
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </button>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 font-medium">Alterações não salvas</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
          </p>
        </div>
      )}

      {/* Garantias */}
      <ParameterCard
        title="Garantias"
        icon={<Shield className="w-5 h-5 text-green-600" />}
        color="text-green-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="% de Segurança"
            value={parameters.guaranteeSecurityPercentage}
            onChange={(value) => handleParameterChange('guaranteeSecurityPercentage', value)}
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
          <InputField
            label="Dias do Vencimento para Liberação da UR"
            value={parameters.guaranteeDaysToRelease}
            onChange={(value) => handleParameterChange('guaranteeDaysToRelease', value)}
            suffix="dias"
            min={1}
            max={365}
          />
        </div>
      </ParameterCard>

      {/* Crédito Pontual */}
      <ParameterCard
        title="Crédito Pontual"
        icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        color="text-purple-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="% de Segurança"
            value={parameters.creditSecurityPercentage}
            onChange={(value) => handleParameterChange('creditSecurityPercentage', value)}
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </ParameterCard>

      {/* Quitação */}
      <ParameterCard
        title="Quitação de Dívidas"
        icon={<DollarSign className="w-5 h-5 text-red-600" />}
        color="text-red-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="% de Segurança"
            value={parameters.settlementSecurityPercentage}
            onChange={(value) => handleParameterChange('settlementSecurityPercentage', value)}
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </ParameterCard>

      {/* Antecipação */}
      <ParameterCard
        title="Antecipação"
        icon={<DollarSign className="w-5 h-5 text-orange-600" />}
        color="text-orange-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="% de Segurança"
            value={parameters.anticipationSecurityPercentage}
            onChange={(value) => handleParameterChange('anticipationSecurityPercentage', value)}
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </ParameterCard>

      {/* Taxas de Desconto */}
      <ParameterCard
        title="Taxas de Desconto para Antecipação"
        icon={<TrendingDown className="w-5 h-5 text-blue-600" />}
        color="text-blue-600"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Configure as taxas de desconto aplicadas na antecipação de recebíveis baseadas no prazo até o vencimento.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider px-3">
              <div className="col-span-3">Dias De</div>
              <div className="col-span-3">Dias Até</div>
              <div className="col-span-3">Taxa (%a.m.)</div>
              <div className="col-span-3"></div>
            </div>

            {discountRates.sort((a, b) => a.daysFrom - b.daysFrom).map((rate) => (
              <div key={rate.id} className="grid grid-cols-12 gap-3 bg-gray-50 rounded-lg p-3 items-center">
                <div className="col-span-3">
                  <input
                    type="number"
                    value={rate.daysFrom}
                    onChange={(e) => handleDiscountRateChange(rate.id, 'daysFrom', parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={rate.daysTo}
                    onChange={(e) => handleDiscountRateChange(rate.id, 'daysTo', parseInt(e.target.value) || 0)}
                    min={rate.daysFrom}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={rate.rate}
                    onChange={(e) => handleDiscountRateChange(rate.id, 'rate', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={() => handleRemoveDiscountRate(rate.id)}
                    disabled={discountRates.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remover faixa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddDiscountRate}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Adicionar Nova Faixa</span>
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium">Atenção:</p>
                <ul className="mt-1 space-y-1">
                  <li>• As faixas não devem se sobrepor</li>
                  <li>• A taxa é aplicada mensalmente (% a.m.)</li>
                  <li>• Alterações afetam apenas novas antecipações</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ParameterCard>

      {/* Configurações Gerais */}
      <ParameterCard
        title="Configurações Gerais"
        icon={<Settings className="w-5 h-5 text-gray-600" />}
        color="text-gray-600"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credenciadora Favorita
            </label>
            <select
              value={parameters.favoriteCredenciadora}
              onChange={(e) => handleParameterChange('favoriteCredenciadora', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableCredenciadoras.map((credenciadora) => (
                <option key={credenciadora} value={credenciadora}>
                  {credenciadora}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Credenciadora que receberá prioridade nas operações
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Máximo de Operações Diárias"
              value={parameters.maxDailyOperations}
              onChange={(value) => handleParameterChange('maxDailyOperations', value)}
              min={100}
              max={10000}
            />
            <InputField
              label="Timeout de Operação"
              value={parameters.operationTimeout}
              onChange={(value) => handleParameterChange('operationTimeout', value)}
              suffix="seg"
              min={60}
              max={600}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            <ToggleField
              label="Tentativas Automáticas"
              value={parameters.autoRetryEnabled}
              onChange={(value) => handleParameterChange('autoRetryEnabled', value)}
              description="Ativar tentativas automáticas em caso de falha"
            />
            <ToggleField
              label="Notificações"
              value={parameters.notificationEnabled}
              onChange={(value) => handleParameterChange('notificationEnabled', value)}
              description="Receber notificações sobre operações"
            />
          </div>
        </div>
      </ParameterCard>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Informações Importantes</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• O % de segurança é aplicado sobre o valor da operação para margem de proteção</li>
              <li>• Para garantias, os dias de vencimento determinam quando as URs podem ser liberadas</li>
              <li>• A credenciadora favorita receberá prioridade na seleção de URs</li>
              <li>• As alterações nos parâmetros afetarão apenas as novas operações</li>
              <li>• Operações em andamento continuarão com os parâmetros anteriores</li>
              <li>• O timeout de operação é aplicado globalmente para todas as operações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
