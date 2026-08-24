import React, { useState } from 'react';
import {
  Bot,
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Bell,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  ChevronRight,
  Power,
  Calendar,
  Timer,
  Target,
  RefreshCw,
} from 'lucide-react';

/* ────────────────────────────────────
   Types
   ──────────────────────────────────── */

interface ExecutionResult {
  id: string;
  timestamp: Date;
  status: 'success' | 'partial' | 'error';
  summary: string;
  details: string;
  duration: string;
  itemsProcessed: number;
  itemsFailed: number;
}

interface AgentData {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: 'running' | 'idle' | 'error' | 'disabled';
  frequency: string;
  lastRun: Date | null;
  nextRun: Date | null;
  totalExecutions: number;
  successRate: number;
  avgDuration: string;
  tasksToday: number;
  tasksThisWeek: number;
  alertsGenerated: number;
  uptime: string;
  results: ExecutionResult[];
  weeklyStats: { day: string; success: number; error: number }[];
}

/* ────────────────────────────────────
   Mock Data
   ──────────────────────────────────── */

const initialAgents: AgentData[] = [
  {
    id: 'a1',
    name: 'Agente de Conciliação',
    description: 'Reconcilia automaticamente agendas de recebíveis com extratos bancários.',
    enabled: true,
    status: 'running',
    frequency: 'A cada 2 horas',
    lastRun: new Date('2026-02-17T14:30:00'),
    nextRun: new Date('2026-02-17T16:30:00'),
    totalExecutions: 1247,
    successRate: 98.2,
    avgDuration: '1m 12s',
    tasksToday: 34,
    tasksThisWeek: 187,
    alertsGenerated: 8,
    uptime: '99.7%',
    results: [
      { id: 'r1', timestamp: new Date('2026-02-17T14:30:00'), status: 'success', summary: 'Conciliação completa — ABC Comércio S.A.', details: '142 registros processados. 2 divergências encontradas e reportadas. Tempo: 48s.', duration: '48s', itemsProcessed: 142, itemsFailed: 0 },
      { id: 'r2', timestamp: new Date('2026-02-17T12:30:00'), status: 'success', summary: 'Conciliação completa — XYZ Indústria Ltda.', details: '89 registros processados. Nenhuma divergência. Tempo: 32s.', duration: '32s', itemsProcessed: 89, itemsFailed: 0 },
      { id: 'r3', timestamp: new Date('2026-02-17T10:30:00'), status: 'partial', summary: 'Conciliação parcial — Varejo Prime Ltda.', details: 'Timeout ao consultar Cielo. 67 de 103 registros processados. Retry agendado.', duration: '2m 01s', itemsProcessed: 67, itemsFailed: 36 },
      { id: 'r4', timestamp: new Date('2026-02-17T08:30:00'), status: 'success', summary: 'Conciliação completa — Comercial Santos Ltda.', details: '56 registros processados. 1 divergência encontrada. Tempo: 28s.', duration: '28s', itemsProcessed: 56, itemsFailed: 0 },
      { id: 'r5', timestamp: new Date('2026-02-16T16:30:00'), status: 'success', summary: 'Ciclo vespertino — 4 clientes processados', details: 'Total: 312 registros. 0 divergências. Todos os clientes OK.', duration: '1m 45s', itemsProcessed: 312, itemsFailed: 0 },
      { id: 'r6', timestamp: new Date('2026-02-16T14:30:00'), status: 'error', summary: 'Falha na conciliação — Distribuidora Norte S.A.', details: 'Registradora CERC offline. Nenhum registro processado. Alerta gerado.', duration: '15s', itemsProcessed: 0, itemsFailed: 1 },
    ],
    weeklyStats: [
      { day: 'Seg', success: 28, error: 1 },
      { day: 'Ter', success: 31, error: 0 },
      { day: 'Qua', success: 30, error: 2 },
      { day: 'Qui', success: 29, error: 0 },
      { day: 'Sex', success: 33, error: 1 },
      { day: 'Sáb', success: 12, error: 0 },
      { day: 'Dom', success: 8, error: 0 },
    ],
  },
  {
    id: 'a2',
    name: 'Monitor de Garantias',
    description: 'Monitora contratos de garantia e alerta sobre insuficiência de cobertura.',
    enabled: true,
    status: 'idle',
    frequency: 'A cada 30 minutos',
    lastRun: new Date('2026-02-17T14:00:00'),
    nextRun: new Date('2026-02-17T14:30:00'),
    totalExecutions: 856,
    successRate: 99.5,
    avgDuration: '22s',
    tasksToday: 18,
    tasksThisWeek: 124,
    alertsGenerated: 3,
    uptime: '99.9%',
    results: [
      { id: 'r7', timestamp: new Date('2026-02-17T14:00:00'), status: 'success', summary: 'Scan de 12 contratos — todos dentro do esperado', details: 'Cobertura mínima: 72% (CTR-2024-005). Todas acima do limite de 70%.', duration: '18s', itemsProcessed: 12, itemsFailed: 0 },
      { id: 'r8', timestamp: new Date('2026-02-17T13:30:00'), status: 'success', summary: 'Scan de 12 contratos — 1 alerta gerado', details: 'CTR-2024-005 com cobertura em 68%. Alerta enviado ao operador.', duration: '20s', itemsProcessed: 12, itemsFailed: 0 },
      { id: 'r9', timestamp: new Date('2026-02-17T13:00:00'), status: 'success', summary: 'Scan de 12 contratos — todos OK', details: 'Sem alertas. Cobertura mínima: 74%.', duration: '17s', itemsProcessed: 12, itemsFailed: 0 },
    ],
    weeklyStats: [
      { day: 'Seg', success: 48, error: 0 },
      { day: 'Ter', success: 48, error: 0 },
      { day: 'Qua', success: 47, error: 1 },
      { day: 'Qui', success: 48, error: 0 },
      { day: 'Sex', success: 48, error: 0 },
      { day: 'Sáb', success: 24, error: 0 },
      { day: 'Dom', success: 24, error: 0 },
    ],
  },
  {
    id: 'a3',
    name: 'Detector de Chargebacks',
    description: 'Detecta e notifica automaticamente sobre chargebacks recebidos.',
    enabled: false,
    status: 'disabled',
    frequency: 'Tempo real',
    lastRun: new Date('2026-02-17T11:42:00'),
    nextRun: null,
    totalExecutions: 189,
    successRate: 91.0,
    avgDuration: '0.5s',
    tasksToday: 2,
    tasksThisWeek: 14,
    alertsGenerated: 11,
    uptime: '87.3%',
    results: [
      { id: 'r10', timestamp: new Date('2026-02-17T11:42:00'), status: 'error', summary: 'Conexão com Stone perdida', details: 'Erro de autenticação — token expirado. Agente desativado automaticamente.', duration: '3s', itemsProcessed: 0, itemsFailed: 1 },
      { id: 'r11', timestamp: new Date('2026-02-17T11:30:00'), status: 'success', summary: '3 chargebacks detectados na Cielo', details: 'Valores: R$ 1.200, R$ 3.450, R$ 890. Notificações enviadas.', duration: '0.4s', itemsProcessed: 3, itemsFailed: 0 },
      { id: 'r12', timestamp: new Date('2026-02-17T10:15:00'), status: 'success', summary: '1 chargeback detectado na Rede', details: 'Valor: R$ 7.800. Notificação urgente enviada.', duration: '0.3s', itemsProcessed: 1, itemsFailed: 0 },
    ],
    weeklyStats: [
      { day: 'Seg', success: 5, error: 0 },
      { day: 'Ter', success: 3, error: 1 },
      { day: 'Qua', success: 4, error: 0 },
      { day: 'Qui', success: 2, error: 0 },
      { day: 'Sex', success: 3, error: 2 },
      { day: 'Sáb', success: 1, error: 0 },
      { day: 'Dom', success: 0, error: 0 },
    ],
  },
  {
    id: 'a4',
    name: 'Validador de Liquidações',
    description: 'Acompanha e valida liquidações diárias dos contratos ativos.',
    enabled: true,
    status: 'idle',
    frequency: 'Diariamente às 14h',
    lastRun: new Date('2026-02-17T14:00:00'),
    nextRun: new Date('2026-02-18T14:00:00'),
    totalExecutions: 2103,
    successRate: 99.1,
    avgDuration: '3m 20s',
    tasksToday: 1,
    tasksThisWeek: 7,
    alertsGenerated: 2,
    uptime: '99.8%',
    results: [
      { id: 'r13', timestamp: new Date('2026-02-17T14:00:00'), status: 'success', summary: '47 liquidações validadas — 1 divergência', details: '46 liquidações OK. 1 divergência de R$ 342,50 no contrato CTR-2024-009. Alerta gerado.', duration: '3m 12s', itemsProcessed: 47, itemsFailed: 0 },
      { id: 'r14', timestamp: new Date('2026-02-16T14:00:00'), status: 'success', summary: '52 liquidações validadas — todas OK', details: 'Nenhuma divergência encontrada. Todos os valores bateram.', duration: '3m 28s', itemsProcessed: 52, itemsFailed: 0 },
      { id: 'r15', timestamp: new Date('2026-02-15T14:00:00'), status: 'partial', summary: '43 liquidações validadas — 3 pendentes', details: '3 liquidações não encontradas nos extratos bancários. Retry agendado para D+1.', duration: '3m 05s', itemsProcessed: 40, itemsFailed: 3 },
    ],
    weeklyStats: [
      { day: 'Seg', success: 1, error: 0 },
      { day: 'Ter', success: 1, error: 0 },
      { day: 'Qua', success: 1, error: 0 },
      { day: 'Qui', success: 1, error: 0 },
      { day: 'Sex', success: 1, error: 0 },
      { day: 'Sáb', success: 0, error: 0 },
      { day: 'Dom', success: 0, error: 0 },
    ],
  },
  {
    id: 'a5',
    name: 'Agente de Captura Automática',
    description: 'Executa capturas automáticas de recebíveis conforme regras configuradas.',
    enabled: true,
    status: 'running',
    frequency: 'A cada 1 hora',
    lastRun: new Date('2026-02-17T14:15:00'),
    nextRun: new Date('2026-02-17T15:15:00'),
    totalExecutions: 432,
    successRate: 95.8,
    avgDuration: '2m 05s',
    tasksToday: 8,
    tasksThisWeek: 52,
    alertsGenerated: 5,
    uptime: '96.2%',
    results: [
      { id: 'r16', timestamp: new Date('2026-02-17T14:15:00'), status: 'success', summary: 'Captura de R$ 125.000 em 3 contratos', details: 'CTR-2024-001: R$ 45.000 | CTR-2024-003: R$ 52.000 | CTR-2024-006: R$ 28.000. Todos com sucesso.', duration: '1m 48s', itemsProcessed: 3, itemsFailed: 0 },
      { id: 'r17', timestamp: new Date('2026-02-17T13:15:00'), status: 'partial', summary: 'Captura parcial — 2 de 3 contratos', details: 'CTR-2024-007 falhou — registradora retornou erro 503. Retry em 1h.', duration: '2m 15s', itemsProcessed: 2, itemsFailed: 1 },
      { id: 'r18', timestamp: new Date('2026-02-17T12:15:00'), status: 'success', summary: 'Captura de R$ 88.500 em 2 contratos', details: 'CTR-2024-002: R$ 38.500 | CTR-2024-004: R$ 50.000.', duration: '1m 32s', itemsProcessed: 2, itemsFailed: 0 },
    ],
    weeklyStats: [
      { day: 'Seg', success: 10, error: 1 },
      { day: 'Ter', success: 11, error: 0 },
      { day: 'Qua', success: 9, error: 2 },
      { day: 'Qui', success: 12, error: 0 },
      { day: 'Sex', success: 10, error: 1 },
      { day: 'Sáb', success: 4, error: 0 },
      { day: 'Dom', success: 2, error: 0 },
    ],
  },
];

/* ────────────────────────────────────
   Helpers
   ──────────────────────────────────── */

const statusConfig: Record<AgentData['status'], { label: string; color: string; bg: string; dotColor: string }> = {
  running:  { label: 'Executando', color: 'text-green-700',  bg: 'bg-green-50',  dotColor: 'bg-green-500' },
  idle:     { label: 'Ocioso',     color: 'text-blue-700',   bg: 'bg-blue-50',   dotColor: 'bg-blue-400' },
  error:    { label: 'Erro',       color: 'text-red-700',    bg: 'bg-red-50',    dotColor: 'bg-red-500' },
  disabled: { label: 'Desativado', color: 'text-gray-500',   bg: 'bg-gray-100',  dotColor: 'bg-gray-400' },
};

const resultStatusConfig: Record<ExecutionResult['status'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  success: { label: 'Sucesso', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  partial: { label: 'Parcial', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  error:   { label: 'Erro',    color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    icon: XCircle },
};

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);

const formatDateFull = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);

/* ────────────────────────────────────
   Toggle Switch
   ──────────────────────────────────── */
const Toggle: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    onClick={e => { e.stopPropagation(); onChange(); }}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
      checked ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

/* ────────────────────────────────────
   Mini bar chart
   ──────────────────────────────────── */
const WeeklyChart: React.FC<{ stats: AgentData['weeklyStats'] }> = ({ stats }) => {
  const max = Math.max(...stats.map(s => s.success + s.error), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {stats.map((s, i) => {
        const total = s.success + s.error;
        const h = Math.max((total / max) * 100, 4);
        const errorH = total > 0 ? (s.error / total) * h : 0;
        const successH = h - errorH;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
              {errorH > 0 && (
                <div className="w-full bg-red-400 rounded-t" style={{ height: `${errorH}%` }} />
              )}
              <div className={`w-full bg-green-400 ${errorH > 0 ? '' : 'rounded-t'} rounded-b`} style={{ height: `${successH}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{s.day}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ────────────────────────────────────
   Component
   ──────────────────────────────────── */
export const AgentsActiveModule: React.FC = () => {
  const [agents, setAgents] = useState(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      const newEnabled = !a.enabled;
      return {
        ...a,
        enabled: newEnabled,
        status: newEnabled ? 'idle' : 'disabled',
      };
    }));
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  /* ─── Detail view ─── */
  if (selectedAgent) {
    const sc = statusConfig[selectedAgent.status];

    return (
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedAgentId(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </button>
          <Toggle checked={selectedAgent.enabled} onChange={() => toggleAgent(selectedAgent.id)} />
        </div>

        {/* Agent header card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${selectedAgent.enabled ? 'bg-gradient-to-br from-violet-500 to-blue-600' : 'bg-gray-300'}`}>
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{selectedAgent.name}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${sc.bg} ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor} ${selectedAgent.status === 'running' ? 'animate-pulse' : ''}`} />
                  {sc.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{selectedAgent.description}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {selectedAgent.frequency}</span>
                {selectedAgent.lastRun && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Última: {formatDateTime(selectedAgent.lastRun)}</span>}
                {selectedAgent.nextRun && <span className="text-xs text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Próxima: {formatDateTime(selectedAgent.nextRun)}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Execuções', value: selectedAgent.totalExecutions.toLocaleString('pt-BR'), icon: BarChart3, color: 'text-gray-900' },
            { label: 'Taxa de Sucesso', value: `${selectedAgent.successRate}%`, icon: Target, color: selectedAgent.successRate >= 95 ? 'text-green-600' : 'text-yellow-600' },
            { label: 'Tarefas Hoje', value: String(selectedAgent.tasksToday), icon: Zap, color: 'text-blue-600' },
            { label: 'Esta Semana', value: String(selectedAgent.tasksThisWeek), icon: Calendar, color: 'text-violet-600' },
            { label: 'Alertas Gerados', value: String(selectedAgent.alertsGenerated), icon: Bell, color: selectedAgent.alertsGenerated > 5 ? 'text-orange-600' : 'text-gray-900' },
            { label: 'Uptime', value: selectedAgent.uptime, icon: Activity, color: 'text-green-600' },
          ].map((kpi, i) => {
            const KpiIcon = kpi.icon;
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <KpiIcon className="w-4 h-4 text-gray-400" />
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              </div>
            );
          })}
        </div>

        {/* Chart + results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Execuções da Semana
            </h4>
            <WeeklyChart stats={selectedAgent.weeklyStats} />
            <div className="flex items-center gap-4 mt-3 justify-center">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded bg-green-400" /> Sucesso</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded bg-red-400" /> Erro</span>
            </div>
          </div>

          {/* Results list */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Últimas Execuções
              </h4>
            </div>
            <div className="divide-y divide-gray-100">
              {selectedAgent.results.map(result => {
                const rc = resultStatusConfig[result.status];
                const ResultIcon = rc.icon;
                return (
                  <div key={result.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1 rounded-lg border ${rc.bg} flex-shrink-0`}>
                        <ResultIcon className={`w-4 h-4 ${rc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">{result.summary}</p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateFull(result.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{result.details}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> {result.duration}
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {result.itemsProcessed} processados
                          </span>
                          {result.itemsFailed > 0 && (
                            <span className="text-[11px] text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {result.itemsFailed} falha{result.itemsFailed > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── List view ─── */
  const enabledAgents = agents.filter(a => a.enabled);
  const disabledAgents = agents.filter(a => !a.enabled);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Power className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{enabledAgents.length}</p>
            <p className="text-sm text-gray-500">Agentes ligados</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Power className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{disabledAgents.length}</p>
            <p className="text-sm text-gray-500">Agentes desligados</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{agents.reduce((s, a) => s + a.tasksToday, 0)}</p>
            <p className="text-sm text-gray-500">Tarefas hoje</p>
          </div>
        </div>
      </div>

      {/* Agent list */}
      <div className="space-y-3">
        {agents.map(agent => {
          const sc = statusConfig[agent.status];
          const trend = agent.successRate >= 95;
          const TrendIcon = trend ? TrendingUp : TrendingDown;

          return (
            <div
              key={agent.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md ${
                !agent.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center px-5 py-4">
                {/* Toggle */}
                <div className="flex-shrink-0 mr-4">
                  <Toggle checked={agent.enabled} onChange={() => toggleAgent(agent.id)} />
                </div>

                {/* Clickable content */}
                <button
                  onClick={() => setSelectedAgentId(agent.id)}
                  className="flex-1 flex items-center justify-between text-left min-w-0 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${agent.enabled ? 'bg-violet-100' : 'bg-gray-100'}`}>
                      <Bot className={`w-5 h-5 ${agent.enabled ? 'text-violet-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{agent.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor} ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-gray-500">Hoje</p>
                      <p className="text-sm font-semibold text-gray-900">{agent.tasksToday}</p>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-gray-500">Sucesso</p>
                      <p className={`text-sm font-semibold flex items-center gap-1 justify-end ${trend ? 'text-green-600' : 'text-yellow-600'}`}>
                        {agent.successRate}%
                        <TrendIcon className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-gray-500">Frequência</p>
                      <p className="text-xs font-medium text-gray-700">{agent.frequency}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
