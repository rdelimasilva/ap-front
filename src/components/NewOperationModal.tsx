import React, { useState } from 'react';
import { X, DollarSign, Shield, CreditCard, TrendingUp, ChevronDown, ChevronUp, Check, AlertTriangle } from 'lucide-react';
import { Product, Client } from '../types';

interface NewOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  client?: Client;
  clients?: Client[];
}

interface FormData {
  operationType: 'guarantee' | 'extra-limit' | 'debt-settlement' | 'anticipation' | '';
  clientId: string;
  requestedValue: string;
  acquirers: string[];
  cardBrands: string[];
  hasRevolvency: boolean;
  description: string;
  transactionTypes: ('debit' | 'credit')[];
}

const AVAILABLE_ACQUIRERS = [
  'Dock - 58',
  'Cielo - 34', 
  'PagSeguro - 46',
  'Stone - 71',
  'Rede - 12',
  'GetNet - 02',
  'Safrapay - 44',
  'Mercado Pago - 09'
];

const AVAILABLE_CARD_BRANDS = [
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
  'Diners Club'
];

const OPERATION_TYPES = [
  { id: 'guarantee', label: 'Garantias', icon: Shield, color: 'text-green-600', description: 'Garantia para operações usando recebíveis' },
  { id: 'extra-limit', label: 'Crédito Pontual', icon: CreditCard, color: 'text-purple-600', description: 'Crédito adicional pré-pago' },
  { id: 'debt-settlement', label: 'Quitação', icon: DollarSign, color: 'text-red-600', description: 'Liquidação de débitos com recebíveis' },
  { id: 'anticipation', label: 'Antecipação', icon: TrendingUp, color: 'text-orange-600', description: 'Antecipação de recebíveis' }
];

export const NewOperationModal: React.FC<NewOperationModalProps> = ({
  isOpen,
  onClose,
  product,
  client,
  clients = []
}) => {
  const [formData, setFormData] = useState<FormData>({
    operationType: product?.type || '',
    clientId: client?.id || '',
    requestedValue: '',
    acquirers: [],
    cardBrands: [],
    hasRevolvency: product?.type === 'guarantee',
    description: '',
    transactionTypes: ['debit', 'credit']
  });

  const [showAcquirerDropdown, setShowAcquirerDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (value: string) => {
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

  const parseValue = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setFormData(prev => ({ ...prev, requestedValue: formatted }));
  };

  const handleOperationTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      operationType: type as FormData['operationType'],
      hasRevolvency: type === 'guarantee' || type === 'extra-limit'
    }));
  };

  const handleAcquirerToggle = (acquirer: string) => {
    setFormData(prev => ({
      ...prev,
      acquirers: prev.acquirers.includes(acquirer)
        ? prev.acquirers.filter(a => a !== acquirer)
        : [...prev.acquirers, acquirer]
    }));
  };

  const handleCardBrandToggle = (brand: string) => {
    setFormData(prev => ({
      ...prev,
      cardBrands: prev.cardBrands.includes(brand)
        ? prev.cardBrands.filter(b => b !== brand)
        : [...prev.cardBrands, brand]
    }));
  };

  const handleTransactionTypeToggle = (type: 'debit' | 'credit') => {
    setFormData(prev => {
      const currentTypes = prev.transactionTypes;
      if (currentTypes.includes(type)) {
        if (currentTypes.length === 1) return prev;
        return {
          ...prev,
          transactionTypes: currentTypes.filter(t => t !== type)
        };
      }
      return {
        ...prev,
        transactionTypes: [...currentTypes, type]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Nova operação:', formData);
    onClose();
  };

  const getSelectedAcquirersText = () => {
    if (formData.acquirers.length === 0) return 'Selecionar credenciadoras...';
    if (formData.acquirers.length === 1) return formData.acquirers[0];
    return `${formData.acquirers.length} credenciadoras selecionadas`;
  };

  const getSelectedBrandsText = () => {
    if (formData.cardBrands.length === 0) return 'Selecionar bandeiras...';
    if (formData.cardBrands.length === 1) return formData.cardBrands[0];
    return `${formData.cardBrands.length} bandeiras selecionadas`;
  };

  const isFormValid = () => {
    return formData.operationType && 
           formData.clientId && 
           formData.requestedValue && 
           parseValue(formData.requestedValue) > 0 &&
           formData.acquirers.length > 0 && 
           formData.cardBrands.length > 0;
  };

  const selectedClient = clients.find(c => c.id === formData.clientId) || client;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nova Operação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors h-8 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Operation Type Selection */}
          {!product && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Operação *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OPERATION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label 
                      key={type.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        formData.operationType === type.id
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="operationType"
                        value={type.id}
                        checked={formData.operationType === type.id}
                        onChange={(e) => handleOperationTypeChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${type.color}`} />
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Client Selection */}
          {!client && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.document}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client Info Display */}
          {selectedClient && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Informações do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{selectedClient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium text-gray-900">{selectedClient.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Limite Disponível</p>
                  <p className="font-medium text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(selectedClient.availableLimit)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requested Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Solicitado *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="text"
                value={formData.requestedValue}
                onChange={handleValueChange}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
              />
            </div>
            {formData.requestedValue && (
              <p className="text-sm text-blue-600 mt-1">
                Valor: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(parseValue(formData.requestedValue))}
              </p>
            )}
          </div>

          {/* Acquirers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credenciadoras *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAcquirerDropdown(!showAcquirerDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <span className={formData.acquirers.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                  {getSelectedAcquirersText()}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {showAcquirerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {AVAILABLE_ACQUIRERS.map((acquirer) => (
                    <div
                      key={acquirer}
                      onClick={() => handleAcquirerToggle(acquirer)}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="text-gray-900">{acquirer}</span>
                      {formData.acquirers.includes(acquirer) && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bandeiras *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <span className={formData.cardBrands.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                  {getSelectedBrandsText()}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {showBrandDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {AVAILABLE_CARD_BRANDS.map((brand) => (
                    <div
                      key={brand}
                      onClick={() => handleCardBrandToggle(brand)}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="text-gray-900">{brand}</span>
                      {formData.cardBrands.includes(brand) && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Configuration */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Configuração Avançada</span>
              {showAdvancedConfig ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showAdvancedConfig && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Transação *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeToggle('debit')}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.transactionTypes.includes('debit')
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {formData.transactionTypes.includes('debit') && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="font-medium">Débito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTransactionTypeToggle('credit')}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.transactionTypes.includes('credit')
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {formData.transactionTypes.includes('credit') && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="font-medium">Crédito</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selecione os tipos de transação que serão considerados na operação
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Revolvency */}
          {(formData.operationType === 'guarantee' || formData.operationType === 'extra-limit') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Revolvência
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, hasRevolvency: !prev.hasRevolvency }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.hasRevolvency ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.hasRevolvency ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.hasRevolvency ? 'text-blue-600' : 'text-gray-500'}`}>
                  {formData.hasRevolvency ? 'Com revolvência' : 'Sem revolvência'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.hasRevolvency 
                  ? 'Permite reutilização automática dos recebíveis liberados'
                  : 'Operação única sem reutilização dos recebíveis'
                }
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição adicional da operação..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Summary */}
          {isFormValid() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Resumo da Operação</h4>
                  <div className="text-sm text-blue-700 mt-2 space-y-1">
                    <p>• <strong>Tipo:</strong> {OPERATION_TYPES.find(t => t.id === formData.operationType)?.label}</p>
                    <p>• <strong>Cliente:</strong> {selectedClient?.name}</p>
                    <p>• <strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(parseValue(formData.requestedValue))}</p>
                    <p>• <strong>Credenciadoras:</strong> {formData.acquirers.length} selecionada(s)</p>
                    <p>• <strong>Bandeiras:</strong> {formData.cardBrands.length} selecionada(s)</p>
                    <p>• <strong>Tipos de Transação:</strong> {
                      formData.transactionTypes.length === 2
                        ? 'Débito e Crédito'
                        : formData.transactionTypes.includes('debit')
                          ? 'Apenas Débito'
                          : 'Apenas Crédito'
                    }</p>
                    {(formData.operationType === 'guarantee' || formData.operationType === 'extra-limit') && (
                      <p>• <strong>Revolvência:</strong> {formData.hasRevolvency ? 'Sim' : 'Não'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors h-8 flex items-center justify-center text-sm font-normal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
            >
              Criar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};