import React, { useState } from 'react';
import { X, CheckCircle, Clock, FileText, Shield, CreditCard, AlertCircle, ChevronRight } from 'lucide-react';
import { Client } from '../types';
import { showToast } from '../hooks/useToast';

interface OnboardingProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  formalizationId: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  icon: React.ElementType;
  substeps?: {
    id: string;
    title: string;
    status: 'pending' | 'completed';
  }[];
}

export const OnboardingProcessModal: React.FC<OnboardingProcessModalProps> = ({
  isOpen,
  onClose,
  client,
  formalizationId
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'documentation',
      title: 'Coleta de Documentação',
      description: 'Reunir documentos necessários do cliente',
      status: 'in_progress',
      icon: FileText,
      substeps: [
        { id: 'cnpj', title: 'Cartão CNPJ', status: 'completed' },
        { id: 'contract', title: 'Contrato Social', status: 'completed' },
        { id: 'address', title: 'Comprovante de Endereço', status: 'pending' },
        { id: 'financials', title: 'Demonstrativos Financeiros', status: 'pending' }
      ]
    },
    {
      id: 'registration',
      title: 'Cadastro no Sistema',
      description: 'Criar perfil completo do cliente',
      status: 'pending',
      icon: CreditCard,
      substeps: [
        { id: 'basic_data', title: 'Dados Básicos', status: 'pending' },
        { id: 'contacts', title: 'Contatos', status: 'pending' },
        { id: 'bank_accounts', title: 'Contas Bancárias', status: 'pending' }
      ]
    },
    {
      id: 'credit_analysis',
      title: 'Análise de Crédito',
      description: 'Avaliar capacidade creditícia do cliente',
      status: 'pending',
      icon: Shield,
      substeps: [
        { id: 'credit_check', title: 'Consulta de Crédito', status: 'pending' },
        { id: 'risk_analysis', title: 'Análise de Risco', status: 'pending' },
        { id: 'limit_approval', title: 'Aprovação de Limite', status: 'pending' }
      ]
    },
    {
      id: 'opt_in',
      title: 'Solicitação de Opt-in',
      description: 'Solicitar autorização do cliente',
      status: 'pending',
      icon: CheckCircle,
      substeps: [
        { id: 'request_sent', title: 'Enviar Solicitação', status: 'pending' },
        { id: 'client_approval', title: 'Aprovação do Cliente', status: 'pending' },
        { id: 'registration_complete', title: 'Registro na Credenciadora', status: 'pending' }
      ]
    }
  ]);

  const [notes, setNotes] = useState('');
  const [blockedReason, setBlockedReason] = useState('');

  if (!isOpen) return null;

  const getStepColor = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStepIcon = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleCompleteStep = () => {
    setSteps(prev => {
      const newSteps = [...prev];
      if (currentStep < newSteps.length) {
        newSteps[currentStep].status = 'completed';
        if (currentStep + 1 < newSteps.length) {
          newSteps[currentStep + 1].status = 'in_progress';
        }
      }
      return newSteps;
    });
    if (currentStep + 1 < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBlockStep = () => {
    if (!blockedReason.trim()) {
      showToast('warning', 'Campo obrigatório', 'Por favor, informe o motivo do bloqueio.');
      return;
    }
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[currentStep].status = 'blocked';
      return newSteps;
    });
    setBlockedReason('');
  };

  const handleToggleSubstep = (stepIndex: number, substepId: string) => {
    setSteps(prev => {
      const newSteps = [...prev];
      const substep = newSteps[stepIndex].substeps?.find(s => s.id === substepId);
      if (substep) {
        substep.status = substep.status === 'completed' ? 'pending' : 'completed';
      }
      return newSteps;
    });
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Processo de Onboarding</h2>
              <p className="text-sm text-gray-600">{client.name} - {client.document}</p>
              <p className="text-xs text-gray-500">ID: {formalizationId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progresso do Onboarding</span>
              <span className="text-gray-600">{completedSteps} de {steps.length} etapas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-teal-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Steps List */}
            <div className="col-span-1 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Etapas</h3>
              {steps.map((step, index) => {
                const _StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      currentStep === index
                        ? 'border-teal-500 bg-teal-50'
                        : `border-transparent ${getStepColor(step.status)}`
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getStepIcon(step.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{step.title}</span>
                          {currentStep === index && (
                            <ChevronRight className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step Details */}
            <div className="col-span-2 space-y-4">
              {steps[currentStep] && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getStepColor(steps[currentStep].status)}`}>
                        {React.createElement(steps[currentStep].icon, { className: 'w-6 h-6' })}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {steps[currentStep].title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {steps[currentStep].description}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStepColor(steps[currentStep].status)}`}>
                            {steps[currentStep].status === 'completed' && 'Concluído'}
                            {steps[currentStep].status === 'in_progress' && 'Em Andamento'}
                            {steps[currentStep].status === 'blocked' && 'Bloqueado'}
                            {steps[currentStep].status === 'pending' && 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Substeps */}
                  {steps[currentStep].substeps && steps[currentStep].substeps!.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Tarefas</h4>
                      <div className="space-y-2">
                        {steps[currentStep].substeps!.map((substep) => (
                          <label
                            key={substep.id}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={substep.status === 'completed'}
                              onChange={() => handleToggleSubstep(currentStep, substep.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                              disabled={steps[currentStep].status === 'completed'}
                            />
                            <span className={`text-sm ${
                              substep.status === 'completed'
                                ? 'text-gray-400 line-through'
                                : 'text-gray-700'
                            }`}>
                              {substep.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Observações</h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Adicione observações sobre esta etapa..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  {/* Actions */}
                  {steps[currentStep].status !== 'completed' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">Ações</h4>

                      {steps[currentStep].status === 'in_progress' && (
                        <>
                          <button
                            onClick={handleCompleteStep}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            Concluir Etapa
                          </button>

                          <div className="space-y-2">
                            <input
                              type="text"
                              value={blockedReason}
                              onChange={(e) => setBlockedReason(e.target.value)}
                              placeholder="Motivo do bloqueio..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            />
                            <button
                              onClick={handleBlockStep}
                              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Bloquear Etapa
                            </button>
                          </div>
                        </>
                      )}

                      {steps[currentStep].status === 'blocked' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            Esta etapa está bloqueada. Entre em contato com o responsável para resolver o problema.
                          </p>
                        </div>
                      )}

                      {steps[currentStep].status === 'pending' && (
                        <button
                          onClick={() => {
                            setSteps(prev => {
                              const newSteps = [...prev];
                              newSteps[currentStep].status = 'in_progress';
                              return newSteps;
                            });
                          }}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Iniciar Etapa
                        </button>
                      )}
                    </div>
                  )}

                  {steps[currentStep].status === 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800">
                          Esta etapa foi concluída com sucesso!
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {completedSteps === steps.length ? (
              <span className="text-green-600 font-medium">✓ Onboarding concluído!</span>
            ) : (
              <span>Progresso: {progressPercentage.toFixed(0)}%</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
