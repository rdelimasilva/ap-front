import React, { useState } from 'react';
import { X, Search, ChevronDown, Check, Users, Filter, AlertCircle, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Settings, ChevronUp } from 'lucide-react';
import { Client } from '../types';

interface AutomaticGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

interface FormData {
  ruleName: string;
  description: string;
  isActive: boolean;
  clientSelectionType: 'all' | 'filtered' | 'specific';
  clientFilters: {
    status: string[];
    minLimit: string;
    maxLimit: string;
    minUsed: string;
    maxUsed: string;
    minCollateral: string;
    maxCollateral: string;
    hasActiveOperations: boolean | null;
  };
  specificClients: string[];
  acquirers: string[];
  cardBrands: string[];
  valuePriority: 'any' | 'lower' | 'higher';
  receivableType: 'any' | 'debit' | 'credit';
  urMaturity: 'any' | 'short' | 'long';
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

export const AutomaticGuaranteeModal: React.FC<AutomaticGuaranteeModalProps> = ({
  isOpen,
  onClose,
  clients
}) => {
  const [formData, setFormData] = useState<FormData>({
    ruleName: '',
    description: '',
    isActive: true,
    clientSelectionType: 'all',
    clientFilters: {
      status: [],
      minLimit: '',
      maxLimit: '',
      minUsed: '',
      maxUsed: '',
      minCollateral: '',
      maxCollateral: '',
      hasActiveOperations: null
    },
    specificClients: [],
    acquirers: [],
    cardBrands: [],
    valuePriority: 'any',
    receivableType: 'any',
    urMaturity: 'any'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAcquirerDropdown, setShowAcquirerDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  if (!isOpen) return null;

  // Calculate how many clients would be affected by current filters
  const getFilteredClientsCount = () => {
    if (formData.clientSelectionType === 'all') {
      return clients.length;
    }
    
    if (formData.clientSelectionType === 'specific') {
      return formData.specificClients.length;
    }

    // Apply filters
    return clients.filter(client => {
      // Status filter
      if (formData.clientFilters.status.length > 0 && 
          !formData.clientFilters.status.includes(client.status)) {
        return false;
      }

      // Limit filters
      if (formData.clientFilters.minLimit && 
          client.totalLimit < parseFloat(formData.clientFilters.minLimit)) {
        return false;
      }
      if (formData.clientFilters.maxLimit && 
          client.totalLimit > parseFloat(formData.clientFilters.maxLimit)) {
        return false;
      }

      // Used limit filters
      if (formData.clientFilters.minUsed && 
          client.usedLimit < parseFloat(formData.clientFilters.minUsed)) {
        return false;
      }
      if (formData.clientFilters.maxUsed && 
          client.usedLimit > parseFloat(formData.clientFilters.maxUsed)) {
        return false;
      }

      // Collateral filters
      if (formData.clientFilters.minCollateral && 
          client.collateralValue < parseFloat(formData.clientFilters.minCollateral)) {
        return false;
      }
      if (formData.clientFilters.maxCollateral && 
          client.collateralValue > parseFloat(formData.clientFilters.maxCollateral)) {
        return false;
      }

      return true;
    }).length;
  };

  // Filter available clients for dual selection
  const availableClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.document.includes(searchTerm) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch && !formData.specificClients.includes(client.id);
  });

  const selectedClients = clients.filter(client => 
    formData.specificClients.includes(client.id)
  );

  const handleAddClient = (clientId: string) => {
    setFormData(prev => ({
      ...prev,
      specificClients: [...prev.specificClients, clientId]
    }));
  };

  const handleRemoveClient = (clientId: string) => {
    setFormData(prev => ({
      ...prev,
      specificClients: prev.specificClients.filter(id => id !== clientId)
    }));
  };

  const handleAddAllClients = () => {
    const availableIds = availableClients.map(client => client.id);
    setFormData(prev => ({
      ...prev,
      specificClients: [...prev.specificClients, ...availableIds]
    }));
  };

  const handleRemoveAllClients = () => {
    setFormData(prev => ({
      ...prev,
      specificClients: []
    }));
  };

  const handleStatusToggle = (status: string) => {
    setFormData(prev => ({
      ...prev,
      clientFilters: {
        ...prev.clientFilters,
        status: prev.clientFilters.status.includes(status)
          ? prev.clientFilters.status.filter(s => s !== status)
          : [...prev.clientFilters.status, status]
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your API
    onClose();
  };

  const getSelectedAcquirersText = () => {
    if (formData.acquirers.length === 0) return 'Selecionar credenciadoras...';
    if (formData.acquirers.length === AVAILABLE_ACQUIRERS.length) return 'Todas as credenciadoras';
    if (formData.acquirers.length === 1) return formData.acquirers[0];
    return `${formData.acquirers.length} credenciadoras selecionadas`;
  };

  const getSelectedBrandsText = () => {
    if (formData.cardBrands.length === 0) return 'Selecionar bandeiras...';
    if (formData.cardBrands.length === AVAILABLE_CARD_BRANDS.length) return 'Todas as bandeiras';
    if (formData.cardBrands.length === 1) return formData.cardBrands[0];
    return `${formData.cardBrands.length} bandeiras selecionadas`;
  };

  const isFormValid = () => {
    // Check if basic fields are filled
    if (!formData.ruleName.trim()) return false;
    
    // Check if client selection is valid
    if (formData.clientSelectionType === 'specific' && formData.specificClients.length === 0) {
      return false;
    }
    
    // Check if other required fields are filled
    return formData.acquirers.length > 0 && formData.cardBrands.length > 0;
  };

  const affectedClientsCount = getFilteredClientsCount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nova Garantia Automática</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors h-8 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Form Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Regra *
                </label>
                <input
                  type="text"
                  value={formData.ruleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
                  placeholder="Ex: Garantia Automática - Clientes Premium"
                  className="w-full px-3 h-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm font-medium ${formData.isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {formData.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional da regra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Client Selection Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seleção de Clientes *
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="clientSelectionType"
                    value="all"
                    checked={formData.clientSelectionType === 'all'}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientSelectionType: e.target.value as 'all' | 'filtered' | 'specific' }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-gray-900 font-medium">Todos os clientes</span>
                    <p className="text-sm text-gray-500">Aplicar garantia automática para todos os {clients.length.toLocaleString()} clientes</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="clientSelectionType"
                    value="filtered"
                    checked={formData.clientSelectionType === 'filtered'}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientSelectionType: e.target.value as 'all' | 'filtered' | 'specific' }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-gray-900 font-medium">Clientes filtrados</span>
                    <p className="text-sm text-gray-500">Aplicar garantia automática baseada em critérios específicos</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="clientSelectionType"
                    value="specific"
                    checked={formData.clientSelectionType === 'specific'}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientSelectionType: e.target.value as 'all' | 'filtered' | 'specific' }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-gray-900 font-medium">Clientes específicos</span>
                    <p className="text-sm text-gray-500">Selecionar manualmente os clientes que receberão a garantia automática</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Filtered Clients Configuration */}
            {formData.clientSelectionType === 'filtered' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Critérios de Seleção</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="space-y-2">
                      {['active', 'pending', 'inactive'].map(status => (
                        <label key={status} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.clientFilters.status.includes(status)}
                            onChange={() => handleStatusToggle(status)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {status === 'active' ? 'Ativo' : status === 'pending' ? 'Pendente' : 'Inativo'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Limit Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limite Total (R$)</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={formData.clientFilters.minLimit}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          clientFilters: { ...prev.clientFilters, minLimit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={formData.clientFilters.maxLimit}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          clientFilters: { ...prev.clientFilters, maxLimit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Used Limit Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limite Utilizado (R$)</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={formData.clientFilters.minUsed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          clientFilters: { ...prev.clientFilters, minUsed: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={formData.clientFilters.maxUsed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          clientFilters: { ...prev.clientFilters, maxUsed: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Collateral Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Garantia (R$)</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={formData.clientFilters.minCollateral}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          clientFilters: { ...prev.clientFilters, minCollateral: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={formData.clientFilters.maxCollateral}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          clientFilters: { ...prev.clientFilters, maxCollateral: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview of affected clients */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {affectedClientsCount.toLocaleString()} clientes serão afetados
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Com os critérios atuais, a garantia automática será aplicada a {affectedClientsCount} clientes
                  </p>
                </div>
              </div>
            )}

            {/* Specific Clients Configuration */}
            {formData.clientSelectionType === 'specific' && (
              <div className="space-y-6">
                {/* Critérios de Seleção - Same as filtered clients */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Critérios de Seleção</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="space-y-2">
                        {['active', 'pending', 'inactive'].map(status => (
                          <label key={status} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.clientFilters.status.includes(status)}
                              onChange={() => handleStatusToggle(status)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">
                              {status === 'active' ? 'Ativo' : status === 'pending' ? 'Pendente' : 'Inativo'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Limit Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Limite Total (R$)</label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Mínimo"
                          value={formData.clientFilters.minLimit}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            clientFilters: { ...prev.clientFilters, minLimit: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Máximo"
                          value={formData.clientFilters.maxLimit}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            clientFilters: { ...prev.clientFilters, maxLimit: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Used Limit Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Limite Utilizado (R$)</label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Mínimo"
                          value={formData.clientFilters.minUsed}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            clientFilters: { ...prev.clientFilters, minUsed: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Máximo"
                          value={formData.clientFilters.maxUsed}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            clientFilters: { ...prev.clientFilters, maxUsed: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Collateral Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Garantia (R$)</label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Mínimo"
                          value={formData.clientFilters.minCollateral}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            clientFilters: { ...prev.clientFilters, minCollateral: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Máximo"
                          value={formData.clientFilters.maxCollateral}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            clientFilters: { ...prev.clientFilters, maxCollateral: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview of affected clients */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {affectedClientsCount.toLocaleString()} clientes serão afetados
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Com os critérios atuais, a garantia automática será aplicada a {affectedClientsCount} clientes
                    </p>
                  </div>
                </div>

                {/* Advanced Settings for Specific Clients ONLY */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <h3 className="font-medium text-gray-900">Configurações avançadas</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showAdvancedSettings ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {showAdvancedSettings && (
                    <div className="space-y-4">
                      {/* Vencimento da UR */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Vencimento da UR
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="urMaturity"
                              value="any"
                              checked={formData.urMaturity === 'any'}
                              onChange={(e) => setFormData(prev => ({ ...prev, urMaturity: e.target.value as 'any' | 'short' | 'long' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs com qualquer vencimento</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="urMaturity"
                              value="short"
                              checked={formData.urMaturity === 'short'}
                              onChange={(e) => setFormData(prev => ({ ...prev, urMaturity: e.target.value as 'any' | 'short' | 'long' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs com vencimento até 30 dias</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="urMaturity"
                              value="long"
                              checked={formData.urMaturity === 'long'}
                              onChange={(e) => setFormData(prev => ({ ...prev, urMaturity: e.target.value as 'any' | 'short' | 'long' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs com vencimento acima de 30 dias</span>
                          </label>
                        </div>
                      </div>

                      {/* Prioridade de Valor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Prioridade de Valor
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="valuePriority"
                              value="any"
                              checked={formData.valuePriority === 'any'}
                              onChange={(e) => setFormData(prev => ({ ...prev, valuePriority: e.target.value as 'any' | 'lower' | 'higher' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs de qualquer valor</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="valuePriority"
                              value="lower"
                              checked={formData.valuePriority === 'lower'}
                              onChange={(e) => setFormData(prev => ({ ...prev, valuePriority: e.target.value as 'any' | 'lower' | 'higher' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs de menor valor</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="valuePriority"
                              value="higher"
                              checked={formData.valuePriority === 'higher'}
                              onChange={(e) => setFormData(prev => ({ ...prev, valuePriority: e.target.value as 'any' | 'lower' | 'higher' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs de maior valor</span>
                          </label>
                        </div>
                      </div>

                      {/* Tipo de Recebível */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Tipo de Recebível
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="receivableType"
                              value="any"
                              checked={formData.receivableType === 'any'}
                              onChange={(e) => setFormData(prev => ({ ...prev, receivableType: e.target.value as 'any' | 'debit' | 'credit' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">Débito e Crédito</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="receivableType"
                              value="debit"
                              checked={formData.receivableType === 'debit'}
                              onChange={(e) => setFormData(prev => ({ ...prev, receivableType: e.target.value as 'any' | 'debit' | 'credit' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">Apenas Débito</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="receivableType"
                              value="credit"
                              checked={formData.receivableType === 'credit'}
                              onChange={(e) => setFormData(prev => ({ ...prev, receivableType: e.target.value as 'any' | 'debit' | 'credit' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">Apenas Crédito</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seleção Manual de Clientes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Seleção Manual de Clientes</h3>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar clientes por nome, documento ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Dual Column Layout */}
                 <div className="grid grid-cols-12 gap-4" style={{ height: '240px' }}>
                    {/* Available Clients */}
                    <div className="col-span-5">
                      <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                        <div className="p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                          <h4 className="font-medium text-gray-900 text-sm">
                            Clientes Disponíveis ({availableClients.length.toLocaleString()})
                          </h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          <div className="space-y-1">
                            {availableClients.map((client) => (
                              <div
                                key={client.id}
                                onClick={() => handleAddClient(client.id)}
                                className="p-3 hover:bg-blue-50 cursor-pointer rounded border border-transparent hover:border-blue-200 transition-all"
                              >
                                <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                                <p className="text-xs text-gray-500">{client.document}</p>
                              </div>
                            ))}
                            {availableClients.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Nenhum cliente disponível</p>
                                <p className="text-xs text-gray-400 mt-1">Todos os clientes já foram selecionados</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="col-span-2 flex flex-col items-center justify-center space-y-2">
                      <button
                        type="button"
                        onClick={handleAddAllClients}
                        disabled={availableClients.length === 0}
                        className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center shadow-sm"
                        title="Adicionar Todos"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (availableClients.length > 0) {
                            handleAddClient(availableClients[0].id);
                          }
                        }}
                        disabled={availableClients.length === 0}
                        className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center shadow-sm"
                        title="Adicionar"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedClients.length > 0) {
                            handleRemoveClient(selectedClients[0].id);
                          }
                        }}
                        disabled={selectedClients.length === 0}
                        className="bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center shadow-sm"
                        title="Remover"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAllClients}
                        disabled={selectedClients.length === 0}
                        className="bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center shadow-sm"
                        title="Remover Todos"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Selected Clients */}
                    <div className="col-span-5">
                      <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                        <div className="p-2 border-b border-gray-200 bg-green-50 rounded-t-lg">
                          <h4 className="font-medium text-gray-900 text-sm">
                            Clientes Selecionados ({selectedClients.length.toLocaleString()})
                          </h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          <div className="space-y-1">
                            {selectedClients.map((client) => (
                              <div
                                key={client.id}
                                onClick={() => handleRemoveClient(client.id)}
                                className="p-3 hover:bg-red-50 cursor-pointer rounded border border-transparent hover:border-red-200 transition-all"
                              >
                                <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                                <p className="text-xs text-gray-500">{client.document}</p>
                              </div>
                            ))}
                            {selectedClients.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Nenhum cliente selecionado</p>
                                <p className="text-xs text-gray-400 mt-1">Selecione clientes da lista ao lado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Summary for Specific Clients */}
                {selectedClients.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        {selectedClients.length.toLocaleString()} clientes selecionados
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Credenciadoras and Bandeiras Section - Only show when client selection is complete */}
            {affectedClientsCount > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Operação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Credenciadoras */}
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

                  {/* Bandeiras */}
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
                </div>

                {/* Advanced Settings Section - Show for ALL client selection types */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center justify-between w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Configurações avançadas</span>
                    </div>
                    {showAdvancedSettings ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {showAdvancedSettings && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      {/* Vencimento da UR */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Vencimento da UR
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="urMaturity"
                              value="any"
                              checked={formData.urMaturity === 'any'}
                              onChange={(e) => setFormData(prev => ({ ...prev, urMaturity: e.target.value as 'any' | 'short' | 'long' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs com qualquer vencimento</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="urMaturity"
                              value="short"
                              checked={formData.urMaturity === 'short'}
                              onChange={(e) => setFormData(prev => ({ ...prev, urMaturity: e.target.value as 'any' | 'short' | 'long' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs com vencimento até 30 dias</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="urMaturity"
                              value="long"
                              checked={formData.urMaturity === 'long'}
                              onChange={(e) => setFormData(prev => ({ ...prev, urMaturity: e.target.value as 'any' | 'short' | 'long' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs com vencimento acima de 30 dias</span>
                          </label>
                        </div>
                      </div>

                      {/* Prioridade de Valor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Prioridade de Valor
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="valuePriority"
                              value="any"
                              checked={formData.valuePriority === 'any'}
                              onChange={(e) => setFormData(prev => ({ ...prev, valuePriority: e.target.value as 'any' | 'lower' | 'higher' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs de qualquer valor</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="valuePriority"
                              value="lower"
                              checked={formData.valuePriority === 'lower'}
                              onChange={(e) => setFormData(prev => ({ ...prev, valuePriority: e.target.value as 'any' | 'lower' | 'higher' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs de menor valor</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="valuePriority"
                              value="higher"
                              checked={formData.valuePriority === 'higher'}
                              onChange={(e) => setFormData(prev => ({ ...prev, valuePriority: e.target.value as 'any' | 'lower' | 'higher' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">URs de maior valor</span>
                          </label>
                        </div>
                      </div>

                      {/* Tipo de Recebível */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Tipo de Recebível
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="receivableType"
                              value="any"
                              checked={formData.receivableType === 'any'}
                              onChange={(e) => setFormData(prev => ({ ...prev, receivableType: e.target.value as 'any' | 'debit' | 'credit' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">Débito e Crédito</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="receivableType"
                              value="debit"
                              checked={formData.receivableType === 'debit'}
                              onChange={(e) => setFormData(prev => ({ ...prev, receivableType: e.target.value as 'any' | 'debit' | 'credit' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">Apenas Débito</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="receivableType"
                              value="credit"
                              checked={formData.receivableType === 'credit'}
                              onChange={(e) => setFormData(prev => ({ ...prev, receivableType: e.target.value as 'any' | 'debit' | 'credit' }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-900">Apenas Crédito</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary Section - Always show when there are affected clients */}
            {affectedClientsCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Resumo da Configuração</h4>
                    <div className="text-sm text-blue-700 mt-2 space-y-1">
                      <p>• <strong>Nome:</strong> {formData.ruleName || 'Nova Regra'}</p>
                      <p>• <strong>Clientes afetados:</strong> {affectedClientsCount.toLocaleString()}</p>
                      <p>• <strong>Credenciadoras:</strong> {formData.acquirers.length} selecionada(s)</p>
                      <p>• <strong>Bandeiras:</strong> {formData.cardBrands.length} selecionada(s)</p>
                      <p>• <strong>Status:</strong> {formData.isActive ? 'Ativo' : 'Inativo'}</p>
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
                Criar Garantia Automática
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};