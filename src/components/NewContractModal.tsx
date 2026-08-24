import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Calendar, DollarSign, ChevronDown, ChevronUp, CheckCircle, RefreshCw } from 'lucide-react';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  clientName?: string;
}

interface AutomationConfig {
  monthlyBlockedValue: string;
  startDate: string;
  contractDuration: 'indeterminate' | '1m' | '3m' | '6m' | '12m';
  autoRenewal: boolean;
  cardBrands: string[];
  acquirers: string[];
  transactionTypes: ('debit' | 'credit')[];
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientName = ''
}) => {
  const [formData, setFormData] = useState<AutomationConfig>({
    monthlyBlockedValue: '',
    startDate: '',
    contractDuration: 'indeterminate',
    autoRenewal: true,
    cardBrands: [],
    acquirers: [],
    transactionTypes: ['debit', 'credit']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApprovalConfirmation, setShowApprovalConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/[^\d,]/g, '');

    if (numbers.includes(',')) {
      const [integer, decimal] = numbers.split(',');
      const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedInteger},${decimal.slice(0, 2)}`;
    }

    const formattedValue = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedValue;
  };

  const handleValueChange = (value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, monthlyBlockedValue: formatted }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.monthlyBlockedValue) {
      newErrors.monthlyBlockedValue = 'Valor mensal bloqueado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      console.log('Automation Config:', formData);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowApprovalConfirmation(true);
      }, 1500);
    }
  };

  const handleConfirmApproval = () => {
    if (onSave) {
      onSave();
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      monthlyBlockedValue: '',
      startDate: '',
      contractDuration: 'indeterminate',
      autoRenewal: true,
      cardBrands: [],
      acquirers: [],
      transactionTypes: ['debit', 'credit']
    });
    setErrors({});
    setShowAdvanced(false);
    setShowApprovalConfirmation(false);
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

  const setTransactionTypeOption = (option: 'debit' | 'credit' | 'both') => {
    setFormData(prev => ({
      ...prev,
      transactionTypes: option === 'both' ? ['debit', 'credit'] : [option]
    }));
  };

  const getTransactionTypeOption = (): 'debit' | 'credit' | 'both' => {
    if (formData.transactionTypes.length === 2) return 'both';
    return formData.transactionTypes[0] as 'debit' | 'credit';
  };

  const durationOptions = [
    { value: 'indeterminate', label: 'Indeterminado' },
    { value: '1m', label: 'Mensal' },
    { value: '3m', label: 'Trimestral' },
    { value: '6m', label: 'Semestral' },
    { value: '12m', label: 'Anual' },
  ] as const;

  const cardBrands = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];
  const acquirers = ['Cielo', 'Rede', 'Stone', 'GetNet', 'PagSeguro', 'Safrapay', 'Dock'];

  const revolvingSteps = [
    'O valor mensal bloqueado é definido como meta de recebíveis a manter onerados',
    'O sistema busca e bloqueia recebíveis até atingir a meta mensal',
    'Ao final do mês, recebíveis liquidados são liberados e o ciclo reinicia',
    'A nova janela mensal mantém sempre o mesmo valor bloqueado como garantia',
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {showApprovalConfirmation ? (
          <div className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Operação Enviada para Aprovação</h2>
                <p className="text-gray-600">
                  A operação foi submetida e está aguardando aprovação.
                </p>
                {clientName && (
                  <p className="text-sm text-gray-500 mt-2">
                    Cliente: <span className="font-medium">{clientName}</span>
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full space-y-2">
                <p className="text-sm text-blue-800">
                  Acompanhe o status desta operação no <strong>menu de Operações</strong>.
                </p>
                <p className="text-sm text-blue-700">
                  Você será notificado quando a operação for aprovada ou se houver necessidade de ajustes.
                </p>
              </div>
              <button
                onClick={handleConfirmApproval}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Registrar Operação</h2>
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
              {/* Seção principal */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-6">
                {/* Título da seção */}
                <div className="flex items-center space-x-3 mb-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Captura de Recebíveis - Janela Mensal</h3>
                </div>

                {/* Valor Bloqueado no Período */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor Bloqueado no Período *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                    <input
                      type="text"
                      value={formData.monthlyBlockedValue}
                      onChange={(e) => handleValueChange(e.target.value)}
                      placeholder="0,00"
                      className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.monthlyBlockedValue ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.monthlyBlockedValue && (
                    <p className="text-red-500 text-xs mt-1">{errors.monthlyBlockedValue}</p>
                  )}
                </div>

                {/* Info box azul */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      A cada mês, este valor será mantido como recebíveis bloqueados. Ao início de uma nova janela mensal, o sistema renova automaticamente.
                    </p>
                  </div>
                </div>

                {/* Duração do Contrato + Data de Início lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração do Contrato
                    </label>
                    <select
                      value={formData.contractDuration}
                      onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value as AutomationConfig['contractDuration'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      {durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Toggle Renovação Automática */}
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Renovação Automática Mensal</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6">Renova a captura automaticamente a cada nova janela</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, autoRenewal: !prev.autoRenewal }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.autoRenewal ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.autoRenewal ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Como funciona a Janela Mensal Revolvente */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-green-800 mb-4">Como funciona a Janela Mensal Revolvente</h4>
                <div className="space-y-3">
                  {revolvingSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-200 text-green-800 text-xs font-bold flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-green-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="border border-gray-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  <span>Configurações Avançadas</span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="px-6 pb-6 space-y-4 border-t border-gray-200 pt-4">
                    {/* Bandeiras de Cartão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Bandeiras de Cartão
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cardBrands.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => toggleCardBrand(brand)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              formData.cardBrands.includes(brand)
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.cardBrands.length === 0 ? 'Todas as bandeiras serão incluídas' : `${formData.cardBrands.length} selecionada(s)`}
                      </p>
                    </div>

                    {/* Credenciadoras */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Credenciadoras
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {acquirers.map((acquirer) => (
                          <button
                            key={acquirer}
                            type="button"
                            onClick={() => toggleAcquirer(acquirer)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              formData.acquirers.includes(acquirer)
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                            }`}
                          >
                            {acquirer}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.acquirers.length === 0 ? 'Todas as credenciadoras serão incluídas' : `${formData.acquirers.length} selecionada(s)`}
                      </p>
                    </div>

                    {/* Tipo de Transação */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tipo de Transação
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setTransactionTypeOption('debit')}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            getTransactionTypeOption() === 'debit'
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                          }`}
                        >
                          Débito
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionTypeOption('credit')}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            getTransactionTypeOption() === 'credit'
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                          }`}
                        >
                          Crédito
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionTypeOption('both')}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            getTransactionTypeOption() === 'both'
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                          }`}
                        >
                          Ambos
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                  {isSubmitting ? 'Criando...' : 'Registrar Operação'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
