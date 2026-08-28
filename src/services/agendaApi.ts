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
