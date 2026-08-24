import React, { useState } from 'react';
import {
  Bot,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Zap,
  Pause,
  XCircle,
  RotateCcw,
  FileText,
  TrendingUp,
} from 'lucide-react';

type AgentStatus = 'active' | 'idle' | 'error' | 'paused';

interface AgentLogEntry {
  id: string;
  timestamp: Date;
  type: 'task_completed' | 'task_started' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  tasksCompleted: number;
  tasksToday: number;
  successRate: number;
  lastActivity: Date;
  avgResponseTime: string;
  logs: AgentLogEntry[];
}

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Agente de Conciliação',
    description: 'Reconcilia automaticamente agendas de recebíveis com extratos bancários.',
    status: 'active',
    tasksCompleted: 1247,
    tasksToday: 34,
    successRate: 98.2,
    lastActivity: new Date('2026-02-17T14:32:00'),
    avgResponseTime: '1.2s',
    logs: [
      { id: 'l1', timestamp: new Date('2026-02-17T14:32:00'), type: 'task_completed', message: 'Conciliação finalizada para ABC Comércio S.A.', details: '142 registros processados, 2 divergências encontradas.' },
      { id: 'l2', timestamp: new Date('2026-02-17T14:28:00'), type: 'task_completed', message: 'Conciliação finalizada para XYZ Indústria Ltda.', details: '89 registros processados, 0 divergências.' },
      { id: 'l3', timestamp: new Date('2026-02-17T14:15:00'), type: 'task_started', message: 'Iniciando conciliação em lote — 5 clientes na fila.' },
      { id: 'l4', timestamp: new Date('2026-02-17T13:50:00'), type: 'warning', message: 'Timeout ao consultar agenda da Cielo para Varejo Prime Ltda.', details: 'Retry automático agendado em 5 min.' },
      { id: 'l5', timestamp: new Date('2026-02-17T13:45:00'), type: 'task_completed', message: 'Conciliação finalizada para Comercial Santos Ltda.', details: '56 registros processados, 1 divergência.' },
      { id: 'l6', timestamp: new Date('2026-02-17T12:00:00'), type: 'info', message: 'Ciclo diário de conciliação iniciado.' },
    ],
  },
  {
    id: 'agent-2',
    name: 'Agente de Monitoramento de Garantias',
    description: 'Monitora contratos de garantia e alerta sobre insuficiência de cobertura.',
    status: 'active',
    tasksCompleted: 856,
    tasksToday: 18,
    successRate: 99.5,
    lastActivity: new Date('2026-02-17T14:30:00'),
    avgResponseTime: '0.8s',
    logs: [
      { id: 'l7', timestamp: new Date('2026-02-17T14:30:00'), type: 'task_completed', message: 'Verificação de cobertura CTR-2024-001 concluída.', details: 'Cobertura em 84% — dentro do esperado.' },
      { id: 'l8', timestamp: new Date('2026-02-17T14:20:00'), type: 'warning', message: 'CTR-2024-005 com cobertura abaixo de 60%.', details: 'Alerta enviado para o operador responsável.' },
      { id: 'l9', timestamp: new Date('2026-02-17T14:10:00'), type: 'task_completed', message: 'Scan de 12 contratos ativos finalizado.' },
      { id: 'l10', timestamp: new Date('2026-02-17T13:00:00'), type: 'info', message: 'Ciclo de monitoramento vespertino iniciado.' },
    ],
  },
  {
    id: 'agent-3',
    name: 'Agente de Captura Automática',
    description: 'Executa capturas automáticas de recebíveis conforme regras configuradas.',
    status: 'paused',
    tasksCompleted: 432,
    tasksToday: 0,
    successRate: 95.8,
    lastActivity: new Date('2026-02-17T09:15:00'),
    avgResponseTime: '2.1s',
    logs: [
      { id: 'l11', timestamp: new Date('2026-02-17T09:15:00'), type: 'info', message: 'Agente pausado manualmente pelo operador.' },
      { id: 'l12', timestamp: new Date('2026-02-17T09:10:00'), type: 'task_completed', message: 'Captura de R$ 45.000 para CTR-2024-003 executada.' },
      { id: 'l13', timestamp: new Date('2026-02-17T08:55:00'), type: 'error', message: 'Falha na captura para CTR-2024-007.', details: 'Registradora CERC retornou erro 503. Tentativa 2/3.' },
      { id: 'l14', timestamp: new Date('2026-02-17T08:30:00'), type: 'task_started', message: 'Iniciando ciclo matutino de capturas automáticas.' },
    ],
  },
  {
    id: 'agent-4',
    name: 'Agente de Alertas de Chargeback',
    description: 'Detecta e notifica automaticamente sobre chargebacks recebidos.',
    status: 'error',
    tasksCompleted: 189,
    tasksToday: 2,
    successRate: 91.0,
    lastActivity: new Date('2026-02-17T11:42:00'),
    avgResponseTime: '0.5s',
    logs: [
      { id: 'l15', timestamp: new Date('2026-02-17T11:42:00'), type: 'error', message: 'Conexão com API da Stone perdida.', details: 'Erro de autenticação — token expirado. Intervenção manual necessária.' },
      { id: 'l16', timestamp: new Date('2026-02-17T11:40:00'), type: 'error', message: 'Retry 3/3 falhou para consulta de chargebacks Stone.' },
      { id: 'l17', timestamp: new Date('2026-02-17T11:30:00'), type: 'task_completed', message: '3 chargebacks identificados na Cielo — notificações enviadas.' },
      { id: 'l18', timestamp: new Date('2026-02-17T10:00:00'), type: 'task_started', message: 'Scan de chargebacks iniciado para 4 credenciadoras.' },
    ],
  },
  {
    id: 'agent-5',
    name: 'Agente de Liquidação',
    description: 'Acompanha e valida liquidações diárias dos contratos ativos.',
    status: 'idle',
    tasksCompleted: 2103,
    tasksToday: 47,
    successRate: 99.1,
    lastActivity: new Date('2026-02-17T13:58:00'),
    avgResponseTime: '1.5s',
    logs: [
      { id: 'l19', timestamp: new Date('2026-02-17T13:58:00'), type: 'task_completed', message: 'Validação de liquidações do dia concluída.', details: '47 liquidações verificadas, 46 OK, 1 com valor divergente.' },
      { id: 'l20', timestamp: new Date('2026-02-17T13:00:00'), type: 'task_started', message: 'Iniciando validação de liquidações D+0.' },
      { id: 'l21', timestamp: new Date('2026-02-17T12:00:00'), type: 'info', message: 'Aguardando janela de liquidação D+0 (13h).' },
    ],
  },
];

const statusConfig: Record<AgentStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  active: { label: 'Ativo', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: Activity },
  idle: { label: 'Ocioso', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: Clock },
  error: { label: 'Erro', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  paused: { label: 'Pausado', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Pause },
};

const logTypeConfig: Record<AgentLogEntry['type'], { color: string; icon: React.ElementType }> = {
  task_completed: { color: 'text-green-600', icon: CheckCircle },
  task_started: { color: 'text-blue-600', icon: Zap },
  error: { color: 'text-red-600', icon: XCircle },
  warning: { color: 'text-yellow-600', icon: AlertTriangle },
  info: { color: 'text-gray-500', icon: FileText },
};

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);

export const AgentsOverviewModule: React.FC = () => {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | AgentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = mockAgents.filter(agent => {
    if (statusFilter !== 'all' && agent.status !== statusFilter) return false;
    if (searchQuery && !agent.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalTasks = mockAgents.reduce((sum, a) => sum + a.tasksToday, 0);
  const activeCount = mockAgents.filter(a => a.status === 'active').length;
  const errorCount = mockAgents.filter(a => a.status === 'error').length;
  const avgSuccess = mockAgents.length > 0
    ? (mockAgents.reduce((sum, a) => sum + a.successRate, 0) / mockAgents.length).toFixed(1)
    : '0';

  const toggleAgent = (id: string) => {
    setExpandedAgentId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agentes Configurados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{mockAgents.length}</p>
            </div>
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativos Agora</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tarefas Hoje</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalTasks}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgSuccess}%</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errorCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {errorCount} agente{errorCount > 1 ? 's' : ''} com erro — ação necessária
            </p>
            <p className="text-xs text-red-600 mt-0.5">Verifique os logs para detalhes e resolva o problema.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar agente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'active', 'idle', 'paused', 'error'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Todos' : statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {filteredAgents.length} de {mockAgents.length} agentes
          </span>
        </div>
      </div>

      {/* Agent Cards */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum agente encontrado</h3>
          <p className="text-sm text-gray-500">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAgents.map(agent => {
            const isExpanded = expandedAgentId === agent.id;
            const sc = statusConfig[agent.status];
            const StatusIcon = sc.icon;

            return (
              <div
                key={agent.id}
                className={`bg-white rounded-xl shadow-sm border-2 ${sc.border} overflow-hidden transition-shadow hover:shadow-md`}
              >
                {/* Header */}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2.5 rounded-lg ${sc.bg} flex-shrink-0`}>
                      <Bot className={`w-5 h-5 ${sc.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{agent.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-gray-500">Hoje</p>
                      <p className="text-sm font-semibold text-gray-900">{agent.tasksToday} tarefas</p>
                    </div>
                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-gray-500">Sucesso</p>
                      <p className={`text-sm font-semibold ${agent.successRate >= 95 ? 'text-green-600' : agent.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {agent.successRate}%
                      </p>
                    </div>
                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-gray-500">Última atividade</p>
                      <p className="text-sm text-gray-700">{formatTime(agent.lastActivity)}</p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-5 h-5 text-gray-400" />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {/* Stats row */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Total Executadas</p>
                          <p className="text-lg font-bold text-gray-900">{agent.tasksCompleted.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Tarefas Hoje</p>
                          <p className="text-lg font-bold text-blue-600">{agent.tasksToday}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Taxa de Sucesso</p>
                          <p className={`text-lg font-bold ${agent.successRate >= 95 ? 'text-green-600' : agent.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {agent.successRate}%
                          </p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Tempo Médio</p>
                          <p className="text-lg font-bold text-gray-900">{agent.avgResponseTime}</p>
                        </div>
                      </div>
                    </div>

                    {/* Logs */}
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <RotateCcw className="w-4 h-4 text-gray-500" />
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Log de Atividades</h4>
                      </div>
                      <div className="space-y-1">
                        {agent.logs.map(log => {
                          const lc = logTypeConfig[log.type];
                          const LogIcon = lc.icon;
                          return (
                            <div key={log.id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white transition-colors">
                              <div className="mt-0.5 flex-shrink-0">
                                <LogIcon className={`w-4 h-4 ${lc.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-gray-900">{log.message}</span>
                                </div>
                                {log.details && (
                                  <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
