# Integração de listagem de URs (agenda-service, Plano 10) com o front

> **Status:** pronta para implementação
> **Repos envolvidos:** `ap-front` (este repo, único a mudar) + `ap-back-consulta-agenda` (backend já pronto — `GET /api/v1/agendas/urs`, Plano 10, merged em `master`)
> **Precedente:** mesmo padrão de service layer do `optinApi.ts` (Bearer JWT via env var) + mesmo padrão de fetch/loading/erro do `ContratosCercModule.tsx`/`OptInModule.tsx` (useEffect + useState + `useToast`, sem hook de dados dedicado)

---

## 0. Contexto e escopo desta sub-integração

O agenda-service (`ap-back-consulta-agenda`) ganhou recentemente três endpoints de leitura novos (Plano 10, design doc §16 desse repo): `GET /api/v1/agendas/urs` (repositório consolidado de URs, paginado por cursor), `GET /api/v1/agendas/urs/posicao` (visão agregada de crédito) e `GET /api/v1/compliance/relatorio` (trilha de compliance). Os três são independentes o suficiente pra virar sub-integrações separadas — este documento cobre **só o primeiro** (`GET /agendas/urs`), que substitui a tabela/modal de detalhe de URs hoje 100% mockada em `ScheduleView.tsx`/`ScheduleModal.tsx`. `/urs/posicao` (cards de posição de crédito) e `/compliance/relatorio` (tela nova) ficam para documentos de design próprios, quando chegar a vez.

**Dentro do escopo:**
- Novo `src/services/agendaApi.ts` — service layer com `listAgendaUrs`.
- Trocar `generateClientURs(selectedClient.id, selectedClient.document)` (mock, `ScheduleView.tsx`) por uma chamada real a `GET /agendas/urs?ufr=<selectedClient.document>`.
- Paginação por cursor com botão "Carregar mais" — primeiro caso desse padrão no app (hoje nenhuma tela pagina; todas buscam tudo de uma vez com `limit`).
- Loading/erro seguindo o padrão já estabelecido (`useToast`, sem spinner dedicado).
- Seções "Identificação" e "Valores" do modal de detalhe (`ScheduleView.tsx:830-1000`) passam a usar dado real.

**Fora do escopo (débito conhecido, documentado inline no código):**
- `GET /agendas/urs/posicao` (cards "Bloqueado/Disponível/Liquidado Hoje/Total a Liquidar") — continuam 100% mockados, sub-integração futura.
- `GET /compliance/relatorio` — tela nova, fora deste documento.
- Seção "Informações de Pagamento" do modal de detalhe — depende de `agenda_ur_pagamento`, que nenhum endpoint do backend expõe hoje (só as colunas de `agenda_ur` saem por `/agendas/urs`). Continua mockada.
- Seção "Eventos de Mutação" do modal de detalhe — depende de `agenda_ur_evento`, mesma situação. Continua mockada.
- Converter os filtros client-side existentes (`urAcquirerFilter`, `urBrandFilter` etc.) em query params server-side — por ora eles continuam filtrando só as URs já carregadas na página atual, não o conjunto completo no backend. Ver §3.3.

---

## 1. `src/services/agendaApi.ts` (novo arquivo)

Segue exatamente o padrão de `optinApi.ts` (Bearer JWT fixo via env, não o padrão sem-auth de `contratosApi.ts`) — o agenda-service exige `@jwt_required` em todos os endpoints, mesmo os de leitura.

### 1.1 Env vars novas (`.env.example` e `.env`)

```
# API do agenda-service (ap-back-consulta-agenda). JWT de desenvolvimento
# fixo — placeholder até existir login real; nunca usar em produção.
VITE_AGENDA_API_BASE_URL=http://localhost:8000/api/v1
VITE_AGENDA_DEV_JWT=
```

Não existe `VITE_AGENDA_FINANCIADOR_ID` — diferente de `contratosApi.ts`, o agenda-service deriva `financiador_id` do próprio JWT (claim), nunca de um parâmetro de URL/query (design doc do backend, Global Constraints do Plano 09).

### 1.2 Tipos

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
  dataLiquidacao: string;              // AAAA-MM-DD
  constituicao: '1' | '2';             // 1 = constituída, 2 = fumaça (a constituir)
  valorConstituidoTotal: string;       // Decimal serializado como string — nunca number, ver §1.3
  valorConstituidoAntecipacaoPre: string;
  valorBloqueado: string;
  valorLivre: string;
  valorTotalUR: string;
  carteira: string | null;
  dataHoraUltimaAtualizacao: string;   // ISO datetime
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
```

### 1.3 Por que valores monetários são `string`, não `number`

O agenda-service serializa `NUMERIC(18,2)` do Postgres como `Decimal`, e o encoder JSON padrão do Django transforma `Decimal` em string (`"150.00"`) — nunca `float` — pra não perder precisão em campo monetário (é um requisito de compliance da SPEC03 do backend). Isso é diferente de `contratosApi.ts`/`optinApi.ts`, cujos backends devolvem `number` direto.

Toda `formatCurrency` já existente neste app (uma por componente, todas locais) espera `number`. Consumir `AgendaUrDTO` significa converter no ponto de uso: `formatCurrency(Number(ur.valorTotalUR))`. Não introduzir uma lib de decimal (`big.js` etc.) — nenhuma parte deste app usa isso hoje, e valores em BRL com 2 casas decimais não estouram a precisão seguininte de `Number` em nenhum cenário realista de UI (a preocupação do backend é auditoria/persistência exata no banco, não a exibição).

### 1.4 Função

```typescript
const BASE_URL = import.meta.env.VITE_AGENDA_API_BASE_URL as string;
const DEV_JWT = import.meta.env.VITE_AGENDA_DEV_JWT as string;

// request()/buildQuery() — cópia estrutural de optinApi.ts (Bearer header,
// tratamento de erro {erro, mensagem}, sem Idempotency-Key — GET não precisa)

export function listAgendaUrs(filtros: ListarUrsFiltros = {}): Promise<ListarUrsResposta> {
  return request<ListarUrsResposta>('GET', `/agendas/urs${buildQuery(filtros)}`);
}
```

Erro do agenda-service já é `{"erro": "<CODIGO>", "mensagem": "<texto>"}` — mesmo shape que `optinApi.ts` já trata (`data?.erro`, `data?.mensagem`), `request()` não precisa de nenhuma lógica nova de parsing de erro.

---

## 2. `ScheduleView.tsx` — troca do mock pelo dado real

### 2.1 Estado novo (substitui a geração síncrona de `ClientUR[]`)

```typescript
const [urs, setUrs] = useState<AgendaUrDTO[]>([]);
const [isLoadingUrs, setIsLoadingUrs] = useState(false);
const [proximoCursor, setProximoCursor] = useState<number | null>(null);
```

A interface `ClientUR` e a função `generateClientURs` (`ScheduleView.tsx:40-63`, `83-142`) são removidas — os componentes que hoje leem campos de `ClientUR` passam a ler os campos equivalentes de `AgendaUrDTO` diretamente (nomes já batem: `constituicao`, `valorConstituidoTotal`, `valorBloqueado`, `valorLivre`, `valorTotalUR`, `dataHoraUltimaAtualizacao`).

### 2.2 Busca inicial e paginação

```typescript
useEffect(() => {
  if (!selectedClient) return;
  setIsLoadingUrs(true);
  listAgendaUrs({ ufr: selectedClient.document, limit: 100 })
    .then(resposta => {
      setUrs(resposta.urs);
      setProximoCursor(resposta.proximoCursor);
    })
    .catch(() => showToast('error', 'Erro ao carregar unidades recebíveis'))
    .finally(() => setIsLoadingUrs(false));
}, [selectedClient]);

function carregarMaisUrs() {
  if (!selectedClient || proximoCursor === null) return;
  setIsLoadingUrs(true);
  listAgendaUrs({ ufr: selectedClient.document, cursor: proximoCursor, limit: 100 })
    .then(resposta => {
      setUrs(prev => [...prev, ...resposta.urs]);
      setProximoCursor(resposta.proximoCursor);
    })
    .catch(() => showToast('error', 'Erro ao carregar mais unidades recebíveis'))
    .finally(() => setIsLoadingUrs(false));
}
```

Botão "Carregar mais" visível só quando `proximoCursor !== null`, desabilitado enquanto `isLoadingUrs`. `limit: 100` é um valor de partida razoável (não medido) — revisar se o volume real por cliente pedir ajuste.

### 2.3 Filtros existentes continuam client-side (débito documentado)

`urAcquirerFilter`, `urBrandFilter` e os demais filtros hoje aplicados em memória sobre o array mockado (`ScheduleView.tsx:224-229`) continuam do mesmo jeito — filtram só o que já está em `urs` (as páginas já carregadas), não disparam nova busca ao backend. Isso é uma limitação real quando o cliente tem mais URs do que cabe numa página e o filtro teria batido em algo além da página atual — aceito conscientemente para não misturar "introduzir paginação" com "converter filtros pra server-side" no mesmo corte de trabalho. Comentário no código apontando essa limitação e como resolver (mover os filtros pros query params de `listAgendaUrs`, refazer a busca a cada mudança de filtro) quando isso se tornar um problema real.

---

## 3. Modal de detalhe da UR (`ScheduleView.tsx:830-1000`)

| Seção | Fonte |
|---|---|
| Identificação (UFR, titular, credenciadora, arranjo, data de liquidação, constituição) | Real — `AgendaUrDTO` |
| Valores (constituído total, bloqueado, livre, total UR, antecipação pré) | Real — `AgendaUrDTO` |
| Última atualização / origem | Real — `AgendaUrDTO` |
| Informações de Pagamento (efeitos de liquidação por linha) | **Mockado** — sem endpoint (`agenda_ur_pagamento` não é exposto) |
| Eventos de Mutação (Captura/Bloqueio/Disponibilização/Liquidação) | **Mockado** — sem endpoint (`agenda_ur_evento` não é exposto) |

As duas seções mockadas ganham um comentário no código apontando a tabela do backend que falta expor (`agenda_ur_pagamento`, `agenda_ur_evento`) — mesma prática de documentar débito já usada no design doc de contratos deste repo.

---

## 4. Testes

Este repo não tem suíte de testes automatizados configurada para componentes React (confirmado: nenhum `*.test.tsx`/framework de teste em `package.json`) — validação é manual via `npm run dev`, mesma prática já usada nas integrações de contratos/optin. Plano de verificação manual (a incluir no plano de implementação):
1. Selecionar um cliente com URs reais no banco de dev do agenda-service → tabela carrega com dado real, sem erro no console.
2. Cliente sem nenhuma UR → tabela vazia, sem erro, sem botão "Carregar mais".
3. Cliente com mais de 100 URs (se existir massa de teste com esse volume; senão, testar com `limit` menor via ajuste temporário) → botão "Carregar mais" aparece, clicar carrega a próxima página e concatena sem duplicar.
4. Backend fora do ar / JWT inválido → toast de erro aparece, tela não quebra.
5. Abrir detalhe de uma UR → Identificação/Valores mostram dado real; Pagamentos/Eventos continuam mockados (comportamento esperado, não é regressão).
