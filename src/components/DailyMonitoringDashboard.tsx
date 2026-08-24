import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ContractMonitoringCard } from './ContractMonitoringCard';
import { mockContractMonitoring } from '../data/mockData';
import { buildContractMonitoringFromContaCorrente } from '../data/contractMonitoringBuilder';
import { useData } from '../context/DataContext';
import { Contract, ContractMonitoring } from '../types';
import {
  Target,
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

type SortOption = 'faltam' | 'criticality' | 'progress' | 'daysLeft' | 'value';

interface DailyMonitoringDashboardProps {
  onContractClick: (contract: Contract) => void;
}

export const DailyMonitoringDashboard: React.FC<DailyMonitoringDashboardProps> = ({ onContractClick }) => {
  const { contracts, contaCorrenteEntries, useCsv } = useData();

  const contractMonitoring = useMemo(() => {
    if (useCsv && contaCorrenteEntries.length > 0 && contracts.length > 0) {
      return buildContractMonitoringFromContaCorrente(contaCorrenteEntries, contracts);
    }
    return mockContractMonitoring;
  }, [useCsv, contaCorrenteEntries, contracts]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('faltam');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleContractClick = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) onContractClick(contract);
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const uniqueClients = useMemo(() =>
    Array.from(new Set(contractMonitoring.map(c => c.clientName))).sort()
  , [contractMonitoring]);

  const filteredClients = uniqueClients.filter(c =>
    c.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const criticality = (c: ContractMonitoring) => {
    const w: Record<string, number> = { no_generation: 3, insufficient: 2, functional: 1 };
    const pct = c.liquidatedPercentage ?? c.capturedPercentage;
    return (w[c.status] || 0) * 10 + (pct < 50 ? 2 : pct < 80 ? 1 : 0);
  };

  const filtered = contractMonitoring.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (clientSearch && !c.clientName.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'faltam': return (b.valorProblema ?? 0) - (a.valorProblema ?? 0);
      case 'criticality': return criticality(b) - criticality(a);
      case 'progress': return (a.liquidatedPercentage ?? a.capturedPercentage) - (b.liquidatedPercentage ?? b.capturedPercentage);
      case 'daysLeft': return a.daysRemaining - b.daysRemaining;
      case 'value': return b.targetValue - a.targetValue;
      default: return 0;
    }
  });

  /* resumo */
  const totOk = contractMonitoring.filter(c => c.status === 'functional').length;
  const totFalha = contractMonitoring.filter(c => c.status === 'insufficient').length;
  const totCritico = contractMonitoring.filter(c => c.status === 'no_generation').length;

  const hasFilters = statusFilter !== 'all' || !!clientSearch;
  const clearAll = () => { setStatusFilter('all'); setClientSearch(''); };

  return (
    <div className="space-y-4">

      {/* ═══ RESUMO RÁPIDO ═══ */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{contractMonitoring.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:ring-1 hover:ring-emerald-300 transition-all" onClick={() => setStatusFilter(statusFilter === 'functional' ? 'all' : 'functional')}>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> OK
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totOk}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:ring-1 hover:ring-amber-300 transition-all" onClick={() => setStatusFilter(statusFilter === 'insufficient' ? 'all' : 'insufficient')}>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Com falha
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totFalha}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:ring-1 hover:ring-red-300 transition-all" onClick={() => setStatusFilter(statusFilter === 'no_generation' ? 'all' : 'no_generation')}>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Crítico
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totCritico}</p>
        </div>
      </div>

      {/* ═══ FILTROS ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* todos */}
          <button onClick={clearAll}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!hasFilters ? 'bg-[#0e4d64] text-white border-[#0e4d64]' : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'}`}
          >
            Todos ({contractMonitoring.length})
          </button>

          <span className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* status pills */}
          {([
            { value: 'functional', label: 'OK', dot: 'bg-emerald-500' },
            { value: 'insufficient', label: 'Com falha', dot: 'bg-amber-500' },
            { value: 'no_generation', label: 'Crítico', dot: 'bg-red-500' },
          ] as const).map(s => (
            <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === s.value ? 'bg-[#0e4d64] text-white border-[#0e4d64]' : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === s.value ? 'bg-white' : s.dot}`} />
              {s.label}
            </button>
          ))}

          <span className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* busca cliente */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input ref={inputRef} type="text" placeholder="Cliente..."
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setShowDrop(true); }}
              onFocus={() => setShowDrop(true)}
              className={`pl-8 pr-7 py-1.5 rounded-full text-xs w-52 border transition-colors focus:ring-1 focus:ring-[#137a8b]/40 focus:border-[#137a8b] ${clientSearch ? 'border-[#137a8b] bg-[#137a8b]/5' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
            />
            {clientSearch && <button onClick={() => { setClientSearch(''); setShowDrop(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
            {showDrop && filteredClients.length > 0 && (
              <div ref={dropRef} className="absolute z-30 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 max-h-52 overflow-y-auto">
                {filteredClients.slice(0, 15).map(c => (
                  <button key={c} onClick={() => { setClientSearch(c); setShowDrop(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* ordenar */}
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
              className="pl-3 pr-7 py-1.5 rounded-full text-xs appearance-none cursor-pointer border border-gray-200 bg-gray-50 transition-colors focus:ring-1 focus:ring-[#137a8b]/40 focus:border-[#137a8b]"
            >
              <option value="faltam">Maior problema</option>
              <option value="criticality">Mais críticos</option>
              <option value="progress">Menor progresso</option>
              <option value="daysLeft">Prazo mais curto</option>
              <option value="value">Maior valor</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearAll} className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              <X className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* ═══ GRID DE CARDS ═══ */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(c => (
            <ContractMonitoringCard key={c.id} monitoring={c} onContractClick={handleContractClick} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center py-16">
            <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum contrato encontrado</p>
            <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros</p>
          </div>
        </div>
      )}
    </div>
  );
};
