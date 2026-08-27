export class OptinApiError extends Error {
  codigo: string;
  status: number;

  constructor(codigo: string, mensagem: string, status: number) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
  }
}

export interface ClienteDTO {
  id: string;
  documento: string;
  documentoTipo: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  status: 'active' | 'inactive' | 'pending';
  criadoEm: string;
  atualizadoEm: string;
}

export interface OptinDTO {
  id: string;
  referenciaExterna: string;
  protocoloCerc: string | null;
  origem: string;
  status: 'PENDENTE' | 'ATIVO' | 'REJEITADO' | 'FALHA_ENVIO';
  clienteId: string;
  clienteNome: string | null;
  cnpjSolicitante: string;
  cnpjFinanciador: string;
  usuarioFinalRecebedor: string;
  titular: string | null;
  dataAssinatura: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  carteira: string | null;
  credenciadoras: string[];
  arranjos: string[];
  criadoEm: string;
}

export interface CriarOptinPayload {
  clienteId: string;
  titular?: string;
  dataAssinatura: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  carteira?: string | null;
  evidenciaAutorizacaoId: string;
  credenciadoras: string[];
  arranjos: string[];
}

export interface AtualizarOptinPayload {
  vigenciaFim?: string;
  carteira?: string | null;
  arranjos?: string[];
  credenciadoras?: string[];
  cnpjFinanciador?: string;
}

export interface CriarClientePayload {
  documento: string;
  nome: string;
  email?: string;
  telefone?: string;
}

const BASE_URL = import.meta.env.VITE_OPTIN_API_BASE_URL as string;
const DEV_JWT = import.meta.env.VITE_OPTIN_DEV_JWT as string;

interface RequestOptions {
  body?: unknown;
  idempotent?: boolean;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEV_JWT}`,
  };
  if (options.idempotent) {
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new OptinApiError(data?.erro ?? 'ERRO_DESCONHECIDO', data?.mensagem ?? 'erro desconhecido', response.status);
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

export function listOptins(filtros: { status?: string; origem?: string; carteira?: string; vigenteEm?: string; limit?: number } = {}): Promise<OptinDTO[]> {
  return request<{ dados: OptinDTO[] }>('GET', `/optins${buildQuery(filtros)}`).then(r => r.dados);
}

export function getOptin(id: string): Promise<OptinDTO> {
  return request<OptinDTO>('GET', `/optins/${id}`);
}

export function createOptin(payload: CriarOptinPayload): Promise<OptinDTO> {
  return request<OptinDTO>('POST', '/optins', { body: payload, idempotent: true });
}

export function updateOptin(id: string, payload: AtualizarOptinPayload): Promise<OptinDTO> {
  return request<OptinDTO>('PATCH', `/optins/${id}`, { body: payload, idempotent: true });
}

export function listClientes(filtros: { documento?: string; limit?: number } = {}): Promise<ClienteDTO[]> {
  return request<{ dados: ClienteDTO[] }>('GET', `/clientes${buildQuery(filtros)}`).then(r => r.dados);
}

export function getCliente(id: string): Promise<ClienteDTO> {
  return request<ClienteDTO>('GET', `/clientes/${id}`);
}

export function createCliente(payload: CriarClientePayload): Promise<ClienteDTO> {
  return request<ClienteDTO>('POST', '/clientes', { body: payload });
}

export interface AtualizarClientePayload {
  nome?: string;
  email?: string;
  telefone?: string;
  status?: string;
}

export function updateCliente(id: string, payload: AtualizarClientePayload): Promise<ClienteDTO> {
  return request<ClienteDTO>('PATCH', `/clientes/${id}`, { body: payload });
}
