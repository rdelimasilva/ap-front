# Integração da jornada de Contratos (CERC-AP007/SPEC-02) com o front

> **Status:** pronta para implementação
> **Repos envolvidos:** `ap-front` (este repo, mudanças principais) + `ap-back-contratos` (2 endpoints de leitura novos)
> **Precedente:** mesmo padrão da integração de opt-in (`ap-back-optin` + `optinApi.ts` + `OptInModule.tsx`, branch `optin-plan-12-integracao-front`)

---

## 0. Contexto e por que isto não é "adaptar a tela de Contratos existente"

O `ap-front` já tem uma tela de "Contratos" (`NewContractModal.tsx`, `ContractTable.tsx`, `ContractDetail.tsx`, `ContractApprovalBoard.tsx`), mas é **100% mockada** e o modelo de dados (`Contract` em `src/types/index.ts`) é uma visão de negócio pós-registro (liquidação, chargeback, aprovação dupla, `acquirers`/`cardBrands` como listas simples) — não tem nenhum campo em comum com o contrato CERC-AP007 (garantias, domicílio de pagamento, filtro de unidades recebíveis, `tipoEfeito`, etc.). Ver comparação completa na discussão que precedeu este documento.

Por isso: **nova seção dedicada**, sem tocar na tela de "Contratos" mockada atual.

O backend (`ap-back-contratos`, SPEC-02) implementa hoje **apenas escrita**: `POST /api/v1/contratos/<financiador_id>` (criar), `.../inativar`, `.../baixar`, e o receptor de webhook. **Não existe nenhum endpoint de leitura** (`GET`/`consultar`) — o resultado real do registro chega por webhook e fica só no banco do backend. Este documento inclui a adição mínima de 2 endpoints `GET` para fechar esse loop.

---

## 1. Escopo

**Dentro do escopo:**
- Criar contrato (`tipoOperacao=C`) — formulário completo dos campos obrigatórios da SPEC-02 §4, uma garantia por contrato.
- Inativar (`tipoOperacao=I`) e Baixar (`tipoOperacao=B`) um contrato já `REGISTRADO`.
- Listar e ver detalhe dos contratos submetidos (via 2 endpoints `GET` novos no backend).
- Atualização de status **manual** (botão "Atualizar"), sem polling automático.

**Fora do escopo:**
- Atualizar contrato (`tipoOperacao=A`), simulação (`S`), resilição parcial/total (`P`/`R`).
- Múltiplas garantias por contrato.
- Qualquer mudança na tela de "Contratos" mockada existente.
- Polling/push automático de status.
- Reconciliação por arquivo AP013.

---

## 2. Backend (`ap-back-contratos`) — endpoints de leitura novos

### 2.1 `GET /api/v1/contratos/<financiador_id>`

Lista os contratos do financiador. Query params opcionais: `status`, `limit`.

```jsonc
// 200
{ "dados": [
  { "id": "...", "referenciaExterna": "...", "identificadorContrato": "...",
    "protocolo": "...", "status": "AGUARDANDO_WEBHOOK", "cnpjDetentor": "...",
    "saldoDevedor": 150000.00, "dataVencimento": "2027-08-15",
    "criadoEm": "2026-08-27T12:00:00Z" }
]}
```

Implementação: nova função `listar_contratos(financiador_id, status=None, limit=None)` em `apps/contratos/contrato_repository.py`, seguindo o mesmo padrão de `buscar_contrato_por_referencia` (`get_db(financiador_id).table("contrato").select("*")...`), ordenado por `enviado_em` desc. Nova view `listar_contratos` em `apps/contratos/views.py`, DTO em camelCase (mesma convenção do `criar_contrato`). Nova rota em `apps/contratos/urls.py`.

### 2.2 `GET /api/v1/contratos/<financiador_id>/<id>`

Detalhe de um contrato: linha de `contrato` + `garantias[]` (cada uma com `garantia_ur[]` alcançadas, quando existirem) + `indicador_consistencia[]`.

```jsonc
// 200
{ "id": "...", "referenciaExterna": "...", "status": "REGISTRADO", "protocolo": "...",
  /* ...campos de contrato... */
  "garantias": [{ "referenciaExterna": "...", "valorAOnerar": 180000.00,
    "unidadesRecebiveisAlcancadas": [ /* ... */ ] }],
  "indicadoresConsistencia": [ /* ... */ ]
}
// 404 se o id não existir para este financiador_id
```

Implementação: nova função `buscar_contrato_por_id_com_garantias(financiador_id, contrato_id)` em `contrato_repository.py`; nova view + rota.

### 2.3 Testes (backend)

- Lista vazia → `{"dados": []}`.
- Lista com filtro `?status=REGISTRADO`.
- Detalhe com garantias e URs alcançadas.
- Detalhe de id inexistente → `404`.
- Isolamento por tenant: contrato de um `financiador_id` não aparece/não é acessível pelo `GET` de outro `financiador_id`.

---

## 3. Frontend (`ap-front`)

### 3.1 `src/services/contratosApi.ts`

Mesmo padrão de `src/services/optinApi.ts` (classe de erro, `request<T>` genérico, `BASE_URL` de `VITE_API_BASE_URL`).

```ts
export class ContratosApiError extends Error { codigo: string; status: number; }

export interface ContratoDTO { id, referenciaExterna, identificadorContrato, protocolo, status,
  cnpjDetentor, saldoDevedor, dataVencimento, criadoEm, /* ... */ }

export interface CriarContratoPayload { /* espelha SPEC-02 §4.1, §4.2, §4.3, §4.4 —
  tipoOperacao fixo 'C' */ }

export function listContratos(filtros?: { status?: string; limit?: number }): Promise<ContratoDTO[]>;
export function getContrato(id: string): Promise<ContratoDTO>;
export function criarContrato(payload: CriarContratoPayload): Promise<ContratoDTO>;
export function inativarContrato(referenciaExterna: string): Promise<void>;
export function baixarContrato(referenciaExterna: string): Promise<void>;
```

`financiador_id` vem de uma nova env var `VITE_FINANCIADOR_ID` (valor `3813878500136`, o mesmo já embutido como claim no `VITE_OPTIN_DEV_JWT` atual) — adicionada em `.env` e `.env.example`. Preferido a decodificar o JWT no front: mais simples e explícito, sem acoplar ao formato do token.

### 3.2 `src/components/ContratosCercModule.tsx`

Tela de listagem — mesmo espírito de `OptInModule.tsx`: busca, filtro por status, tabela com badges de status (`AGUARDANDO_WEBHOOK`, `REGISTRADO`, `REJEITADO`, `REJEITADO_ESTRUTURAL`, `PENDENTE_CONCILIACAO`, `INATIVADO`, `BAIXADO` — cores mapeadas 1:1 com a máquina de estados da SPEC-02 §8), botão "Novo Contrato", botão "Atualizar" (recarrega a lista).

### 3.3 `src/components/NewContratoModal.tsx`

Nome novo (não colide com `NewContractModal.tsx` mockado existente). Formulário completo dos campos obrigatórios de SPEC-02 §4.1 (dados do contrato), §4.3 (domicílio de pagamento) e §4.4 (filtro da garantia, uma garantia por contrato). Validações de formato no front espelhando as regras C01-C20 aplicáveis à criação (documentos 11/14 dígitos, valores ≥ 0.01, `dataInicio >= hoje`, `dataFim >= dataInicio`, ISPB 8 dígitos, COMPE 3 dígitos, `regrasDivisao=2 → valorAOnerar <= 100`, etc.) — feedback antes de bater no `422` do backend. Em caso de `422` do backend (regra que passou pelo front mas não pelo backend, ou regra de negócio que só a CERC valida), mostrar `codigo` + `erro` num banner.

### 3.4 `src/components/ContratoDetailModal.tsx`

Detalhe: status, protocolo, dados do contrato, garantia, URs alcançadas (quando presentes), indicadores de consistência. Botões "Inativar"/"Baixar" habilitados só quando `status === 'REGISTRADO'`. Botão "Atualizar" (re-busca o detalhe — sem polling automático).

### 3.5 Navegação

`src/components/Sidebar.tsx`: nova entrada de topo `{ id: 'contratos-cerc', label: 'Registro CERC', icon: FileSignature }`.
`src/App.tsx`: novo `case 'contratos-cerc': return <ContratosCercModule />` + entrada em `pageTitleMap`. Não mexe nas seções `contracts`/`contracts-menu`/`contract-approval`/`contracts-monitoring` existentes.

---

## 4. Fluxo de dados

1. Usuário abre "Registro CERC" → `ContratosCercModule` monta → `listContratos()` → tabela.
2. "Novo Contrato" → `NewContratoModal` → validação local → `criarContrato(payload)` → `POST .../<financiador_id>`.
   - `202` → `{id, status: 'AGUARDANDO_WEBHOOK', protocolo}` → toast de sucesso, fecha modal, recarrega lista.
   - `422` → banner com `codigo` + `erro`, modal permanece aberto.
3. Clique numa linha → `ContratoDetailModal` → `getContrato(id)` → detalhe.
4. "Inativar"/"Baixar" → `POST .../<financiador_id>/{inativar,baixar}` com `{referenciaExterna}` → `202` (aceito, aguardando webhook) → toast, recarrega detalhe.
5. Status real (`REGISTRADO`/`REJEITADO`/etc.) só aparece depois que o webhook processar no backend — usuário clica "Atualizar" pra ver o estado mais recente.

---

## 5. Erros e estados

- Erros de rede/HTTP: `ContratosApiError` (mesmo padrão de `OptinApiError`), exibido via `showToast`/`useToast` já existentes no projeto.
- Estados de contrato exibidos como badge com cor (mapeamento 1:1 com SPEC-02 §8): `AGUARDANDO_WEBHOOK` (amarelo), `REGISTRADO` (verde), `REJEITADO`/`REJEITADO_ESTRUTURAL` (vermelho), `PENDENTE_CONCILIACAO` (laranja/alerta), `INATIVADO`/`BAIXADO` (cinza).

---

## 6. Teste

- **Backend:** `pytest` cobrindo os 2 endpoints novos (ver §2.3).
- **Frontend:** projeto não tem framework de teste configurado (`package.json` sem `vitest`/`jest`) — verificação manual: `pnpm dev`, criar um contrato de ponta a ponta (form → 202 → aparece na lista → detalhe → inativar/baixar quando aplicável), incluindo o caminho de erro (`422`).

---

## 7. Decisões e riscos aceitos

- Sem polling automático de status — YAGNI por agora; se virar necessidade real, é um `setInterval` isolado dentro de `ContratoDetailModal`, não um redesenho.
- `financiador_id` fixo via env var (não multi-financiador na UI) — consistente com o dev JWT atual, que já carrega um único financiador.
- Formulário de criação cobre só os campos **obrigatórios** da SPEC-02 §4 (não os opcionais `taxaJuros`, `indexador`, `aceiteIncondicional`, `tipoAvaliacao`) — pode crescer depois sem mudar a arquitetura.
