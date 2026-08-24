import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  Search,
  Download,
  Building2,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { UrIdLink } from './UrIdLink';
import type { LiquidationProblemUr } from '../data/csvLoader';

const ACQUIRER_COLORS: Record<string, string> = {
  Cielo: '#1e3a5f',
  Rede: '#ef4444',
  Getnet: '#f97316',
  Stone: '#22c55e',
  PagSeguro: '#eab308',
  Dock: '#06b6d4',
  MercadoPago: '#ec4899',
  default: '#94a3b8',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

const formatDateStr = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  return formatDate(d);
};

const getStatusLabel = (status: LiquidationProblemUr['status']) => {
  switch (status) {
    case 'not_settled':
      return 'Não liquidado';
    case 'delayed':
      return 'Liquidado em data diferente';
    case 'partial':
      return 'Liquidação parcial';
    default:
      return status;
  }
};

const getStatusBadge = (status: LiquidationProblemUr['status']) => {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium';
  switch (status) {
    case 'not_settled':
      return `${base} bg-red-100 text-red-800`;
    case 'delayed':
      return `${base} bg-amber-100 text-amber-800`;
    case 'partial':
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return base;
  }
};

export const LiquidationProblemModule: React.FC = () => {
  const { liquidationProblems } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [acquirerFilter, setAcquirerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chartExpanded, setChartExpanded] = useState(true);

  const filteredProblems = useMemo(() => {
    return liquidationProblems.filter((ur) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        ur.id.toLowerCase().includes(searchLower) ||
        ur.contractId.toLowerCase().includes(searchLower) ||
        ur.client.toLowerCase().includes(searchLower) ||
        ur.acquirer.toLowerCase().includes(searchLower);
      const matchesContract =
        contractFilter === 'all' || ur.contractId === contractFilter;
      const matchesAcquirer =
        acquirerFilter === 'all' || ur.acquirer === acquirerFilter;
      const matchesStatus =
        statusFilter === 'all' || ur.status === statusFilter;
      return matchesSearch && matchesContract && matchesAcquirer && matchesStatus;
    });
  }, [liquidationProblems, searchTerm, contractFilter, acquirerFilter, statusFilter]);

  const uniqueContracts = useMemo(
    () =>
      Array.from(new Set(liquidationProblems.map((ur) => ur.contractId))).sort(),
    [liquidationProblems]
  );

  const uniqueCredenciadoras = useMemo(
    () =>
      Array.from(new Set(liquidationProblems.map((ur) => ur.acquirer))).sort(),
    [liquidationProblems]
  );

  const totalReduction = filteredProblems.reduce(
    (sum, ur) => sum + (ur.expectedAmount - ur.realizedAmount),
    0
  );

  const chartData = useMemo(() => {
    const byDateAcquirer = new Map<string, Map<string, number>>();

    for (const ur of filteredProblems) {
      const dateKey = ur.actualDate ?? ur.expectedDate;
      const reduction = ur.expectedAmount - ur.realizedAmount;
      if (!byDateAcquirer.has(dateKey)) {
        byDateAcquirer.set(dateKey, new Map());
      }
      const acquirerMap = byDateAcquirer.get(dateKey)!;
      acquirerMap.set(
        ur.acquirer,
        (acquirerMap.get(ur.acquirer) ?? 0) + reduction
      );
    }

    const sortedDates = Array.from(byDateAcquirer.keys()).sort();
    const acquirersInData = new Set<string>();
    for (const m of byDateAcquirer.values()) {
      for (const a of m.keys()) acquirersInData.add(a);
    }
    const acquirersSorted = Array.from(acquirersInData).sort();

    return sortedDates.map((dateKey) => {
      const d = new Date(dateKey + 'T12:00:00');
      const row: Record<string, string | number> = {
        date: formatDate(d),
        dateKey,
      };
      let total = 0;
      for (const acquirer of acquirersSorted) {
        const val = byDateAcquirer.get(dateKey)?.get(acquirer) ?? 0;
        row[acquirer] = val;
        total += val;
      }
      row.total = total;
      return row;
    });
  }, [filteredProblems]);

  const chartAcquirers = useMemo(() => {
    const s = new Set<string>();
    for (const row of chartData) {
      for (const k of Object.keys(row)) {
        if (k !== 'date' && k !== 'dateKey' && k !== 'total') s.add(k);
      }
    }
    return Array.from(s).sort();
  }, [chartData]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
            <div className="flex items-center gap-2">
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300"
              >
                <option value="all">Todos os contratos</option>
                {uniqueContracts.map((cn) => (
                  <option key={cn} value={cn}>
                    {cn}
                  </option>
                ))}
              </select>
              <select
                value={acquirerFilter}
                onChange={(e) => setAcquirerFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300"
              >
                <option value="all">Todas as credenciadoras</option>
                {uniqueCredenciadoras.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300"
              >
                <option value="all">Todos os status</option>
                <option value="not_settled">Não liquidado</option>
                <option value="partial">Liquidação parcial</option>
                <option value="delayed">Liquidado em data diferente</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar UR, contrato, credenciadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                title="Exportar"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">
              {filteredProblems.length} URs com problema de liquidação
            </span>
            <span className="text-sm font-semibold text-amber-600">
              Redução total: {formatCurrency(totalReduction)}
            </span>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="border-b border-gray-100">
            <button
              type="button"
              onClick={() => setChartExpanded((e) => !e)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Valor de problema por dia / credenciadora
                </h3>
              </div>
              {chartExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {chartExpanded && (
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tick={{ angle: -45, textAnchor: 'end' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Data: ${label}`}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                            <p className="font-medium text-gray-900 mb-2">
                              {p.date}
                            </p>
                            {chartAcquirers
                              .filter((a) => (p[a] as number) > 0)
                              .map((a) => (
                                <p key={a} className="text-gray-700">
                                  {a}: {formatCurrency(p[a] as number)}
                                </p>
                              ))}
                            <p className="font-semibold text-amber-600 mt-1 pt-1 border-t border-gray-100">
                              Total: {formatCurrency(p.total as number)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend align="right" verticalAlign="middle" layout="vertical" />
                    {chartAcquirers.map((acquirer) => (
                      <Bar
                        key={acquirer}
                        dataKey={acquirer}
                        stackId="liquidation"
                        fill={ACQUIRER_COLORS[acquirer] ?? ACQUIRER_COLORS.default}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  UR
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contrato / Cliente
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Credenciadora
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Valor original
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Valor realizado
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Redução
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((ur) => {
                const reduction = ur.expectedAmount - ur.realizedAmount;
                const problemDate = ur.actualDate ?? ur.expectedDate;
                return (
                  <tr
                    key={ur.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <UrIdLink urId={ur.id} />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ur.contractId}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {ur.client}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {ur.acquirer} {ur.brand}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-700">
                      {formatCurrency(ur.expectedAmount)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-700">
                      {formatCurrency(ur.realizedAmount)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-semibold text-amber-600">
                        -{formatCurrency(reduction)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDateStr(problemDate)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={getStatusBadge(ur.status)}>
                        {getStatusLabel(ur.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProblems.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>
              Nenhuma UR com problema de liquidação encontrada com os filtros aplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
