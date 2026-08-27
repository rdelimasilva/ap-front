# Integração da jornada de Contratos CERC com o front — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nova seção "Registro CERC" no `ap-front` que consome a jornada de contratos do `ap-back-contratos` (SPEC-02): criar, listar, ver detalhe, inativar e baixar contratos — sem tocar na tela de "Contratos" mockada existente.

**Architecture:** Um serviço de API novo e independente (`contratosApi.ts`, mesmo padrão de request/erro que o resto do projeto usaria para um backend real), um módulo de validação client-side que espelha as regras locais do backend (C01-C18 aplicáveis à criação, sem as que dependem de dado de referência que o front não tem: C11, C13, C14, C17, C19, C20), e três componentes React novos (lista, formulário de criação, detalhe) ligados a uma entrada de menu nova. Nenhum arquivo da tela de "Contratos" mockada é tocado.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind, `fetch` nativo (sem lib de HTTP), `lucide-react` pros ícones, hook `useToast`/`showToast` já existente pra feedback.

**Spec:** `docs/superpowers/specs/2026-08-27-contratos-cerc-integracao-frontend-design.md` (§3, §4, §5 — este plano implementa a metade do front; a metade do backend está em `C:\DEV\ap\ap-back-contratos\contratos\docs\superpowers\plans\2026-08-27-contratos-plan-15-endpoints-leitura.md`).

**Contexto de execução:** este plano roda no worktree `C:\DEV\ap\ap-front\.worktrees\contratos-cerc-integracao-front` (branch `contratos-cerc-integracao-front`, a partir de `main` — **não** tem o trabalho de opt-in de `optin-plan-12-integracao-front`, que ainda não foi mergeado). Todo caminho de arquivo abaixo é relativo à raiz desse worktree.

## Global Constraints

- **Não editar** `NewContractModal.tsx`, `ContractTable.tsx`, `ContractDetail.tsx`, `ContractApprovalBoard.tsx`, `types/index.ts` (`Contract`), `data/mockData.ts`, nem qualquer `case` do switch de `App.tsx` que já existe (`contracts`, `contracts-menu`, `contract-approval`, `contracts-monitoring`) — são a tela mockada existente, fora de escopo.
- Toda chamada de API usa `VITE_API_BASE_URL` (já reservada em `.env.example` pro `ap-back-contratos`, distinta de qualquer variável `VITE_OPTIN_*` de outro serviço) + `VITE_FINANCIADOR_ID` (nova).
- Backend precisa estar rodando em `http://localhost:8000` (`python manage.py runserver 8000` em `ap-back-contratos/contratos`) pra qualquer verificação manual funcionar — CORS já libera `http://localhost:5173` (config já existe em `config/settings.py` do backend, nada a fazer aqui).
- Sem framework de teste automatizado neste projeto — o "test" de cada task é `npx tsc --noEmit` (compilação limpa) + `npx eslint <arquivos da task>` (lint limpo, escopado às tuas mudanças — o projeto já tem 12 erros de lint pré-existentes em outros arquivos, não é escopo desta feature corrigi-los). Verificação end-to-end real é manual, na Task 7.
- Datas em `<input type="date">` (formato `AAAA-MM-DD`, já compatível com o formato que a SPEC-02 exige — sem conversão).
- Valores monetários: input de texto livre (aceita `,` ou `.` como separador decimal, convertido pra `number` só no submit) — mesmo padrão de `NewContractModal.tsx` (`formatCurrency`), mas sem obrigar máscara de milhar (não é requisito da spec).

---

### Task 3: `contratosApi.ts` — serviço de API

**Files:**
- Create: `src/services/contratosApi.ts`
- Modify: `.env.example` (adicionar `VITE_FINANCIADOR_ID`)
- Create: `.env` (não versionado — necessário pra rodar/testar localmente)

**Interfaces:**
- Produces: `ContratosApiError`, `ContratoDTO`, `ContratoDetalheDTO`, `GarantiaDetalheDTO`, `UnidadeRecebivelDTO`, `IndicadorConsistenciaDTO`, `CriarContratoPayload`, `GarantiaPayload`, `DomicilioPagamentoPayload`, `DefinicaoUnidadeRecebivelPayload`, `ParcelaPayload`, `listContratos`, `getContrato`, `criarContrato`, `inativarContrato`, `baixarContrato` — todos consumidos pelas Tasks 4-6.

- [ ] **Step 1: Criar `.env` local (não versionado)**

Ler `.env.example` (contém só `VITE_API_BASE_URL`). Criar `.env` na raiz do worktree com:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_FINANCIADOR_ID=3813878500136
```

- [ ] **Step 2: Adicionar `VITE_FINANCIADOR_ID` ao `.env.example`**

Editar `.env.example`, acrescentando ao final:

```
# CNPJ (14 dígitos) do financiador usado nas chamadas a /contratos/<financiador_id>.
# Em produção isto viria de um contexto de sessão/tenant; por agora é fixo via env.
VITE_FINANCIADOR_ID=
```

- [ ] **Step 3: Escrever `src/services/contratosApi.ts`**

```ts
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

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const FINANCIADOR_ID = import.meta.env.VITE_FINANCIADOR_ID as string;

interface RequestOptions {
  body?: unknown;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ContratosApiError(data?.codigo ?? 'ERRO_DESCONHECIDO', data?.erro ?? 'erro desconhecido', response.status);
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

export function listContratos(filtros: { status?: string; limit?: number } = {}): Promise<ContratoDTO[]> {
  return request<{ dados: ContratoDTO[] }>('GET', `/contratos/${FINANCIADOR_ID}${buildQuery(filtros)}`).then(r => r.dados);
}

export function getContrato(id: string): Promise<ContratoDetalheDTO> {
  return request<ContratoDetalheDTO>('GET', `/contratos/${FINANCIADOR_ID}/${id}`);
}

export function criarContrato(payload: CriarContratoPayload): Promise<ContratoDTO> {
  return request<ContratoDTO>('POST', `/contratos/${FINANCIADOR_ID}`, { body: payload });
}

export function inativarContrato(referenciaExterna: string): Promise<OperacaoPosRegistroResultado> {
  return request<OperacaoPosRegistroResultado>('POST', `/contratos/${FINANCIADOR_ID}/inativar`, { body: { referenciaExterna } });
}

export function baixarContrato(referenciaExterna: string): Promise<OperacaoPosRegistroResultado> {
  return request<OperacaoPosRegistroResultado>('POST', `/contratos/${FINANCIADOR_ID}/baixar`, { body: { referenciaExterna } });
}
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `contratosApi.ts` (o arquivo não é importado por ninguém ainda, então só precisa compilar sozinho sem erro de sintaxe/tipo).

- [ ] **Step 5: Lint do arquivo novo**

Run: `npx eslint src/services/contratosApi.ts`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/services/contratosApi.ts .env.example
git commit -m "feat: contratosApi.ts — client HTTP pro serviço de contratos CERC (ap-back-contratos)"
```

(`.env` não entra no commit — está no `.gitignore`.)

---

### Task 4: `contratoValidation.ts` — validações client-side espelhando C01-C18

**Files:**
- Create: `src/utils/contratoValidation.ts`

**Interfaces:**
- Consumes: nada (módulo puro, sem dependência de outros arquivos do projeto)
- Produces: `ValidacaoError`, `validarC01Documento`, `validarC02Repactuacao`, `validarC03RepactuacaoSemGarantias`, `validarC04ValorMonetario`, `validarC05ModalidadeParcelado`, `validarC06TipoDistribuicao`, `validarC07RegraDivisaoPercentual`, `validarC08DataInicioFutura`, `validarC09OrdemDatas`, `validarC10RaizTitularIgualUfr`, `validarC12ReferenciaGarantiaUnica`, `validarC15NumeroConta`, `validarC16DomicilioFormatos`, `validarC18BloqueioJudicial`, `validarPayloadContrato` (orquestrador usado pela Task 5) — nomes e assinaturas usados literalmente pela Task 5, não renomear sem atualizar lá.

- [ ] **Step 1: Escrever `src/utils/contratoValidation.ts`**

```ts
import type { CriarContratoPayload } from '../services/contratosApi';

/**
 * Espelha apenas as regras de apps/contratos/validation.py (SPEC-02 §9)
 * que são puramente locais — sem dependência de dado de referência que o
 * front não tem acesso: C11 (único documento na definição — trivial aqui,
 * o formulário só permite 1 documento por campo), C13 (sobreposição entre
 * garantias — só existe com múltiplas garantias, fora do escopo v1), C14
 * (lista de participantes do SLC), C17 (só se aplica a atualização,
 * tipoOperacao=A, fora do escopo), C19 (domínio de arranjos sincronizado),
 * C20 (contagem de efeitos já aplicados numa UR). Essas seis regras
 * continuam validadas pelo backend — o 422 delas aparece como erro geral,
 * não campo a campo.
 */
export class ValidacaoError extends Error {
  campo: string;

  constructor(campo: string, mensagem: string) {
    super(mensagem);
    this.campo = campo;
  }
}

export function normalizarDocumento(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) throw new ValidacaoError('documento', 'documento vazio');
  if (digits.length <= 8) return digits.padStart(8, '0');
  if (digits.length <= 11) return digits.padStart(11, '0');
  return digits.padStart(14, '0');
}

export function tipoDocumento(documento: string): 'CNPJ_RAIZ' | 'CPF' | 'CNPJ' {
  if (documento.length === 8) return 'CNPJ_RAIZ';
  if (documento.length === 11) return 'CPF';
  if (documento.length === 14) return 'CNPJ';
  throw new ValidacaoError('documento', `documento com tamanho inválido: ${documento.length}`);
}

function digitoVerificador(base: string, pesos: number[]): string {
  const soma = base.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? '0' : String(11 - resto);
}

function validarCpf(cpf: string): boolean {
  if (cpf === cpf[0].repeat(11)) return false;
  const dv1 = digitoVerificador(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = digitoVerificador(cpf.slice(0, 9) + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cpf.slice(-2) === dv1 + dv2;
}

function validarCnpj(cnpj: string): boolean {
  if (cnpj === cnpj[0].repeat(14)) return false;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = digitoVerificador(cnpj.slice(0, 12), pesos1);
  const dv2 = digitoVerificador(cnpj.slice(0, 12) + dv1, pesos2);
  return cnpj.slice(-2) === dv1 + dv2;
}

export function validarC01Documento(raw: string, campo: string): string {
  const documento = normalizarDocumento(raw);
  const tipo = tipoDocumento(documento);
  if (tipo === 'CPF' && !validarCpf(documento)) throw new ValidacaoError(campo, 'dígito verificador de CPF inválido');
  if (tipo === 'CNPJ' && !validarCnpj(documento)) throw new ValidacaoError(campo, 'dígito verificador de CNPJ inválido');
  return documento;
}

export function validarC02Repactuacao(repactuacao: '0' | '1', identificacaoContratosAnteriores: string[]): void {
  if (repactuacao === '1' && identificacaoContratosAnteriores.length === 0) {
    throw new ValidacaoError('identificacaoContratosAnteriores', 'repactuação exige ao menos um contrato anterior');
  }
}

export function validarC03RepactuacaoSemGarantias(repactuacao: '0' | '1', temGarantia: boolean): void {
  if (repactuacao === '1' && temGarantia) {
    throw new ValidacaoError('garantias', 'repactuação não pode ter garantia especificada');
  }
}

export function validarC04ValorMonetario(valor: number, campo: string): void {
  if (Number.isNaN(valor) || valor < 0.01) throw new ValidacaoError(campo, `${campo} deve ser maior ou igual a 0,01`);
}

export function validarC05ModalidadeParcelado(modalidadeOperacao: string, parcelas: unknown[]): void {
  if (modalidadeOperacao === '2' && parcelas.length === 0) {
    throw new ValidacaoError('parcelas', 'modalidade parcelado exige ao menos uma parcela');
  }
}

export function validarC06TipoDistribuicao(tipoDistribuicao: string, gestaoEntidadeRegistradora: string): void {
  const gestaoRegistradora = gestaoEntidadeRegistradora === '1';
  if (tipoDistribuicao && !gestaoRegistradora) {
    throw new ValidacaoError('tipoDistribuicao', 'só pode ser informado quando a gestão é da entidade registradora');
  }
  if (gestaoRegistradora && !tipoDistribuicao) {
    throw new ValidacaoError('tipoDistribuicao', 'obrigatório quando a gestão é da entidade registradora');
  }
}

export function validarC07RegraDivisaoPercentual(regrasDivisao: '1' | '2', valorAOnerar: number): void {
  if (regrasDivisao === '2' && valorAOnerar > 100) {
    throw new ValidacaoError('valorAOnerar', 'percentual não pode exceder 100');
  }
}

export function validarC08DataInicioFutura(dataInicio: string, hoje: string): void {
  if (dataInicio < hoje) throw new ValidacaoError('definicaoDataInicio', 'não pode ser no passado');
}

export function validarC09OrdemDatas(dataInicio: string, dataFim: string): void {
  if (dataFim < dataInicio) throw new ValidacaoError('definicaoDataFim', 'não pode ser anterior à data de início');
}

export function validarC10RaizTitularIgualUfr(documentoTitular: string, documentoUfr: string, ehRaiz: boolean): void {
  if (ehRaiz && documentoTitular !== documentoUfr) {
    throw new ValidacaoError('definicaoDocumentoTitular', 'CNPJ raiz exige documentoTitular igual a documentoUsuarioFinalRecebedor');
  }
}

export function validarC12ReferenciaGarantiaUnica(referencias: string[]): void {
  if (new Set(referencias).size !== referencias.length) {
    throw new ValidacaoError('garantiaReferenciaExterna', 'referência de garantia duplicada no mesmo contrato');
  }
}

export function validarC15NumeroConta(tipoConta: string, numeroConta: string): void {
  const temHifen = numeroConta.includes('-');
  if (['CC', 'CD', 'PP'].includes(tipoConta) && !temHifen) {
    throw new ValidacaoError('domicilioNumeroConta', `conta ${tipoConta} exige dígito verificador separado por hífen`);
  }
  if (tipoConta === 'PG' && temHifen) {
    throw new ValidacaoError('domicilioNumeroConta', 'conta PG não deve ter hífen');
  }
}

export function validarC16DomicilioFormatos(ispb: string, compe: string, agencia: string): void {
  if (!(ispb.length === 8 && /^\d+$/.test(ispb))) throw new ValidacaoError('domicilioIspb', 'deve ter exatamente 8 dígitos');
  if (compe && !(compe.length === 3 && /^\d+$/.test(compe))) throw new ValidacaoError('domicilioCompe', 'deve ter exatamente 3 dígitos');
  if (!(agencia && /^\d+$/.test(agencia) && agencia.length <= 8)) throw new ValidacaoError('domicilioAgencia', 'deve ter até 8 dígitos, sem dígito verificador');
}

export function validarC18BloqueioJudicial(tipoEfeito: string, identificadorContrato: string): void {
  if (tipoEfeito === '4' && !identificadorContrato) {
    throw new ValidacaoError('identificadorContrato', 'bloqueio judicial exige o número do processo judicial');
  }
}

export type ErrosPorCampo = Record<string, string>;

export function validarPayloadContrato(payload: CriarContratoPayload, hoje: string): ErrosPorCampo {
  const erros: ErrosPorCampo = {};
  const registrar = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      if (e instanceof ValidacaoError) erros[e.campo] = e.message;
      else throw e;
    }
  };

  registrar(() => validarC01Documento(payload.documentoContratante, 'documentoContratante'));
  registrar(() => validarC01Documento(payload.cnpjDetentor, 'cnpjDetentor'));
  registrar(() => validarC02Repactuacao(payload.repactuacao, payload.identificacaoContratosAnteriores ?? []));
  registrar(() => validarC03RepactuacaoSemGarantias(payload.repactuacao, payload.garantias.length > 0));
  registrar(() => validarC04ValorMonetario(payload.saldoDevedor, 'saldoDevedor'));
  registrar(() => validarC04ValorMonetario(payload.limiteOperacaoGarantida, 'limiteOperacaoGarantida'));
  registrar(() => validarC04ValorMonetario(payload.valorMantido, 'valorMantido'));
  registrar(() => validarC05ModalidadeParcelado(payload.modalidadeOperacao, payload.parcelas ?? []));
  registrar(() => validarC18BloqueioJudicial(payload.tipoEfeito, payload.identificadorContrato));

  payload.garantias.forEach((g) => {
    registrar(() => validarC06TipoDistribuicao(g.tipoDistribuicao ?? '', payload.identificacaoGestaoEntidadeRegistradora));
    registrar(() => validarC07RegraDivisaoPercentual(g.regrasDivisao, g.valorAOnerar));
    registrar(() => validarC08DataInicioFutura(g.definicaoUnidadeRecebivel.dataInicio, hoje));
    registrar(() => validarC09OrdemDatas(g.definicaoUnidadeRecebivel.dataInicio, g.definicaoUnidadeRecebivel.dataFim));
    const ehRaiz = (g.definicaoUnidadeRecebivel.documentoTitular ?? '').length === 8;
    registrar(() => validarC10RaizTitularIgualUfr(
      g.definicaoUnidadeRecebivel.documentoTitular ?? '',
      g.definicaoUnidadeRecebivel.documentoUsuarioFinalRecebedor ?? '',
      ehRaiz,
    ));
    registrar(() => validarC15NumeroConta(g.domicilioPagamento.tipoConta, g.domicilioPagamento.numeroConta));
    registrar(() => validarC16DomicilioFormatos(g.domicilioPagamento.ispb, g.domicilioPagamento.compe ?? '', g.domicilioPagamento.agencia));
  });
  registrar(() => validarC12ReferenciaGarantiaUnica(payload.garantias.map(g => g.referenciaExterna)));

  return erros;
}
```

- [ ] **Step 2: Escrever um smoke test manual via `tsx`/console (sem framework de teste no projeto)**

Não há Jest/Vitest configurado — a verificação é: compilação limpa (Step 3 abaixo) + exercitar as funções manualmente na Task 5 (o formulário real chama `validarPayloadContrato`). Não escrever um arquivo de teste que o projeto não tem como rodar.

- [ ] **Step 3: Verificar compilação e lint**

Run: `npx tsc --noEmit && npx eslint src/utils/contratoValidation.ts`
Expected: sem erros. (`contratosApi.ts` da Task 3 precisa existir primeiro — o `import type` deste arquivo depende dele.)

- [ ] **Step 4: Commit**

```bash
git add src/utils/contratoValidation.ts
git commit -m "feat: contratoValidation.ts — espelha C01-C18 (validation.py) pro formulário de criação"
```

---

### Task 5: `NewContratoModal.tsx` — formulário de criação

**Files:**
- Create: `src/components/NewContratoModal.tsx`

**Interfaces:**
- Consumes: `criarContrato`, `ContratosApiError`, `CriarContratoPayload`, `GarantiaPayload` de `contratosApi.ts` (Task 3); `validarPayloadContrato`, `ErrosPorCampo` de `contratoValidation.ts` (Task 4); `showToast` de `hooks/useToast`
- Produces: componente `NewContratoModal` com props `{ isOpen: boolean; onClose: () => void; onCreated: () => void }` — `onCreated` é chamado após criação bem-sucedida, consumido pela Task 6 pra recarregar a lista.

- [ ] **Step 1: Escrever `src/components/NewContratoModal.tsx`**

```tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import {
  criarContrato,
  ContratosApiError,
  type CriarContratoPayload,
  type GarantiaPayload,
} from '../services/contratosApi';
import { validarPayloadContrato, type ErrosPorCampo } from '../utils/contratoValidation';

interface NewContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ParcelaForm {
  vencimento: string;
  valor: string;
}

interface FormState {
  referenciaExterna: string;
  identificadorContrato: string;
  documentoContratante: string;
  repactuacao: '0' | '1';
  identificacaoContratosAnterioresRaw: string;
  cnpjDetentor: string;
  tipoEfeito: '1' | '2' | '3' | '4';
  saldoDevedor: string;
  limiteOperacaoGarantida: string;
  valorMantido: string;
  dataAssinatura: string;
  dataVencimento: string;
  identificacaoGestaoEntidadeRegistradora: '1' | '2' | '3';
  modalidadeOperacao: '1' | '2' | '3';
  carteira: string;
  tipoAvaliacao: string;
  garantiaReferenciaExterna: string;
  domicilioNumeroDocumentoTitular: string;
  domicilioNomeTitular: string;
  domicilioTipoConta: 'CC' | 'CD' | 'PG' | 'PP';
  domicilioCompe: string;
  domicilioIspb: string;
  domicilioAgencia: string;
  domicilioNumeroConta: string;
  definicaoDocumentoUfr: string;
  definicaoDocumentoTitular: string;
  definicaoDataInicio: string;
  definicaoDataFim: string;
  regrasDivisao: '1' | '2';
  valorAOnerar: string;
  tipoDistribuicao: '' | 'padrao_empilhamento_ap' | 'padrao_pro_rata_ap';
}

const ESTADO_INICIAL: FormState = {
  referenciaExterna: '', identificadorContrato: '', documentoContratante: '',
  repactuacao: '0', identificacaoContratosAnterioresRaw: '', cnpjDetentor: '',
  tipoEfeito: '2', saldoDevedor: '', limiteOperacaoGarantida: '', valorMantido: '',
  dataAssinatura: '', dataVencimento: '', identificacaoGestaoEntidadeRegistradora: '2',
  modalidadeOperacao: '1', carteira: '', tipoAvaliacao: '',
  garantiaReferenciaExterna: '', domicilioNumeroDocumentoTitular: '', domicilioNomeTitular: '',
  domicilioTipoConta: 'CC', domicilioCompe: '', domicilioIspb: '', domicilioAgencia: '',
  domicilioNumeroConta: '', definicaoDocumentoUfr: '', definicaoDocumentoTitular: '',
  definicaoDataInicio: '', definicaoDataFim: '', regrasDivisao: '1', valorAOnerar: '',
  tipoDistribuicao: '',
};

const TIPOS_EFEITO: Array<{ value: FormState['tipoEfeito']; label: string }> = [
  { value: '1', label: '1 — Troca de titularidade' },
  { value: '2', label: '2 — Ônus cessão fiduciária' },
  { value: '3', label: '3 — Ônus outros' },
  { value: '4', label: '4 — Bloqueio judicial' },
];

const TIPOS_GESTAO: Array<{ value: FormState['identificacaoGestaoEntidadeRegistradora']; label: string }> = [
  { value: '1', label: '1 — Gestão pela entidade registradora (GCAP)' },
  { value: '2', label: '2 — Gestão do financiador' },
  { value: '3', label: '3 — Gestão do financiador com monitoramento e alertas CERC' },
];

const MODALIDADES: Array<{ value: FormState['modalidadeOperacao']; label: string }> = [
  { value: '1', label: '1 — Rotativo' },
  { value: '2', label: '2 — Parcelado' },
  { value: '3', label: '3 — Cessão' },
];

const TIPOS_CONTA: Array<{ value: FormState['domicilioTipoConta']; label: string }> = [
  { value: 'CC', label: 'CC — Corrente' },
  { value: 'CD', label: 'CD — Depósito' },
  { value: 'PG', label: 'PG — Pagamento' },
  { value: 'PP', label: 'PP — Poupança' },
];

function paraNumero(valor: string): number {
  return Number(valor.replace(',', '.'));
}

function listaDeTexto(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function montarPayload(
  form: FormState,
  todasCredenciadoras: boolean,
  credenciadorasRaw: string,
  todosArranjos: boolean,
  arranjosRaw: string,
  parcelas: ParcelaForm[],
): CriarContratoPayload {
  const repactuado = form.repactuacao === '1';

  const garantia: GarantiaPayload = {
    referenciaExterna: form.garantiaReferenciaExterna,
    domicilioPagamento: {
      numeroDocumentoTitular: form.domicilioNumeroDocumentoTitular,
      nomeTitular: form.domicilioNomeTitular || undefined,
      tipoConta: form.domicilioTipoConta,
      compe: form.domicilioCompe || undefined,
      ispb: form.domicilioIspb,
      agencia: form.domicilioAgencia,
      numeroConta: form.domicilioNumeroConta,
    },
    definicaoUnidadeRecebivel: {
      listaCnpjCredenciadora: todasCredenciadoras ? ['99T'] : listaDeTexto(credenciadorasRaw),
      listaCodigoArranjoPagamento: todosArranjos ? ['99T'] : listaDeTexto(arranjosRaw),
      documentoUsuarioFinalRecebedor: form.definicaoDocumentoUfr || undefined,
      documentoTitular: form.definicaoDocumentoTitular || undefined,
      dataInicio: form.definicaoDataInicio,
      dataFim: form.definicaoDataFim,
    },
    regrasDivisao: form.regrasDivisao,
    valorAOnerar: paraNumero(form.valorAOnerar),
    tipoDistribuicao: form.tipoDistribuicao || undefined,
  };

  return {
    tipoOperacao: 'C',
    referenciaExterna: form.referenciaExterna,
    identificadorContrato: form.identificadorContrato,
    documentoContratante: form.documentoContratante,
    repactuacao: form.repactuacao,
    identificacaoContratosAnteriores: listaDeTexto(form.identificacaoContratosAnterioresRaw),
    cnpjDetentor: form.cnpjDetentor,
    tipoEfeito: form.tipoEfeito,
    saldoDevedor: paraNumero(form.saldoDevedor),
    limiteOperacaoGarantida: paraNumero(form.limiteOperacaoGarantida),
    valorMantido: paraNumero(form.valorMantido),
    dataAssinatura: form.dataAssinatura,
    dataVencimento: form.dataVencimento,
    identificacaoGestaoEntidadeRegistradora: form.identificacaoGestaoEntidadeRegistradora,
    modalidadeOperacao: form.modalidadeOperacao,
    parcelas: form.modalidadeOperacao === '2'
      ? parcelas.map(p => ({ vencimento: p.vencimento, valor: paraNumero(p.valor) }))
      : [],
    carteira: form.carteira || undefined,
    tipoAvaliacao: form.tipoAvaliacao || undefined,
    garantias: repactuado ? [] : [garantia],
  };
}

const Campo: React.FC<{ label: string; erro?: string; obrigatorio?: boolean; children: React.ReactNode }> = ({ label, erro, obrigatorio, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{obrigatorio && <span className="text-red-500"> *</span>}
    </label>
    {children}
    {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
  </div>
);

const inputClass = (temErro?: boolean) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${temErro ? 'border-red-400' : 'border-gray-300'}`;

export const NewContratoModal: React.FC<NewContratoModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [parcelas, setParcelas] = useState<ParcelaForm[]>([]);
  const [todasCredenciadoras, setTodasCredenciadoras] = useState(true);
  const [credenciadorasRaw, setCredenciadorasRaw] = useState('');
  const [todosArranjos, setTodosArranjos] = useState(true);
  const [arranjosRaw, setArranjosRaw] = useState('');
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [bannerErro, setBannerErro] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const set = <K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const resetar = () => {
    setForm(ESTADO_INICIAL);
    setParcelas([]);
    setTodasCredenciadoras(true);
    setCredenciadorasRaw('');
    setTodosArranjos(true);
    setArranjosRaw('');
    setErros({});
    setBannerErro(null);
  };

  const fechar = () => {
    resetar();
    onClose();
  };

  const adicionarParcela = () => setParcelas(prev => [...prev, { vencimento: '', valor: '' }]);
  const removerParcela = (index: number) => setParcelas(prev => prev.filter((_, i) => i !== index));
  const atualizarParcela = (index: number, campo: keyof ParcelaForm, valor: string) => {
    setParcelas(prev => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerErro(null);

    const payload = montarPayload(form, todasCredenciadoras, credenciadorasRaw, todosArranjos, arranjosRaw, parcelas);
    const hoje = new Date().toISOString().split('T')[0];
    const errosValidacao = validarPayloadContrato(payload, hoje);
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) return;

    setIsSubmitting(true);
    try {
      const contrato = await criarContrato(payload);
      showToast('success', 'Contrato submetido', `Status: ${contrato.status}${contrato.protocolo ? ` — protocolo ${contrato.protocolo}` : ''}`);
      onCreated();
      fechar();
    } catch (err) {
      if (err instanceof ContratosApiError) {
        setBannerErro(`${err.codigo}: ${err.message}`);
      } else {
        setBannerErro('Falha ao comunicar com o serviço de contratos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const repactuado = form.repactuacao === '1';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Novo Contrato (CERC-AP007)</h2>
          <button onClick={fechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {bannerErro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {bannerErro}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dados do contrato</h3>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Referência externa" obrigatorio erro={erros.referenciaExterna}>
                <input className={inputClass(!!erros.referenciaExterna)} value={form.referenciaExterna} onChange={e => set('referenciaExterna', e.target.value)} />
              </Campo>
              <Campo label="Identificador do contrato" obrigatorio erro={erros.identificadorContrato}>
                <input className={inputClass(!!erros.identificadorContrato)} value={form.identificadorContrato} onChange={e => set('identificadorContrato', e.target.value)} />
              </Campo>
              <Campo label="Documento do contratante (CPF/CNPJ)" obrigatorio erro={erros.documentoContratante}>
                <input className={inputClass(!!erros.documentoContratante)} value={form.documentoContratante} onChange={e => set('documentoContratante', e.target.value)} />
              </Campo>
              <Campo label="CNPJ do detentor" obrigatorio erro={erros.cnpjDetentor}>
                <input className={inputClass(!!erros.cnpjDetentor)} value={form.cnpjDetentor} onChange={e => set('cnpjDetentor', e.target.value)} />
              </Campo>
              <Campo label="Tipo de efeito" obrigatorio erro={erros.tipoEfeito}>
                <select className={inputClass()} value={form.tipoEfeito} onChange={e => set('tipoEfeito', e.target.value as FormState['tipoEfeito'])}>
                  {TIPOS_EFEITO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              {form.tipoEfeito === '4' && (
                <Campo label="Nº do processo judicial" erro={erros.identificadorContrato}>
                  <p className="text-xs text-gray-500 pt-2">Bloqueio judicial: informe o número do processo no campo "Identificador do contrato" acima.</p>
                </Campo>
              )}
              <Campo label="Repactuação" obrigatorio>
                <select className={inputClass()} value={form.repactuacao} onChange={e => set('repactuacao', e.target.value as FormState['repactuacao'])}>
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </select>
              </Campo>
              {repactuado && (
                <Campo label="Contratos anteriores (separados por vírgula)" obrigatorio erro={erros.identificacaoContratosAnteriores}>
                  <input className={inputClass(!!erros.identificacaoContratosAnteriores)} value={form.identificacaoContratosAnterioresRaw} onChange={e => set('identificacaoContratosAnterioresRaw', e.target.value)} />
                </Campo>
              )}
              <Campo label="Saldo devedor" obrigatorio erro={erros.saldoDevedor}>
                <input className={inputClass(!!erros.saldoDevedor)} value={form.saldoDevedor} onChange={e => set('saldoDevedor', e.target.value)} placeholder="150000.00" />
              </Campo>
              <Campo label="Limite da operação garantida" obrigatorio erro={erros.limiteOperacaoGarantida}>
                <input className={inputClass(!!erros.limiteOperacaoGarantida)} value={form.limiteOperacaoGarantida} onChange={e => set('limiteOperacaoGarantida', e.target.value)} placeholder="200000.00" />
              </Campo>
              <Campo label="Valor mantido" obrigatorio erro={erros.valorMantido}>
                <input className={inputClass(!!erros.valorMantido)} value={form.valorMantido} onChange={e => set('valorMantido', e.target.value)} placeholder="180000.00" />
              </Campo>
              <Campo label="Data de assinatura" obrigatorio>
                <input type="date" className={inputClass()} value={form.dataAssinatura} onChange={e => set('dataAssinatura', e.target.value)} />
              </Campo>
              <Campo label="Data de vencimento" obrigatorio>
                <input type="date" className={inputClass()} value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} />
              </Campo>
              <Campo label="Gestão da entidade registradora" obrigatorio>
                <select className={inputClass()} value={form.identificacaoGestaoEntidadeRegistradora} onChange={e => set('identificacaoGestaoEntidadeRegistradora', e.target.value as FormState['identificacaoGestaoEntidadeRegistradora'])}>
                  {TIPOS_GESTAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              <Campo label="Modalidade da operação" obrigatorio>
                <select className={inputClass()} value={form.modalidadeOperacao} onChange={e => set('modalidadeOperacao', e.target.value as FormState['modalidadeOperacao'])}>
                  {MODALIDADES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              <Campo label="Carteira (opcional)">
                <input className={inputClass()} value={form.carteira} onChange={e => set('carteira', e.target.value)} />
              </Campo>
              <Campo label="Tipo de avaliação (opcional)">
                <select className={inputClass()} value={form.tipoAvaliacao} onChange={e => set('tipoAvaliacao', e.target.value)}>
                  <option value="">—</option>
                  <option value="avaliacao_agenda_basica_ap">Avaliação de agenda básica</option>
                  <option value="avaliacao_agenda_completa_ap">Avaliação de agenda completa</option>
                  <option value="avaliacao_contrato_basica_ap">Avaliação de contrato básica</option>
                  <option value="avaliacao_contrato_completa_ap">Avaliação de contrato completa</option>
                </select>
              </Campo>
            </div>

            {form.modalidadeOperacao === '2' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Parcelas {erros.parcelas && <span className="text-red-500 text-xs ml-2">{erros.parcelas}</span>}</p>
                  <button type="button" onClick={adicionarParcela} className="text-emerald-600 text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Adicionar parcela
                  </button>
                </div>
                {parcelas.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="date" className={inputClass()} value={p.vencimento} onChange={e => atualizarParcela(i, 'vencimento', e.target.value)} />
                    <input className={inputClass()} value={p.valor} onChange={e => atualizarParcela(i, 'valor', e.target.value)} placeholder="12500.00" />
                    <button type="button" onClick={() => removerParcela(i)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!repactuado && (
            <section className="space-y-4 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Garantia</h3>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Referência externa da garantia" obrigatorio erro={erros.garantiaReferenciaExterna}>
                  <input className={inputClass(!!erros.garantiaReferenciaExterna)} value={form.garantiaReferenciaExterna} onChange={e => set('garantiaReferenciaExterna', e.target.value)} />
                </Campo>
                <Campo label="Regra de divisão" obrigatorio>
                  <select className={inputClass()} value={form.regrasDivisao} onChange={e => set('regrasDivisao', e.target.value as FormState['regrasDivisao'])}>
                    <option value="1">1 — Valor definido</option>
                    <option value="2">2 — Percentual</option>
                  </select>
                </Campo>
                <Campo label={form.regrasDivisao === '2' ? 'Percentual a onerar (até 100)' : 'Valor a onerar'} obrigatorio erro={erros.valorAOnerar}>
                  <input className={inputClass(!!erros.valorAOnerar)} value={form.valorAOnerar} onChange={e => set('valorAOnerar', e.target.value)} />
                </Campo>
                {form.identificacaoGestaoEntidadeRegistradora === '1' && (
                  <Campo label="Tipo de distribuição" obrigatorio erro={erros.tipoDistribuicao}>
                    <select className={inputClass(!!erros.tipoDistribuicao)} value={form.tipoDistribuicao} onChange={e => set('tipoDistribuicao', e.target.value as FormState['tipoDistribuicao'])}>
                      <option value="">—</option>
                      <option value="padrao_empilhamento_ap">Padrão empilhamento</option>
                      <option value="padrao_pro_rata_ap">Padrão pro-rata</option>
                    </select>
                  </Campo>
                )}
              </div>

              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Domicílio de pagamento</h4>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Documento do titular" obrigatorio erro={erros.domicilioNumeroDocumentoTitular}>
                  <input className={inputClass(!!erros.domicilioNumeroDocumentoTitular)} value={form.domicilioNumeroDocumentoTitular} onChange={e => set('domicilioNumeroDocumentoTitular', e.target.value)} />
                </Campo>
                <Campo label="Nome do titular (opcional)">
                  <input className={inputClass()} value={form.domicilioNomeTitular} onChange={e => set('domicilioNomeTitular', e.target.value)} />
                </Campo>
                <Campo label="Tipo de conta" obrigatorio>
                  <select className={inputClass()} value={form.domicilioTipoConta} onChange={e => set('domicilioTipoConta', e.target.value as FormState['domicilioTipoConta'])}>
                    {TIPOS_CONTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Campo>
                <Campo label="COMPE (3 dígitos, opcional)" erro={erros.domicilioCompe}>
                  <input className={inputClass(!!erros.domicilioCompe)} value={form.domicilioCompe} onChange={e => set('domicilioCompe', e.target.value)} maxLength={3} />
                </Campo>
                <Campo label="ISPB (8 dígitos)" obrigatorio erro={erros.domicilioIspb}>
                  <input className={inputClass(!!erros.domicilioIspb)} value={form.domicilioIspb} onChange={e => set('domicilioIspb', e.target.value)} maxLength={8} />
                </Campo>
                <Campo label="Agência (até 8 dígitos, sem DV)" obrigatorio erro={erros.domicilioAgencia}>
                  <input className={inputClass(!!erros.domicilioAgencia)} value={form.domicilioAgencia} onChange={e => set('domicilioAgencia', e.target.value)} maxLength={8} />
                </Campo>
                <Campo label="Número da conta (com DV/hífen se CC/CD/PP)" obrigatorio erro={erros.domicilioNumeroConta}>
                  <input className={inputClass(!!erros.domicilioNumeroConta)} value={form.domicilioNumeroConta} onChange={e => set('domicilioNumeroConta', e.target.value)} placeholder="464561-6" />
                </Campo>
              </div>

              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtro de unidades recebíveis</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={todasCredenciadoras} onChange={e => setTodasCredenciadoras(e.target.checked)} />
                  Todas as credenciadoras (99T)
                </label>
                {!todasCredenciadoras && (
                  <input className={inputClass()} value={credenciadorasRaw} onChange={e => setCredenciadorasRaw(e.target.value)} placeholder="CNPJs separados por vírgula" />
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={todosArranjos} onChange={e => setTodosArranjos(e.target.checked)} />
                  Todos os arranjos de pagamento (99T)
                </label>
                {!todosArranjos && (
                  <input className={inputClass()} value={arranjosRaw} onChange={e => setArranjosRaw(e.target.value)} placeholder="Códigos separados por vírgula" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Documento do usuário final recebedor (opcional)">
                  <input className={inputClass()} value={form.definicaoDocumentoUfr} onChange={e => set('definicaoDocumentoUfr', e.target.value)} />
                </Campo>
                <Campo label="Documento do titular (opcional)" erro={erros.definicaoDocumentoTitular}>
                  <input className={inputClass(!!erros.definicaoDocumentoTitular)} value={form.definicaoDocumentoTitular} onChange={e => set('definicaoDocumentoTitular', e.target.value)} />
                </Campo>
                <Campo label="Início da janela de liquidação" obrigatorio erro={erros.definicaoDataInicio}>
                  <input type="date" className={inputClass(!!erros.definicaoDataInicio)} value={form.definicaoDataInicio} onChange={e => set('definicaoDataInicio', e.target.value)} />
                </Campo>
                <Campo label="Fim da janela de liquidação" obrigatorio erro={erros.definicaoDataFim}>
                  <input type="date" className={inputClass(!!erros.definicaoDataFim)} value={form.definicaoDataFim} onChange={e => set('definicaoDataFim', e.target.value)} />
                </Campo>
              </div>
            </section>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={fechar} className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
              {isSubmitting ? 'Enviando...' : 'Criar contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
```

- [ ] **Step 2: Verificar compilação e lint**

Run: `npx tsc --noEmit && npx eslint src/components/NewContratoModal.tsx`
Expected: sem erros. (O componente ainda não é importado por ninguém — isso é normal até a Task 6.)

- [ ] **Step 3: Commit**

```bash
git add src/components/NewContratoModal.tsx
git commit -m "feat: NewContratoModal — formulario completo de criacao de contrato CERC (SPEC-02 §4)"
```

---

### Task 6: `ContratosCercModule.tsx` — listagem + navegação

**Files:**
- Create: `src/components/ContratosCercModule.tsx`
- Modify: `src/components/Sidebar.tsx` (import de ícone + 2 entradas de nav)
- Modify: `src/App.tsx` (import do módulo + 1 case + 1 entrada em `pageTitleMap`)

**Interfaces:**
- Consumes: `listContratos`, `ContratoDTO`, `ContratosApiError` de `contratosApi.ts`; `NewContratoModal` da Task 5
- Produces: componente `ContratosCercModule` (sem props) — usado por `App.tsx`. Expõe internamente um `<ContratoDetailModal>` que a Task 7 vai criar; por enquanto o clique na linha só abre um placeholder de `alert` removido no Step 4 da Task 7 (ver nota no Step 1 abaixo — o componente já reserva o estado `contratoSelecionadoId`, a Task 7 só precisa plugar o modal).

- [ ] **Step 1: Escrever `src/components/ContratosCercModule.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import { listContratos, type ContratoDTO } from '../services/contratosApi';
import { NewContratoModal } from './NewContratoModal';

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
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

function formatarValor(v: number | null): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export const ContratosCercModule: React.FC = () => {
  const [contratos, setContratos] = useState<ContratoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [contratoSelecionadoId, setContratoSelecionadoId] = useState<string | null>(null);

  const carregar = async () => {
    setIsLoading(true);
    try {
      const dados = await listContratos(statusFiltro ? { status: statusFiltro } : {});
      setContratos(dados);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
      showToast('error', 'Erro ao carregar contratos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFiltro]);

  const contratosFiltrados = contratos.filter(c =>
    !searchTerm ||
    c.referenciaExterna.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identificadorContrato.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro CERC</h1>
          <p className="text-sm text-gray-500">Contratos registrados via CERC-AP007 (SPEC-02)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={carregar} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button onClick={() => setIsNewModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm">
            <Plus className="w-4 h-4" /> Novo Contrato
          </button>
        </div>
      </div>

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
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setContratoSelecionadoId(c.id)}>
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

      <NewContratoModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={carregar}
      />

      {/* ContratoDetailModal plugado na Task 7 — usa contratoSelecionadoId/setContratoSelecionadoId(null) */}
    </div>
  );
};
```

- [ ] **Step 2: Adicionar entrada de navegação em `Sidebar.tsx`**

Adicionar `FileSignature` ao import de ícones (linha 2-17, junto de `FolderOpen`):

```tsx
import {
  ChevronDown,
  ChevronRight,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  FileText,
  CalendarDays,
  FolderOpen,
  FileSignature,
  ClipboardCheck,
  UserPlus,
  Settings,
  FileCode,
  Shield,
} from 'lucide-react';
```

Em `collapsedPrincipalItems` (linha ~99-103), adicionar a nova entrada logo após `contracts`:

```tsx
  const collapsedPrincipalItems: NavItem[] = [
    { id: 'partner-registration', label: 'Cadastro', icon: UserPlus },
    { id: 'schedule-view', label: 'Agendas', icon: CalendarDays },
    { id: 'contracts', label: 'Contratos', icon: FolderOpen },
    { id: 'contratos-cerc', label: 'Registro CERC', icon: FileSignature },
  ];
```

No bloco de navegação expandida (linha ~280-284), adicionar logo após o `renderSimple('contracts', ...)`:

```tsx
          <div className="space-y-1">
            {renderSimple('partner-registration', UserPlus, 'Cadastro')}
            {renderSimple('schedule-view', CalendarDays, 'Agendas')}
            {renderSimple('contracts', FolderOpen, 'Contratos')}
            {renderSimple('contratos-cerc', FileSignature, 'Registro CERC')}
          </div>
```

- [ ] **Step 3: Ligar a seção nova em `App.tsx`**

Adicionar o import logo após `import { OptInModule } from './components/OptInModule';` (linha 16):

```tsx
import { ContratosCercModule } from './components/ContratosCercModule';
```

Adicionar a entrada em `pageTitleMap` (linha 309, junto de `'contracts': 'Contratos',`):

```tsx
    'contracts': 'Contratos',
    'contratos-cerc': 'Registro CERC',
```

Adicionar o `case` no switch de `renderContent`, logo depois do bloco `case 'contracts':` (linhas 436-445):

```tsx
      case 'contracts':
        return (
          <ClientTable
            clients={appClients}
            showScheduleRequest={false}
            onClientClick={handleClientClick}
            onRadarClick={handleRadarClick}
            onEditClient={(client) => setEditingClient(client)}
          />
        );
      case 'contratos-cerc':
        return <ContratosCercModule />;
```

- [ ] **Step 4: Verificar compilação e lint**

Run: `npx tsc --noEmit && npx eslint src/components/ContratosCercModule.tsx src/components/Sidebar.tsx src/App.tsx`
Expected: sem erros novos (o projeto já tem 12 erros de lint pré-existentes em outros arquivos — não escopo desta task).

- [ ] **Step 5: Verificar visualmente no navegador**

Run: `pnpm dev` (worktree) e, em outro terminal, o backend rodando em `:8000` (ver Global Constraints).
Abrir `http://localhost:5173`, clicar em "Registro CERC" no menu — deve mostrar a tabela vazia (ou com contratos, se o backend já tiver algum do plano do backend) e o botão "Novo Contrato" deve abrir o formulário da Task 5.

- [ ] **Step 6: Commit**

```bash
git add src/components/ContratosCercModule.tsx src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: ContratosCercModule — listagem de contratos CERC + entrada de menu Registro CERC"
```

---

### Task 7: `ContratoDetailModal.tsx` — detalhe, inativar, baixar

**Files:**
- Create: `src/components/ContratoDetailModal.tsx`
- Modify: `src/components/ContratosCercModule.tsx` (plugar o modal no lugar do comentário deixado na Task 6)

**Interfaces:**
- Consumes: `getContrato`, `inativarContrato`, `baixarContrato`, `ContratoDetalheDTO`, `ContratosApiError` de `contratosApi.ts`; `ConfirmDialog` (já existe em `src/components/ConfirmDialog.tsx`)
- Produces: componente `ContratoDetailModal` com props `{ contratoId: string | null; onClose: () => void; onChanged: () => void }` — `onChanged` dispara o `carregar()` da lista (Task 6) depois de inativar/baixar.

- [ ] **Step 1: Escrever `src/components/ContratoDetailModal.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Ban, ArrowDownCircle } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import {
  getContrato,
  inativarContrato,
  baixarContrato,
  ContratosApiError,
  type ContratoDetalheDTO,
} from '../services/contratosApi';
import { ConfirmDialog } from './ConfirmDialog';

interface ContratoDetailModalProps {
  contratoId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

function formatarValor(v: number | null): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export const ContratoDetailModal: React.FC<ContratoDetailModalProps> = ({ contratoId, onClose, onChanged }) => {
  const [contrato, setContrato] = useState<ContratoDetalheDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmacao, setConfirmacao] = useState<'inativar' | 'baixar' | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  const carregar = async (id: string) => {
    setIsLoading(true);
    try {
      const dados = await getContrato(id);
      setContrato(dados);
    } catch (err) {
      console.error('Erro ao carregar detalhe do contrato:', err);
      showToast('error', 'Erro ao carregar detalhe do contrato');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contratoId) carregar(contratoId);
    else setContrato(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId]);

  if (!contratoId) return null;

  const executarOperacao = async (tipo: 'inativar' | 'baixar') => {
    if (!contrato) return;
    setIsProcessando(true);
    try {
      const resultado = tipo === 'inativar'
        ? await inativarContrato(contrato.referenciaExterna)
        : await baixarContrato(contrato.referenciaExterna);
      showToast('success', tipo === 'inativar' ? 'Inativação submetida' : 'Baixa submetida', `Status: ${resultado.status}`);
      onChanged();
      await carregar(contrato.id);
    } catch (err) {
      if (err instanceof ContratosApiError) {
        showToast('error', `Falha ao ${tipo}`, `${err.codigo}: ${err.message}`);
      } else {
        showToast('error', `Falha ao ${tipo} contrato`);
      }
    } finally {
      setIsProcessando(false);
    }
  };

  const podeOperar = contrato?.status === 'REGISTRADO';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Detalhe do contrato</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading && <p className="text-center text-gray-400 py-8">Carregando...</p>}

          {!isLoading && contrato && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Referência externa</p><p className="font-medium text-gray-900">{contrato.referenciaExterna}</p></div>
                <div><p className="text-gray-500">Identificador</p><p className="font-medium text-gray-900">{contrato.identificadorContrato}</p></div>
                <div><p className="text-gray-500">Status</p><p className="font-medium text-gray-900">{contrato.status}</p></div>
                <div><p className="text-gray-500">Protocolo CERC</p><p className="font-medium text-gray-900">{contrato.protocolo ?? '—'}</p></div>
                <div><p className="text-gray-500">Saldo devedor</p><p className="font-medium text-gray-900">{formatarValor(contrato.saldoDevedor)}</p></div>
                <div><p className="text-gray-500">Vencimento</p><p className="font-medium text-gray-900">{formatarData(contrato.dataVencimento)}</p></div>
                <div><p className="text-gray-500">Resultado da distribuição</p><p className="font-medium text-gray-900">{contrato.resultadoDistribuicao ?? '—'}</p></div>
                <div><p className="text-gray-500">Ind. sobrecolateral</p><p className="font-medium text-gray-900">{contrato.indSobrecolateral ?? '—'}</p></div>
              </div>

              {contrato.garantias.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Garantia</h3>
                  {contrato.garantias.map(g => (
                    <div key={g.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-500">Referência</p><p className="text-gray-900">{g.referenciaExterna}</p></div>
                        <div><p className="text-gray-500">Valor a onerar</p><p className="text-gray-900">{formatarValor(g.valorAOnerar)}</p></div>
                      </div>
                      {g.unidadesRecebiveisAlcancadas.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-gray-400 uppercase">
                              <tr>
                                <th className="text-left py-1">Credenciadora</th>
                                <th className="text-left py-1">Arranjo</th>
                                <th className="text-left py-1">Liquidação</th>
                                <th className="text-right py-1">Valor onerado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.unidadesRecebiveisAlcancadas.map((ur, i) => (
                                <tr key={i} className="border-t border-gray-50">
                                  <td className="py-1">{ur.cnpjCredenciadora}</td>
                                  <td className="py-1">{ur.codigoArranjoPagamento}</td>
                                  <td className="py-1">{formatarData(ur.dataLiquidacao)}</td>
                                  <td className="py-1 text-right">{formatarValor(ur.valorOnerado)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {contrato.indicadoresConsistencia.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Indicadores de consistência</h3>
                  <ul className="text-sm space-y-1">
                    {contrato.indicadoresConsistencia.map((ind, i) => (
                      <li key={i} className="flex justify-between border-b border-gray-50 py-1">
                        <span className="text-gray-600">{ind.indicador}</span>
                        <span className="text-gray-900">{ind.resultado ?? '—'} (criticidade {ind.criticidade ?? '—'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={!podeOperar || isProcessando}
                  onClick={() => setConfirmacao('inativar')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  <Ban className="w-4 h-4" /> Inativar
                </button>
                <button
                  type="button"
                  disabled={!podeOperar || isProcessando}
                  onClick={() => setConfirmacao('baixar')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  <ArrowDownCircle className="w-4 h-4" /> Baixar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmacao !== null}
        title={confirmacao === 'inativar' ? 'Inativar contrato?' : 'Baixar contrato?'}
        message={`Esta operação é submetida à CERC e não é imediata — o contrato entra em '${confirmacao === 'inativar' ? 'INATIVANDO' : 'BAIXANDO'}' até a confirmação por webhook.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="warning"
        onCancel={() => setConfirmacao(null)}
        onConfirm={() => confirmacao && executarOperacao(confirmacao)}
      />
    </div>,
    document.body,
  );
};
```

- [ ] **Step 2: Plugar o modal em `ContratosCercModule.tsx`**

Adicionar o import (junto de `NewContratoModal`):

```tsx
import { ContratoDetailModal } from './ContratoDetailModal';
```

Substituir o comentário `{/* ContratoDetailModal plugado na Task 7 ... */}` por:

```tsx
      <ContratoDetailModal
        contratoId={contratoSelecionadoId}
        onClose={() => setContratoSelecionadoId(null)}
        onChanged={carregar}
      />
```

- [ ] **Step 3: Verificar compilação e lint**

Run: `npx tsc --noEmit && npx eslint src/components/ContratoDetailModal.tsx src/components/ContratosCercModule.tsx`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContratoDetailModal.tsx src/components/ContratosCercModule.tsx
git commit -m "feat: ContratoDetailModal — detalhe, inativar e baixar contrato registrado"
```

---

### Task 8: Verificação manual de ponta a ponta

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Subir o backend**

```bash
cd C:\DEV\ap\ap-back-contratos\contratos
python manage.py runserver 8000
```

- [ ] **Step 2: Subir o front**

```bash
cd C:\DEV\ap\ap-front\.worktrees\contratos-cerc-integracao-front
pnpm dev
```

- [ ] **Step 3: Fluxo de criação com sucesso**

No navegador (`http://localhost:5173`), abrir "Registro CERC" → "Novo Contrato" → preencher com dados válidos (usar os do exemplo da SPEC-02 §4.5 como referência) → submeter. Esperado: toast de sucesso, contrato aparece na lista com status `AGUARDANDO_WEBHOOK` (a CERC de homologação real não está configurada neste ambiente — se `criarContrato` falhar com `502` por falta de credencial CERC, documentar isso como limitação conhecida do ambiente local, não como bug desta feature).

- [ ] **Step 4: Fluxo de erro de validação**

Tentar submeter com `regrasDivisao=2` e valor a onerar `120` — esperado: erro inline "percentual não pode exceder 100" no campo, sem chamada à API (`validarPayloadContrato` barra antes do `criarContrato`).

- [ ] **Step 5: Fluxo de detalhe**

Clicar numa linha da lista → modal de detalhe abre com os dados do contrato. Se o backend não tiver CERC configurada (Step 3), usar um contrato inserido diretamente via `inserir_contrato_criado` nos testes do backend como fallback pra verificar a UI de detalhe.

- [ ] **Step 6: Reportar resultado**

Documentar no PR/commit final quais dos passos acima passaram de fato (dependem de CERC de homologação estar acessível) e quais ficaram bloqueados por infraestrutura externa ao escopo desta feature.
