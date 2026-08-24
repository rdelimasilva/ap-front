import React, { useState, useMemo } from 'react';
import { TrendingUp, Lock, CheckCircle, Calendar, ArrowLeft, Eye, FileText, Plus, Filter, Search, Activity, ChevronDown, ChevronRight, CreditCard, Shield, DollarSign, RefreshCw, Zap, ArrowRight, X, ArrowUpDown, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { Client } from '../types';
import { NewOptInModal } from './NewOptInModal';
import { OptInDetailsModal } from './OptInDetailsModal';
import { CreditRecoveryJourney } from './CreditRecoveryJourney';
import { GuaranteesJourney } from './GuaranteesJourney';
import { PrepaymentJourney } from './PrepaymentJourney';
import { AntecipationJourney } from './AntecipationJourney';
import { OwnershipTransferJourney } from './OwnershipTransferJourney';
import { PreContractedAntecipationJourney } from './PreContractedAntecipationJourney';
import { Tooltip } from './Tooltip';
import { showToast } from '../hooks/useToast';

interface ScheduleViewProps {
  clients: Client[];
}

interface RadarData {
  date: string;
  blocked: number;
  available: number;
  isPast: boolean;
}

// Estrutura alinhada ao arquivo AP005 da CERC (Consulta de Agenda) — ver docs.cerc.com.
interface URPaymentInfo {
  numeroDocumentoTitularDomicilio: string;
  tipoConta: 'CC' | 'CD' | 'CG' | 'CI' | 'PG' | 'PP';
  ispb: string;
  agencia?: string;
  numeroConta: string;
  valorAPagar: number;
  beneficiario?: string;
  dataLiquidacaoEfetiva?: string;
  valorLiquidacaoEfetiva?: number;
  tipoInformacaoPagamento: string;
}

interface ClientUR {
  id: string;
  acquirer: string;
  brand: string;
  type: 'credito' | 'debito';
  settlementDate: string;
  value: number;
  status: 'bloqueado' | 'disponivel' | 'liquidado';
  // Campos adicionais do AP005
  referenciaExterna: string;
  entidadeRegistradora: string;
  cnpjCredenciadora: string;
  documentoUsuarioFinalRecebedor: string;
  titularUR: string;
  constituicao: '1' | '2';
  valorConstituidoTotal: number;
  valorConstituidoAntecipacaoPreContratado: number;
  valorBloqueado: number;
  valorLivre: number;
  valorTotalUR: number;
  carteira?: string;
  dataHoraUltimaAtualizacao: string;
  listaInformacoesPagamento: URPaymentInfo[];
}

const UR_ACQUIRERS = ['Cielo', 'Rede', 'Stone', 'GetNet'];
const UR_BRANDS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'];
const UR_ACQUIRER_CNPJS: Record<string, string> = {
  Cielo: '01.027.058/0001-91',
  Rede: '01.425.787/0001-04',
  Stone: '16.501.555/0001-57',
  GetNet: '10.573.521/0001-91',
};
const TIPOS_INFORMACAO_PAGAMENTO = [
  '1 - Transferência de titularidade',
  '2 - Gravame',
  '3 - Bloqueio judicial',
  '4 - Antecipação pós-contratação',
  '5 - Liquidação',
  '6 - Domicílio de pagamento',
  '7 - Promessa de cessão',
];

const generateClientURs = (clientId: string, clientDocument: string): ClientUR[] => {
  const statuses: ClientUR['status'][] = ['bloqueado', 'disponivel', 'liquidado'];
  const baseDate = new Date('2025-11-10');
  const urs: ClientUR[] = [];

  for (let i = 0; i < 32; i++) {
    const settlementDate = new Date(baseDate);
    settlementDate.setDate(baseDate.getDate() + (i * 3 - 45));

    const status = statuses[i % statuses.length];
    const acquirer = UR_ACQUIRERS[i % UR_ACQUIRERS.length];
    const value = Math.round(2500 + Math.random() * 15000);

    const valorBloqueado = status === 'bloqueado' ? value : 0;
    const valorLivre = status === 'disponivel' ? value : 0;
    const valorConstituidoAntecipacaoPreContratado = i % 5 === 0 ? Math.round(value * 0.2) : 0;
    const valorConstituidoTotal = value + valorConstituidoAntecipacaoPreContratado;

    const lastUpdate = new Date(settlementDate);
    lastUpdate.setDate(lastUpdate.getDate() - 1);

    const paymentInfo: URPaymentInfo = {
      numeroDocumentoTitularDomicilio: clientDocument,
      tipoConta: i % 4 === 0 ? 'PG' : 'CC',
      ispb: String(10000000 + i * 137).padStart(8, '0'),
      agencia: i % 4 === 0 ? undefined : String(1000 + i).padStart(4, '0'),
      numeroConta: `${100000 + i}-${i % 10}`,
      valorAPagar: value,
      dataLiquidacaoEfetiva: status === 'liquidado' ? settlementDate.toISOString().split('T')[0] : undefined,
      valorLiquidacaoEfetiva: status === 'liquidado' ? value : undefined,
      tipoInformacaoPagamento: TIPOS_INFORMACAO_PAGAMENTO[status === 'liquidado' ? 4 : i % TIPOS_INFORMACAO_PAGAMENTO.length],
    };

    urs.push({
      id: `${clientId}-ur-${i}`,
      acquirer,
      brand: UR_BRANDS[(i * 2) % UR_BRANDS.length],
      type: i % 3 === 0 ? 'debito' : 'credito',
      settlementDate: settlementDate.toISOString().split('T')[0],
      value,
      status,
      referenciaExterna: `REF-${clientId.slice(0, 6).toUpperCase()}-${1000 + i}`,
      entidadeRegistradora: '22.246.686/0001-96', // CERC
      cnpjCredenciadora: UR_ACQUIRER_CNPJS[acquirer],
      documentoUsuarioFinalRecebedor: clientDocument,
      titularUR: clientDocument,
      constituicao: i % 6 === 0 ? '2' : '1',
      valorConstituidoTotal,
      valorConstituidoAntecipacaoPreContratado,
      valorBloqueado,
      valorLivre,
      valorTotalUR: valorConstituidoTotal,
      carteira: i % 7 === 0 ? `CART-${100 + i}` : undefined,
      dataHoraUltimaAtualizacao: lastUpdate.toISOString(),
      listaInformacoesPagamento: [paymentInfo],
    });
  }

  return urs;
};

interface URMutationEvent {
  date: string;
  title: string;
  description: string;
}

const generateURMutationEvents = (ur: ClientUR, formatCurrency: (value: number) => string): URMutationEvent[] => {
  const settlement = new Date(ur.settlementDate);
  const captureDate = new Date(settlement);
  captureDate.setDate(captureDate.getDate() - 2);

  const events: URMutationEvent[] = [
    {
      date: captureDate.toISOString().split('T')[0],
      title: 'Captura da UR',
      description: `Transação capturada via ${ur.acquirer} (${ur.brand}) no valor de ${formatCurrency(ur.value)}`,
    },
  ];

  if (ur.status === 'bloqueado' || ur.status === 'liquidado') {
    const blockDate = new Date(captureDate);
    blockDate.setDate(blockDate.getDate() + 1);
    events.push({
      date: blockDate.toISOString().split('T')[0],
      title: 'Bloqueio',
      description: 'UR vinculada a uma operação de garantia ativa',
    });
  }

  if (ur.status === 'disponivel') {
    const releaseDate = new Date(captureDate);
    releaseDate.setDate(releaseDate.getDate() + 1);
    events.push({
      date: releaseDate.toISOString().split('T')[0],
      title: 'Disponibilização',
      description: 'UR liberada para novas operações',
    });
  }

  if (ur.status === 'liquidado') {
    events.push({
      date: ur.settlementDate,
      title: 'Liquidação',
      description: `Liquidação ${ur.type === 'credito' ? 'de crédito' : 'de débito'} processada pela ${ur.acquirer}`,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
};

interface OptInClient {
  id: string;
  client_name: string;
  client_document: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'signed' | 'pending_registry';
  created_at: string;
  expiry_date: string;
  signature_token: string;
  signed_at?: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ clients }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [bloqueadoExpanded, setBloqueadoExpanded] = useState(false);
  const [bloqueadoFilter, setBloqueadoFilter] = useState<'all' | 'mine' | 'others'>('all');
  const [liquidadoHojeExpanded, setLiquidadoHojeExpanded] = useState(false);
  const [showNewOptInModal, setShowNewOptInModal] = useState(false);
  const [showOptInDetailsModal, setShowOptInDetailsModal] = useState(false);
  const [selectedOptInClient, setSelectedOptInClient] = useState<OptInClient | null>(null);
  const [pastPeriodFilter, _setPastPeriodFilter] = useState<'week' | 'month' | 'quarter' | 'semester' | 'year' | 'custom'>('month');
  const [customPastStartDate, _setCustomPastStartDate] = useState('');
  const [customPastEndDate, _setCustomPastEndDate] = useState('');
  const [futurePeriodFilter, setFuturePeriodFilter] = useState<'7days' | '15days' | '30days' | '60days' | '90days' | '180days' | 'custom'>('30days');
  const [futureCustomStart, setFutureCustomStart] = useState('');
  const [futureCustomEnd, setFutureCustomEnd] = useState('');
  const [showFutureCalendar, setShowFutureCalendar] = useState(false);
  const [showOperationSelector, setShowOperationSelector] = useState(false);
  const [urAcquirerFilter, setUrAcquirerFilter] = useState('all');
  const [urBrandFilter, setUrBrandFilter] = useState('all');
  const [urTypeFilter, setUrTypeFilter] = useState<'all' | 'credito' | 'debito'>('all');
  const [urSettlementStart, setUrSettlementStart] = useState('');
  const [urSettlementEnd, setUrSettlementEnd] = useState('');
  const [urSettlementSort, setUrSettlementSort] = useState<'asc' | 'desc' | null>(null);
  const [selectedUR, setSelectedUR] = useState<ClientUR | null>(null);
  const [isCreditRecoveryOpen, setIsCreditRecoveryOpen] = useState(false);
  const [isGuaranteesOpen, setIsGuaranteesOpen] = useState(false);
  const [isPrepaymentOpen, setIsPrepaymentOpen] = useState(false);
  const [isAntecipationOpen, setIsAntecipationOpen] = useState(false);
  const [isOwnershipTransferOpen, setIsOwnershipTransferOpen] = useState(false);
  const [isPreContractedAntecipationOpen, setIsPreContractedAntecipationOpen] = useState(false);

  const futurePeriodPresets: { key: typeof futurePeriodFilter; label: string }[] = [
    { key: '7days', label: '7D' },
    { key: '15days', label: '15D' },
    { key: '30days', label: '30D' },
    { key: '60days', label: '60D' },
    { key: '90days', label: '90D' },
    { key: '180days', label: '180D' },
  ];
  const [searchName, setSearchName] = useState('');
  const [filterLimit, setFilterLimit] = useState<'all' | 'above500k' | 'above1m' | 'above5m'>('all');
  const [filterOptIn, setFilterOptIn] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');

  const handleSendToRegistry = (client: OptInClient) => {
    showToast('success', 'Opt-in encaminhado!', `Cliente: ${client.client_name}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesName = client.name.toLowerCase().includes(searchName.toLowerCase());

      let matchesLimit = true;
      if (filterLimit === 'above500k') {
        matchesLimit = client.totalLimit >= 500000;
      } else if (filterLimit === 'above1m') {
        matchesLimit = client.totalLimit >= 1000000;
      } else if (filterLimit === 'above5m') {
        matchesLimit = client.totalLimit >= 5000000;
      }

      let matchesOptIn = true;
      if (filterOptIn === 'active') {
        matchesOptIn = client.status === 'active';
      } else if (filterOptIn === 'pending') {
        matchesOptIn = client.status === 'pending';
      } else if (filterOptIn === 'inactive') {
        matchesOptIn = client.status === 'inactive';
      }

      return matchesName && matchesLimit && matchesOptIn;
    });
  }, [clients, searchName, filterLimit, filterOptIn]);

  const _formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  const generateDailyData = () => {
    const data: RadarData[] = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2026-12-31');
    const today = new Date('2025-11-05');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isPast = d < today;
      const randomFactor = 0.8 + Math.random() * 0.4;

      data.push({
        date: dateStr,
        blocked: Math.floor((20000 + Math.random() * 15000) * randomFactor),
        available: Math.floor((25000 + Math.random() * 20000) * randomFactor),
        isPast
      });
    }
    return data;
  };

  const radarData: RadarData[] = useMemo(() => generateDailyData(), []);

  const clientURs: ClientUR[] = useMemo(
    () => (selectedClient ? generateClientURs(selectedClient.id, selectedClient.document) : []),
    [selectedClient?.id, selectedClient?.document]
  );

  const filteredClientURs = clientURs
    .filter((ur) => {
      if (urAcquirerFilter !== 'all' && ur.acquirer !== urAcquirerFilter) return false;
      if (urBrandFilter !== 'all' && ur.brand !== urBrandFilter) return false;
      if (urTypeFilter !== 'all' && ur.type !== urTypeFilter) return false;
      if (urSettlementStart && ur.settlementDate < urSettlementStart) return false;
      if (urSettlementEnd && ur.settlementDate > urSettlementEnd) return false;
      return true;
    })
    .sort((a, b) => {
      if (!urSettlementSort) return 0;
      const cmp = a.settlementDate.localeCompare(b.settlementDate);
      return urSettlementSort === 'asc' ? cmp : -cmp;
    });

  const toggleUrSettlementSort = () => {
    setUrSettlementSort((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
  };

  const getURStatusStyle = (status: ClientUR['status']) => {
    switch (status) {
      case 'bloqueado': return 'bg-red-100 text-red-800';
      case 'disponivel': return 'bg-blue-100 text-blue-800';
      case 'liquidado': return 'bg-green-100 text-green-800';
    }
  };

  const getURStatusLabel = (status: ClientUR['status']) => {
    switch (status) {
      case 'bloqueado': return 'Bloqueado';
      case 'disponivel': return 'Disponível';
      case 'liquidado': return 'Liquidado';
    }
  };

  const getFilteredPastData = () => {
    const today = new Date('2025-11-05');
    const pastData = radarData.filter(d => d.isPast);

    if (pastPeriodFilter === 'custom' && customPastStartDate && customPastEndDate) {
      return pastData.filter(d => {
        const date = new Date(d.date);
        return date >= new Date(customPastStartDate) && date <= new Date(customPastEndDate);
      });
    }

    const filterDate = new Date(today);
    switch (pastPeriodFilter) {
      case 'week':
        filterDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(today.getMonth() - 3);
        break;
      case 'semester':
        filterDate.setMonth(today.getMonth() - 6);
        break;
      case 'year':
        filterDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    return pastData.filter(d => new Date(d.date) >= filterDate);
  };

  const getFilteredFutureData = () => {
    const today = new Date('2025-11-05');
    const futureData = radarData.filter(d => !d.isPast);

    if (futurePeriodFilter === 'custom' && futureCustomStart && futureCustomEnd) {
      return futureData.filter(d => {
        const date = new Date(d.date);
        return date >= new Date(futureCustomStart) && date <= new Date(futureCustomEnd);
      });
    }

    const daysMap: Record<string, number> = {
      '7days': 7,
      '15days': 15,
      '30days': 30,
      '60days': 60,
      '90days': 90,
      '180days': 180,
    };

    const days = daysMap[futurePeriodFilter] || 30;
    const filterDate = new Date(today);
    filterDate.setDate(today.getDate() + days);

    return futureData.filter(d => new Date(d.date) <= filterDate);
  };

  const filteredPastData = getFilteredPastData();
  const filteredFutureData = getFilteredFutureData();

  const totalPastBlocked = filteredPastData.reduce((sum, d) => sum + d.blocked, 0);
  const totalPastAvailable = filteredPastData.reduce((sum, d) => sum + d.available, 0);
  const totalPastLiquidated = totalPastBlocked + totalPastAvailable;

  const totalFutureBlocked = filteredFutureData.reduce((sum, d) => sum + d.blocked, 0);
  const totalFutureAvailable = filteredFutureData.reduce((sum, d) => sum + d.available, 0);
  const totalFutureLiquidate = totalFutureBlocked + totalFutureAvailable;

  const totalReceivables = totalPastLiquidated + totalFutureLiquidate;
  const _averageTicket = totalReceivables / radarData.length;
  const oldestTotal = radarData[0]?.blocked + radarData[0]?.available || 0;
  const newestTotal = radarData[radarData.length - 1]?.blocked + radarData[radarData.length - 1]?.available || 0;
  const _growthRate = oldestTotal > 0 ? ((newestTotal - oldestTotal) / oldestTotal) * 100 : 0;
  const _utilizationRate = totalReceivables > 0 ? ((totalPastBlocked + totalFutureBlocked) / totalReceivables) * 100 : 0;
  const maxDayTotal = Math.max(...radarData.map(d => d.blocked + d.available));
  const _concentration = totalReceivables > 0 ? (maxDayTotal / totalReceivables) * 100 : 0;

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedClient(null)}
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          </div>
        <button
          onClick={() => setShowOperationSelector(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Trava</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Período Futuro</h3>
                <p className="text-sm text-gray-600">Projeções e previsões</p>
              </div>
            </div>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {futurePeriodPresets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => { setFuturePeriodFilter(preset.key); setShowFutureCalendar(false); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    futurePeriodFilter === preset.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFutureCalendar(!showFutureCalendar);
                    if (futurePeriodFilter !== 'custom') {
                      setFuturePeriodFilter('custom');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    futurePeriodFilter === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Personalizado</span>
                </button>
                {showFutureCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
                        <input
                          type="date"
                          value={futureCustomStart}
                          onChange={(e) => setFutureCustomStart(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
                        <input
                          type="date"
                          value={futureCustomEnd}
                          onChange={(e) => setFutureCustomEnd(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => setShowFutureCalendar(false)}
                        disabled={!futureCustomStart || !futureCustomEnd}
                        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {futurePeriodFilter === 'custom' && futureCustomStart && futureCustomEnd && (
              <p className="text-xs text-gray-500 mt-2">
                Período: {new Date(futureCustomStart).toLocaleDateString('pt-BR')} — {new Date(futureCustomEnd).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg">
              <button
                onClick={() => setBloqueadoExpanded(!bloqueadoExpanded)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">Bloqueado</span>
                  <Tooltip content="Valores comprometidos com operações existentes (promessa de cessão ou outros gravames)" />
                  {bloqueadoExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="text-lg font-bold text-red-600">{formatCurrency(totalFutureBlocked)}</span>
              </button>
              {bloqueadoExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-3">
                  {/* Filtro: Todos / Para mim / Terceiros */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBloqueadoFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        bloqueadoFilter === 'all'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setBloqueadoFilter('mine')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        bloqueadoFilter === 'mine'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      Bloqueado para mim
                    </button>
                    <button
                      onClick={() => setBloqueadoFilter('others')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        bloqueadoFilter === 'others'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      Bloqueado por terceiros
                    </button>
                  </div>

                  {/* Valores conforme filtro */}
                  {(bloqueadoFilter === 'all' || bloqueadoFilter === 'mine') && (
                    <div>
                      {bloqueadoFilter === 'all' && (
                        <p className="text-xs font-semibold text-blue-800 mb-1.5 uppercase tracking-wide">Bloqueado para mim</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-blue-100/50 rounded-lg">
                          <span className="text-sm text-gray-700">Promessa de Cessão</span>
                          <span className="text-sm font-semibold text-blue-700">{formatCurrency(Math.round(totalFutureBlocked * 0.45))}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-100/50 rounded-lg">
                          <span className="text-sm text-gray-700">Garantia</span>
                          <span className="text-sm font-semibold text-blue-700">{formatCurrency(Math.round(totalFutureBlocked * 0.2))}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-100/70 rounded-lg font-medium">
                          <span className="text-sm text-blue-800">Subtotal</span>
                          <span className="text-sm font-bold text-blue-700">{formatCurrency(Math.round(totalFutureBlocked * 0.65))}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(bloqueadoFilter === 'all' || bloqueadoFilter === 'others') && (
                    <div>
                      {bloqueadoFilter === 'all' && (
                        <p className="text-xs font-semibold text-red-800 mb-1.5 mt-2 uppercase tracking-wide">Bloqueado por terceiros</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-red-100/50 rounded-lg">
                          <span className="text-sm text-gray-700">Promessa de Cessão</span>
                          <span className="text-sm font-semibold text-red-700">{formatCurrency(Math.round(totalFutureBlocked * 0.25))}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-100/50 rounded-lg">
                          <span className="text-sm text-gray-700">Outros Gravames</span>
                          <span className="text-sm font-semibold text-red-700">{formatCurrency(Math.round(totalFutureBlocked * 0.1))}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-100/70 rounded-lg font-medium">
                          <span className="text-sm text-red-800">Subtotal</span>
                          <span className="text-sm font-bold text-red-700">{formatCurrency(Math.round(totalFutureBlocked * 0.35))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Disponível</span>
                <Tooltip content="Valores livres para novas operações de crédito" />
              </div>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(totalFutureAvailable)}</span>
            </div>
            <div className="bg-purple-50 rounded-lg">
              <button
                onClick={() => setLiquidadoHojeExpanded(!liquidadoHojeExpanded)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Liquidado Hoje</span>
                  {liquidadoHojeExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="text-lg font-bold text-purple-600">{formatCurrency(0)}</span>
              </button>
              {liquidadoHojeExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="flex items-center justify-between p-3 bg-purple-100/50 rounded-lg">
                    <span className="text-sm text-gray-700">Valor Pré-Contratado</span>
                    <span className="text-sm font-semibold text-purple-700">{formatCurrency(0)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Total a Liquidar</span>
              </div>
              <span className="text-lg font-bold text-green-600">{formatCurrency(totalFutureLiquidate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">URs do Cliente</h3>
          <p className="text-sm text-gray-600">Todas as unidades recebíveis, independente do status</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Credenciador</label>
            <select
              value={urAcquirerFilter}
              onChange={(e) => setUrAcquirerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              {UR_ACQUIRERS.map((acquirer) => (
                <option key={acquirer} value={acquirer}>{acquirer}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bandeira</label>
            <select
              value={urBrandFilter}
              onChange={(e) => setUrBrandFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              {UR_BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select
              value={urTypeFilter}
              onChange={(e) => setUrTypeFilter(e.target.value as typeof urTypeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="credito">Crédito</option>
              <option value="debito">Débito</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Liquidação de</label>
            <input
              type="date"
              value={urSettlementStart}
              onChange={(e) => setUrSettlementStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Liquidação até</label>
            <input
              type="date"
              value={urSettlementEnd}
              onChange={(e) => setUrSettlementEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {(urSettlementStart || urSettlementEnd) && (
            <button
              onClick={() => { setUrSettlementStart(''); setUrSettlementEnd(''); }}
              className="text-sm text-blue-600 hover:text-blue-700 pb-2.5"
            >
              Limpar datas
            </button>
          )}

          <div className="text-sm text-gray-500 ml-auto pb-2.5">
            {filteredClientURs.length} de {clientURs.length} URs
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credenciador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={toggleUrSettlementSort}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Data de Liquidação</span>
                    {urSettlementSort === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-blue-600" />
                    ) : urSettlementSort === 'desc' ? (
                      <ArrowDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientURs.map((ur) => (
                <tr
                  key={ur.id}
                  onClick={() => setSelectedUR(ur)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.acquirer}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.brand}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{ur.type === 'credito' ? 'Crédito' : 'Débito'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {new Date(ur.settlementDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(ur.value)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getURStatusStyle(ur.status)}`}>
                      {getURStatusLabel(ur.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClientURs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-1">Nenhuma UR encontrada</div>
              <div className="text-sm text-gray-400">Tente ajustar os filtros</div>
            </div>
          )}
        </div>
      </div>

      {selectedUR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUR(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedUR.acquirer} · {selectedUR.brand}</h2>
                <p className="text-sm text-gray-600">
                  {selectedUR.type === 'credito' ? 'Crédito' : 'Débito'} — Liquidação em {new Date(selectedUR.settlementDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getURStatusStyle(selectedUR.status)}`}>
                  {getURStatusLabel(selectedUR.status)}
                </span>
                <button
                  onClick={() => setSelectedUR(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Identificação — AP005 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Identificação</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Referência Externa</p>
                    <p className="text-sm text-gray-900 font-mono">{selectedUR.referenciaExterna}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Entidade Registradora</p>
                    <p className="text-sm text-gray-900">{selectedUR.entidadeRegistradora}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">CNPJ Credenciadora</p>
                    <p className="text-sm text-gray-900">{selectedUR.cnpjCredenciadora}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Usuário Final Recebedor</p>
                    <p className="text-sm text-gray-900">{selectedUR.documentoUsuarioFinalRecebedor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Titular da UR</p>
                    <p className="text-sm text-gray-900">{selectedUR.titularUR}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Constituição da UR</p>
                    <p className="text-sm text-gray-900">{selectedUR.constituicao === '1' ? 'Constituída' : 'A constituir'}</p>
                  </div>
                  {selectedUR.carteira && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Carteira</p>
                      <p className="text-sm text-gray-900">{selectedUR.carteira}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Última Atualização</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUR.dataHoraUltimaAtualizacao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Valores — AP005 */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Valores</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Valor Total da UR</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedUR.valorTotalUR)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Valor Constituído Total</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedUR.valorConstituidoTotal)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Valor Bloqueado</p>
                    <p className="text-sm font-semibold text-red-700">{formatCurrency(selectedUR.valorBloqueado)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Valor Livre</p>
                    <p className="text-sm font-semibold text-blue-700">{formatCurrency(selectedUR.valorLivre)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Valor Constituído — Antecipação Pré-Contratado</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(selectedUR.valorConstituidoAntecipacaoPreContratado)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Informações de Pagamento — AP005 */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações de Pagamento</h3>
                <div className="space-y-3">
                  {selectedUR.listaInformacoesPagamento.map((info, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Tipo de Efeito</p>
                          <p className="text-sm text-gray-900">{info.tipoInformacaoPagamento}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Valor a Pagar</p>
                          <p className="text-sm text-gray-900">{formatCurrency(info.valorAPagar)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Domicílio Bancário</p>
                          <p className="text-sm text-gray-900">
                            {info.tipoConta} · ISPB {info.ispb}
                            {info.agencia && ` · Ag. ${info.agencia}`} · Conta {info.numeroConta}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Titular do Domicílio</p>
                          <p className="text-sm text-gray-900">{info.numeroDocumentoTitularDomicilio}</p>
                        </div>
                        {info.beneficiario && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Beneficiário</p>
                            <p className="text-sm text-gray-900">{info.beneficiario}</p>
                          </div>
                        )}
                        {info.dataLiquidacaoEfetiva && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Liquidação Efetiva</p>
                            <p className="text-sm text-gray-900">
                              {new Date(info.dataLiquidacaoEfetiva).toLocaleDateString('pt-BR')}
                              {info.valorLiquidacaoEfetiva != null && ` — ${formatCurrency(info.valorLiquidacaoEfetiva)}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eventos de Mutação */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Eventos de Mutação
                </h3>
                <div className="space-y-3">
                  {generateURMutationEvents(selectedUR, formatCurrency).map((event, index) => (
                    <div key={index} className="border-l-2 border-blue-600 pl-4 py-1">
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOperationSelector && (
        <OperationSelectorModal
          onClose={() => setShowOperationSelector(false)}
          onSelect={(op) => {
            setShowOperationSelector(false);
            if (op === 'recovery') setIsCreditRecoveryOpen(true);
            else if (op === 'guarantees') setIsGuaranteesOpen(true);
            else if (op === 'prepayment') setIsPrepaymentOpen(true);
            else if (op === 'anticipation') setIsAntecipationOpen(true);
            else if (op === 'ownershipTransfer') setIsOwnershipTransferOpen(true);
            else if (op === 'preContractedAntecipation') setIsPreContractedAntecipationOpen(true);
          }}
        />
      )}

      <CreditRecoveryJourney isOpen={isCreditRecoveryOpen} onClose={() => setIsCreditRecoveryOpen(false)} initialClient={selectedClient} />
      <GuaranteesJourney isOpen={isGuaranteesOpen} onClose={() => setIsGuaranteesOpen(false)} initialClient={selectedClient} />
      <PrepaymentJourney isOpen={isPrepaymentOpen} onClose={() => setIsPrepaymentOpen(false)} initialClient={selectedClient} />
      <AntecipationJourney isOpen={isAntecipationOpen} onClose={() => setIsAntecipationOpen(false)} initialClient={selectedClient} />
      <OwnershipTransferJourney isOpen={isOwnershipTransferOpen} onClose={() => setIsOwnershipTransferOpen(false)} initialClient={selectedClient} />
      <PreContractedAntecipationJourney isOpen={isPreContractedAntecipationOpen} onClose={() => setIsPreContractedAntecipationOpen(false)} initialClient={selectedClient} />
    </div>
    );
  }

  return (
    <div className="space-y-6">
      <NewOptInModal
        isOpen={showNewOptInModal}
        onClose={() => setShowNewOptInModal(false)}
        onSuccess={() => {
          console.log('Opt-in criado com sucesso');
        }}
      />

      <OptInDetailsModal
        isOpen={showOptInDetailsModal}
        onClose={() => {
          setShowOptInDetailsModal(false);
          setSelectedOptInClient(null);
        }}
        client={selectedOptInClient}
        onSendToRegistry={handleSendToRegistry}
      />

      {showOperationSelector && (
        <OperationSelectorModal
          onClose={() => setShowOperationSelector(false)}
          onSelect={(op) => {
            setShowOperationSelector(false);
            if (op === 'recovery') setIsCreditRecoveryOpen(true);
            else if (op === 'guarantees') setIsGuaranteesOpen(true);
            else if (op === 'prepayment') setIsPrepaymentOpen(true);
            else if (op === 'anticipation') setIsAntecipationOpen(true);
            else if (op === 'ownershipTransfer') setIsOwnershipTransferOpen(true);
            else if (op === 'preContractedAntecipation') setIsPreContractedAntecipationOpen(true);
          }}
        />
      )}

      <CreditRecoveryJourney isOpen={isCreditRecoveryOpen} onClose={() => setIsCreditRecoveryOpen(false)} />
      <GuaranteesJourney isOpen={isGuaranteesOpen} onClose={() => setIsGuaranteesOpen(false)} />
      <PrepaymentJourney isOpen={isPrepaymentOpen} onClose={() => setIsPrepaymentOpen(false)} />
      <AntecipationJourney isOpen={isAntecipationOpen} onClose={() => setIsAntecipationOpen(false)} />
      <OwnershipTransferJourney isOpen={isOwnershipTransferOpen} onClose={() => setIsOwnershipTransferOpen(false)} />
      <PreContractedAntecipationJourney isOpen={isPreContractedAntecipationOpen} onClose={() => setIsPreContractedAntecipationOpen(false)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Nome</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Digite o nome do cliente..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Limite</label>
            <select
              value={filterLimit}
              onChange={(e) => setFilterLimit(e.target.value as typeof filterLimit)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Limites</option>
              <option value="above500k">Acima de R$ 500 mil</option>
              <option value="above1m">Acima de R$ 1 milhão</option>
              <option value="above5m">Acima de R$ 5 milhões</option>
            </select>
          </div>

          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Opt-in</label>
            <select
              value={filterOptIn}
              onChange={(e) => setFilterOptIn(e.target.value as typeof filterOptIn)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="pending">Aguardando Assinatura</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOperationSelector(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Trava
            </button>
            <button
              onClick={() => setShowNewOptInModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Optin
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Limite Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {client.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.segment}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.cnpj}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : client.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status === 'active' ? 'Ativo' : client.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(client.totalLimit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Radar
                      </button>
                      <button
                        onClick={() => {
                          const statusMap: Record<Client['status'], OptInClient['status']> = {
                            'active': 'signed',
                            'pending': 'pending_registry',
                            'inactive': 'expired'
                          };
                          const optInStatus = statusMap[client.status] || 'expired';
                          setSelectedOptInClient({
                            id: client.id,
                            client_name: client.name,
                            client_document: client.cnpj,
                            client_email: 'contato@empresa.com.br',
                            client_phone: '(11) 99999-9999',
                            client_address: 'Av. Paulista, 1000 - São Paulo, SP',
                            status: optInStatus,
                            created_at: '2024-01-15T10:00:00Z',
                            expiry_date: '2025-01-15T10:00:00Z',
                            signature_token: 'abc123token',
                            signed_at: optInStatus === 'signed' || optInStatus === 'pending_registry' ? '2024-01-16T14:30:00Z' : undefined
                          });
                          setShowOptInDetailsModal(true);
                        }}
                        className={`inline-flex items-center px-3 py-1.5 border-0 text-xs font-medium rounded-lg text-white transition-colors ${
                          client.status === 'active'
                            ? 'bg-green-600 hover:bg-green-700'
                            : client.status === 'pending'
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        OPT-IN
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

type OperationType = 'recovery' | 'guarantees' | 'prepayment' | 'anticipation' | 'ownershipTransfer' | 'preContractedAntecipation';

interface OperationSelectorModalProps {
  onClose: () => void;
  onSelect: (operation: OperationType) => void;
}

const operations: { key: OperationType; title: string; description: string; icon: React.ReactNode; color: string; hoverBorder: string; hoverBg: string; iconBg: string }[] = [
  {
    key: 'recovery',
    title: 'Recuperação de Crédito',
    description: 'Recupere valores de clientes inadimplentes com automação de busca',
    icon: <CreditCard className="w-7 h-7 text-blue-600" />,
    color: 'text-blue-600',
    hoverBorder: 'hover:border-blue-400',
    hoverBg: 'hover:bg-blue-50',
    iconBg: 'bg-blue-100',
  },
  {
    key: 'guarantees',
    title: 'Garantias',
    description: 'Constitua garantias sobre recebíveis de clientes',
    icon: <Shield className="w-7 h-7 text-green-600" />,
    color: 'text-green-600',
    hoverBorder: 'hover:border-green-400',
    hoverBg: 'hover:bg-green-50',
    iconBg: 'bg-green-100',
  },
  {
    key: 'prepayment',
    title: 'Pré-pagamentos',
    description: 'Use recebíveis futuros como forma de pagamento adiantado',
    icon: <DollarSign className="w-7 h-7 text-teal-600" />,
    color: 'text-teal-600',
    hoverBorder: 'hover:border-teal-400',
    hoverBg: 'hover:bg-teal-50',
    iconBg: 'bg-teal-100',
  },
  {
    key: 'anticipation',
    title: 'Antecipação',
    description: 'Antecipe recebíveis e melhore o fluxo de caixa',
    icon: <TrendingUp className="w-7 h-7 text-orange-600" />,
    color: 'text-orange-600',
    hoverBorder: 'hover:border-orange-400',
    hoverBg: 'hover:bg-orange-50',
    iconBg: 'bg-orange-100',
  },
  {
    key: 'ownershipTransfer',
    title: 'Troca de Titularidade Automática',
    description: 'Ative a compra automática de URs com troca de titularidade',
    icon: <RefreshCw className="w-7 h-7 text-purple-600" />,
    color: 'text-purple-600',
    hoverBorder: 'hover:border-purple-400',
    hoverBg: 'hover:bg-purple-50',
    iconBg: 'bg-purple-100',
  },
  {
    key: 'preContractedAntecipation',
    title: 'Antecipação Automática Pré Contratada',
    description: 'Configure antecipações automáticas com regras pré-definidas',
    icon: <Zap className="w-7 h-7 text-amber-600" />,
    color: 'text-amber-600',
    hoverBorder: 'hover:border-amber-400',
    hoverBg: 'hover:bg-amber-50',
    iconBg: 'bg-amber-100',
  },
];

const OperationSelectorModal: React.FC<OperationSelectorModalProps> = ({ onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nova Operação</h2>
            <p className="text-sm text-gray-600">Selecione o tipo de operação que deseja iniciar</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {operations.map((op) => (
              <button
                key={op.key}
                onClick={() => onSelect(op.key)}
                className={`bg-white border-2 border-gray-200 rounded-xl p-5 ${op.hoverBorder} ${op.hoverBg} transition-all group text-left`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${op.iconBg} rounded-lg transition-colors`}>
                    {op.icon}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{op.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{op.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
