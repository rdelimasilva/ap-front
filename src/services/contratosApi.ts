export class ContratosApiError extends Error {
  codigo: string;
  status: number;

  constructor(codigo: string, mensagem: string, status: number) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
  }
}

export interface ParcelaPayload {
  vencimento: string;
  valor: number;
}

export interface DomicilioPagamentoPayload {
  numeroDocumentoTitular: string;
  nomeTitular?: string;
  tipoConta: 'CC' | 'CD' | 'PG' | 'PP';
  compe?: string;
  ispb: string;
  agencia: string;
  numeroConta: string;
}

export interface DefinicaoUnidadeRecebivelPayload {
  listaCnpjCredenciadora: string[];
  listaCodigoArranjoPagamento: string[];
  documentoUsuarioFinalRecebedor?: string;
  documentoTitular?: string;
  dataInicio: string;
  dataFim: string;
}

export interface GarantiaPayload {
  referenciaExterna: string;
  domicilioPagamento: DomicilioPagamentoPayload;
  definicaoUnidadeRecebivel: DefinicaoUnidadeRecebivelPayload;
  regrasDivisao: '1' | '2';
  valorAOnerar: number;
  tipoDistribuicao?: 'padrao_empilhamento_ap' | 'padrao_pro_rata_ap';
}

export interface CriarContratoPayload {
  tipoOperacao: 'C';
  referenciaExterna: string;
  identificadorContrato: string;
  documentoContratante: string;
  repactuacao: '0' | '1';
  identificacaoContratosAnteriores?: string[];
  cnpjDetentor: string;
  tipoEfeito: '1' | '2' | '3' | '4';
  saldoDevedor: number;
  limiteOperacaoGarantida: number;
  valorMantido: number;
  dataAssinatura: string;
  dataVencimento: string;
  identificacaoGestaoEntidadeRegistradora: '1' | '2' | '3';
  modalidadeOperacao: '1' | '2' | '3';
  parcelas?: ParcelaPayload[];
  carteira?: string;
  tipoAvaliacao?: string;
  garantias: GarantiaPayload[];
}

export interface ContratoDTO {
  id: string;
  referenciaExterna: string;
  identificadorContrato: string;
  protocolo: string | null;
  idContratoCerc: string | null;
  status: string;
  statusGarantia: string | null;
  cnpjParticipante: string;
  documentoContratante: string;
  cnpjDetentor: string;
  tipoEfeito: string;
  modalidadeOperacao: string;
  gestaoEntidadeRegistradora: string;
  saldoDevedor: number;
  limiteOperacaoGarantida: number;
  valorMantido: number;
  dataAssinatura: string;
  dataVencimento: string;
  repactuacao: boolean;
  carteira: string | null;
  tipoAvaliacao: string | null;
  qtdUrsAlcancadas: number | null;
  valorUrsAlcancadas: number | null;
  resultadoDistribuicao: string | null;
  indSobrecolateral: number | null;
  criadoEm: string | null;
  confirmadoEm: string | null;
}

export interface UnidadeRecebivelDTO {
  cnpjCredenciadora: string | null;
  documentoUsuarioFinalRecebedor: string | null;
  documentoTitular: string | null;
  codigoArranjoPagamento: string | null;
  dataLiquidacao: string | null;
  constituicao: string | null;
  valorConstituidoTotal: number | null;
  valorBloqueado: number | null;
  indicadorOneracao: string | null;
  regrasDivisao: string | null;
  valorOnerado: number | null;
  valorConstituidoEfeito: number | null;
  origem: string | null;
}

export interface GarantiaDetalheDTO {
  id: string;
  referenciaExterna: string;
  regrasDivisao: string;
  valorAOnerar: number;
  tipoDistribuicao: string | null;
  definicaoUnidadeRecebivel: DefinicaoUnidadeRecebivelPayload;
  unidadesRecebiveisAlcancadas: UnidadeRecebivelDTO[];
}

export interface IndicadorConsistenciaDTO {
  indicador: string;
  resultado: string | null;
  parametros: unknown;
  criticidade: string | null;
  observadoEm: string | null;
}

export interface ContratoDetalheDTO extends ContratoDTO {
  garantias: GarantiaDetalheDTO[];
  indicadoresConsistencia: IndicadorConsistenciaDTO[];
}

export interface OperacaoPosRegistroResultado {
  id: string;
  status: string;
  referenciaExterna: string;
  protocolo: string | null;
}

export interface RequisicaoCercDTO {
  recurso: string;
  httpStatus: number | null;
  tentativa: number;
  requestBody: unknown;
  responseBody: unknown;
  criadoEm: string;
}

export interface EventoContratoDTO {
  tipo: string;
  ocorridoEm: string;
  payload: unknown;
  requisicoes: RequisicaoCercDTO[];
}

const BASE_URL = import.meta.env.VITE_CONTRATOS_API_BASE_URL as string;
const FINANCIADOR_ID = import.meta.env.VITE_FINANCIADOR_ID as string;
const DEV_JWT = import.meta.env.VITE_CONTRATOS_DEV_JWT as string;

interface RequestOptions {
  body?: unknown;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Só o endpoint de eventos exige JWT hoje (ele devolve request/response
      // crus da CERC, com dados bancários do domicílio). Enviar em todas as
      // chamadas mantém o dia em que as demais rotas forem protegidas como
      // uma mudança só do backend.
      'Authorization': `Bearer ${DEV_JWT}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    // O serviço usa dois formatos de corpo de erro: o de validação estrutural
    // (`codigo` + `erro`, onde `erro` já é o texto da mensagem) e o de
    // autenticação de shared/jwt_auth.py (sem `codigo`; `erro` é o próprio
    // código — NAO_AUTENTICADO, SERVICO_MAL_CONFIGURADO — e `mensagem`, quando
    // vem, carrega o diagnóstico real, como "token expirado"). Sem distinguir
    // os dois, o diagnóstico de autenticação era descartado e todo 401/503
    // virava "ERRO_DESCONHECIDO" para quem consome `codigo`.
    const corpo = (data && typeof data === 'object' ? data : {}) as { codigo?: string; erro?: string; mensagem?: string; erros?: Array<{ codigo?: string; mensagem?: string } | string> };
    if (corpo.codigo) {
      throw new ContratosApiError(corpo.codigo, corpo.erro ?? 'erro desconhecido', response.status);
    }
    if (corpo.erro) {
      throw new ContratosApiError(corpo.erro, corpo.mensagem ?? corpo.erro, response.status);
    }
    if (Array.isArray(corpo.erros) && corpo.erros.length > 0) {
      const mensagens = corpo.erros.map(e => (typeof e === 'string' ? e : e.mensagem ?? e.codigo ?? JSON.stringify(e)));
      throw new ContratosApiError('REJEITADO_ESTRUTURAL', mensagens.join('; '), response.status);
    }
    throw new ContratosApiError(`HTTP_${response.status}`, `resposta ${response.status} sem corpo de erro reconhecível`, response.status);
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

export function listContratos(
  filtros: { status?: string; limit?: number; documentoContratante?: string } = {},
): Promise<ContratoDTO[]> {
  return request<{ dados: ContratoDTO[] }>('GET', `/contratos/${FINANCIADOR_ID}${buildQuery(filtros)}`).then(r => r.dados);
}

export function getContrato(id: string): Promise<ContratoDetalheDTO> {
  return request<ContratoDetalheDTO>('GET', `/contratos/${FINANCIADOR_ID}/${id}`);
}

export function criarContrato(payload: CriarContratoPayload): Promise<OperacaoPosRegistroResultado> {
  return request<OperacaoPosRegistroResultado>('POST', `/contratos/${FINANCIADOR_ID}`, { body: payload });
}

export function inativarContrato(referenciaExterna: string): Promise<OperacaoPosRegistroResultado> {
  return request<OperacaoPosRegistroResultado>('POST', `/contratos/${FINANCIADOR_ID}/inativar`, { body: { referenciaExterna } });
}

export function baixarContrato(referenciaExterna: string): Promise<OperacaoPosRegistroResultado> {
  return request<OperacaoPosRegistroResultado>('POST', `/contratos/${FINANCIADOR_ID}/baixar`, { body: { referenciaExterna } });
}

export function getEventosContrato(id: string): Promise<EventoContratoDTO[]> {
  return request<{ dados: EventoContratoDTO[] }>('GET', `/contratos/${FINANCIADOR_ID}/${id}/eventos`).then(r => r.dados);
}
