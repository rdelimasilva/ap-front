import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getContestacaoMotivo, hasContestacao } from '../utils/contestacaoStorage';
import { UrIdLink } from './UrIdLink';
import type { ContaCorrenteEvento } from '../types/contaCorrente';

const EVENTO_LABELS: Record<ContaCorrenteEvento, string> = {
  contrato_criado: 'Contrato criado',
  liquidacao_total: 'Liquidação total',
  liquidacao_parcial: 'Liquidação parcial',
  nao_liquidada_na_data: 'Não liquidada na data',
  chargeback: 'Chargeback',
  liquidacao_prevista: 'Liquidação prevista',
  liquidacao_prevista_com_chargeback: 'Liquidação prevista com chargeback',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getEventoBadge = (evento: ContaCorrenteEvento) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
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

export const DisputesModule: React.FC = () => {
  const { contaCorrenteEntries, useCsv } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventoFilter, setEventoFilter] = useState<string>('all');
  const [showContestacaoMotivo, setShowContestacaoMotivo] = useState<{ urId: string; motivo: string } | null>(null);

  const contestedEntries = useMemo(() => {
    return contaCorrenteEntries.filter(
      (e) =>
        e.urId &&
        hasContestacao(e.urId) &&
        e.evento !== 'contrato_criado' &&
        Math.abs((e.valorEsperado ?? 0) - (e.valorAtual ?? 0)) > 0.01
    );
  }, [contaCorrenteEntries]);

  const filteredEntries = useMemo(() => {
    let list = contestedEntries;
    if (eventoFilter !== 'all') {
      list = list.filter((e) => e.evento === eventoFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.urId?.toLowerCase().includes(lower) ||
          e.contractNumber?.toLowerCase().includes(lower) ||
          e.nomeEstabelecimento?.toLowerCase().includes(lower) ||
          e.acquirer?.toLowerCase().includes(lower) ||
          e.cnpj?.replace(/\D/g, '').includes(lower)
      );
    }
    return list.sort((a, b) => {
      const dA = a.dataEfetiva ?? a.dataEsperada ?? a.dataEvento;
      const dB = b.dataEfetiva ?? b.dataEsperada ?? b.dataEvento;
      return dB.getTime() - dA.getTime();
    });
  }, [contestedEntries, eventoFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar UR, contrato, estabelecimento, credenciadora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Evento:</span>
            {['all', ...Object.keys(EVENTO_LABELS)].map((ev) => (
              <button
                key={ev}
                onClick={() => setEventoFilter(ev)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  eventoFilter === ev ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ev === 'all' ? 'Todos' : EVENTO_LABELS[ev as ContaCorrenteEvento]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credenciadora</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Esperado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Atual</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <UrIdLink urId={e.urId} className="text-sm font-medium" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.contractNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.nomeEstabelecimento}</td>
                  <td className="px-4 py-3">
                    <span className={getEventoBadge(e.evento)}>{EVENTO_LABELS[e.evento]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.acquirer} / {e.cardBrand}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(e.valorEsperado ?? 0)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                    {formatCurrency(e.valorAtual ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        const motivo = getContestacaoMotivo(e.urId);
                        if (motivo) setShowContestacaoMotivo({ urId: e.urId, motivo });
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                      Ver motivo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!useCsv && (
          <div className="p-4 bg-amber-50 border-t border-amber-100 text-sm text-amber-800">
            Carregue a massa de dados para ver contestações.
          </div>
        )}

        {filteredEntries.length === 0 && useCsv && (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma UR contestada encontrada.</p>
          </div>
        )}
      </div>

      {/* Modal motivo */}
      {showContestacaoMotivo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Motivo da contestação</h3>
              <button onClick={() => setShowContestacaoMotivo(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-2">UR {showContestacaoMotivo.urId}</p>
              <p className="text-gray-900">{showContestacaoMotivo.motivo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
