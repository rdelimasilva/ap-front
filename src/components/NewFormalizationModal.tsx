import React, { useState } from 'react';
import { X, FileCheck, User, TrendingUp, Upload, Plus } from 'lucide-react';
import { Client } from '../types';
import { OnboardingProcessModal } from './OnboardingProcessModal';
import { NewPartnerModal } from './NewPartnerModal';

interface NewFormalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export const NewFormalizationModal: React.FC<NewFormalizationModalProps> = ({
  isOpen,
  onClose,
  clients
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    businessFlow: '' as string,
    requestOptIn: false,
    notes: '',
    contractDraft: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [createdFormalizationId, setCreatedFormalizationId] = useState<string | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Selecione um cliente';
    }

    if (!formData.businessFlow) {
      newErrors.businessFlow = 'Selecione um fluxo de negócio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formalizationId = `FORM-${Date.now()}`;
    console.log('Nova formalização:', formData, 'ID:', formalizationId);

    setCreatedFormalizationId(formalizationId);
    setShowOnboarding(true);
  };

  const handleClose = () => {
    setFormData({
      clientId: '',
      businessFlow: '',
      requestOptIn: false,
      notes: '',
      contractDraft: null
    });
    setErrors({});
    setShowOnboarding(false);
    setCreatedFormalizationId(null);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, contractDraft: file }));
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    handleClose();
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <FileCheck className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nova Formalização</h2>
              <p className="text-sm text-gray-600">Inicie um novo processo de formalização</p>
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
          {/* Cliente Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <User className="w-4 h-4 inline mr-1" />
                Cliente *
              </label>
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="flex items-center space-x-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar novo</span>
              </button>
            </div>
            <select
              value={formData.clientId}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, clientId: e.target.value }));
                setErrors(prev => ({ ...prev, clientId: '' }));
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.clientId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.document}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
            )}
            {selectedClient && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Razão Social:</span> {selectedClient.name}</div>
                  <div><span className="font-medium">Documento:</span> {selectedClient.document}</div>
                  <div><span className="font-medium">Status:</span> {selectedClient.status === 'active' ? 'Ativo' : 'Inativo'}</div>
                </div>
              </div>
            )}
          </div>


          {/* Business Flow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Fluxo de Negócio *
            </label>
            <select
              value={formData.businessFlow}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, businessFlow: e.target.value }));
                setErrors(prev => ({ ...prev, businessFlow: '' }));
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.businessFlow ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione um fluxo de negócio</option>
              <option value="anticipation">Antecipação</option>
              <option value="debt_renegotiation">Renegociação de Dívidas</option>
              <option value="guaranteed_flow">Fluxo Garantido</option>
              <option value="prepaid">Pré-pago</option>
            </select>
            {errors.businessFlow && (
              <p className="mt-1 text-sm text-red-600">{errors.businessFlow}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Selecione o tipo de operação de crédito
            </p>
          </div>

          {/* Upload Contract Draft */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Minuta de Contrato
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-teal-500 transition-colors">
              <input
                type="file"
                id="contract-draft"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="contract-draft"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  {formData.contractDraft ? (
                    <span className="text-teal-600 font-medium">{formData.contractDraft.name}</span>
                  ) : (
                    <>
                      Clique para fazer upload da minuta de contrato
                      <span className="block text-xs text-gray-500 mt-1">
                        PDF, DOC ou DOCX (máx. 10MB)
                      </span>
                    </>
                  )}
                </span>
              </label>
            </div>
            {formData.contractDraft && (
              <div className="mt-2 flex items-center justify-between p-2 bg-teal-50 rounded-lg">
                <span className="text-sm text-teal-700">{formData.contractDraft.name}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contractDraft: null }))}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* Request Opt-in */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={formData.requestOptIn}
                onChange={(e) => setFormData(prev => ({ ...prev, requestOptIn: e.target.checked }))}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
            </div>
            <div className="ml-3">
              <label className="text-sm font-medium text-gray-700">
                Solicitar Opt-in Imediatamente
              </label>
              <p className="text-xs text-gray-500">
                Marque esta opção para enviar a solicitação de opt-in automaticamente após criar o processo
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              placeholder="Adicione observações sobre este processo de formalização..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Informações adicionais relevantes para o processo
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Criar Processo
            </button>
          </div>
        </form>
      </div>

      {/* Onboarding Process Modal */}
      {showOnboarding && createdFormalizationId && selectedClient && (
        <OnboardingProcessModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          client={selectedClient}
          formalizationId={createdFormalizationId}
        />
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewPartnerModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
          onSave={(partnerData) => {
            console.log('Novo parceiro cadastrado:', partnerData);
            setShowNewClientModal(false);
          }}
        />
      )}
    </div>
  );
};
