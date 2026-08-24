import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Zap,
  AlertTriangle,
  Bell,
  RefreshCw,
  Shield,
  FileText,
  Edit3,
  Plus,
  X,
  Loader2,
  RotateCcw,
} from 'lucide-react';

/* ────────────────────────────────────
   Types
   ──────────────────────────────────── */
interface AgentAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface AgentTrigger {
  id: string;
  label: string;
  description: string;
}

interface ParsedAgent {
  name: string;
  description: string;
  triggers: AgentTrigger[];
  actions: AgentAction[];
  frequency: string;
  scope: string;
  notifications: string[];
}

type Step = 'describe' | 'processing' | 'review' | 'success';

/* ────────────────────────────────────
   Fake "AI interpretation"
   ──────────────────────────────────── */
const EXAMPLE_PROMPTS = [
  'Quero um agente que monitore todos os contratos de garantia e me avise quando a cobertura cair abaixo de 70%.',
  'Preciso de um agente que verifique diariamente as liquidações e crie alertas automáticos quando houver divergência de valores.',
  'Crie um agente que identifique chargebacks acima de R$ 5.000 e envie uma notificação urgente para o time de operações.',
  'Quero automatizar a conciliação de agendas — o agente deve rodar a cada 2h e reportar divergências.',
];

const simulateParse = (prompt: string): ParsedAgent => {
  const lower = prompt.toLowerCase();

  let name = 'Novo Agente';
  let description = prompt.length > 120 ? prompt.slice(0, 117) + '...' : prompt;
  const triggers: AgentTrigger[] = [];
  const actions: AgentAction[] = [];
  let frequency = 'A cada 1 hora';
  let scope = 'Todos os contratos ativos';
  const notifications: string[] = ['Notificação no painel'];

  if (lower.includes('cobertura') || lower.includes('garantia') || lower.includes('monitor')) {
    name = 'Monitor de Cobertura';
    triggers.push({ id: 't1', label: 'Cobertura abaixo do limite', description: 'Quando a cobertura de um contrato ficar abaixo do valor configurado' });
    actions.push({ id: 'a1', label: 'Verificar cobertura', description: 'Consultar valor alcançado vs solicitado', icon: Shield });
    actions.push({ id: 'a2', label: 'Enviar alerta', description: 'Notificar operador responsável', icon: Bell });
    frequency = 'A cada 30 minutos';
  } else if (lower.includes('liquidação') || lower.includes('liquidaç') || lower.includes('divergência') || lower.includes('divergencia')) {
    name = 'Validador de Liquidações';
    triggers.push({ id: 't1', label: 'Nova liquidação recebida', description: 'Quando uma liquidação é processada pelo sistema' });
    triggers.push({ id: 't2', label: 'Divergência detectada', description: 'Quando o valor liquidado difere do esperado' });
    actions.push({ id: 'a1', label: 'Comparar valores', description: 'Validar valor liquidado vs esperado', icon: FileText });
    actions.push({ id: 'a2', label: 'Criar alerta', description: 'Gerar alerta automático de divergência', icon: AlertTriangle });
    actions.push({ id: 'a3', label: 'Notificar equipe', description: 'Enviar notificação para o time', icon: Bell });
    frequency = 'Diariamente às 14h';
    notifications.push('E-mail para equipe de operações');
  } else if (lower.includes('chargeback') || lower.includes('contestação') || lower.includes('contestacao')) {
    name = 'Detector de Chargebacks';
    triggers.push({ id: 't1', label: 'Chargeback identificado', description: 'Quando um chargeback é registrado por qualquer credenciadora' });
    actions.push({ id: 'a1', label: 'Analisar valor', description: 'Verificar se o chargeback excede o limite configurado', icon: Zap });
    actions.push({ id: 'a2', label: 'Alerta urgente', description: 'Enviar notificação prioritária', icon: AlertTriangle });
    frequency = 'Tempo real';
    scope = 'Todas as credenciadoras';
    notifications.push('Notificação push urgente');
  } else if (lower.includes('concilia') || lower.includes('agenda')) {
    name = 'Conciliador de Agendas';
    triggers.push({ id: 't1', label: 'Ciclo agendado', description: 'Executar na frequência configurada' });
    actions.push({ id: 'a1', label: 'Buscar agendas', description: 'Consultar agendas nas registradoras', icon: RefreshCw });
    actions.push({ id: 'a2', label: 'Comparar registros', description: 'Cruzar agenda com dados internos', icon: FileText });
    actions.push({ id: 'a3', label: 'Reportar divergências', description: 'Gerar relatório de divergências encontradas', icon: AlertTriangle });
    frequency = 'A cada 2 horas';
  } else {
    name = 'Agente Personalizado';
    triggers.push({ id: 't1', label: 'Condição personalizada', description: 'Definida pela descrição do agente' });
    actions.push({ id: 'a1', label: 'Executar tarefa', description: 'Ação principal do agente', icon: Zap });
    actions.push({ id: 'a2', label: 'Notificar', description: 'Enviar resultado para o operador', icon: Bell });
  }

  return { name, description, triggers, actions, frequency, scope, notifications };
};

/* ────────────────────────────────────
   Component
   ──────────────────────────────────── */
export const AgentCreatorModule: React.FC = () => {
  const [step, setStep] = useState<Step>('describe');
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState<ParsedAgent | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [editFrequency, setEditFrequency] = useState('');
  const [createdAgentName, setCreatedAgentName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    if (step === 'describe' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleSubmitPrompt = () => {
    if (!prompt.trim()) return;
    setStep('processing');
    // Simulate API delay
    setTimeout(() => {
      const result = simulateParse(prompt);
      setParsed(result);
      setEditName(result.name);
      setEditFrequency(result.frequency);
      setStep('review');
    }, 2200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitPrompt();
    }
  };

  const handleConfirmCreate = () => {
    if (!parsed) return;
    setCreatedAgentName(parsed.name);
    setStep('success');
  };

  const handleStartOver = () => {
    setStep('describe');
    setPrompt('');
    setParsed(null);
    setEditingName(false);
    setEditingFrequency(false);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const saveName = () => {
    if (parsed && editName.trim()) {
      setParsed({ ...parsed, name: editName.trim() });
    }
    setEditingName(false);
  };

  const saveFrequency = () => {
    if (parsed && editFrequency.trim()) {
      setParsed({ ...parsed, frequency: editFrequency.trim() });
    }
    setEditingFrequency(false);
  };

  const removeAction = (actionId: string) => {
    if (parsed) {
      setParsed({ ...parsed, actions: parsed.actions.filter(a => a.id !== actionId) });
    }
  };

  const removeTrigger = (triggerId: string) => {
    if (parsed) {
      setParsed({ ...parsed, triggers: parsed.triggers.filter(t => t.id !== triggerId) });
    }
  };

  /* ─── Step: Describe ─── */
  const renderDescribeStep = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center pt-4">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-200">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Criar novo agente</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Descreva em linguagem natural o que o agente deve fazer. Nossa IA vai interpretar e configurar tudo para você.
        </p>
      </div>

      {/* Input area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o problema que o agente deve resolver...&#10;&#10;Ex: Quero um agente que monitore todos os contratos de garantia e me avise quando a cobertura cair abaixo de 70%."
            rows={5}
            className="w-full resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed"
          />
        </div>
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-400">
            Shift+Enter para nova linha — Enter para enviar
          </p>
          <button
            onClick={handleSubmitPrompt}
            disabled={!prompt.trim()}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              prompt.trim()
                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Interpretar
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Sugestões para começar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXAMPLE_PROMPTS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleUseSuggestion(suggestion)}
              className="text-left p-3.5 rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 transition-all text-sm text-gray-700 leading-snug group"
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0 group-hover:text-violet-600 transition-colors" />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─── Step: Processing ─── */
  const renderProcessingStep = () => (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Interpretando sua descrição...</h3>
      <p className="text-sm text-gray-500">A IA está analisando o que você precisa e configurando o agente.</p>

      <div className="mt-8 space-y-3 max-w-xs mx-auto">
        <ProcessingLine label="Analisando contexto" done />
        <ProcessingLine label="Identificando gatilhos" done />
        <ProcessingLine label="Configurando ações" loading />
        <ProcessingLine label="Montando agente" pending />
      </div>
    </div>
  );

  /* ─── Step: Review ─── */
  const renderReviewStep = () => {
    if (!parsed) return null;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep('describe')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar e editar descrição
          </button>
          <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Interpretado pela IA
          </div>
        </div>

        {/* Original prompt */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sua descrição</p>
          <p className="text-sm text-gray-700 italic leading-relaxed">"{prompt}"</p>
        </div>

        {/* Parsed config card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Name */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    className="text-xl font-bold text-gray-900 border-b-2 border-violet-500 focus:outline-none bg-transparent flex-1"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{parsed.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{parsed.description}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setEditName(parsed.name); setEditingName(true); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-3"
                title="Editar nome"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Triggers */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Gatilhos
            </h4>
            <div className="space-y-2">
              {parsed.triggers.map(trigger => (
                <div key={trigger.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{trigger.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{trigger.description}</p>
                  </div>
                  {parsed.triggers.length > 1 && (
                    <button onClick={() => removeTrigger(trigger.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              Ações
            </h4>
            <div className="space-y-2">
              {parsed.actions.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <div key={action.id} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-blue-600 flex-shrink-0">
                      <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{idx + 1}</span>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                    </div>
                    {parsed.actions.length > 1 && (
                      <button onClick={() => removeAction(action.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings row */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Frequency */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Frequência
                </span>
                <button
                  onClick={() => { setEditFrequency(parsed.frequency); setEditingFrequency(true); }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              {editingFrequency ? (
                <input
                  type="text"
                  value={editFrequency}
                  onChange={e => setEditFrequency(e.target.value)}
                  onBlur={saveFrequency}
                  onKeyDown={e => e.key === 'Enter' && saveFrequency()}
                  autoFocus
                  className="text-sm font-medium text-gray-900 border-b border-violet-500 focus:outline-none bg-transparent w-full"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{parsed.frequency}</p>
              )}
            </div>

            {/* Scope */}
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Shield className="w-3 h-3" /> Escopo
              </span>
              <p className="text-sm font-medium text-gray-900">{parsed.scope}</p>
            </div>

            {/* Notifications */}
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Bell className="w-3 h-3" /> Notificações
              </span>
              <div className="space-y-0.5">
                {parsed.notifications.map((n, i) => (
                  <p key={i} className="text-sm font-medium text-gray-900">{n}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep('describe')}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Refazer descrição
          </button>
          <button
            onClick={handleConfirmCreate}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Criar Agente
          </button>
        </div>
      </div>
    );
  };

  /* ─── Step: Success ─── */
  const renderSuccessStep = () => (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Agente criado com sucesso!</h3>
      <p className="text-sm text-gray-500 mb-8">
        O agente <span className="font-semibold text-gray-700">"{createdAgentName}"</span> está configurado e pronto para ativação.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 text-left">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{createdAgentName}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700">
              <Clock className="w-3 h-3" />
              Aguardando ativação
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Vá para <span className="font-medium text-gray-700">Agentes Ativos</span> para ativar e acompanhar a execução em tempo real.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleStartOver}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Criar outro agente
        </button>
        <button
          onClick={handleStartOver}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          Ver agentes ativos
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[60vh]">
      {/* Progress bar */}
      {step !== 'success' && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center gap-3">
            {(['describe', 'review'] as const).map((s, idx) => {
              const stepLabels = ['Descrever', 'Revisar e criar'];
              const isActive = step === s || (step === 'processing' && s === 'describe');
              const isDone = (step === 'review' && s === 'describe') || (step === 'processing' && s === 'describe');
              return (
                <React.Fragment key={s}>
                  {idx > 0 && (
                    <div className={`flex-1 h-px ${isDone || isActive ? 'bg-violet-300' : 'bg-gray-200'}`} />
                  )}
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone ? 'bg-violet-600 text-white' : isActive ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-300' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-sm font-medium ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                      {stepLabels[idx]}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {step === 'describe' && renderDescribeStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
};

/* ─── Helper component ─── */
const ProcessingLine: React.FC<{ label: string; done?: boolean; loading?: boolean; pending?: boolean }> = ({ label, done, loading }) => (
  <div className="flex items-center gap-3">
    {done ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : loading ? (
      <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    )}
    <span className={`text-sm ${done ? 'text-gray-700' : loading ? 'text-violet-700 font-medium' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);
