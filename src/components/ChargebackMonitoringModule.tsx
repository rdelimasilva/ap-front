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
  TrendingDown,
  Search,
  Download,
  Building2,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { UrIdLink } from './UrIdLink';
import type { Receivable } from '../types';

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
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

export const ChargebackMonitoringModule: React.FC = () => {
  const { receivables, contracts, clients } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [acquirerFilter, setAcquirerFilter] = useState<string>('all');
  const [chartExpanded, setChartExpanded] = useState(true);

  const chargebackReceivables = useMemo(
    () => receivables.filter((r): r is Receivable & { chargebackDate?: Date } =>
      r.status === 'chargeback'
    ),
    [receivables]
  );

  const contractMap = useMemo(
    () => new Map(contracts.map((c) => [c.id, c])),
    [contracts]
  );
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  );

  const filteredReceivables = useMemo(() => {
    return chargebackReceivables.filter((r) => {
      const contract = contractMap.get(r.contractId);
      const clientName = contract ? clientMap.get(contract.clientId) ?? '' : '';
      const contractNumber = contract?.contractNumber ?? '';
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        r.id.toLowerCase().includes(searchLower) ||
        contractNumber.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        r.acquirer.toLowerCase().includes(searchLower);
      const matchesContract =
        contractFilter === 'all' || contract?.contractNumber === contractFilter;
      const matchesAcquirer =
        acquirerFilter === 'all' || r.acquirer === acquirerFilter;
      return matchesSearch && matchesContract && matchesAcquirer;
    });
  }, [
    chargebackReceivables,
    searchTerm,
    contractFilter,
    acquirerFilter,
    contractMap,
    clientMap,
  ]);

  const uniqueContracts = useMemo(
    () =>
      Array.from(
        new Set(
          chargebackReceivables
            .map((r) => contractMap.get(r.contractId)?.contractNumber)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [chargebackReceivables, contractMap]
  );

  const uniqueCredenciadoras = useMemo(
    () =>
      Array.from(new Set(chargebackReceivables.map((r) => r.acquirer))).sort(),
    [chargebackReceivables]
  );

  const totalReduction = filteredReceivables.reduce(
    (sum, r) => sum + (r.originalValue - r.encumberedValue),
    0
  );

  const chartData = useMemo(() => {
    const withDate = filteredReceivables.filter(
      (r): r is Receivable & { chargebackDate: Date } =>
        !!r.chargebackDate
    );
    const byDateAcquirer = new Map<string, Map<string, number>>();

    for (const r of withDate) {
      const dateKey = r.chargebackDate!.toISOString().slice(0, 10);
      const reduction = r.originalValue - r.encumberedValue;
      if (!byDateAcquirer.has(dateKey)) {
        byDateAcquirer.set(dateKey, new Map());
      }
      const acquirerMap = byDateAcquirer.get(dateKey)!;
      acquirerMap.set(
        r.acquirer,
        (acquirerMap.get(r.acquirer) ?? 0) + reduction
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
  }, [filteredReceivables]);

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
              {filteredReceivables.length} URs com chargeback
            </span>
            <span className="text-sm font-semibold text-red-600">
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
                  Valor de chargeback por dia / credenciadora
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
                        <p className="font-semibold text-red-600 mt-1 pt-1 border-t border-gray-100">
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
                    stackId="chargeback"
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
                  Valor após chargeback
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Redução
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.map((r) => {
                const contract = contractMap.get(r.contractId);
                const clientName = contract
                  ? clientMap.get(contract.clientId) ?? '-'
                  : '-';
                const reduction = r.originalValue - r.encumberedValue;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <UrIdLink urId={r.id} />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {contract?.contractNumber ?? '-'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {clientName}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {r.acquirer} {r.cardBrand}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-700">
                      {formatCurrency(r.originalValue)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-700">
                      {formatCurrency(r.encumberedValue)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-semibold text-red-600">
                        -{formatCurrency(reduction)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {r.chargebackDate
                        ? formatDate(r.chargebackDate)
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredReceivables.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <TrendingDown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma UR com chargeback encontrada com os filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
