import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, Download, CheckCircle, AlertTriangle, XCircle, FileText, Building2, ChevronDown, Landmark, ArrowLeft } from 'lucide-react';
import { useData } from '../context/DataContext';
import { showToast } from '../hooks/useToast';
import { saveContestacao, getContestacaoMotivo, hasContestacao } from '../utils/contestacaoStorage';
import type { ContaCorrenteEntry } from '../types/contaCorrente';

interface SettlementComparison {
  id: string;
  contractId: string;
  client: string;
  merchant: string;
  expectedDate: string;
  expectedAmount: number;
  realizedDate: string | null;
  realizedAmount: number | null;
  status: 'completed' | 'partial' | 'pending' | 'failed';
  difference: number;
  urs: {
    id: string;
    acquirer: string;
    brand: string;
    expectedAmount: number;
    realizedAmount: number;
    settlementDate: string;
  }[];
}

function buildSettlementsFromEntries(entries: ContaCorrenteEntry[]): SettlementComparison[] {
  const urEntries = entries.filter((e) => e.evento !== 'contrato_criado' && e.urId);
  const byContract = new Map<string, ContaCorrenteEntry[]>();
  urEntries.forEach((e) => {
    const list = byContract.get(e.contractId) ?? [];
    list.push(e);
    byContract.set(e.contractId, list);
  });

  return Array.from(byContract.entries()).map(([contractId, contractEntries]) => {
    const first = contractEntries[0];
    const expectedAmount = contractEntries.reduce((s, e) => s + e.valorEsperado, 0);
    const realizedAmount = contractEntries.reduce((s, e) => s + e.credito, 0);
    const maxExpectedDate = contractEntries.reduce(
      (max, e) => (e.dataEsperada > max ? e.dataEsperada : max),
      contractEntries[0].dataEsperada
    );
    const realizedEntries = contractEntries.filter((e) => e.credito > 0);
    const maxRealizedDate =
      realizedEntries.length > 0
        ? realizedEntries.reduce(
            (max, e) => {
              const d = e.dataEfetiva ?? e.dataEsperada;
              return d > max ? d : max;
            },
            realizedEntries[0].dataEfetiva ?? realizedEntries[0].dataEsperada
          )
        : null;

    const expectedDateStr = maxExpectedDate.toISOString().slice(0, 10);
    const realizedDateStr = maxRealizedDate ? maxRealizedDate.toISOString().slice(0, 10) : null;

    let status: SettlementComparison['status'] = 'pending';
    if (realizedAmount <= 0) {
      const hasPastDue = contractEntries.some(
        (e) => e.evento === 'nao_liquidada_na_data' || (e.dataEsperada < new Date() && e.credito === 0)
      );
      status = hasPastDue ? 'failed' : 'pending';
    } else if (Math.abs(realizedAmount - expectedAmount) < 0.01) {
      status = 'completed';
    } else {
      status = 'partial';
    }

    const difference = realizedAmount - expectedAmount;

    const urs = contractEntries.map((e) => ({
      id: e.urId,
      acquirer: e.acquirer,
      brand: e.cardBrand,
      expectedAmount: e.valorEsperado,
      realizedAmount: e.credito,
      settlementDate: (e.dataEfetiva ?? e.dataEsperada).toISOString().slice(0, 10),
    }));

    return {
      id: contractId,
      contractId: first.contractNumber,
      client: first.nomeEstabelecimento,
      merchant: first.nomeEstabelecimento,
      expectedDate: expectedDateStr,
      expectedAmount,
      realizedDate: realizedDateStr,
      realizedAmount: realizedAmount > 0 ? realizedAmount : null,
      status,
      difference,
      urs,
    };
  });
}

export const SettlementControlModule: React.FC = () => {
  const { contaCorrenteEntries, isLoading } = useData();
  const [expandedRows] = useState<Set<string>>(new Set());
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementComparison | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterClients, setFilterClients] = useState<string[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [contestUr, setContestUr] = useState<{ id: string; acquirer: string; brand: string; diff: number } | null>(null);
  const [contestMessage, setContestMessage] = useState('');
  const [showContestacaoMotivo, setShowContestacaoMotivo] = useState<{ urId: string; motivo: string } | null>(null);
  const [contaLiquidacaoUr, setContaLiquidacaoUr] = useState<string | null>(null);

  const settlements = useMemo(
    () => buildSettlementsFromEntries(contaCorrenteEntries),
    [contaCorrenteEntries]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const uniqueClients = useMemo(() => {
    const clients = settlements.map(s => s.client);
    return Array.from(new Set(clients)).sort();
  }, [settlements]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter(settlement => {
      const settlementDate = new Date(settlement.expectedDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && settlementDate < start) return false;
      if (end && settlementDate > end) return false;
      if (filterClients.length > 0 && !filterClients.includes(settlement.client)) return false;
      return true;
    });
  }, [settlements, startDate, endDate, filterClients]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      pending: <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>,
      completed: <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completo</span>,
      partial: <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Parcial</span>,
      failed: <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Falhou</span>,
    };
    return badges[status] || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-gray-500">Carregando liquidações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">De:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Empresa:</span>
              <button
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px] text-left flex items-center justify-between gap-2"
              >
                <span className="truncate">
                  {filterClients.length === 0
                    ? 'Todas'
                    : filterClients.length === 1
                      ? filterClients[0]
                      : `${filterClients.length} selecionadas`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>
              {showClientDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setShowClientDropdown(false); setClientSearchTerm(''); }} />
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {uniqueClients
                        .filter(c => c.toLowerCase().includes(clientSearchTerm.toLowerCase()))
                        .map(client => (
                          <label
                            key={client}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={filterClients.includes(client)}
                              onChange={() => {
                                setFilterClients(prev =>
                                  prev.includes(client)
                                    ? prev.filter(c => c !== client)
                                    : [...prev, client]
                                );
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 truncate">{client}</span>
                          </label>
                        ))}
                      {uniqueClients.filter(c => c.toLowerCase().includes(clientSearchTerm.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400">Nenhuma empresa encontrada</p>
                      )}
                    </div>
                    {filterClients.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <button
                          onClick={() => setFilterClients([])}
                          className="w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Limpar seleção
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {(startDate || endDate || filterClients.length > 0) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setFilterClients([]);
                }}
                className="ml-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Limpar
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {filteredSettlements.length} de {settlements.length} liquidações
              </span>
              <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Previsto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Realizado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSettlements.map((settlement) => (
                  <React.Fragment key={settlement.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-gray-900">{settlement.contractId}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{settlement.client}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{formatDate(settlement.expectedDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-gray-600">{formatCurrency(settlement.expectedAmount)}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {settlement.realizedAmount !== null ? formatCurrency(settlement.realizedAmount) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-semibold ${
                          settlement.difference > 0 ? 'text-green-600' :
                          settlement.difference < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {settlement.difference !== 0 ? formatCurrency(Math.abs(settlement.difference)) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(settlement.status)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setSelectedSettlement(settlement)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver Analítico
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(settlement.id) && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Unidades de Recebíveis (URs)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {settlement.urs.map((ur) => (
                                <div key={ur.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-900">{ur.id}</span>
                                    <span className="text-xs text-gray-600">{formatDate(ur.settlementDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      {ur.acquirer}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {ur.brand}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-600">Previsto:</span>
                                      <div className="font-semibold text-gray-900">{formatCurrency(ur.expectedAmount)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Realizado:</span>
                                      <div className="font-semibold text-gray-900">
                                        {ur.realizedAmount > 0 ? formatCurrency(ur.realizedAmount) : '-'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Análise Detalhada da Liquidação</h2>
                <p className="text-sm text-gray-600">{selectedSettlement.contractId} - {selectedSettlement.client}</p>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-medium text-blue-900">Data Prevista</p>
                  </div>
                  <p className="text-lg font-bold text-blue-900">{formatDate(selectedSettlement.expectedDate)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <p className="text-xs font-medium text-purple-900">Valor Previsto</p>
                  </div>
                  <p className="text-lg font-bold text-purple-900">{formatCurrency(selectedSettlement.expectedAmount)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <p className="text-xs font-medium text-green-900">Valor Realizado</p>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    {selectedSettlement.realizedAmount !== null
                      ? formatCurrency(selectedSettlement.realizedAmount)
                      : 'Pendente'}
                  </p>
                </div>

                <div className={`rounded-lg p-4 border ${
                  selectedSettlement.difference > 0
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    : selectedSettlement.difference < 0
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedSettlement.difference > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : selectedSettlement.difference < 0 ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-600" />
                    )}
                    <p className={`text-xs font-medium ${
                      selectedSettlement.difference > 0 ? 'text-green-900' :
                      selectedSettlement.difference < 0 ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      Diferença
                    </p>
                  </div>
                  <p className={`text-lg font-bold ${
                    selectedSettlement.difference > 0 ? 'text-green-900' :
                    selectedSettlement.difference < 0 ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {selectedSettlement.difference !== 0
                      ? formatCurrency(Math.abs(selectedSettlement.difference))
                      : 'Sem diferença'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">Status da Liquidação</h3>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedSettlement.status)}
                  <span className="text-sm text-blue-700">
                    {selectedSettlement.status === 'completed' && 'Liquidação executada com sucesso sem divergências'}
                    {selectedSettlement.status === 'partial' && 'Liquidação parcial - valor realizado menor que o previsto'}
                    {selectedSettlement.status === 'pending' && 'Aguardando liquidação na data prevista'}
                    {selectedSettlement.status === 'failed' && 'Liquidação falhou - nenhum valor recebido'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unidades de Recebíveis (URs)</h3>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UR ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adquirente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Previsto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Realizado</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...selectedSettlement.urs]
                        .sort((a, b) => {
                          const diffA = a.realizedAmount - a.expectedAmount;
                          const diffB = b.realizedAmount - b.expectedAmount;
                          return diffA - diffB;
                        })
                        .map((ur) => {
                        const urDiff = ur.realizedAmount - ur.expectedAmount;
                        const contestacaoMotivo = getContestacaoMotivo(ur.id);
                        const isContestado = hasContestacao(ur.id);
                        return (
                          <tr key={ur.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{ur.id}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {ur.acquirer}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {ur.brand}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(ur.settlementDate)}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(ur.expectedAmount)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              {ur.realizedAmount > 0 ? formatCurrency(ur.realizedAmount) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-semibold ${
                                urDiff > 0 ? 'text-green-600' :
                                urDiff < 0 ? 'text-red-600' : 'text-gray-400'
                              }`}>
                                {urDiff !== 0 ? formatCurrency(Math.abs(urDiff)) : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setContaLiquidacaoUr(ur.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
                                  title="Ver conta de liquidação"
                                >
                                  <Landmark className="w-3 h-3" />
                                  Conta
                                </button>
                                {isContestado ? (
                                  <button
                                    onClick={() => contestacaoMotivo && setShowContestacaoMotivo({ urId: ur.id, motivo: contestacaoMotivo })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-xs font-medium"
                                  >
                                    Contestado
                                  </button>
                                ) : urDiff < 0 ? (
                                  <button
                                    onClick={() => setContestUr({ id: ur.id, acquirer: ur.acquirer, brand: ur.brand, diff: Math.abs(urDiff) })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    Contestar
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>

                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(selectedSettlement.expectedAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {selectedSettlement.realizedAmount !== null
                            ? formatCurrency(selectedSettlement.realizedAmount)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${
                            selectedSettlement.difference > 0 ? 'text-green-600' :
                            selectedSettlement.difference < 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {selectedSettlement.difference !== 0
                              ? formatCurrency(Math.abs(selectedSettlement.difference))
                              : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedSettlement(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Fechar
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contestação */}
      {contestUr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Abrir Contestação</h3>
              <p className="text-sm text-gray-500 mt-1">UR {contestUr.id} — {contestUr.acquirer} / {contestUr.brand}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700">Diferença a menor</span>
                <span className="text-sm font-semibold text-red-600">{formatCurrency(contestUr.diff)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da contestação</label>
                <textarea
                  value={contestMessage}
                  onChange={(e) => setContestMessage(e.target.value)}
                  placeholder="Descreva o motivo da contestação..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => { setContestUr(null); setContestMessage(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const motivo = contestMessage.trim();
                  if (motivo) {
                    saveContestacao(contestUr.id, motivo);
                    showToast('success', 'Contestação enviada!', `UR: ${contestUr.id}`);
                  }
                  setContestUr(null);
                  setContestMessage('');
                }}
                disabled={!contestMessage.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal exibir motivo da contestação */}
      {showContestacaoMotivo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Motivo da contestação</h3>
              <button
                onClick={() => setShowContestacaoMotivo(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-2">UR {showContestacaoMotivo.urId}</p>
              <p className="text-gray-900">{showContestacaoMotivo.motivo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conta de Liquidação */}
      {contaLiquidacaoUr && (() => {
        const urEntry = contaCorrenteEntries.find((e) => e.urId === contaLiquidacaoUr);
        if (!urEntry) return null;

        // Mock: generate deterministic account data based on acquirer
        const acquirerBanks: Record<string, { bankName: string; bankCode: string; agency: string; accountNumber: string; ispb: string }> = {
          Cielo: { bankName: 'Banco Bradesco', bankCode: '237', agency: '3045', accountNumber: '0072851-4', ispb: '60746948' },
          Rede: { bankName: 'Itaú Unibanco', bankCode: '341', agency: '1572', accountNumber: '0043298-7', ispb: '60701190' },
          Stone: { bankName: 'Banco do Brasil', bankCode: '001', agency: '4021-8', accountNumber: '0018763-2', ispb: '00000000' },
          Getnet: { bankName: 'Santander', bankCode: '033', agency: '2190', accountNumber: '0130455-9', ispb: '90400888' },
          PagSeguro: { bankName: 'Banco PagSeguro', bankCode: '290', agency: '0001', accountNumber: '0098712-3', ispb: '08561701' },
          Safrapay: { bankName: 'Banco Safra', bankCode: '422', agency: '0115', accountNumber: '0045231-8', ispb: '58160789' },
        };
        const defaultBank = { bankName: 'Banco do Brasil', bankCode: '001', agency: '1234-5', accountNumber: '0012345-6', ispb: '00000000' };
        const bankInfo = acquirerBanks[urEntry.acquirer] || defaultBank;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Conta de Liquidação</h2>
                    <p className="text-sm text-gray-500">UR {contaLiquidacaoUr}</p>
                  </div>
                </div>
                <button
                  onClick={() => setContaLiquidacaoUr(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Banco</p>
                    <p className="text-sm font-medium text-gray-900">{bankInfo.bankCode} - {bankInfo.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ISPB</p>
                    <p className="text-sm font-medium text-gray-900">{bankInfo.ispb}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Agência</p>
                    <p className="text-sm font-medium text-gray-900">{bankInfo.agency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conta</p>
                    <p className="text-sm font-medium text-gray-900">{bankInfo.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="text-sm font-medium text-gray-900">Conta Corrente</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Titular</p>
                    <p className="text-sm font-medium text-gray-900">{urEntry.nomeEstabelecimento}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">CPF/CNPJ do Titular</p>
                    <p className="text-sm font-medium text-gray-900">{urEntry.cnpj}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setContaLiquidacaoUr(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
