import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Target,
  TrendingUp,
  Upload,
  Send,
  MessageSquare
} from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { ConfirmDialog } from './ConfirmDialog';

interface ClientFormalizationStatus {
  clientId: string;
  clientName: string;
  document: string;
  optInStatus: 'pending' | 'approved' | 'rejected' | 'not_requested';
  optInRequestDate?: Date;
  optInApprovalDate?: Date;
  contractStatus: 'pending' | 'formalized' | 'rejected' | 'not_started';
  contractFormalizationDate?: Date;
  targetValue: number;
  currentValue: number;
  businessFlow: 'onboarding' | 'credit_analysis' | 'contract_negotiation' | 'active' | 'suspended';
  lastUpdate: Date;
}

interface FormalizationDetailProps {
  client: ClientFormalizationStatus;
  onBack: () => void;
  onUpdateClient: (clientId: string, updates: Partial<ClientFormalizationStatus>) => void;
}

interface Activity {
  id: string;
  type: 'status_change' | 'note' | 'document' | 'action';
  user: string;
  timestamp: Date;
  description: string;
  details?: string;
}

type ActionColor = 'green' | 'red' | 'blue';
type ActionType =
  | 'complete_onboarding'
  | 'approve_credit'
  | 'reject_credit'
  | 'request_optin'
  | 'approve_optin'
  | 'reject_optin'
  | 'move_to_formalization'
  | 'send_contract'
  | 'mark_signed';

interface StepAction {
  label: string;
  action: ActionType;
  color: ActionColor;
}

interface ActionData extends StepAction {
  stepId: string;
}

export const FormalizationDetail: React.FC<FormalizationDetailProps> = ({ client, onBack, onUpdateClient }) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'status_change',
      user: 'João Silva',
      timestamp: new Date('2024-01-12'),
      description: 'Opt-in aprovado'
    },
    {
      id: '2',
      type: 'note',
      user: 'Maria Santos',
      timestamp: new Date('2024-01-13'),
      description: 'Cliente solicitou revisão das taxas',
      details: 'Enviei proposta revisada por email'
    },
    {
      id: '3',
      type: 'document',
      user: 'Pedro Costa',
      timestamp: new Date('2024-01-14'),
      description: 'Contrato enviado para assinatura'
    }
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const achievementPercentage = (client.currentValue / client.targetValue) * 100;

  const getStepActions = (stepId: string) => {
    const actions: StepAction[] = [];

    switch (stepId) {
      case 'onboarding':
        if (client.businessFlow === 'onboarding') {
          actions.push({ label: 'Concluir Onboarding', action: 'complete_onboarding', color: 'green' });
        }
        break;
      case 'credit_analysis':
        if (client.businessFlow === 'credit_analysis') {
          actions.push({ label: 'Aprovar Análise', action: 'approve_credit', color: 'green' });
          actions.push({ label: 'Rejeitar', action: 'reject_credit', color: 'red' });
        }
        break;
      case 'opt_in':
        if (client.optInStatus === 'not_requested') {
          actions.push({ label: 'Solicitar Opt-in', action: 'request_optin', color: 'blue' });
        } else if (client.optInStatus === 'pending') {
          actions.push({ label: 'Aprovar Opt-in', action: 'approve_optin', color: 'green' });
          actions.push({ label: 'Rejeitar Opt-in', action: 'reject_optin', color: 'red' });
        }
        break;
      case 'contract_negotiation':
        if (client.businessFlow === 'contract_negotiation') {
          actions.push({ label: 'Avançar para Formalização', action: 'move_to_formalization', color: 'green' });
        }
        break;
      case 'formalization':
        if (client.contractStatus === 'not_started') {
          actions.push({ label: 'Enviar Contrato', action: 'send_contract', color: 'blue' });
        } else if (client.contractStatus === 'pending') {
          actions.push({ label: 'Marcar como Assinado', action: 'mark_signed', color: 'green' });
        }
        break;
    }

    return actions;
  };

  const workflowSteps = [
    {
      id: 'onboarding',
      label: 'Onboarding',
      description: 'Cadastro inicial e coleta de documentos',
      status: client.businessFlow === 'onboarding' ? 'current' : 'completed'
    },
    {
      id: 'credit_analysis',
      label: 'Análise de Crédito',
      description: 'Avaliação de risco e limite',
      status: client.businessFlow === 'credit_analysis' ? 'current' :
              ['onboarding'].includes(client.businessFlow) ? 'pending' : 'completed'
    },
    {
      id: 'opt_in',
      label: 'Opt-in',
      description: 'Autorização de acesso aos recebíveis',
      status: client.optInStatus === 'approved' ? 'completed' :
              client.optInStatus === 'pending' ? 'current' :
              client.optInStatus === 'rejected' ? 'rejected' : 'pending'
    },
    {
      id: 'contract_negotiation',
      label: 'Negociação',
      description: 'Ajustes de contrato e condições',
      status: client.businessFlow === 'contract_negotiation' ? 'current' :
              ['onboarding', 'credit_analysis'].includes(client.businessFlow) ? 'pending' : 'completed'
    },
    {
      id: 'formalization',
      label: 'Formalização',
      description: 'Assinatura e ativação do contrato',
      status: client.contractStatus === 'formalized' ? 'completed' :
              client.contractStatus === 'pending' ? 'current' :
              client.contractStatus === 'rejected' ? 'rejected' : 'pending'
    },
    {
      id: 'active',
      label: 'Ativo',
      description: 'Operação em andamento',
      status: client.businessFlow === 'active' ? 'completed' : 'pending'
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'current':
        return 'bg-blue-100 border-blue-300';
      case 'rejected':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const handleRequestOptIn = () => {
    onUpdateClient(client.clientId, {
      optInStatus: 'pending',
      optInRequestDate: new Date()
    });
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'action',
      user: 'Usuário Atual',
      timestamp: new Date(),
      description: 'Opt-in solicitado'
    };
    setActivities([newActivity, ...activities]);
  };

  const handleUploadContract = () => {
    onUpdateClient(client.clientId, {
      contractStatus: 'pending'
    });
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'document',
      user: 'Usuário Atual',
      timestamp: new Date(),
      description: 'Contrato enviado'
    };
    setActivities([newActivity, ...activities]);
  };

  const handleSendContract = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'action',
      user: 'Usuário Atual',
      timestamp: new Date(),
      description: 'Contrato enviado para assinatura'
    };
    setActivities([newActivity, ...activities]);
  };

  const handleAddNote = () => {
    if (note.trim()) {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: 'note',
        user: 'Usuário Atual',
        timestamp: new Date(),
        description: note
      };
      setActivities([newActivity, ...activities]);
      setNote('');
      setShowNoteModal(false);
    }
  };

  const handleStepAction = (stepId: string, action: StepAction) => {
    const actionData: ActionData = { stepId, ...action };

    if (action.action === 'reject_credit' || action.action === 'reject_optin') {
      setConfirmDialog({
        isOpen: true,
        title: 'Confirmar Rejeição',
        message: `Tem certeza que deseja ${action.label.toLowerCase()}? Esta ação afetará o fluxo do cliente.`,
        type: 'danger',
        onConfirm: () => {
          setCurrentAction(actionData);
          executeActionDirectly(actionData);
        },
      });
    } else {
      setCurrentAction(actionData);
      setShowActionModal(true);
    }
  };

  const executeActionDirectly = (actionData: ActionData) => {
    const updates: Partial<ClientFormalizationStatus> = {};

    switch (actionData.action) {
      case 'complete_onboarding':
        updates.businessFlow = 'credit_analysis';
        break;
      case 'approve_credit':
        updates.businessFlow = 'contract_negotiation';
        break;
      case 'reject_credit':
        updates.businessFlow = 'suspended';
        break;
      case 'request_optin':
        updates.optInStatus = 'pending';
        updates.optInRequestDate = new Date();
        break;
      case 'approve_optin':
        updates.optInStatus = 'approved';
        updates.optInApprovalDate = new Date();
        break;
      case 'reject_optin':
        updates.optInStatus = 'rejected';
        break;
      case 'move_to_formalization':
        updates.businessFlow = 'active';
        break;
      case 'send_contract':
        updates.contractStatus = 'pending';
        break;
      case 'mark_signed':
        updates.contractStatus = 'formalized';
        updates.contractFormalizationDate = new Date();
        updates.businessFlow = 'active';
        break;
    }

    if (Object.keys(updates).length > 0) {
      onUpdateClient(client.clientId, updates);
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'status_change',
      user: 'Usuário Atual',
      timestamp: new Date(),
      description: `${actionData.label}`
    };
    setActivities([newActivity, ...activities]);
  };

  const executeAction = () => {
    if (!currentAction) return;

    const updates: Partial<ClientFormalizationStatus> = {};

    switch (currentAction.action) {
      case 'complete_onboarding':
        updates.businessFlow = 'credit_analysis';
        break;
      case 'approve_credit':
        updates.businessFlow = 'contract_negotiation';
        break;
      case 'reject_credit':
        updates.businessFlow = 'suspended';
        break;
      case 'request_optin':
        updates.optInStatus = 'pending';
        updates.optInRequestDate = new Date();
        break;
      case 'approve_optin':
        updates.optInStatus = 'approved';
        updates.optInApprovalDate = new Date();
        break;
      case 'reject_optin':
        updates.optInStatus = 'rejected';
        break;
      case 'move_to_formalization':
        updates.businessFlow = 'active';
        break;
      case 'send_contract':
        updates.contractStatus = 'pending';
        break;
      case 'mark_signed':
        updates.contractStatus = 'formalized';
        updates.contractFormalizationDate = new Date();
        updates.businessFlow = 'active';
        break;
    }

    if (Object.keys(updates).length > 0) {
      onUpdateClient(client.clientId, updates);
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'status_change',
      user: 'Usuário Atual',
      timestamp: new Date(),
      description: `${currentAction.label}`
    };
    setActivities([newActivity, ...activities]);
    setShowActionModal(false);
    setCurrentAction(null);
  };

  const getAvailableActions = () => {
    const actions = [];

    if (client.optInStatus === 'not_requested' || client.optInStatus === 'rejected') {
      actions.push({
        label: 'Solicitar Opt-in',
        icon: Send,
        color: 'bg-blue-600 hover:bg-blue-700',
        onClick: handleRequestOptIn
      });
    }

    if (client.optInStatus === 'approved' && client.contractStatus === 'not_started') {
      actions.push({
        label: 'Fazer Upload de Contrato',
        icon: Upload,
        color: 'bg-teal-600 hover:bg-teal-700',
        onClick: handleUploadContract
      });
    }

    if (client.contractStatus === 'pending') {
      actions.push({
        label: 'Enviar para Assinatura',
        icon: Send,
        color: 'bg-purple-600 hover:bg-purple-700',
        onClick: handleSendContract
      });
    }

    actions.push({
      label: 'Adicionar Nota',
      icon: MessageSquare,
      color: 'bg-gray-600 hover:bg-gray-700',
      onClick: () => setShowNoteModal(true)
    });

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Formalização', onClick: onBack },
          { label: client.clientName },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.clientName}</h1>
            <p className="text-gray-600">{client.document}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {availableActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`${action.color} text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm`}
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Valor Alvo</span>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(client.targetValue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Valor Atual</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(client.currentValue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Taxa de Realização</span>
            <CheckCircle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{achievementPercentage.toFixed(1)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Fluxo de Formalização</h2>

        <div className="relative">
          <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200" style={{ zIndex: 0 }}></div>

          <div className="relative grid grid-cols-6 gap-4" style={{ zIndex: 1 }}>
            {workflowSteps.map((step, _index) => {
              const stepActions = getStepActions(step.id);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full border-2 ${getStepColor(step.status)} flex items-center justify-center mb-3 bg-white`}>
                    {getStepIcon(step.status)}
                  </div>
                  <div className="text-center mb-2">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{step.label}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {stepActions.length > 0 && (
                    <div className="flex flex-col space-y-1 w-full">
                      {stepActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleStepAction(step.id, action)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            action.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            action.color === 'red' ? 'bg-red-600 hover:bg-red-700 text-white' :
                            'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Histórico de Atividades
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-blue-600 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    {activity.details && (
                      <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-full ${
                    activity.type === 'status_change' ? 'bg-green-100' :
                    activity.type === 'note' ? 'bg-blue-100' :
                    activity.type === 'document' ? 'bg-orange-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'status_change' && <CheckCircle className="w-3 h-3 text-green-600" />}
                    {activity.type === 'note' && <MessageSquare className="w-3 h-3 text-blue-600" />}
                    {activity.type === 'document' && <Upload className="w-3 h-3 text-orange-600" />}
                    {activity.type === 'action' && <Target className="w-3 h-3 text-gray-600" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Status do Opt-in
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {client.optInStatus === 'approved' ? 'Aprovado' :
                   client.optInStatus === 'pending' ? 'Pendente' :
                   client.optInStatus === 'rejected' ? 'Rejeitado' : 'Não Solicitado'}
                </span>
              </div>
              {client.optInRequestDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Solicitado em:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(client.optInRequestDate)}</span>
                </div>
              )}
              {client.optInApprovalDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Aprovado em:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(client.optInApprovalDate)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-teal-600" />
              Status do Contrato
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {client.contractStatus === 'formalized' ? 'Formalizado' :
                   client.contractStatus === 'pending' ? 'Pendente' :
                   client.contractStatus === 'rejected' ? 'Rejeitado' : 'Não Iniciado'}
                </span>
              </div>
              {client.contractFormalizationDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Formalizado em:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(client.contractFormalizationDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Última atualização:</span>
                <span className="text-sm font-semibold text-gray-900">{formatDate(client.lastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nota</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Digite sua nota..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setNote('');
                  setShowNoteModal(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {showActionModal && currentAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Ação</h3>
            <p className="text-gray-600 mb-6">
              Você tem certeza que deseja executar: <strong>{currentAction.label}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setCurrentAction(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  currentAction.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  currentAction.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};
