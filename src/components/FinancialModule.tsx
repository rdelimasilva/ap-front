import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Scissors,
  ShieldX,
  Clock,
  CreditCard,
  Edit2,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { NonAcceptanceCriteria, STORAGE_PREFIX, DEFAULT_CRITERIA_KEY, defaultCriteria, loadCriteria, hasClientCriteria, loadDefaultCriteria, saveDefaultCriteria as persistDefaultCriteria, hasDefaultCriteria } from '../utils/nonAcceptanceCriteria';
import { AlertTriangle, Info } from 'lucide-react';

interface InterestCurvePoint {
  days: number;
  rate: number;
}

interface ClientRate {
  daysFrom: number;
  daysTo: number;
  rate: number;
}

export const FinancialModule: React.FC = () => {
  const { clients, updateClient } = useData();
  const [activeTab, setActiveTab] = useState<'rates' | 'curve' | 'haircut' | 'criteria' | 'limits'>('rates');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientRates, setClientRates] = useState<Map<string, ClientRate[]>>(
    () => {
      const map = new Map();
      clients.forEach(c => {
        const saved = localStorage.getItem(`clientDiscountRates_${c.id}`);
        if (saved) {
          map.set(c.id, JSON.parse(saved));
        }
      });
      return map;
    }
  );
  const [interestCurve, setInterestCurve] = useState<InterestCurvePoint[]>(() => {
    const saved = localStorage.getItem('interestCurve');
    return saved ? JSON.parse(saved) : [
      { days: 30, rate: 1.5 },
      { days: 60, rate: 1.8 },
      { days: 90, rate: 2.1 },
      { days: 180, rate: 2.8 },
      { days: 360, rate: 3.5 },
    ];
  });
  const [defaultHaircut, setDefaultHaircut] = useState<number>(() => {
    const saved = localStorage.getItem('defaultHaircut');
    return saved ? Number(saved) : 0;
  });
  const [clientHaircuts, setClientHaircuts] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    clients.forEach(c => {
      const saved = localStorage.getItem(`clientHaircut_${c.id}`);
      if (saved) {
        map.set(c.id, Number(saved));
      }
    });
    return map;
  });
  const [haircutSearchTerm, setHaircutSearchTerm] = useState('');
  const [expandedHaircutClient, setExpandedHaircutClient] = useState<string | null>(null);
  const [defaultRates, setDefaultRates] = useState<ClientRate[]>(() => {
    const saved = localStorage.getItem('defaultDiscountRates');
    return saved ? JSON.parse(saved) : [{ daysFrom: 1, daysTo: 30, rate: 2.5 }];
  });
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [savedSection, setSavedSection] = useState('');

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  const getClientRates = (clientId: string) => {
    return clientRates.get(clientId) || [{ daysFrom: 1, daysTo: 30, rate: 2.5 }];
  };

  const updateClientRate = (clientId: string, index: number, field: keyof ClientRate, value: number) => {
    const rates = [...getClientRates(clientId)];
    rates[index][field] = value;
    setClientRates(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, rates);
      return newMap;
    });
  };

  const addClientRate = (clientId: string) => {
    const rates = getClientRates(clientId);
    const last = rates[rates.length - 1];
    const newRate = {
      daysFrom: last ? last.daysTo + 1 : 1,
      daysTo: last ? last.daysTo + 30 : 30,
      rate: 2.5,
    };
    setClientRates(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, [...rates, newRate]);
      return newMap;
    });
  };

  const removeClientRate = (clientId: string, index: number) => {
    const rates = getClientRates(clientId);
    if (rates.length <= 1) return;
    setClientRates(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, rates.filter((_, i) => i !== index));
      return newMap;
    });
  };

  const saveClientRates = (clientId: string) => {
    const rates = getClientRates(clientId);
    localStorage.setItem(`clientDiscountRates_${clientId}`, JSON.stringify(rates));
    setSavedSection(clientId);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const updateDefaultRate = (index: number, field: keyof ClientRate, value: number) => {
    setDefaultRates(prev => {
      const newRates = [...prev];
      newRates[index] = { ...newRates[index], [field]: value };
      return newRates;
    });
  };

  const addDefaultRate = () => {
    const last = defaultRates[defaultRates.length - 1];
    setDefaultRates(prev => [...prev, {
      daysFrom: last ? last.daysTo + 1 : 1,
      daysTo: last ? last.daysTo + 30 : 30,
      rate: 2.5,
    }]);
  };

  const removeDefaultRate = (index: number) => {
    if (defaultRates.length <= 1) return;
    setDefaultRates(prev => prev.filter((_, i) => i !== index));
  };

  const saveDefaultRates = () => {
    localStorage.setItem('defaultDiscountRates', JSON.stringify(defaultRates));
    setSavedSection('defaultRates');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const addCurvePoint = () => {
    const last = interestCurve[interestCurve.length - 1];
    setInterestCurve([...interestCurve, {
      days: last ? last.days + 30 : 30,
      rate: last ? last.rate + 0.3 : 1.5,
    }]);
  };

  const removeCurvePoint = (index: number) => {
    if (interestCurve.length <= 1) return;
    setInterestCurve(interestCurve.filter((_, i) => i !== index));
  };

  const updateCurvePoint = (index: number, field: keyof InterestCurvePoint, value: number) => {
    const newCurve = [...interestCurve];
    newCurve[index][field] = value;
    setInterestCurve(newCurve);
  };

  const saveCurve = () => {
    localStorage.setItem('interestCurve', JSON.stringify(interestCurve));
    setSavedSection('curve');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const filteredHaircutClients = clients.filter(c =>
    c.name.toLowerCase().includes(haircutSearchTerm.toLowerCase()) ||
    c.document.includes(haircutSearchTerm)
  );

  const saveDefaultHaircut = () => {
    localStorage.setItem('defaultHaircut', String(defaultHaircut));
    setSavedSection('haircut');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const saveClientHaircut = (clientId: string) => {
    const value = clientHaircuts.get(clientId) ?? defaultHaircut;
    localStorage.setItem(`clientHaircut_${clientId}`, String(value));
    setSavedSection(clientId);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const updateClientHaircut = (clientId: string, value: number) => {
    setClientHaircuts(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, value);
      return newMap;
    });
  };

  const removeClientHaircut = (clientId: string) => {
    setClientHaircuts(prev => {
      const newMap = new Map(prev);
      newMap.delete(clientId);
      return newMap;
    });
    localStorage.removeItem(`clientHaircut_${clientId}`);
    setSavedSection(clientId);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  // --- Não Aceite (Criteria) ---
  const [criteriaSearchTerm, setCriteriaSearchTerm] = useState('');
  const [expandedCriteriaClient, setExpandedCriteriaClient] = useState<string | null>(null);
  const [clientCriteria, setClientCriteria] = useState<Map<string, NonAcceptanceCriteria>>(() => {
    const map = new Map<string, NonAcceptanceCriteria>();
    clients.forEach(c => {
      const saved = localStorage.getItem(STORAGE_PREFIX + c.id);
      if (saved) {
        map.set(c.id, { ...defaultCriteria, ...JSON.parse(saved) });
      }
    });
    return map;
  });

  const [globalDefaultCriteria, setGlobalDefaultCriteria] = useState<NonAcceptanceCriteria>(() => loadDefaultCriteria());

  const filteredCriteriaClients = clients.filter(c =>
    c.name.toLowerCase().includes(criteriaSearchTerm.toLowerCase()) ||
    c.document.includes(criteriaSearchTerm)
  );

  const getCriteria = (clientId: string): NonAcceptanceCriteria => {
    return clientCriteria.get(clientId) || { ...defaultCriteria };
  };

  const updateCriteria = (clientId: string, partial: Partial<NonAcceptanceCriteria>) => {
    setClientCriteria(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, { ...getCriteria(clientId), ...partial });
      return newMap;
    });
  };

  const saveCriteria = (clientId: string) => {
    const criteria = getCriteria(clientId);
    localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(criteria));
    setSavedSection('criteria');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const removeCriteria = (clientId: string) => {
    localStorage.removeItem(STORAGE_PREFIX + clientId);
    setClientCriteria(prev => {
      const newMap = new Map(prev);
      newMap.delete(clientId);
      return newMap;
    });
    setSavedSection('criteria');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const saveGlobalDefaultCriteria = () => {
    persistDefaultCriteria(globalDefaultCriteria);
    setSavedSection('defaultCriteria');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const removeGlobalDefaultCriteria = () => {
    localStorage.removeItem(DEFAULT_CRITERIA_KEY);
    setGlobalDefaultCriteria({ ...defaultCriteria });
    setSavedSection('defaultCriteria');
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const isDefaultCriteriaActive = globalDefaultCriteria.termEnabled || globalDefaultCriteria.valueEnabled;

  // --- Limites de Crédito ---
  const [limitsSearchTerm, setLimitsSearchTerm] = useState('');
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitEditingClient, setLimitEditingClient] = useState<string | null>(null);
  const [limitFormName, setLimitFormName] = useState('');
  const [limitFormDocument, setLimitFormDocument] = useState('');
  const [limitFormTotal, setLimitFormTotal] = useState('');
  const [limitFormUsed, setLimitFormUsed] = useState('');

  const filteredLimitsClients = clients.filter(c =>
    c.name.toLowerCase().includes(limitsSearchTerm.toLowerCase()) ||
    c.document.includes(limitsSearchTerm)
  );
  const totalLimitAll = clients.reduce((sum, c) => sum + c.totalLimit, 0);
  const totalUsedAll = clients.reduce((sum, c) => sum + c.usedLimit, 0);
  const totalAvailableAll = clients.reduce((sum, c) => sum + c.availableLimit, 0);

  const openNewLimitModal = () => {
    setLimitEditingClient(null);
    setLimitFormName('');
    setLimitFormDocument('');
    setLimitFormTotal('');
    setLimitFormUsed('');
    setLimitModalOpen(true);
  };

  const openEditLimitModal = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setLimitEditingClient(clientId);
    setLimitFormName(client.name);
    setLimitFormDocument(client.document);
    setLimitFormTotal(String(client.totalLimit));
    setLimitFormUsed(String(client.usedLimit));
    setLimitModalOpen(true);
  };

  const closeLimitModal = () => {
    setLimitModalOpen(false);
    setLimitEditingClient(null);
  };

  const parseCurrency = (v: string) => {
    const num = parseFloat(v.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const handleSaveLimit = () => {
    const total = parseCurrency(limitFormTotal);
    const used = parseCurrency(limitFormUsed);
    const available = Math.max(total - used, 0);

    if (limitEditingClient) {
      updateClient(limitEditingClient, { totalLimit: total, usedLimit: used, availableLimit: available });
    }
    // For "new limit" on an existing client we'd need a client selector —
    // but since all clients already exist in the system, the create flow
    // is kept as a placeholder that updates the first matching client by name/doc.
    closeLimitModal();
  };

  const formatBRL = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('rates')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
            activeTab === 'rates'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Taxas por Cliente</span>
        </button>
        <button
          onClick={() => setActiveTab('curve')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
            activeTab === 'curve'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Curva de Juros</span>
        </button>
        <button
          onClick={() => setActiveTab('haircut')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
            activeTab === 'haircut'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Redutor de URs</span>
        </button>
        <button
          onClick={() => setActiveTab('criteria')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
            activeTab === 'criteria'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ShieldX className="w-4 h-4" />
          <span>Não Aceite</span>
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
            activeTab === 'limits'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Limites de Crédito</span>
        </button>
      </div>

      {/* Saved message */}
      {showSavedMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium text-sm">
            {savedSection === 'curve'
              ? 'Curva de juros salva com sucesso!'
              : savedSection === 'haircut'
              ? 'Redutor padrão salvo com sucesso!'
              : savedSection === 'criteria'
              ? 'Critérios de não aceite salvos com sucesso!'
              : savedSection === 'defaultCriteria'
              ? 'Regra padrão de não aceite salva com sucesso!'
              : savedSection === 'defaultRates'
              ? 'Taxa padrão salva com sucesso!'
              : 'Taxas salvas com sucesso!'}
          </p>
        </div>
      )}

      {/* Taxas por Cliente */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          {/* Taxa Padrão (Global) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Taxa Padrão</h2>
              <p className="text-sm text-gray-600 mt-1">
                Faixas de taxa aplicadas para todos os clientes que não possuem taxas personalizadas
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dias De</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dias Até</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taxa (% a.m.)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {defaultRates.map((rate, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rate.daysFrom}
                          onChange={(e) => updateDefaultRate(index, 'daysFrom', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rate.daysTo}
                          onChange={(e) => updateDefaultRate(index, 'daysTo', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rate.rate}
                          step="0.01"
                          onChange={(e) => updateDefaultRate(index, 'rate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeDefaultRate(index)}
                          disabled={defaultRates.length === 1}
                          className={`p-1 rounded ${defaultRates.length === 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                onClick={addDefaultRate}
                className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar faixa</span>
              </button>
              <button
                onClick={saveDefaultRates}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4 flex items-center gap-2">
              <span className="text-xs font-medium text-amber-800">A taxa padrão só é aplicada para clientes que não possuem taxa específica cadastrada.</span>
            </div>
          </div>

          {/* Taxas por Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Taxas por Cliente</h2>
                <p className="text-sm text-gray-600 mt-1">Configure taxas personalizadas para clientes específicos (sobrescrevem a taxa padrão)</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isExpanded = expandedClient === client.id;
                  const rates = getClientRates(client.id);
                  const hasCustom = clientRates.has(client.id);

                  return (
                    <div key={client.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${hasCustom ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.document}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasCustom && (
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Taxa personalizada
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && !hasCustom && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50 flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium">Sem taxa cadastrada</p>
                          <p className="text-xs text-gray-400">Este cliente utiliza a taxa padrão do sistema</p>
                          <button
                            onClick={() => addClientRate(client.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-1"
                          >
                            <Plus className="w-4 h-4" />
                            Cadastrar taxa
                          </button>
                        </div>
                      )}

                      {isExpanded && hasCustom && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                          <table className="min-w-full">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dias De</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dias Até</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taxa (% a.m.)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {rates.map((rate, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={rate.daysFrom}
                                      onChange={(e) => updateClientRate(client.id, index, 'daysFrom', Number(e.target.value))}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={rate.daysTo}
                                      onChange={(e) => updateClientRate(client.id, index, 'daysTo', Number(e.target.value))}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={rate.rate}
                                      step="0.01"
                                      onChange={(e) => updateClientRate(client.id, index, 'rate', Number(e.target.value))}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => removeClientRate(client.id, index)}
                                      disabled={rates.length === 1}
                                      className={`p-1 rounded ${rates.length === 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => addClientRate(client.id)}
                              className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Adicionar faixa</span>
                            </button>
                            <button
                              onClick={() => saveClientRates(client.id)}
                              className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redutor de URs (Haircut) */}
      {activeTab === 'haircut' && (
        <div className="space-y-4">
          {/* Redutor Padrão (Global) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Redutor Padrão</h2>
              <p className="text-sm text-gray-600 mt-1">
                Percentual redutor aplicado sobre o <strong>valor bruto</strong> das URs para todos os clientes que não possuem redutor específico cadastrado
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="number"
                  value={defaultHaircut}
                  onChange={(e) => setDefaultHaircut(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <button
                onClick={saveDefaultHaircut}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs font-medium text-amber-800 space-y-1">
                <p>O redutor é aplicado sobre o <strong>valor bruto</strong> da UR, antes da taxa de antecipação. A dedução do redutor e o desconto da antecipação são calculados independentemente sobre o bruto.</p>
                <p>O redutor padrão só é executado para clientes que <strong>não possuem redutor específico</strong> cadastrado abaixo. Quando um cliente tem valor próprio, o padrão é ignorado para aquele cliente.</p>
              </div>
            </div>
          </div>

          {/* Redutores por Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Redutores por Cliente</h2>
                <p className="text-sm text-gray-600 mt-1">Configure redutores personalizados por cliente (sobrescrevem o redutor padrão)</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ..."
                value={haircutSearchTerm}
                onChange={(e) => setHaircutSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredHaircutClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
                </div>
              ) : (
                filteredHaircutClients.map((client) => {
                  const isExpanded = expandedHaircutClient === client.id;
                  const hasCustom = clientHaircuts.has(client.id);
                  const currentValue = clientHaircuts.get(client.id) ?? defaultHaircut;
                  const isDefaultActive = defaultHaircut > 0;

                  return (
                    <div key={client.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedHaircutClient(isExpanded ? null : client.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${hasCustom ? 'bg-blue-500' : isDefaultActive ? 'bg-amber-400' : 'bg-gray-300'}`} />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.document}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasCustom ? (
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Redutor específico: {currentValue}%
                            </span>
                          ) : isDefaultActive ? (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              Usando padrão: {defaultHaircut}%
                            </span>
                          ) : null}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                          {!hasCustom && isDefaultActive && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-amber-800">
                                Este cliente está usando o redutor padrão de {defaultHaircut}%. Ao salvar um redutor específico abaixo, o padrão será ignorado para este cliente.
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Redutor (%)</label>
                            <div className="relative flex-1 max-w-xs">
                              <input
                                type="number"
                                value={currentValue}
                                onChange={(e) => updateClientHaircut(client.id, Number(e.target.value))}
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            {hasCustom ? (
                              <button
                                onClick={() => removeClientHaircut(client.id)}
                                className="flex items-center gap-1 text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remover e usar padrão</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {isDefaultActive
                                  ? `Padrão ativo: ${defaultHaircut}%`
                                  : 'Nenhum redutor ativo'}
                              </span>
                            )}
                            <button
                              onClick={() => saveClientHaircut(client.id)}
                              className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Scissors className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 text-sm mb-1">O que é o Redutor de Captura (Haircut)?</h3>
                <p className="text-xs text-blue-800">
                  O redutor de captura (haircut) é um percentual aplicado sobre o <strong>valor bruto</strong> da UR, antes da taxa de antecipação.
                  Por exemplo, um redutor de 2% sobre uma UR de R$ 1.000,00 deduz R$ 20,00 do bruto, e a taxa de antecipação
                  também incide sobre os mesmos R$ 1.000,00 — ambas as deduções são independentes.
                  Clientes com redutor específico utilizam seu valor próprio; os demais utilizam o redutor padrão global, se ativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Não Aceite (Criteria) */}
      {activeTab === 'criteria' && (
        <div className="space-y-4">
          {/* Regra Padrão de Não Aceite */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Regra Padrão de Não Aceite</h2>
              <p className="text-sm text-gray-600 mt-1">
                Critérios padrão aplicados para todos os clientes que não possuem regra específica cadastrada
              </p>
            </div>

            <div className="space-y-4">
              {/* Prazo */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Prazo de URs (dias)</span>
                  </div>
                  <button
                    onClick={() => setGlobalDefaultCriteria(prev => ({ ...prev, termEnabled: !prev.termEnabled }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      globalDefaultCriteria.termEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        globalDefaultCriteria.termEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {globalDefaultCriteria.termEnabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                      <input
                        type="number"
                        value={globalDefaultCriteria.minTerm}
                        onChange={(e) => setGlobalDefaultCriteria(prev => ({ ...prev, minTerm: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-gray-400 mt-5">—</span>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                      <input
                        type="number"
                        value={globalDefaultCriteria.maxTerm}
                        onChange={(e) => setGlobalDefaultCriteria(prev => ({ ...prev, maxTerm: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Valor */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Valor de URs (R$)</span>
                  </div>
                  <button
                    onClick={() => setGlobalDefaultCriteria(prev => ({ ...prev, valueEnabled: !prev.valueEnabled }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      globalDefaultCriteria.valueEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        globalDefaultCriteria.valueEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {globalDefaultCriteria.valueEnabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                        <input
                          type="text"
                          value={globalDefaultCriteria.minValue}
                          onChange={(e) => setGlobalDefaultCriteria(prev => ({ ...prev, minValue: formatCurrencyInput(e.target.value) }))}
                          placeholder="0,00"
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <span className="text-gray-400 mt-5">—</span>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                        <input
                          type="text"
                          value={globalDefaultCriteria.maxValue}
                          onChange={(e) => setGlobalDefaultCriteria(prev => ({ ...prev, maxValue: formatCurrencyInput(e.target.value) }))}
                          placeholder="0,00"
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              {hasDefaultCriteria() ? (
                <button
                  onClick={removeGlobalDefaultCriteria}
                  className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remover Regra Padrão</span>
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={saveGlobalDefaultCriteria}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-800">
                A regra padrão de não aceite só é executada para clientes que não possuem regra específica cadastrada.
                Quando um cliente tem critérios próprios configurados abaixo, a regra padrão é ignorada para aquele cliente.
              </span>
            </div>
          </div>

          {/* Critérios por Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Critérios de Não Aceite por Cliente</h2>
                <p className="text-sm text-gray-600 mt-1">Configure critérios personalizados por cliente (sobrescrevem a regra padrão)</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ..."
                value={criteriaSearchTerm}
                onChange={(e) => setCriteriaSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredCriteriaClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
                </div>
              ) : (
                filteredCriteriaClients.map((client) => {
                  const isExpanded = expandedCriteriaClient === client.id;
                  const criteria = getCriteria(client.id);
                  const isConfigured = hasClientCriteria(client.id);

                  return (
                    <div key={client.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCriteriaClient(isExpanded ? null : client.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-red-500' : isDefaultCriteriaActive ? 'bg-amber-400' : 'bg-gray-300'}`} />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.document}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isConfigured ? (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                              Regra específica
                            </span>
                          ) : isDefaultCriteriaActive ? (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              Usando regra padrão
                            </span>
                          ) : null}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                          {/* Aviso de regra padrão ativa */}
                          {!isConfigured && isDefaultCriteriaActive && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-amber-800">
                                Este cliente está usando a regra padrão de não aceite. Ao salvar critérios específicos abaixo, a regra padrão será ignorada para este cliente.
                              </span>
                            </div>
                          )}
                          {/* Bloco Prazo */}
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-900">Prazo de URs (dias)</span>
                              </div>
                              <button
                                onClick={() => updateCriteria(client.id, { termEnabled: !criteria.termEnabled })}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  criteria.termEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    criteria.termEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                            {criteria.termEnabled && (
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                                  <input
                                    type="number"
                                    value={criteria.minTerm}
                                    onChange={(e) => updateCriteria(client.id, { minTerm: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <span className="text-gray-400 mt-5">—</span>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                                  <input
                                    type="number"
                                    value={criteria.maxTerm}
                                    onChange={(e) => updateCriteria(client.id, { maxTerm: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bloco Valor */}
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-900">Valor de URs (R$)</span>
                              </div>
                              <button
                                onClick={() => updateCriteria(client.id, { valueEnabled: !criteria.valueEnabled })}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  criteria.valueEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    criteria.valueEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                            {criteria.valueEnabled && (
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                    <input
                                      type="text"
                                      value={criteria.minValue}
                                      onChange={(e) => updateCriteria(client.id, { minValue: formatCurrencyInput(e.target.value) })}
                                      placeholder="0,00"
                                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <span className="text-gray-400 mt-5">—</span>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                    <input
                                      type="text"
                                      value={criteria.maxValue}
                                      onChange={(e) => updateCriteria(client.id, { maxValue: formatCurrencyInput(e.target.value) })}
                                      placeholder="0,00"
                                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Botões */}
                          <div className="flex items-center justify-between pt-2">
                            {isConfigured ? (
                              <button
                                onClick={() => removeCriteria(client.id)}
                                className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remover Critérios</span>
                              </button>
                            ) : (
                              <span />
                            )}
                            <button
                              onClick={() => saveCriteria(client.id)}
                              className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ShieldX className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 text-sm mb-1">O que são Critérios de Não Aceite?</h3>
                <p className="text-xs text-blue-800">
                  Os critérios de não aceite permitem definir regras automáticas para rejeição de URs por cliente,
                  com base no prazo e no valor. Quando ativados, URs com prazo ou valor fora dos intervalos
                  configurados (mínimo e máximo) serão automaticamente marcadas como não aceitas.
                  As configurações realizadas aqui são compartilhadas com o cadastro de clientes e vice-versa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limites de Crédito */}
      {activeTab === 'limits' && (
        <div className="space-y-4">
          {/* Resumo geral */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Limite Total</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatBRL(totalLimitAll)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Limite em Uso</span>
              </div>
              <p className="text-xl font-bold text-amber-700">{formatBRL(totalUsedAll)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Limite Disponível</span>
              </div>
              <p className="text-xl font-bold text-green-700">{formatBRL(totalAvailableAll)}</p>
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Limites por Cliente</h2>
                <p className="text-sm text-gray-600 mt-1">Visualize o limite ativo e o limite em uso de cada cliente</p>
              </div>
              <button
                onClick={openNewLimitModal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cadastrar novo limite
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ..."
                value={limitsSearchTerm}
                onChange={(e) => setLimitsSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Limite Ativo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Limite em Uso</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disponível</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Utilização</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLimitsClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLimitsClients.map((client) => {
                      const usagePercent = client.totalLimit > 0
                        ? Math.round((client.usedLimit / client.totalLimit) * 100)
                        : 0;
                      const barColor = usagePercent >= 90
                        ? 'bg-red-500'
                        : usagePercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-green-500';

                      return (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-green-500' : client.status === 'inactive' ? 'bg-red-400' : 'bg-amber-400'}`} />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                                <p className="text-xs text-gray-500">{client.document}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatBRL(client.totalLimit)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-amber-700">{formatBRL(client.usedLimit)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-green-700">{formatBRL(client.availableLimit)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${barColor}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium min-w-[36px] text-right ${
                                usagePercent >= 90 ? 'text-red-600' : usagePercent >= 70 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {usagePercent}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEditLimitModal(client.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 text-sm mb-1">Sobre os Limites de Crédito</h3>
                <p className="text-xs text-blue-800">
                  O limite ativo é o valor total de crédito aprovado para o cliente. O limite em uso representa
                  o montante já comprometido em operações vigentes. A barra de utilização indica visualmente
                  a proporção de uso: verde (abaixo de 70%), amarelo (70–89%) e vermelho (90% ou mais).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curva de Juros */}
      {activeTab === 'curve' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Curva de Juros</h2>
            <p className="text-sm text-gray-600 mt-1">
              Defina a curva de juros utilizada como referência nas operações de antecipação
            </p>
          </div>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              A curva de juros <strong>não</strong> se sobrepõe a taxas cadastradas especificamente para um EC em <strong>"Taxas por Cliente"</strong>. Quando um cliente possui taxas individuais configuradas, estas sempre terão prioridade sobre a curva geral.
            </p>
          </div>

          {/* Visual da curva */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-end gap-1 h-40">
              {interestCurve
                .sort((a, b) => a.days - b.days)
                .map((point, index) => {
                  const maxRate = Math.max(...interestCurve.map(p => p.rate));
                  const heightPercent = maxRate > 0 ? (point.rate / maxRate) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-blue-700">{point.rate}%</span>
                      <div
                        className="w-full bg-blue-500 rounded-t-sm min-h-[4px] transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-xs text-gray-500">{point.days}d</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Tabela editável */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prazo (dias)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa (% a.m.)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {interestCurve.map((point, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={point.days}
                        onChange={(e) => updateCurvePoint(index, 'days', Number(e.target.value))}
                        min="1"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={point.rate}
                        onChange={(e) => updateCurvePoint(index, 'rate', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeCurvePoint(index)}
                        disabled={interestCurve.length === 1}
                        className={`p-1.5 rounded ${interestCurve.length === 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={addCurvePoint}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Ponto</span>
            </button>
            <button
              onClick={saveCurve}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Curva</span>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 text-sm mb-1">Informação</h3>
                <p className="text-xs text-blue-800">
                  A curva de juros serve como referência base para o cálculo de desconto nas operações de antecipação.
                  As taxas por cliente, quando configuradas, sobrescrevem os valores desta curva.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Limite de Crédito */}
      {limitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeLimitModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {limitEditingClient ? 'Editar Limite de Crédito' : 'Cadastrar Novo Limite'}
              </h2>
              <button onClick={closeLimitModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {!limitEditingClient && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select
                      value={limitFormName}
                      onChange={(e) => {
                        const selected = clients.find(c => c.id === e.target.value);
                        if (selected) {
                          setLimitEditingClient(selected.id);
                          setLimitFormName(selected.name);
                          setLimitFormDocument(selected.document);
                          setLimitFormTotal(String(selected.totalLimit));
                          setLimitFormUsed(String(selected.usedLimit));
                        }
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.document}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {limitEditingClient && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{limitFormName}</p>
                  <p className="text-xs text-gray-500">{limitFormDocument}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite Total (R$)</label>
                <input
                  type="text"
                  value={limitFormTotal}
                  onChange={(e) => setLimitFormTotal(e.target.value)}
                  placeholder="Ex: 500000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite em Uso (R$)</label>
                <input
                  type="text"
                  value={limitFormUsed}
                  onChange={(e) => setLimitFormUsed(e.target.value)}
                  placeholder="Ex: 150000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {limitFormTotal && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-emerald-700 font-medium">Limite disponível resultante</p>
                  <p className="text-lg font-bold text-emerald-800">
                    {formatBRL(Math.max(parseCurrency(limitFormTotal) - parseCurrency(limitFormUsed), 0))}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeLimitModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLimit}
                disabled={!limitEditingClient}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {limitEditingClient ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
