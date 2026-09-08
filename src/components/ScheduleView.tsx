import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, Lock, CheckCircle, Calendar, ArrowLeft, Eye, FileText, Plus, Filter, Search, Activity, CreditCard, Shield, DollarSign, RefreshCw, Zap, ArrowRight, X, ArrowUpDown, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { Client } from '../types';
import { NewOptInModal } from './NewOptInModal';
import { OptInDetailsModal } from './OptInDetailsModal';
import { CreditRecoveryJourney } from './CreditRecoveryJourney';
import { CercGarantiaJourney, type ContextoTrava } from './CercGarantiaJourney';
import { PrepaymentJourney } from './PrepaymentJourney';
import { AntecipationJourney } from './AntecipationJourney';
import { OwnershipTransferJourney } from './OwnershipTransferJourney';
import { PreContractedAntecipationJourney } from './PreContractedAntecipationJourney';
import { Tooltip } from './Tooltip';
import { showToast } from '../hooks/useToast';
import { listAgendaUrs, getPagamentosUr, getTotaisUrs, type AgendaUrDTO, type PagamentoUrDTO, type TotaisUrsResposta } from '../services/agendaApi';
import { ARRANJOS_CERC } from '../data/arranjosCerc';
import { CREDENCIADORAS_CERC } from '../data/credenciadorasCerc';

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

interface UrExibicao {
  id: string;
  credenciadora: string;
  arranjoDescricao: string;
  settlementDate: string;
  value: number;
  status: 'bloqueado' | 'disponivel' | 'liquidado';
  entidadeRegistradora: string;
  cnpjCredenciadora: string;
  documentoUsuarioFinalRecebedor: string;
  titularUR: string;
  codigoArranjo: string;
  constituicao: '1' | '2';
  valorConstituidoTotal: number;
  valorConstituidoAntecipacaoPreContratado: number;
  valorBloqueado: number;
  valorLivre: number;
  valorTotalUR: number;
  carteira?: string;
  dataHoraUltimaAtualizacao: string;
}

const CREDENCIADORA_POR_CNPJ = new Map(CREDENCIADORAS_CERC.map((c) => [c.cnpj, c.nome]));
const ARRANJO_POR_CODIGO = new Map(ARRANJOS_CERC.map((a) => [a.codigo, a.descricao]));

function nomeCredenciadora(cnpj: string): string {
  const digitos = cnpj.replace(/\D/g, '');
  return CREDENCIADORA_POR_CNPJ.get(digitos) ?? cnpj;
}

function descricaoArranjo(codigo: string): string {
  return ARRANJO_POR_CODIGO.get(codigo) ?? codigo;
}

// Aproximação — não há dado exato de liquidação efetiva disponível (mora em
// agenda_ur_pagamento, nenhum endpoint do backend expõe essa tabela ainda).
function statusDerivado(ur: AgendaUrDTO): UrExibicao['status'] {
  if (Number(ur.valorBloqueado) > 0) return 'bloqueado';
  if (Number(ur.valorLivre) > 0) return 'disponivel';
  return 'liquidado';
}

function mapearUrExibicao(ur: AgendaUrDTO): UrExibicao {
  return {
    id: `${ur.dataLiquidacao}-${ur.entidadeRegistradora}-${ur.cnpjCredenciadora}-${ur.documentoUfr}-${ur.documentoTitular}-${ur.codigoArranjo}`,
    credenciadora: nomeCredenciadora(ur.cnpjCredenciadora),
    arranjoDescricao: descricaoArranjo(ur.codigoArranjo),
    settlementDate: ur.dataLiquidacao,
    value: Number(ur.valorTotalUR),
    status: statusDerivado(ur),
    entidadeRegistradora: ur.entidadeRegistradora,
    cnpjCredenciadora: ur.cnpjCredenciadora,
    documentoUsuarioFinalRecebedor: ur.documentoUfr,
    titularUR: ur.documentoTitular,
    codigoArranjo: ur.codigoArranjo,
    constituicao: ur.constituicao,
    valorConstituidoTotal: Number(ur.valorConstituidoTotal),
    valorConstituidoAntecipacaoPreContratado: Number(ur.valorConstituidoAntecipacaoPre),
    valorBloqueado: Number(ur.valorBloqueado),
    valorLivre: Number(ur.valorLivre),
    valorTotalUR: Number(ur.valorTotalUR),
    carteira: ur.carteira ?? undefined,
    dataHoraUltimaAtualizacao: ur.dataHoraUltimaAtualizacao,
  };
}

function mapearPagamentoExibicao(p: PagamentoUrDTO): URPaymentInfo {
  return {
    numeroDocumentoTitularDomicilio: p.domicilio.numeroDocumentoTitular ?? '',
    tipoConta: (p.domicilio.tipoConta ?? '') as URPaymentInfo['tipoConta'],
    ispb: p.domicilio.ispb ?? '',
    agencia: p.domicilio.agencia ?? undefined,
    numeroConta: p.domicilio.numeroConta ?? '',
    valorAPagar: Number(p.valorAPagar),
    beneficiario: p.beneficiario ?? undefined,
    dataLiquidacaoEfetiva: p.dataLiquidacaoEfetiva ?? undefined,
    valorLiquidacaoEfetiva: p.valorLiquidacaoEfetiva != null ? Number(p.valorLiquidacaoEfetiva) : undefined,
    tipoInformacaoPagamento: p.tipoInformacaoPagamento,
  };
}

interface URMutationEvent {
  date: string;
  title: string;
  description: string;
}

const generateURMutationEvents = (ur: UrExibicao, formatCurrency: (value: number) => string): URMutationEvent[] => {
  const settlement = new Date(ur.settlementDate);
  const captureDate = new Date(settlement);
  captureDate.setDate(captureDate.getDate() - 2);

  const events: URMutationEvent[] = [
    {
      date: captureDate.toISOString().split('T')[0],
      title: 'Captura da UR',
      description: `Transação capturada via ${ur.credenciadora} (${ur.arranjoDescricao}) no valor de ${formatCurrency(ur.value)}`,
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
      description: `Liquidação processada pela ${ur.credenciadora}`,
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
  const clienteSessaoRef = useRef(0);
  const urPagamentosSessaoRef = useRef(0);
  const [totaisUrs, setTotaisUrs] = useState<TotaisUrsResposta | null>(null);
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
  const [urSettlementStart, setUrSettlementStart] = useState('');
  const [urSettlementEnd, setUrSettlementEnd] = useState('');
  const [urSettlementSort, setUrSettlementSort] = useState<'asc' | 'desc' | null>(null);
  const [selectedUR, setSelectedUR] = useState<UrExibicao | null>(null);
  const [selectedURPagamentos, setSelectedURPagamentos] = useState<URPaymentInfo[]>([]);
  const [isLoadingSelectedURPagamentos, setIsLoadingSelectedURPagamentos] = useState(false);
  const [urs, setUrs] = useState<UrExibicao[]>([]);
  const [isLoadingUrs, setIsLoadingUrs] = useState(false);
  const [proximoCursor, setProximoCursor] = useState<number | null>(null);
  const [isCreditRecoveryOpen, setIsCreditRecoveryOpen] = useState(false);
  const [isCercGarantiaOpen, setIsCercGarantiaOpen] = useState(false);
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

  useEffect(() => {
    clienteSessaoRef.current += 1;
    const sessaoAtual = clienteSessaoRef.current;

    // Limpa estado stale incondicionalmente — inclusive ao trocar para um
    // cliente real — pra não depender de nenhuma invariante de navegação
    // em outro ponto do arquivo pra evitar mostrar dados do cliente anterior.
    setUrs([]);
    setProximoCursor(null);
    setSelectedUR(null);
    setUrAcquirerFilter('all');
    setUrBrandFilter('all');
    setTotaisUrs(null);

    if (!selectedClient) {
      return;
    }

    const ufr = selectedClient.document.replace(/\D/g, '');
    if (!ufr) {
      // Documento vazio/malformado: nunca chamar listAgendaUrs/getTotaisUrs
      // sem ufr, senão o backend retorna dado de todos os UFRs visíveis ao
      // financiador do JWT (exposição de dados cross-cliente).
      return;
    }

    setIsLoadingUrs(true);
    listAgendaUrs({ ufr, limit: 100 })
      .then((resposta) => {
        if (sessaoAtual !== clienteSessaoRef.current) return;
        setUrs(resposta.urs.map(mapearUrExibicao));
        setProximoCursor(resposta.proximoCursor);
      })
      .catch(() => {
        if (sessaoAtual !== clienteSessaoRef.current) return;
        showToast('error', 'Erro ao carregar unidades recebíveis');
        setUrs([]);
        setProximoCursor(null);
      })
      .finally(() => {
        if (sessaoAtual === clienteSessaoRef.current) setIsLoadingUrs(false);
      });

    getTotaisUrs({ ufr })
      .then((resposta) => {
        if (sessaoAtual !== clienteSessaoRef.current) return;
        setTotaisUrs(resposta);
      })
      .catch(() => {
        if (sessaoAtual !== clienteSessaoRef.current) return;
        showToast('error', 'Erro ao carregar totalizadores da agenda');
        setTotaisUrs(null);
      });
  }, [selectedClient]);

  useEffect(() => {
    urPagamentosSessaoRef.current += 1;
    const sessaoAtual = urPagamentosSessaoRef.current;

    if (!selectedUR) {
      setSelectedURPagamentos([]);
      return;
    }

    setIsLoadingSelectedURPagamentos(true);
    getPagamentosUr({
      entidadeRegistradora: selectedUR.entidadeRegistradora,
      credenciadora: selectedUR.cnpjCredenciadora,
      ufr: selectedUR.documentoUsuarioFinalRecebedor,
      titular: selectedUR.titularUR,
      arranjo: selectedUR.codigoArranjo,
      dataLiquidacao: selectedUR.settlementDate,
    })
      .then((resposta) => {
        if (sessaoAtual !== urPagamentosSessaoRef.current) return;
        setSelectedURPagamentos(resposta.pagamentos.map(mapearPagamentoExibicao));
      })
      .catch(() => {
        if (sessaoAtual !== urPagamentosSessaoRef.current) return;
        showToast('error', 'Erro ao carregar informações de pagamento da UR');
        setSelectedURPagamentos([]);
      })
      .finally(() => {
        if (sessaoAtual === urPagamentosSessaoRef.current) setIsLoadingSelectedURPagamentos(false);
      });
  }, [selectedUR]);

  function carregarMaisUrs() {
    if (!selectedClient || proximoCursor === null) return;
    const sessaoDaChamada = clienteSessaoRef.current;
    const ufr = selectedClient.document.replace(/\D/g, '');
    if (!ufr) return;
    setIsLoadingUrs(true);
    listAgendaUrs({ ufr, cursor: proximoCursor, limit: 100 })
      .then((resposta) => {
        if (sessaoDaChamada !== clienteSessaoRef.current) return;
        setUrs((prev) => [...prev, ...resposta.urs.map(mapearUrExibicao)]);
        setProximoCursor(resposta.proximoCursor);
      })
      .catch(() => {
        if (sessaoDaChamada !== clienteSessaoRef.current) return;
        showToast('error', 'Erro ao carregar mais unidades recebíveis');
      })
      .finally(() => {
        if (sessaoDaChamada === clienteSessaoRef.current) setIsLoadingUrs(false);
      });
  }

  const acquirerOptions = useMemo(
    () => Array.from(new Set(urs.map((ur) => ur.credenciadora))).sort(),
    [urs]
  );
  const brandOptions = useMemo(
    () => Array.from(new Set(urs.map((ur) => ur.arranjoDescricao))).sort(),
    [urs]
  );

  const filteredClientURs = urs
    .filter((ur) => {
      if (urAcquirerFilter !== 'all' && ur.credenciadora !== urAcquirerFilter) return false;
      if (urBrandFilter !== 'all' && ur.arranjoDescricao !== urBrandFilter) return false;
      if (urSettlementStart && ur.settlementDate < urSettlementStart) return false;
      if (urSettlementEnd && ur.settlementDate > urSettlementEnd) return false;
      return true;
    })
    .sort((a, b) => {
      if (!urSettlementSort) return 0;
      const cmp = a.settlementDate.localeCompare(b.settlementDate);
      return urSettlementSort === 'asc' ? cmp : -cmp;
    });

  // Acima disto a lista deixa de ser um recorte útil e o formulário cai para
  // a sentinela "todas" (99T) — ver NewContratoModal e spec §9.
  const LIMITE_LISTA_CONTEXTO = 10;

  // O contexto sai das URs, e não do estado dos filtros: urAcquirerFilter e
  // urBrandFilter guardam rótulos legíveis (nome da credenciadora, descrição
  // do arranjo), enquanto a CERC exige CNPJ e código.
  const contextoTrava: ContextoTrava | undefined = useMemo(() => {
    if (!selectedClient) return undefined;
    const distintos = (valores: string[]) => Array.from(new Set(valores.filter(Boolean))).sort();
    const credenciadoras = distintos(filteredClientURs.map(ur => ur.cnpjCredenciadora));
    const arranjos = distintos(filteredClientURs.map(ur => ur.codigoArranjo));
    const ufrs = distintos(filteredClientURs.map(ur => ur.documentoUsuarioFinalRecebedor));
    const datas = filteredClientURs.map(ur => ur.settlementDate).sort();
    return {
      documentoContratante: selectedClient.document,
      documentoUsuarioFinalRecebedor: ufrs.length === 1 ? ufrs[0] : undefined,
      listaCnpjCredenciadora: credenciadoras.length <= LIMITE_LISTA_CONTEXTO ? credenciadoras : undefined,
      listaCodigoArranjoPagamento: arranjos.length <= LIMITE_LISTA_CONTEXTO ? arranjos : undefined,
      dataInicio: datas[0],
      dataFim: datas[datas.length - 1],
    };
  }, [selectedClient, filteredClientURs]);

  const toggleUrSettlementSort = () => {
    setUrSettlementSort((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
  };

  const getURStatusStyle = (status: UrExibicao['status']) => {
    switch (status) {
      case 'bloqueado': return 'bg-red-100 text-red-800';
      case 'disponivel': return 'bg-blue-100 text-blue-800';
      case 'liquidado': return 'bg-green-100 text-green-800';
    }
  };

  const getURStatusLabel = (status: UrExibicao['status']) => {
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
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-900">Bloqueado</span>
                <Tooltip content="Valores comprometidos com operações existentes (promessa de cessão ou outros gravames) — soma passado + futuro" />
              </div>
              <span className="text-lg font-bold text-red-600">
                {totaisUrs ? formatCurrency(Number(totaisUrs.bloqueado)) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Disponível</span>
                <Tooltip content="Valores livres para novas operações de crédito — soma passado + futuro" />
              </div>
              <span className="text-lg font-bold text-blue-600">
                {totaisUrs ? formatCurrency(Number(totaisUrs.disponivel)) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Liquidado Hoje</span>
                <Tooltip content="Confirmação real de pagamento recebida hoje (data_liquidacao_efetiva), não a data agendada da UR" />
              </div>
              <span className="text-lg font-bold text-purple-600">
                {totaisUrs ? formatCurrency(Number(totaisUrs.liquidadoHoje)) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Total a Liquidar</span>
                <Tooltip content="Total constituído menos o que já foi confirmado como liquidado, em qualquer data" />
              </div>
              <span className="text-lg font-bold text-green-600">
                {totaisUrs ? formatCurrency(Number(totaisUrs.totalALiquidar)) : '—'}
              </span>
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
              {acquirerOptions.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
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
              {brandOptions.map((descricao) => (
                <option key={descricao} value={descricao}>{descricao}</option>
              ))}
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
            {filteredClientURs.length} de {urs.length} URs
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credenciador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.credenciadora}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.arranjoDescricao}</td>
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

          {isLoadingUrs && urs.length === 0 && (
            <div className="text-center py-12 text-gray-500">Carregando URs...</div>
          )}

          {!isLoadingUrs && filteredClientURs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-1">Nenhuma UR encontrada</div>
              <div className="text-sm text-gray-400">Tente ajustar os filtros</div>
            </div>
          )}

          {proximoCursor !== null && (
            <div className="text-center py-4">
              <button
                onClick={carregarMaisUrs}
                disabled={isLoadingUrs}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingUrs ? 'Carregando...' : 'Carregar mais'}
              </button>
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
                <h2 className="text-lg font-bold text-gray-900">{selectedUR.credenciadora} · {selectedUR.arranjoDescricao}</h2>
                <p className="text-sm text-gray-600">
                  Liquidação em {new Date(selectedUR.settlementDate).toLocaleDateString('pt-BR')}
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
                  {isLoadingSelectedURPagamentos && (
                    <p className="text-sm text-gray-500">Carregando informações de pagamento…</p>
                  )}
                  {!isLoadingSelectedURPagamentos && selectedURPagamentos.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhuma informação de pagamento para esta UR.</p>
                  )}
                  {selectedURPagamentos.map((info, index) => (
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
            else if (op === 'guarantees') setIsCercGarantiaOpen(true);
            else if (op === 'prepayment') setIsPrepaymentOpen(true);
            else if (op === 'anticipation') setIsAntecipationOpen(true);
            else if (op === 'ownershipTransfer') setIsOwnershipTransferOpen(true);
            else if (op === 'preContractedAntecipation') setIsPreContractedAntecipationOpen(true);
          }}
        />
      )}

      <CreditRecoveryJourney isOpen={isCreditRecoveryOpen} onClose={() => setIsCreditRecoveryOpen(false)} initialClient={selectedClient} />
      <CercGarantiaJourney
        isOpen={isCercGarantiaOpen}
        onClose={() => setIsCercGarantiaOpen(false)}
        onCreated={() => setIsCercGarantiaOpen(false)}
        contexto={contextoTrava}
      />
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
            else if (op === 'guarantees') setIsCercGarantiaOpen(true);
            else if (op === 'prepayment') setIsPrepaymentOpen(true);
            else if (op === 'anticipation') setIsAntecipationOpen(true);
            else if (op === 'ownershipTransfer') setIsOwnershipTransferOpen(true);
            else if (op === 'preContractedAntecipation') setIsPreContractedAntecipationOpen(true);
          }}
        />
      )}

      <CreditRecoveryJourney isOpen={isCreditRecoveryOpen} onClose={() => setIsCreditRecoveryOpen(false)} />
      <CercGarantiaJourney
        isOpen={isCercGarantiaOpen}
        onClose={() => setIsCercGarantiaOpen(false)}
        onCreated={() => setIsCercGarantiaOpen(false)}
      />
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.document}</div>
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
                            client_document: client.document,
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
