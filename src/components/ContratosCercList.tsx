import React, { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import { listContratos, type ContratoDTO } from '../services/contratosApi';

const STATUS_LABEL: Record<string, string> = {
  ENVIANDO: 'Enviando',
  AGUARDANDO_WEBHOOK: 'Aguardando confirmação',
  REJEITADO_ESTRUTURAL: 'Rejeitado (estrutural)',
  REGISTRADO: 'Registrado',
  REJEITADO: 'Rejeitado',
  PENDENTE_CONCILIACAO: 'Pendente de conciliação',
  ATUALIZANDO: 'Atualizando',
  INATIVANDO: 'Inativando',
  BAIXANDO: 'Baixando',
  RESILINDO_PARCIAL: 'Resilindo (parcial)',
  RESILINDO_TOTAL: 'Resilindo (total)',
  INATIVADO: 'Inativado',
  BAIXADO: 'Baixado',
  RESILIDO_PARCIAL: 'Resilido (parcial)',
  RESILIDO_TOTAL: 'Resilido (total)',
};

const STATUS_COLOR: Record<string, string> = {
  ENVIANDO: 'bg-gray-100 text-gray-700',
  AGUARDANDO_WEBHOOK: 'bg-yellow-100 text-yellow-800',
  REJEITADO_ESTRUTURAL: 'bg-red-100 text-red-800',
  REGISTRADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  PENDENTE_CONCILIACAO: 'bg-orange-100 text-orange-800',
  ATUALIZANDO: 'bg-yellow-100 text-yellow-800',
  INATIVANDO: 'bg-yellow-100 text-yellow-800',
  BAIXANDO: 'bg-yellow-100 text-yellow-800',
  RESILINDO_PARCIAL: 'bg-yellow-100 text-yellow-800',
  RESILINDO_TOTAL: 'bg-yellow-100 text-yellow-800',
  INATIVADO: 'bg-gray-200 text-gray-700',
  BAIXADO: 'bg-gray-200 text-gray-700',
  RESILIDO_PARCIAL: 'bg-gray-200 text-gray-700',
  RESILIDO_TOTAL: 'bg-gray-200 text-gray-700',
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  // Datas "só data" (YYYY-MM-DD, sem T) são interpretadas como UTC pelo
  // Date nativo — em fusos negativos (ex.: America/Sao_Paulo) isso exibia
  // um dia a menos. Forçar meia-noite local quando não há componente de hora.
  const data = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(data);
}

function formatarValor(v: number | null): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

interface ContratosCercListProps {
  documentoContratante?: string;
  onSelecionarContrato: (id: string) => void;
  // Muda de valor quando algo externo (criação, inativação, baixa) precisa
  // forçar recarga da lista.
  recarregarToken?: number;
}

// Barra de filtros e tabela, sem cabeçalho: quem monta a lista já tem o seu.
export const ContratosCercList: React.FC<ContratosCercListProps> = ({
  documentoContratante, onSelecionarContrato, recarregarToken = 0,
}) => {
  const [contratos, setContratos] = useState<ContratoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [recargaLocal, setRecargaLocal] = useState(0);
  const recarregar = () => setRecargaLocal(n => n + 1);

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setIsLoading(true);
      try {
        const dados = await listContratos({
          ...(statusFiltro ? { status: statusFiltro } : {}),
          ...(documentoContratante ? { documentoContratante } : {}),
        });
        if (!cancelado) setContratos(dados);
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar contratos:', err);
          showToast('error', 'Erro ao carregar contratos');
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    };
    carregar();
    return () => { cancelado = true; };
  }, [statusFiltro, documentoContratante, recarregarToken, recargaLocal]);

  const contratosFiltrados = contratos.filter(c =>
    !searchTerm ||
    c.referenciaExterna.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identificadorContrato.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Buscar por referência ou identificador"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
        <button onClick={recarregar} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Referência externa</th>
              <th className="text-left px-4 py-3">Identificador</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Saldo devedor</th>
              <th className="text-left px-4 py-3">Vencimento</th>
              <th className="text-left px-4 py-3">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            )}
            {!isLoading && contratosFiltrados.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum contrato encontrado.</td></tr>
            )}
            {contratosFiltrados.map(c => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onSelecionarContrato(c.id)}>
                <td className="px-4 py-3 font-medium text-gray-900">{c.referenciaExterna}</td>
                <td className="px-4 py-3 text-gray-600">{c.identificadorContrato}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-900">{formatarValor(c.saldoDevedor)}</td>
                <td className="px-4 py-3 text-gray-600">{formatarData(c.dataVencimento)}</td>
                <td className="px-4 py-3 text-gray-600">{formatarData(c.criadoEm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
