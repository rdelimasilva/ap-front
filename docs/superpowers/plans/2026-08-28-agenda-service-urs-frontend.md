# Integração de listagem de URs (agenda-service, Plano 10) com o front — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a tabela de URs 100% mockada em `ScheduleView.tsx` por dado real de `GET /api/v1/agendas/urs` (agenda-service, Plano 10), com paginação por cursor e nomes reais de credenciadora/arranjo (planilhas CERC).

**Architecture:** Um serviço de API novo (`agendaApi.ts`, padrão Bearer JWT igual `optinApi.ts`), um arquivo de dados de referência novo (`arranjosCerc.ts`, 47 códigos de arranjo → descrição) reaproveitando o `credenciadorasCerc.ts` já existente (não commitado, criado por outra sessão para o fluxo de opt-in — ver Global Constraints), e a reforma de `ScheduleView.tsx`: troca da geração síncrona mockada por fetch assíncrono + paginação, e um adaptador (`mapearUrExibicao`) que traduz `AgendaUrDTO` pro shape que a UI já usa, com os campos sem correspondência real resolvidos (nome de credenciadora/arranjo via lookup, status aproximado por heurística, "Referência Externa" removida por não ter fonte no backend, tipo crédito/débito removido por não ter fonte confiável).

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind, `fetch` nativo, hook `useToast` já existente.

**Spec:** `docs/superpowers/specs/2026-08-27-agenda-service-urs-integracao-frontend-design.md` (design completo, incluindo §2.1bis sobre os dados de referência CERC).

**Contexto de execução:** este plano roda **direto na working tree principal** (`C:\DEV\ap\ap-front`, branch `main`) — **sem worktree isolado**, ao contrário do padrão usual deste repo (`contratos-cerc-frontend.md` usa `.worktrees/`). Motivo: a working tree principal já tem `src/data/credenciadorasCerc.ts` (não commitado, 262 linhas) e `src/components/NewOptInModal.tsx` modificado (não commitado) de outra sessão de trabalho em andamento — um worktree novo, criado a partir do último commit, não teria acesso a esses arquivos não commitados. Este plano reaproveita `credenciadorasCerc.ts` e **não toca** em `NewOptInModal.tsx`.

## Global Constraints

- **Não editar `src/components/NewOptInModal.tsx`** — tem mudanças não commitadas de outra sessão de trabalho (seletor de arranjo/credenciadora pro fluxo de opt-in). Fora de escopo total deste plano.
- **Reaproveitar `src/data/credenciadorasCerc.ts` como já existe** (não commitado) — exporta `CREDENCIADORAS_CERC: CredenciadoraCerc[]` com `{ cnpj: string; nome: string; tipo: 'Credenciadora' | 'Subcredenciadora' }`. Não modificar este arquivo.
- **`src/data/arranjosCerc.ts` é novo** (não existe ainda) — mesmo estilo/formato do `credenciadorasCerc.ts` (interface + array), pra consistência. Vai duplicar os mesmos 47 códigos que já estão inline em `NewOptInModal.tsx` (`ARRANJOS_PAGAMENTO`, não exportado) — duplicação aceita conscientemente porque não podemos tocar naquele arquivo; consolidação (`NewOptInModal.tsx` passar a importar de `arranjosCerc.ts`) fica pra quando aquele outro trabalho for commitado.
- **JSON de erro do agenda-service:** `{"erro": "<CODIGO>", "mensagem": "<texto>"}` — mesmo shape que `optinApi.ts` já trata via `data?.erro`/`data?.mensagem`.
- **Valores monetários da API são `string`** (`Decimal` serializado, nunca `float`) — todo campo `AgendaUrDTO.valor*` é convertido com `Number(...)` no ponto de adaptação (`mapearUrExibicao`), nunca exibido cru.
- **Sem framework de teste automatizado neste projeto** — o "test" de cada task é `npx tsc --noEmit` (compilação limpa) + `npx eslint <arquivos da task>` (lint escopado às mudanças desta task — projeto já tem erros de lint pré-existentes em outros arquivos, não é escopo corrigi-los). Verificação end-to-end real é manual, na Task 4.
- **Backend precisa estar rodando** em `http://localhost:8000` (`python manage.py runserver 8000` em `ap-back-consulta-agenda`) pra qualquer verificação manual funcionar.
- **Campos sem fonte real, decisão já tomada (ver spec §2.1bis):** `referenciaExterna` (removida da seção Identificação do modal — backend não mapeia esse campo pra nenhuma coluna ainda, design doc do backend §14 item 5), `type` credito/débito (removido — sem fonte confiável, a descrição do arranjo já embute bandeira+modalidade numa string só), `status` bloqueado/disponível/liquidado (aproximado por heurística `valorBloqueado>0→bloqueado, valorLivre>0→disponível, senão→liquidado`, documentado como aproximação no código), "Informações de Pagamento" e "Eventos de Mutação" (continuam mockados, sem endpoint — `agenda_ur_pagamento`/`agenda_ur_evento`).

---

### Task 1: `src/data/arranjosCerc.ts` — domínio de arranjos de pagamento CERC

**Files:**
- Create: `src/data/arranjosCerc.ts`

**Interfaces:**
- Produces: `ArranjoCerc` (interface), `ARRANJOS_CERC: ArranjoCerc[]` — consumido pela Task 3.

- [ ] **Step 1: Escrever `src/data/arranjosCerc.ts`**

```typescript
// Domínio oficial de arranjos de pagamento da CERC.
// Fonte: "arranjos_pagamento_cerc.xlsx" (2026-08-28). Mesmo domínio que o
// backend do agenda-service documenta como pendente de seed (dominio_arranjo,
// design doc §15 risco 11) — usado aqui só como dado estático de exibição
// no front, sem depender do backend seedar aquela tabela.
//
// Nota: os mesmos 47 códigos existem hoje também inline em
// NewOptInModal.tsx (ARRANJOS_PAGAMENTO, não exportado) — duplicação
// temporária aceita porque aquele arquivo tinha mudanças não commitadas de
// outra sessão no momento em que este arquivo foi criado. Consolidar
// quando aquele trabalho for commitado.
export interface ArranjoCerc {
  codigo: string;
  descricao: string;
}

export const ARRANJOS_CERC: ArranjoCerc[] = [
  { codigo: 'BCD', descricao: 'Banescard Cartão de Débito' },
  { codigo: 'HCD', descricao: 'Hiper Débito' },
  { codigo: 'NUD', descricao: 'NuPay Débito' },
  { codigo: 'VCD', descricao: 'Visa Cartão de Débito' },
  { codigo: 'ACD', descricao: 'Amex Débito' },
  { codigo: 'CBD', descricao: 'Cabal Débito' },
  { codigo: 'SCD', descricao: 'Sorocred Cartão de Débito' },
  { codigo: 'ECD', descricao: 'Elo Cartão de Débito' },
  { codigo: 'BVV', descricao: 'Ben Visa Vale' },
  { codigo: 'MCD', descricao: 'Mastercard Cartão de Débito' },
  { codigo: 'OCD', descricao: 'Ourocard Cartão de Débito' },
  { codigo: 'SPC', descricao: 'Sem Parar' },
  { codigo: 'FRC', descricao: 'Fortbrasil' },
  { codigo: 'VCB', descricao: 'Visa Cartão Benefícios' },
  { codigo: 'CUP', descricao: 'Cup Crédito' },
  { codigo: 'ECC', descricao: 'Elo Cartão de Crédito' },
  { codigo: 'MXC', descricao: 'Maxifrota' },
  { codigo: 'VDC', descricao: 'Verdecard Cartão de Crédito' },
  { codigo: 'CSC', descricao: 'Credi-Shop' },
  { codigo: 'ECB', descricao: 'Elo Cartão Benefícios' },
  { codigo: 'CZC', descricao: 'CREDZ Crédito' },
  { codigo: 'JCC', descricao: 'JCB Cartão de Crédito' },
  { codigo: 'SCC', descricao: 'Sorocred Cartão de Crédito' },
  { codigo: 'NUC', descricao: 'NuPay Crédito' },
  { codigo: 'BCC', descricao: 'Banescard Cartão de Crédito' },
  { codigo: 'BRC', descricao: 'Brasil Card' },
  { codigo: 'GCC', descricao: 'Goodcard Crédito' },
  { codigo: 'DAC', descricao: 'Dacasa' },
  { codigo: 'SFC', descricao: 'Senff' },
  { codigo: 'CCD', descricao: 'Calcard' },
  { codigo: 'MAC', descricao: 'Mais!' },
  { codigo: 'BNC', descricao: 'Banese Card' },
  { codigo: 'HCC', descricao: 'Hipercard Cartão de Crédito' },
  { codigo: 'ALC', descricao: 'Alelo Credito Pós' },
  { codigo: 'MCB', descricao: 'Mastercard Cartão Benefícios' },
  { codigo: 'AUC', descricao: 'Aura' },
  { codigo: 'DCC', descricao: 'Liquidações de transações transfronteiriças Diners' },
  { codigo: 'AVC', descricao: 'Avista' },
  { codigo: 'RCC', descricao: 'Redesplan' },
  { codigo: 'CAC', descricao: 'Cielo Amex Crédito' },
  { codigo: 'VCC', descricao: 'Visa Cartão de Crédito' },
  { codigo: 'AGC', descricao: 'Agiplan' },
  { codigo: 'TKC', descricao: 'TicketLog Pós' },
  { codigo: 'CBC', descricao: 'Cabal Crédito' },
  { codigo: 'MCC', descricao: 'Mastercard Cartão de Crédito' },
  { codigo: 'ACC', descricao: 'Amex Cartão de Crédito' },
  { codigo: 'DBC', descricao: 'Discover' },
];
```

- [ ] **Step 2: Verificar compilação e lint**

Run: `npx tsc --noEmit && npx eslint src/data/arranjosCerc.ts`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/data/arranjosCerc.ts
git commit -m "feat: domínio de arranjos de pagamento CERC (agenda-service, Task 1)"
```

---

### Task 2: `src/services/agendaApi.ts` — serviço de API

**Files:**
- Create: `src/services/agendaApi.ts`
- Modify: `.env.example` (adicionar `VITE_AGENDA_API_BASE_URL`, `VITE_AGENDA_DEV_JWT`)
- Modify: `.env` (não versionado — necessário pra rodar localmente; se não existir ainda, criar)

**Interfaces:**
- Produces: `AgendaApiError`, `AgendaUrDTO`, `ListarUrsFiltros`, `ListarUrsResposta`, `listAgendaUrs` — consumidos pela Task 3.

- [ ] **Step 1: Adicionar env vars ao `.env.example`**

Ao final do arquivo:

```
# API do agenda-service (ap-back-consulta-agenda). JWT de desenvolvimento
# fixo — placeholder até existir login real; nunca usar em produção.
VITE_AGENDA_API_BASE_URL=http://localhost:8000/api/v1
VITE_AGENDA_DEV_JWT=
```

- [ ] **Step 2: Adicionar as mesmas variáveis ao `.env` local**

Se `.env` já existir (verificar antes — outras sessões podem já tê-lo criado com `VITE_OPTIN_*`), acrescentar ao final:

```
VITE_AGENDA_API_BASE_URL=http://localhost:8000/api/v1
VITE_AGENDA_DEV_JWT=<obter um JWT de dev válido para o agenda-service — mesmo IdP/chave RS256 que os outros dois serviços usam em dev>
```

Se `.env` não existir, criar com essas duas linhas mais o conteúdo básico de `.env.example` preenchido.

- [ ] **Step 3: Escrever `src/services/agendaApi.ts`**

```typescript
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
```

- [ ] **Step 4: Verificar compilação e lint**

Run: `npx tsc --noEmit && npx eslint src/services/agendaApi.ts`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/services/agendaApi.ts .env.example
git commit -m "feat: agendaApi.ts — serviço de API do agenda-service (Task 2)"
```

(`.env` não é versionado — não entra no commit.)

---

### Task 3: `ScheduleView.tsx` — dado real, adaptador, paginação e JSX

**Files:**
- Modify: `src/components/ScheduleView.tsx`

**Interfaces:**
- Consumes: `listAgendaUrs`, `AgendaUrDTO` (Task 2), `ARRANJOS_CERC` (Task 1), `CREDENCIADORAS_CERC` (já existe em `src/data/credenciadorasCerc.ts`).
- Produces: `UrExibicao` (interface local), `mapearUrExibicao`, `nomeCredenciadora`, `descricaoArranjo`, `statusDerivado`, `gerarInformacaoPagamentoMock`, `acquirerOptions`, `brandOptions`, `carregarMaisUrs`, `isLoadingUrs`, `proximoCursor` — todos usados na segunda metade desta mesma task (Steps 7-14, JSX).

- [ ] **Step 1: Atualizar imports no topo do arquivo**

Adicionar após a linha `import { showToast } from '../hooks/useToast';`:

```typescript
import { listAgendaUrs, type AgendaUrDTO } from '../services/agendaApi';
import { ARRANJOS_CERC } from '../data/arranjosCerc';
import { CREDENCIADORAS_CERC } from '../data/credenciadorasCerc';
```

- [ ] **Step 2: Substituir a interface `ClientUR` e `generateClientURs` pelo adaptador novo**

Remover por completo o bloco de `interface ClientUR { ... }` até o fim de `generateClientURs` (linhas 40-142 do arquivo original: a interface `ClientUR`, as constantes `UR_ACQUIRERS`/`UR_BRANDS`/`UR_ACQUIRER_CNPJS`/`TIPOS_INFORMACAO_PAGAMENTO`, e a função `generateClientURs`). Manter a interface `URPaymentInfo` (ainda usada pela seção mockada de pagamentos).

Substituir por:

```typescript
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

// MOCKADO — agenda_ur_pagamento não é exposto por nenhum endpoint do
// backend ainda (design doc §2.1bis do plano de integração). Gera uma
// única linha de "informação de pagamento" fabricada a partir de dados
// reais da UR, só pra a seção do modal não ficar vazia.
function gerarInformacaoPagamentoMock(ur: UrExibicao): URPaymentInfo[] {
  return [{
    numeroDocumentoTitularDomicilio: ur.titularUR,
    tipoConta: 'CC',
    ispb: '00000000',
    numeroConta: '—',
    valorAPagar: ur.valorTotalUR,
    dataLiquidacaoEfetiva: ur.status === 'liquidado' ? ur.settlementDate : undefined,
    valorLiquidacaoEfetiva: ur.status === 'liquidado' ? ur.valorTotalUR : undefined,
    tipoInformacaoPagamento: 'Mockado — endpoint agenda_ur_pagamento não disponível',
  }];
}
```

- [ ] **Step 3: Atualizar `generateURMutationEvents` pra usar `UrExibicao`**

Substituir a função inteira (linhas 150-192 do arquivo original) por:

```typescript
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
```

- [ ] **Step 4: Substituir o estado de filtro/seleção de UR**

Localizar (dentro de `ScheduleView`):

```typescript
  const [urAcquirerFilter, setUrAcquirerFilter] = useState('all');
  const [urBrandFilter, setUrBrandFilter] = useState('all');
  const [urTypeFilter, setUrTypeFilter] = useState<'all' | 'credito' | 'debito'>('all');
  const [urSettlementStart, setUrSettlementStart] = useState('');
  const [urSettlementEnd, setUrSettlementEnd] = useState('');
  const [urSettlementSort, setUrSettlementSort] = useState<'asc' | 'desc' | null>(null);
  const [selectedUR, setSelectedUR] = useState<ClientUR | null>(null);
```

Substituir por:

```typescript
  const [urAcquirerFilter, setUrAcquirerFilter] = useState('all');
  const [urBrandFilter, setUrBrandFilter] = useState('all');
  const [urSettlementStart, setUrSettlementStart] = useState('');
  const [urSettlementEnd, setUrSettlementEnd] = useState('');
  const [urSettlementSort, setUrSettlementSort] = useState<'asc' | 'desc' | null>(null);
  const [selectedUR, setSelectedUR] = useState<UrExibicao | null>(null);
  const [urs, setUrs] = useState<UrExibicao[]>([]);
  const [isLoadingUrs, setIsLoadingUrs] = useState(false);
  const [proximoCursor, setProximoCursor] = useState<number | null>(null);
```

(`urTypeFilter` removido — sem fonte de dado confiável pra crédito/débito, ver Global Constraints.)

- [ ] **Step 5: Substituir a geração de `clientURs` por fetch real + paginação**

Localizar:

```typescript
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
```

Substituir por:

```typescript
  useEffect(() => {
    if (!selectedClient) {
      setUrs([]);
      setProximoCursor(null);
      return;
    }
    setIsLoadingUrs(true);
    listAgendaUrs({ ufr: selectedClient.document, limit: 100 })
      .then((resposta) => {
        setUrs(resposta.urs.map(mapearUrExibicao));
        setProximoCursor(resposta.proximoCursor);
      })
      .catch(() => showToast('error', 'Erro ao carregar unidades recebíveis'))
      .finally(() => setIsLoadingUrs(false));
  }, [selectedClient]);

  function carregarMaisUrs() {
    if (!selectedClient || proximoCursor === null) return;
    setIsLoadingUrs(true);
    listAgendaUrs({ ufr: selectedClient.document, cursor: proximoCursor, limit: 100 })
      .then((resposta) => {
        setUrs((prev) => [...prev, ...resposta.urs.map(mapearUrExibicao)]);
        setProximoCursor(resposta.proximoCursor);
      })
      .catch(() => showToast('error', 'Erro ao carregar mais unidades recebíveis'))
      .finally(() => setIsLoadingUrs(false));
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
```

Note: `React` já é importado com `useState, useMemo` no topo do arquivo (linha 1) — adicionar `useEffect` a esse import:

```typescript
import React, { useState, useMemo, useEffect } from 'react';
```

- [ ] **Step 6: Atualizar a contagem de URs (usa `clientURs`, agora removido)**

Localizar:

```typescript
          <div className="text-sm text-gray-500 ml-auto pb-2.5">
            {filteredClientURs.length} de {clientURs.length} URs
          </div>
```

Substituir por:

```typescript
          <div className="text-sm text-gray-500 ml-auto pb-2.5">
            {filteredClientURs.length} de {urs.length} URs
          </div>
```

Continue no mesmo arquivo, sem commit intermediário — os steps abaixo terminam a migração da JSX que os Steps 1-6 deixaram pendente (o arquivo não compila entre um step e outro; só precisa compilar limpo ao final do Step 14).

- [ ] **Step 7: Remover o filtro "Tipo" e trocar as opções de "Credenciador"/"Bandeira" pelas listas dinâmicas**

Localizar o bloco (filtro "Credenciador" até o fim do filtro "Tipo"):

```typescript
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
```

Substituir por:

```typescript
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
```

- [ ] **Step 8: Remover a coluna "Tipo" da tabela e trocar `acquirer`/`brand` pelos campos reais**

Localizar o `<thead>`:

```typescript
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credenciador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
```

Substituir por:

```typescript
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credenciador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
```

Localizar o `<tbody>` (linha da tabela):

```typescript
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.acquirer}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.brand}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{ur.type === 'credito' ? 'Crédito' : 'Débito'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
```

Substituir por:

```typescript
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.credenciadora}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{ur.arranjoDescricao}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
```

- [ ] **Step 9: Adicionar loading e botão "Carregar mais" após a tabela**

Localizar:

```typescript
          {filteredClientURs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-1">Nenhuma UR encontrada</div>
              <div className="text-sm text-gray-400">Tente ajustar os filtros</div>
            </div>
          )}
        </div>
      </div>
```

Substituir por:

```typescript
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
```

- [ ] **Step 10: Atualizar o cabeçalho do modal de detalhe**

Localizar:

```typescript
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedUR.acquirer} · {selectedUR.brand}</h2>
                <p className="text-sm text-gray-600">
                  {selectedUR.type === 'credito' ? 'Crédito' : 'Débito'} — Liquidação em {new Date(selectedUR.settlementDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
```

Substituir por:

```typescript
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedUR.credenciadora} · {selectedUR.arranjoDescricao}</h2>
                <p className="text-sm text-gray-600">
                  Liquidação em {new Date(selectedUR.settlementDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
```

- [ ] **Step 11: Remover "Referência Externa" da seção Identificação**

Localizar:

```typescript
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Referência Externa</p>
                    <p className="text-sm text-gray-900 font-mono">{selectedUR.referenciaExterna}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Entidade Registradora</p>
```

Substituir por:

```typescript
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Entidade Registradora</p>
```

(Campo removido porque o backend não mapeia `referenciaExterna` pra nenhuma coluna ainda — design doc do backend §14 item 5, ver Global Constraints deste plano.)

- [ ] **Step 12: Trocar a lista de pagamentos mockada pela função nova**

Localizar:

```typescript
                  {selectedUR.listaInformacoesPagamento.map((info, index) => (
```

Substituir por:

```typescript
                  {gerarInformacaoPagamentoMock(selectedUR).map((info, index) => (
```

- [ ] **Step 13: Verificar compilação e lint (agora deve estar limpo)**

Run: `npx tsc --noEmit && npx eslint src/components/ScheduleView.tsx`
Expected: sem erros. Se `tsc` ainda reclamar de algum uso remanescente de `ClientUR`/`acquirer`/`brand`/`type`/`UR_ACQUIRERS`/`UR_BRANDS`/`urTypeFilter`/`listaInformacoesPagamento`, localizar e ajustar (pode haver mais um uso em `ScheduleModal.tsx` ou outro trecho de `ScheduleView.tsx` fora do que este plano previu — investigar e resolver seguindo os mesmos princípios das Global Constraints antes de prosseguir).

- [ ] **Step 14: Commit**

```bash
git add src/components/ScheduleView.tsx
git commit -m "feat: busca real de URs via agendaApi, adaptador de exibição e JSX (Task 3)"
```

---

### Task 4: Verificação manual end-to-end

**Files:** nenhum (só verificação).

- [ ] **Step 1: Garantir que o backend está rodando**

```bash
cd ../ap-back-consulta-agenda
python manage.py runserver 8000
```

- [ ] **Step 2: Preencher `VITE_AGENDA_DEV_JWT` no `.env` com um JWT de dev válido**

Sem isso, todas as chamadas retornam `401`. Ver Task 2 Step 2.

- [ ] **Step 3: Rodar o front**

```bash
npm run dev
```

- [ ] **Step 4: Roteiro de verificação manual**

1. Selecionar um cliente com URs reais no banco de dev do agenda-service (`documento` do cliente = `documento_ufr` de alguma linha em `agenda_ur`) → tabela carrega com dado real, sem erro no console. Coluna "Credenciador" mostra nome real (ex. "CIELO S.A.") quando o CNPJ está nas 262 credenciadoras conhecidas, senão mostra o CNPJ cru. Coluna "Bandeira" mostra descrição real (ex. "Visa Cartão de Crédito") quando o código está nos 47 arranjos conhecidos, senão mostra o código cru.
2. Cliente sem nenhuma UR → tabela vazia, sem erro, sem botão "Carregar mais".
3. Cliente com mais de 100 URs (se existir massa de teste com esse volume) → botão "Carregar mais" aparece; clicar carrega a próxima página e concatena sem duplicar linhas.
4. Backend fora do ar ou `VITE_AGENDA_DEV_JWT` inválido/vazio → toast de erro aparece, tela não quebra (sem tela branca).
5. Abrir detalhe de uma UR → Identificação (sem "Referência Externa") e Valores mostram dado real; "Informações de Pagamento" mostra a linha mockada com o aviso "Mockado — endpoint agenda_ur_pagamento não disponível"; "Eventos de Mutação" continua mockado (comportamento esperado, não é regressão).
6. Filtrar por "Credenciador"/"Bandeira" usando os dropdowns → só mostra as opções realmente presentes nas URs carregadas (não uma lista fixa de 4 nomes como antes).

- [ ] **Step 5: Commit final (se algo precisou de ajuste na verificação manual)**

```bash
git add -A
git commit -m "fix: ajustes pós-verificação manual (Task 4)"
```

Se nada precisou de ajuste, pular este commit.
