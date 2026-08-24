import React from 'react';
import { X, Users, Building2, CreditCard, Calendar, Settings, CheckCircle, XCircle } from 'lucide-react';
import { AutomaticGuaranteeRule, Client } from '../types';

interface AutomaticGuaranteeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: AutomaticGuaranteeRule;
  clients: Client[];
}

export const AutomaticGuaranteeViewModal: React.FC<AutomaticGuaranteeViewModalProps> = ({
  isOpen,
  onClose,
  rule,
  clients: _clients
}) => {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSelectionTypeLabel = (type: AutomaticGuaranteeRule['clientSelectionType']) => {
    switch (type) {
      case 'all': return 'Todos os clientes';
      case 'filtered': return 'Por critérios';
      case 'specific': return 'Específicos';
      default: return 'Desconhecido';
    }
  };

  const getValuePriorityLabel = (priority: AutomaticGuaranteeRule['valuePriority']) => {
    switch (priority) {
      case 'any': return 'URs de qualquer valor';
      case 'lower': return 'URs de menor valor';
      case 'higher': return 'URs de maior valor';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${rule.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {rule.status === 'active' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalhes da Regra</h2>
              <p className="text-gray-600">{rule.name}</p>
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
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra</label>
                <p className="text-gray-900 bg-white p-2 rounded border">{rule.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  rule.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {rule.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {rule.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <p className="text-gray-900 bg-white p-2 rounded border">{rule.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Datas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                <p className="text-gray-900 bg-white p-2 rounded border">{formatDate(rule.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Última Atualização</label>
                <p className="text-gray-900 bg-white p-2 rounded border">{formatDate(rule.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Seleção de Clientes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Seleção</label>
                <p className="text-gray-900 bg-white p-2 rounded border">{getSelectionTypeLabel(rule.clientSelectionType)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clientes Afetados</label>
                <p className="text-gray-900 bg-white p-2 rounded border font-semibold">
                  {rule.affectedClientsCount.toLocaleString()} clientes
                </p>
              </div>
            </div>
          </div>

          {/* Acquirers and Card Brands */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Credenciadoras e Bandeiras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credenciadoras</label>
                <div className="bg-white p-3 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {rule.acquirers.map((acquirer, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {acquirer}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bandeiras</label>
                <div className="bg-white p-3 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {rule.cardBrands.map((brand, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Priority */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Configurações de Valor
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade de Valor</label>
              <p className="text-gray-900 bg-white p-2 rounded border">{getValuePriorityLabel(rule.valuePriority)}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Resumo da Regra</h3>
            <p className="text-yellow-700">
              Esta regra está <strong>{rule.status === 'active' ? 'ativa' : 'inativa'}</strong> e afeta{' '}
              <strong>{rule.affectedClientsCount.toLocaleString()} clientes</strong> usando{' '}
              <strong>{rule.acquirers.length} credenciadora(s)</strong> e{' '}
              <strong>{rule.cardBrands.length} bandeira(s)</strong> de cartão.
              {rule.status === 'active' && (
                <span> A garantia automática está sendo aplicada conforme as configurações definidas.</span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors h-8 flex items-center justify-center text-sm font-normal"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};