import React from 'react';
import { ContractMonitoring } from '../types';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';

interface ContractMonitoringCardProps {
  monitoring: ContractMonitoring;
  onContractClick: (contractId: string) => void;
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d);

export const ContractMonitoringCard: React.FC<ContractMonitoringCardProps> = ({
  monitoring,
  onContractClick,
}) => {
  const pct = monitoring.liquidatedPercentage ?? monitoring.capturedPercentage;
  const faltam = monitoring.valorProblema ?? 0;

  const status = (() => {
    switch (monitoring.status) {
      case 'functional':
        return { cardBg: 'bg-emerald-50', cardBorder: 'border-emerald-200', cardHover: 'hover:shadow-emerald-100', label: 'OK', accent: 'text-emerald-700', badgeBg: 'bg-emerald-100', ring: 'ring-emerald-300', icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />, labelColor: 'text-emerald-500', metricLabel: 'text-emerald-400', footerBorder: 'border-emerald-200/60', footerText: 'text-emerald-500', daysColor: 'text-emerald-600 font-semibold' };
      case 'insufficient':
        return { cardBg: 'bg-amber-50', cardBorder: 'border-amber-200', cardHover: 'hover:shadow-amber-100', label: 'Com falha', accent: 'text-amber-700', badgeBg: 'bg-amber-100', ring: 'ring-amber-300', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />, labelColor: 'text-amber-500', metricLabel: 'text-amber-400', footerBorder: 'border-amber-200/60', footerText: 'text-amber-500', daysColor: '' };
      case 'no_generation':
        return { cardBg: 'bg-red-50', cardBorder: 'border-red-200', cardHover: 'hover:shadow-red-100', label: 'Crítico', accent: 'text-red-700', badgeBg: 'bg-red-100', ring: 'ring-red-300', icon: <TrendingDown className="w-3.5 h-3.5 text-red-600" />, labelColor: 'text-red-500', metricLabel: 'text-red-300', footerBorder: 'border-red-200/60', footerText: 'text-red-400', daysColor: '' };
      default:
        return { cardBg: 'bg-gray-50', cardBorder: 'border-gray-200', cardHover: 'hover:shadow-gray-100', label: '—', accent: 'text-gray-600', badgeBg: 'bg-gray-100', ring: 'ring-gray-200', icon: <CheckCircle className="w-3.5 h-3.5 text-gray-400" />, labelColor: 'text-gray-400', metricLabel: 'text-gray-400', footerBorder: 'border-gray-200', footerText: 'text-gray-400', daysColor: '' };
    }
  })();

  const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';

  const daysText = monitoring.daysRemaining <= 3 && monitoring.status !== 'functional'
    ? 'text-red-600 font-semibold'
    : status.daysColor || status.footerText;

  return (
    <div
      className={`${status.cardBg} ${status.cardBorder} border rounded-xl shadow-sm ${status.cardHover} hover:shadow-md transition-all cursor-pointer group`}
      onClick={() => onContractClick(monitoring.contractId)}
    >
      {/* header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{monitoring.contractNumber}</span>
          </div>
          <p className="text-xs text-gray-600 truncate">{monitoring.clientName}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.badgeBg} ${status.accent} ring-1 ${status.ring} flex-shrink-0`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* métricas */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-3">
        <div>
          <p className={`text-[10px] ${status.metricLabel} uppercase tracking-wide font-medium`}>Meta</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{brl(monitoring.targetValue)}</p>
        </div>
        <div>
          <p className={`text-[10px] ${status.metricLabel} uppercase tracking-wide font-medium`}>Liquidado</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{brl(monitoring.liquidatedValue ?? monitoring.capturedValue)}</p>
        </div>
        <div>
          <p className={`text-[10px] ${status.metricLabel} uppercase tracking-wide font-medium`}>Faltam</p>
          <p className={`text-sm font-bold mt-0.5 ${faltam > 0 ? 'text-red-600' : 'text-gray-900'}`}>{brl(faltam)}</p>
        </div>
      </div>

      {/* barra de progresso */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[10px] ${status.metricLabel} font-medium uppercase tracking-wide`}>Progresso</span>
          <span className="text-xs font-bold text-gray-700">{pct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      {/* futuro */}
      {(monitoring.valorFuturo ?? 0) > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 bg-white/50 rounded-lg flex items-center justify-between">
          <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">A liquidar (futuro)</span>
          <span className="text-xs font-bold text-emerald-700">{brl(monitoring.valorFuturo ?? 0)}</span>
        </div>
      )}

      {/* footer */}
      <div className={`px-4 py-3 border-t ${status.footerBorder} flex items-center justify-between`}>
        <div className={`flex items-center gap-1.5 text-xs ${status.footerText}`}>
          <Clock className="w-3.5 h-3.5" />
          <span className={daysText}>
            {monitoring.daysRemaining}d restantes
          </span>
          <span className="opacity-30">|</span>
          <span>Fim {fmtDate(monitoring.windowEndDate)}</span>
        </div>
        <Eye className="w-4 h-4 opacity-30 group-hover:opacity-70 transition-opacity" />
      </div>
    </div>
  );
};
