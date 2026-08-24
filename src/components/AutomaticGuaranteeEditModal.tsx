import React, { useState } from 'react';
import { X, Search, ChevronDown, Check, Users, Filter, AlertCircle, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Save } from 'lucide-react';
import { AutomaticGuaranteeRule, Client } from '../types';

interface AutomaticGuaranteeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: AutomaticGuaranteeRule;
  clients: Client[];
  onSave: (updatedRule: AutomaticGuaranteeRule) => void;
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

export const AutomaticGuaranteeEditModal: React.FC<AutomaticGuaranteeEditModalProps> = ({
  isOpen,
  onClose,
  rule,
  clients,
  onSave
}) => {
  const [formData, setFormData] = useState<FormData>({
    ruleName: rule.name,
    description: rule.description || '',
    isActive: rule.status === 'active',
    clientSelectionType: rule.clientSelectionType,
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
    specificClients: [], // In a real app, this would be populated from the rule
    acquirers: [...rule.acquirers],
    cardBrands: [...rule.cardBrands],
    valuePriority: rule.valuePriority
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAcquirerDropdown, setShowAcquirerDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

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
    
    const updatedRule: AutomaticGuaranteeRule = {
      ...rule,
      name: formData.ruleName,
      description: formData.description,
      status: formData.isActive ? 'active' : 'inactive',
      clientSelectionType: formData.clientSelectionType,
      affectedClientsCount: getFilteredClientsCount(),
      acquirers: formData.acquirers,
      cardBrands: formData.cardBrands,
      valuePriority: formData.valuePriority,
      updatedAt: new Date()
    };

    onSave(updatedRule);
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Garantia Automática</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors h-8 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Form Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Regra *
              </label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
                placeholder="Ex: Garantia Automática - Clientes Premium"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional da regra"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {formData.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
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
                  <span className="text-gray-900 font-medium">Clientes por critérios</span>
                  <p className="text-sm text-gray-500">Aplicar filtros para selecionar clientes automaticamente</p>
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
                  <p className="text-sm text-gray-500">Selecionar clientes individualmente</p>
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

          {/* Dual Column Client Selection */}
          {formData.clientSelectionType === 'specific' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Seleção de Clientes Específicos</h3>
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
              <div className="grid grid-cols-12 gap-4 h-80">
                {/* Available Clients */}
                <div className="col-span-5">
                  <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                    <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <h4 className="font-medium text-gray-900">
                        Clientes Disponíveis ({availableClients.length.toLocaleString()})
                      </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="space-y-1">
                        {availableClients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => handleAddClient(client.id)}
                            className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-transparent hover:border-blue-200 transition-all"
                          >
                            <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.document}</p>
                          </div>
                        ))}
                        {availableClients.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhum cliente disponível</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="col-span-2 flex flex-col items-center justify-center space-y-3">
                  <button
                    type="button"
                    onClick={handleAddAllClients}
                    disabled={availableClients.length === 0}
                    className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center"
                    title="Adicionar Todos"
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (availableClients.length > 0) {
                        handleAddClient(availableClients[0].id);
                      }
                    }}
                    disabled={availableClients.length === 0}
                    className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center"
                    title="Adicionar"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedClients.length > 0) {
                        handleRemoveClient(selectedClients[0].id);
                      }
                    }}
                    disabled={selectedClients.length === 0}
                    className="bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center"
                    title="Remover"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAllClients}
                    disabled={selectedClients.length === 0}
                    className="bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center"
                    title="Remover Todos"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Clients */}
                <div className="col-span-5">
                  <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                    <div className="p-3 border-b border-gray-200 bg-green-50 rounded-t-lg">
                      <h4 className="font-medium text-gray-900">
                        Clientes Selecionados ({selectedClients.length.toLocaleString()})
                      </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="space-y-1">
                        {selectedClients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => handleRemoveClient(client.id)}
                            className="p-3 hover:bg-red-50 cursor-pointer rounded-lg border border-transparent hover:border-red-200 transition-all"
                          >
                            <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.document}</p>
                          </div>
                        ))}
                        {selectedClients.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhum cliente selecionado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
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

          {/* Credenciadoras Section */}
          <div className="space-y-6 px-6">
            {/* Credenciadoras */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credenciadoras *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAcquirerDropdown(!showAcquirerDropdown)}
                  className="w-full flex items-center justify-between px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  className="w-full flex items-center justify-between px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

            {/* Prioridade de Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade de Valor *
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

            {/* Summary */}
            {affectedClientsCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Resumo da Operação</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      A regra "<strong>{formData.ruleName || 'Regra Editada'}</strong>" será aplicada a <strong>{affectedClientsCount.toLocaleString()} clientes</strong>.
                      A garantia automática será ativada para todos os clientes selecionados usando as credenciadoras e bandeiras especificadas.
                    </p>
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
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};