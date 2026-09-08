export class AgendaApiError extends Error {
  codigo: string;
  status: number;

  constructor(codigo: string, mensagem: string, status: number) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
  }
}

export interface AgendaUrDTO {
  entidadeRegistradora: string;
  cnpjCredenciadora: string;
  documentoUfr: string;
  documentoTitular: string;
  codigoArranjo: string;
  dataLiquidacao: string;
  constituicao: '1' | '2';
  valorConstituidoTotal: string;
  valorConstituidoAntecipacaoPre: string;
  valorBloqueado: string;
  valorLivre: string;
  valorTotalUR: string;
  carteira: string | null;
  dataHoraUltimaAtualizacao: string;
  origem: 'SINCRONO' | 'WEBHOOK' | 'ARQUIVO';
  origemArquivo: string | null;
}

export interface ListarUrsFiltros {
  ufr?: string;
  titular?: string;
  credenciadora?: string;
  arranjo?: string;
  dataLiquidacaoInicio?: string;
  dataLiquidacaoFim?: string;
  constituicao?: '1' | '2';
  origem?: 'SINCRONO' | 'WEBHOOK' | 'ARQUIVO';
  atualizadoDesde?: string;
  cursor?: number;
  limit?: number;
}

export interface ListarUrsResposta {
  urs: AgendaUrDTO[];
  proximoCursor: number | null;
}

const BASE_URL = import.meta.env.VITE_AGENDA_API_BASE_URL as string;
const DEV_JWT = import.meta.env.VITE_AGENDA_DEV_JWT as string;

interface RequestOptions {
  body?: unknown;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEV_JWT}`,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new AgendaApiError(data?.erro ?? 'ERRO_DESCONHECIDO', data?.mensagem ?? 'erro desconhecido', response.status);
  }

  return data as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function listAgendaUrs(filtros: ListarUrsFiltros = {}): Promise<ListarUrsResposta> {
  return request<ListarUrsResposta>('GET', `/agendas/urs${buildQuery(filtros)}`);
}

export interface TotaisUrsFiltros {
  ufr: string;
  credenciadora?: string;
  arranjo?: string;
}

export interface TotaisUrsResposta {
  bloqueado: string;
  disponivel: string;
  liquidadoHoje: string;
  totalALiquidar: string;
}

// bloqueado/disponivel somam passado + futuro (estado atual da UR, não uma
// janela); liquidadoHoje é confirmação real de pagamento hoje, não data
// agendada; totalALiquidar é o que falta pagar de verdade (constituído menos
// já confirmado), não uma soma de valorTotalUR — ver
// apps/agenda/views.py::totais_urs no backend.
export function getTotaisUrs(filtros: TotaisUrsFiltros): Promise<TotaisUrsResposta> {
  return request<TotaisUrsResposta>('GET', `/agendas/urs/totais${buildQuery(filtros)}`);
}

export interface DomicilioPagamentoDTO {
  numeroDocumentoTitular?: string | null;
  tipoConta?: string | null;
  compe?: string | null;
  ispb?: string | null;
  agencia?: string | null;
  numeroConta?: string | null;
}

export interface PagamentoUrDTO {
  tipoInformacaoPagamento: string;
  indicadorEfeitosContrato: string | null;
  identificadorCercContrato: string | null;
  regrasDivisao: string | null;
  valorOnerado: string | null;
  valorConstituidoEfeito: string | null;
  valorAPagar: string;
  beneficiario: string | null;
  dataLiquidacaoEfetiva: string | null;
  valorLiquidacaoEfetiva: string | null;
  motivoNaoPagamento: string | null;
  domicilio: DomicilioPagamentoDTO;
}

// Identifica a UR pela chave natural — os mesmos 6 campos que cada item de
// ListarUrsResposta já traz (backend não expõe `sequencia`, o cursor interno
// de paginação, como identificador estável — ver
// apps/agenda/tests/test_views_listar_urs.py::test_lista_filtrada_por_ufr).
export interface PagamentosUrFiltro {
  entidadeRegistradora: string;
  credenciadora: string;
  ufr: string;
  titular: string;
  arranjo: string;
  dataLiquidacao: string;
}

export interface PagamentosUrResposta {
  pagamentos: PagamentoUrDTO[];
}

export function getPagamentosUr(filtro: PagamentosUrFiltro): Promise<PagamentosUrResposta> {
  return request<PagamentosUrResposta>('GET', `/agendas/urs/pagamentos${buildQuery(filtro)}`);
}
