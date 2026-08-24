import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Building2,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getEstablishmentsFromEntries } from '../data/csvLoader';
import { UrIdLink } from './UrIdLink';
import type { ContaCorrenteEntry, ContaCorrenteEvento } from '../types/contaCorrente';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

const EVENTO_LABELS: Record<ContaCorrenteEvento, string> = {
  contrato_criado: 'Contrato criado',
  liquidacao_total: 'Liquidação total',
  liquidacao_parcial: 'Liquidação parcial',
  nao_liquidada_na_data: 'Não liquidada na data',
  chargeback: 'Chargeback',
  liquidacao_prevista: 'Liquidação prevista',
  liquidacao_prevista_com_chargeback: 'Liquidação prevista com chargeback',
};

const getEventoBadge = (evento: ContaCorrenteEvento) => {
  const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium';
  const map: Record<ContaCorrenteEvento, string> = {
    contrato_criado: `${base} bg-blue-100 text-blue-800`,
    liquidacao_total: `${base} bg-emerald-100 text-emerald-800`,
    liquidacao_parcial: `${base} bg-teal-100 text-teal-800`,
    nao_liquidada_na_data: `${base} bg-orange-100 text-orange-800`,
    chargeback: `${base} bg-red-100 text-red-800`,
    liquidacao_prevista: `${base} bg-amber-100 text-amber-800`,
    liquidacao_prevista_com_chargeback: `${base} bg-amber-50 text-amber-900 border border-amber-300`,
  };
  return map[evento];
};

export const ReceivablesLedgerModule: React.FC = () => {
  const { contaCorrenteEntries } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [establishmentFilter, setEstablishmentFilter] = useState<string>('');
  const [eventoFilter, setEventoFilter] = useState<string>('all');
  const [collapsedEstablishments, setCollapsedEstablishments] = useState<Set<string>>(new Set());

  const establishments = useMemo(() => getEstablishmentsFromEntries(contaCorrenteEntries), [contaCorrenteEntries]);
  useEffect(() => {
    if (!establishmentFilter && establishments[0]) {
      setEstablishmentFilter(establishments[0].merchantId);
    }
  }, [establishments, establishmentFilter]);
  const effectiveEstablishment = establishmentFilter || establishments[0]?.merchantId || '';
  const uniqueEventos = useMemo(
    () => Array.from(new Set(contaCorrenteEntries.map((e) => e.evento))).sort(),
    [contaCorrenteEntries]
  );

  const filteredEntries = useMemo(() => {
    return contaCorrenteEntries.filter((e) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (e.urId && e.urId.toLowerCase().includes(searchLower)) ||
        e.nomeEstabelecimento.toLowerCase().includes(searchLower) ||
        e.cnpj.replace(/\D/g, '').includes(searchLower) ||
        e.contractNumber.toLowerCase().includes(searchLower) ||
        e.acquirer.toLowerCase().includes(searchLower) ||
        e.cardBrand.toLowerCase().includes(searchLower);
      const matchesEstablishment =
        !effectiveEstablishment || e.merchantId === effectiveEstablishment;
      const matchesEvento = eventoFilter === 'all' || e.evento === eventoFilter;
      return matchesSearch && matchesEstablishment && matchesEvento;
    });
  }, [searchTerm, effectiveEstablishment, eventoFilter, contaCorrenteEntries]);

  const entriesByEstablishment = useMemo(() => {
    const map = new Map<string, ContaCorrenteEntry[]>();
    filteredEntries.forEach((e) => {
      const list = map.get(e.merchantId) ?? [];
      list.push(e);
      map.set(e.merchantId, list);
    });
    return map;
  }, [filteredEntries]);

  const toggleEstablishment = (merchantId: string) => {
    setCollapsedEstablishments((prev) => {
      const next = new Set(prev);
      if (next.has(merchantId)) next.delete(merchantId);
      else next.add(merchantId);
      return next;
    });
  };

  const { totalDebito, totalCredito, totalSaldo } = useMemo(() => {
    let deb = 0,
      cred = 0;
    filteredEntries.forEach((e) => {
      deb += e.debito;
      cred += e.credito;
    });
    return { totalDebito: deb, totalCredito: cred, totalSaldo: deb - cred };
  }, [filteredEntries]);

  const displayDate = (e: ContaCorrenteEntry) => (e.dataEfetiva ? e.dataEfetiva : e.dataEsperada);

  const TableRow = ({
    e,
    runningSaldo,
  }: {
    e: ContaCorrenteEntry;
    runningSaldo: number;
  }) => (
    <tr className="border-b border-gray-100 hover:bg-slate-50/80 transition-colors">
      <td className="py-2 px-3 text-left">
        {e.evento === 'contrato_criado' ? (
          <p className="font-mono text-xs font-medium text-gray-900">{e.contractNumber}</p>
        ) : (
          <>
            <p><UrIdLink urId={e.urId} className="text-xs" /></p>
            <p className="text-[10px] text-gray-500">{e.contractNumber}</p>
          </>
        )}
      </td>
      <td className="py-2 px-3 text-center text-xs text-gray-600">
        <span className="inline-flex items-center gap-1 justify-center">
          <Calendar className="w-3 h-3 text-gray-400" />
          {formatDate(displayDate(e))}
        </span>
      </td>
      <td className="py-2 px-3 text-left">
        <span className={getEventoBadge(e.evento)}>{EVENTO_LABELS[e.evento]}</span>
      </td>
      <td className="py-2 px-3 text-left text-xs text-gray-600">{e.acquirer} / {e.cardBrand}</td>
      <td className="py-2 px-3 text-right text-xs tabular-nums text-gray-700">
        {formatCurrency(e.valorEsperado)}
      </td>
      <td className="py-2 px-3 text-right text-xs tabular-nums font-medium text-gray-900">
        {e.evento === 'liquidacao_parcial' && e.valorLiquidado != null
          ? formatCurrency(e.valorLiquidado)
          : formatCurrency(e.valorAtual)}
      </td>
      <td className="py-2 px-3 text-right">
        {e.valorFaltante != null && e.valorFaltante > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1 py-0.5 rounded" title="Valor faltante (não computado em débito)">
            <TrendingDown className="w-3 h-3" />
            {formatCurrency(e.valorFaltante)}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
      <td className="py-2 px-3 text-right text-xs tabular-nums font-medium text-gray-900">
        {e.debito > 0 ? formatCurrency(e.debito) : '—'}
      </td>
      <td className="py-2 px-3 text-right text-xs tabular-nums font-medium text-gray-900">
        {e.credito > 0 ? formatCurrency(e.credito) : '—'}
      </td>
      <td
        className={`py-2 px-3 text-right text-xs tabular-nums font-semibold ${
          runningSaldo > 0 ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {formatCurrency(runningSaldo)}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={effectiveEstablishment}
                onChange={(e) => setEstablishmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {establishments.map((est) => (
                  <option key={est.merchantId} value={est.merchantId}>
                    {est.nome}
                  </option>
                ))}
              </select>
              <select
                value={eventoFilter}
                onChange={(e) => setEventoFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os eventos</option>
                {uniqueEventos.map((ev) => (
                  <option key={ev} value={ev}>
                    {EVENTO_LABELS[ev]}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar UR, CNPJ, estabelecimento, contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                title="Exportar"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm text-gray-600">
              {filteredEntries.length} eventos • {entriesByEstablishment.size} estabelecimentos
            </span>
            <span className="text-sm text-gray-600">
              Débito: <strong className="text-gray-900">{formatCurrency(totalDebito)}</strong>
            </span>
            <span className="text-sm text-gray-600">
              Crédito: <strong className="text-gray-900">{formatCurrency(totalCredito)}</strong>
            </span>
            <span
              className={`text-sm font-semibold ${
                totalSaldo > 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              Saldo final: {formatCurrency(totalSaldo)}
            </span>
          </div>
        </div>

        {/* Tabela por estabelecimento */}
        <div className="divide-y divide-gray-100">
          {Array.from(entriesByEstablishment.entries())
            .sort(([a], [b]) => {
              const nameA = establishments.find((e) => e.merchantId === a)?.nome ?? a;
              const nameB = establishments.find((e) => e.merchantId === b)?.nome ?? b;
              return nameA.localeCompare(nameB);
            })
            .map(([merchantId, entries]) => {
              const est = establishments.find((e) => e.merchantId === merchantId);
              const nomeEst = est?.nome ?? merchantId;
              const cnpjEst = est?.cnpj ?? '—';
              const isExpanded = !collapsedEstablishments.has(merchantId);

              const debito = entries.reduce((s, e) => s + e.debito, 0);
              const credito = entries.reduce((s, e) => s + e.credito, 0);
              const saldo = debito - credito;

              const ateHoje = entries.filter((e) => !e.isFuturo).sort((a, b) => a.dataEvento.getTime() - b.dataEvento.getTime());
              const futuras = entries.filter((e) => e.isFuturo).sort((a, b) => a.dataEsperada.getTime() - b.dataEsperada.getTime());

              return (
                <div key={merchantId} className="bg-white">
                  <button
                    onClick={() => toggleEstablishment(merchantId)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{nomeEst}</p>
                        <p className="text-xs text-gray-500 font-mono">{cnpjEst}</p>
                        <p className="text-xs text-gray-400">{entries.length} eventos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Débito</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(debito)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Crédito</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(credito)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Saldo final</p>
                        <p
                          className={`text-lg font-bold ${
                            saldo > 0 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {formatCurrency(saldo)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30 overflow-x-auto">
                      <table className="w-full min-w-[1200px]">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-100/80">
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              UR / Contrato
                            </th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Data
                            </th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Evento
                            </th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Cred. / Bandeira
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Valor esperado
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Valor atual
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase" title="Valor faltante (exibido, não computado)">
                              Chargeback / Redução
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Débito
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Crédito
                            </th>
                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 uppercase">
                              Saldo
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ateHoje.reduce<{ rows: React.ReactNode[]; runningSaldo: number }>(
                            (acc, e) => {
                              acc.runningSaldo += e.debito - e.credito;
                              acc.rows.push(
                                <TableRow key={e.id} e={e} runningSaldo={acc.runningSaldo} />
                              );
                              return acc;
                            },
                            { rows: [], runningSaldo: 0 }
                          ).rows}
                          {futuras.length > 0 && (
                            <>
                              <tr className="bg-amber-50/50 border-y border-amber-100">
                                <td
                                  colSpan={10}
                                  className="py-1.5 px-3 text-[10px] font-semibold text-amber-800 uppercase tracking-wider"
                                >
                                  Liquidações futuras (previstas)
                                </td>
                              </tr>
                              {futuras.reduce<{ rows: React.ReactNode[]; runningSaldo: number }>(
                                (acc, e) => {
                                  acc.runningSaldo += e.debito - e.credito;
                                  acc.rows.push(
                                    <TableRow key={e.id} e={e} runningSaldo={acc.runningSaldo} />
                                  );
                                  return acc;
                                },
                                {
                                  rows: [],
                                  runningSaldo: ateHoje.reduce(
                                    (s, e) => s + e.debito - e.credito,
                                    0
                                  ),
                                }
                              ).rows}
                            </>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-100">
                            <td
                              colSpan={7}
                              className="py-2 px-3 text-right text-xs font-semibold text-gray-700"
                            >
                              Saldo final
                            </td>
                            <td className="py-2 px-3 text-right text-xs tabular-nums font-semibold text-gray-700">
                              {formatCurrency(debito)}
                            </td>
                            <td className="py-2 px-3 text-right text-xs tabular-nums font-semibold text-gray-700">
                              {formatCurrency(credito)}
                            </td>
                            <td
                              className={`py-2 px-3 text-right text-xs tabular-nums font-bold ${
                                saldo > 0 ? 'text-red-600' : 'text-gray-900'
                              }`}
                            >
                              {formatCurrency(saldo)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {filteredEntries.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum evento encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Legenda de eventos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Eventos do ciclo de vida</h4>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(EVENTO_LABELS) as ContaCorrenteEvento[]).map((ev) => (
            <span key={ev} className={getEventoBadge(ev)}>
              {EVENTO_LABELS[ev]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
