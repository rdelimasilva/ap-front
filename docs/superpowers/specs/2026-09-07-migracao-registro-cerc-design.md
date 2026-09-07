# Migração da jornada "Registro CERC" para Agendas e Contratos

> **Status:** pronta para implementação
> **Repos envolvidos:** `ap-front` (mudanças principais) + `ap-back-contratos` (1 filtro novo, 1 endpoint novo, 1 índice)
> **Fora do escopo, mas urgente:** ver §10 — rotas de leitura de contratos sem autenticação em produção
> **Antecedente:** `docs/superpowers/specs/2026-08-27-contratos-cerc-integracao-frontend-design.md`, que criou a seção autônoma agora sendo migrada.

---

## 0. Contexto

A integração de contratos CERC-AP007 entrou no front como uma seção autônoma no menu PRINCIPAL — `Sidebar.tsx:286` (`contratos-cerc`) → `App.tsx:448` → `ContratosCercModule.tsx`. Ela é a única jornada do front que fala com um backend real de contratos; as demais jornadas de operação são mocks.

O problema é de posicionamento. Registrar um contrato de garantia sobre recebíveis é a operação que o produto chama de **trava**, e o usuário chega nela por dois caminhos naturais que hoje não levam a lugar nenhum de verdade:

1. **Agendas → Ver Radar do cliente → Nova Trava**, onde ele acabou de olhar as URs que quer onerar.
2. **Contratos → cliente**, onde ele quer ver e gerir o que já foi registrado para aquele cliente.

Esta spec move a jornada para esses dois pontos e retira o item do menu.

---

## 1. Decisões tomadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Como a jornada CERC se encaixa no seletor de "Nova Trava" | O card **"Garantias"** passa a abrir a jornada CERC real. Os outros 5 cards continuam mockados. |
| 2 | Destino do item de menu "Registro CERC" | **Sai do menu de vez.** A tabela global deixa de existir; contratos passam a ser vistos por cliente. |
| 3 | Escopo dos logs por cliente | **Timeline por contrato + diagnóstico técnico** — eventos de `contrato_evento` mais as requisições HTTP de `cerc_requisicao`. |
| 4 | Abordagem de implementação | **Extração em componentes reusáveis** (jornada e lista), montados nos dois destinos. |

### Assunções fixadas

1. **O cliente de um contrato é o `documento_contratante`.** É quem contrata a operação e oferece as URs em garantia; `cnpj_detentor` é o financiador. Caso apareça o cenário em que contratante e usuário final recebedor diferem, o filtro vira um OR com `garantia.documento_usuario_final_recebedor` e o índice muda — mudança localizada no backend.
2. **A `GuaranteesJourney` mockada fica órfã, sem ser removida.** Perde o acesso pelo seletor de Agendas, e continua alcançável por outros pontos do `App`. Remoção fica para uma limpeza posterior.

---

## 2. Escopo

**Dentro:**
- Extrair a jornada de criação de contrato e a lista de contratos do `ContratosCercModule` para componentes com contexto opcional.
- Montar a jornada no card "Garantias" do `OperationSelectorModal` do radar, com pré-preenchimento derivado das URs filtradas em tela.
- Montar lista + criação + gestão numa seção nova do `ClientDetail`.
- Aba de histórico no `ContratoDetailModal`, com eventos e diagnóstico técnico.
- Remover `contratos-cerc` do `Sidebar` e do `App`.
- Backend: filtro `documentoContratante` na listagem, endpoint de eventos protegido por JWT, índice de suporte.
- Envio de `Authorization: Bearer` no `contratosApi.ts`, hoje ausente (§3.3).
- Corrigir o acesso a `client.cnpj` no `ScheduleView` (ver §7).

**Fora:**
- Alterar as outras 5 jornadas mockadas do seletor.
- Remover a `GuaranteesJourney`.
- Log agregado por cliente atravessando optin/agenda/contratos.
- Operações CERC ainda não implementadas no backend (`A`, `S`, `P`, `R`).
- Múltiplas garantias por contrato.
- Polling automático de status.

---

## 3. Backend (`ap-back-contratos`)

### 3.1 Filtro por contratante na listagem

`GET /api/v1/contratos/<financiador_id>` ganha o query param opcional `documentoContratante`, combinável com os já existentes `status` e `limit`. Sem o param, o comportamento atual permanece.

Índice de suporte em `sql/schema/` — hoje só existem `(cnpj_participante, status)` e `(status)`:

```sql
CREATE INDEX ON contrato (cnpj_participante, documento_contratante);
```

### 3.2 Endpoint de eventos

```
GET /api/v1/contratos/<financiador_id>/<contrato_id>/eventos
```

Rota nova em `apps/contratos/urls.py`, no mesmo padrão de `detalhar_contrato`:

```python
re_path(r"^contratos/(?P<financiador_id>\d{14})/(?P<contrato_id>[0-9a-f-]{36})/eventos$", views.eventos_contrato),
```

Resposta:

```jsonc
{ "dados": [
  { "tipo": "rejeicao_estrutural",
    "ocorridoEm": "2026-09-05T14:02:11Z",
    "payload": { "erros": [ { "codigo": "...", "mensagem": "..." } ] },
    "requisicoes": [
      { "recurso": "/contratos", "httpStatus": 422, "tentativa": 1,
        "requestBody": { }, "responseBody": { }, "criadoEm": "2026-09-05T14:02:10Z" }
    ] }
]}
```

Ordenação cronológica ascendente por `ocorrido_em`.

**Fontes e correlação.** Os eventos vêm de `contrato_evento` (populado hoje em `views.py:338` — `ContratoSubgarantido`, `:355` — `webhook_recebido`, e `:629` — `rejeicao_estrutural`). As requisições vêm de `cerc_requisicao`, correlacionadas pelo `correlacao_id`, que é gravado como `referencia_externa` na criação (`views.py:579`) e como `{referencia_externa}:{tipo_operacao}` nas operações pós-registro (`views.py:710`). A consulta filtra `correlacao_id IN (ref, ref:I, ref:B)` para o contrato em questão, e cada requisição é anexada ao evento imediatamente anterior a ela no tempo; requisições sem evento correspondente aparecem como entradas próprias de tipo `requisicao_cerc`, para que uma falha de rede sem evento de domínio continue visível.

### 3.3 Autenticação — o endpoint novo nasce protegido

`request_body` e `response_body` de `cerc_requisicao` carregam o domicílio de pagamento: ISPB, agência e número da conta. Isso é material que não pode ser servido sem autenticação.

As rotas de leitura de contratos hoje **não têm** `jwt_required` (`views.py:456` e `:509` só têm `@require_GET`), e o `contratosApi.ts` não envia header `Authorization`. Verificado contra o ambiente real em 2026-09-07:

```
GET https://contratos-service-...run.app/api/v1/contratos/38138785000136?limit=1  →  200 sem auth
```

Portanto:

- O endpoint de eventos nasce com `@jwt_required` (mesmo decorador de `shared/jwt_auth.py` que o agenda-service usa), lendo o `financiador_id` do claim e recusando quando ele diverge do da URL.
- `contratosApi.ts` passa a enviar `Authorization: Bearer` no `request()`, alinhado ao que o `agendaApi.ts:60` já faz.

**Proteger as rotas de leitura já existentes fica fora desta spec** e está registrado como pendência em §10. Com o Bearer já sendo enviado por `contratosApi.ts` depois desta mudança, adicionar `@jwt_required` a elas passa a ser uma alteração de uma linha por rota.

---

## 4. Front — componentes extraídos

O `ContratosCercModule` (175 linhas) se dissolve em duas peças. Nenhuma lógica de negócio muda de comportamento; muda quem a monta.

### 4.1 `CercGarantiaJourney`

```ts
interface CercGarantiaJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contexto?: ContextoTrava;
}

interface ContextoTrava {
  documentoContratante?: string;
  documentoUsuarioFinalRecebedor?: string;
  listaCnpjCredenciadora?: string[];
  listaCodigoArranjoPagamento?: string[];
  dataInicio?: string;
  dataFim?: string;
}
```

Envolve o `NewContratoModal.tsx` já existente (459 linhas, formulário completo da SPEC-02), acrescentando a ele uma prop `contextoInicial?: ContextoTrava` que semeia o `ESTADO_INICIAL` (`NewContratoModal.tsx:59`). Campos semeados continuam editáveis, e o formulário reseta ao contexto a cada abertura.

**Valores monetários não são pré-preenchidos.** `saldoDevedor`, `limiteOperacaoGarantida`, `valorMantido` e `valorAOnerar` seguem em branco mesmo quando o radar tem totais em tela: derivar automaticamente o valor de uma trava a partir de um filtro visual é o tipo de conveniência que produz oneração indevida.

### 4.2 `ContratosCercList`

```ts
interface ContratosCercListProps {
  documentoContratante?: string;
  mostrarCabecalho?: boolean;
  onNovoContrato?: () => void;
}
```

É a tabela atual (`ContratosCercModule.tsx:125-160`), com os mapas `STATUS_LABEL`/`STATUS_COLOR` e os formatadores movidos junto. Com `documentoContratante` preenchido, chama `listContratos({ documentoContratante })`; a busca por texto e o filtro de status continuam client-side como hoje. `mostrarCabecalho={false}` suprime título e subtítulo quando embutida numa seção que já tem cabeçalho próprio.

`contratosApi.ts:186` passa a aceitar o novo filtro:

```ts
export function listContratos(
  filtros: { status?: string; limit?: number; documentoContratante?: string } = {},
): Promise<ContratoDTO[]>
```

E ganha:

```ts
export function getEventosContrato(id: string): Promise<EventoContratoDTO[]>
```

---

## 5. Montagem nos destinos

### 5.1 Agendas → Ver Radar → Nova Trava → Garantias

Em `ScheduleView.tsx`, o despacho do seletor (`:1003` no radar e `:1047` na lista) troca `setIsGuaranteesOpen(true)` por `setIsCercGarantiaOpen(true)` no ramo `guarantees`. A `GuaranteesJourney` sai do JSX do `ScheduleView`; o `CercGarantiaJourney` entra no lugar.

**Contexto derivado do radar.** Montado a partir de `filteredClientURs` (`ScheduleView.tsx:416`), que já reflete os filtros de credenciadora, arranjo e janela aplicados na tela:

| Campo do contexto | Origem |
|---|---|
| `documentoContratante` | `selectedClient.document` |
| `documentoUsuarioFinalRecebedor` | `documentoUsuarioFinalRecebedor` das URs filtradas, quando único |
| `listaCnpjCredenciadora` | `cnpjCredenciadora` distintos das URs filtradas |
| `listaCodigoArranjoPagamento` | `codigoArranjo` distintos das URs filtradas |
| `dataInicio` / `dataFim` | menor e maior `settlementDate` das URs filtradas |

Os campos brutos existem em `UrExibicao` (`ScheduleView.tsx:43-63`); os filtros do radar guardam rótulos legíveis (`ur.credenciadora`, `ur.arranjoDescricao`), então a derivação lê as URs, e não o estado dos filtros.

Com `filteredClientURs` vazio, o contexto leva apenas `documentoContratante` e o formulário abre no estado padrão.

No ramo da lista de clientes (`:1047`), onde não há cliente nem URs em contexto, a jornada abre sem `contexto`.

### 5.2 Contratos → cliente → seção "Contratos CERC"

`ClientDetail.tsx` já organiza o conteúdo em seções colapsáveis controladas por `collapsedSections` (`:38`) — "Informações do Cliente", "Volumes por Credenciadora", "Contratos de Recebíveis", "Histórico de Valores". A seção nova entra com a chave `cerc-contracts`, logo após "Contratos de Recebíveis", contendo:

- `<ContratosCercList documentoContratante={client.document} mostrarCabecalho={false} onNovoContrato={...} />`
- Botão "Novo contrato CERC" no cabeçalho da seção, abrindo `CercGarantiaJourney` com `contexto={{ documentoContratante: client.document }}`.
- Clique na linha abre o `ContratoDetailModal`, de onde saem inativação e baixa — a gestão pedida, já implementada e agora acessível a partir do cliente.

A seção "Contratos de Recebíveis" mockada permanece intocada, conforme o antecedente desta spec.

### 5.3 Aba de histórico no `ContratoDetailModal`

O modal (199 linhas) ganha duas abas: **Detalhe** (todo o conteúdo atual) e **Histórico**.

A aba Histórico chama `getEventosContrato(contratoId)` na primeira vez que é aberta e renderiza uma timeline vertical. Cada entrada mostra tipo traduzido, data-hora e resumo. Para `rejeicao_estrutural`, o resumo lista os códigos e mensagens de erro devolvidos pela CERC — hoje visíveis só no toast do momento da submissão.

Cada entrada com requisições correlacionadas traz um bloco recolhido "Detalhe técnico" com recurso, status HTTP, tentativa e os corpos de request/response em `<pre>`.

### 5.4 Remoção do menu

- `Sidebar.tsx:104` — remover a entrada de `collapsedPrincipalItems`.
- `Sidebar.tsx:286` — remover o `renderSimple('contratos-cerc', ...)`.
- `Sidebar.tsx:12` — remover o import de `FileSignature`, que fica sem uso.
- `App.tsx:448` — remover o `case 'contratos-cerc'` e o import do `ContratosCercModule`.
- `App.tsx:311` — remover o rótulo `'contratos-cerc': 'Registro CERC'` do mapa de breadcrumb.

---

## 6. Estados e erros

Comportamento herdado, sem invenção: erros de API sobem como `ContratosApiError` e viram toast (`showToast('error', ...)`), no mesmo padrão de `ContratosCercModule.tsx:73`. A lista tem estados de carregando e vazio próprios. A criação continua devolvendo 202 com status `AGUARDANDO_WEBHOOK`, ou 422 com `REJEITADO_ESTRUTURAL` e a lista de erros.

Duas situações novas:

- **Aba Histórico sem eventos** — contrato recém-criado cujo webhook ainda não chegou. Mostra "Nenhum evento registrado ainda", com a observação de que a confirmação da CERC chega por webhook.
- **Falha ao carregar eventos** — a aba mostra o erro e um botão de tentar de novo, deixando a aba Detalhe utilizável.

---

## 7. Correção pontual no caminho

`ScheduleView.tsx:1159` e `:1200` leem `client.cnpj`, propriedade que não existe em `Client` (`src/types/index.ts:1-14`). O campo real é `document`, populado pelo `DataContext` a partir do optin-service (`DataContext.tsx:18`). O `tsc` acusa os dois acessos (`error TS2339: Property 'cnpj' does not exist on type 'Client'`), e passaram despercebidos porque `npm run build` roda `vite build` sem typecheck.

Efeito hoje: a coluna CNPJ da tabela de clientes em Agendas renderiza vazio, e o `client_document` passado ao modal de opt-in vai `undefined`.

Está no caminho porque o pré-preenchimento de `documentoContratante` depende exatamente desse campo. As duas linhas passam a usar `client.document`. `client.segment` (`:1154`) tem o mesmo defeito e é corrigido junto, exibindo vazio de forma explícita, já que `Client` não tem equivalente.

O projeto tem 102 erros de `tsc` pré-existentes. Corrigir os demais fica fora desta spec.

---

## 8. Testes

O front não tem suíte de testes automatizados hoje, e esta spec não introduz uma. A verificação é:

**Backend** — testes no padrão dos existentes em `apps/contratos/tests/`. A suíte do `ap-back-contratos` só roda apontada para o projeto GCP `registradora-506000`; com outra conta ela falha em Cloud SQL, o que não indica defeito de código:
- `test_views_listar_contratos.py` — filtro por `documentoContratante` devolve só os contratos daquele contratante; ausência do param preserva o comportamento atual; contratante de outro financiador não vaza.
- `test_views_eventos_contrato.py` (novo) — ordem cronológica; correlação de `cerc_requisicao` pelo `correlacao_id` nas duas formas (`ref` e `ref:I`); requisição órfã vira entrada própria; contrato inexistente devolve 404; sem JWT devolve 401; JWT cujo `financiador_id` diverge do da URL devolve 403.

**Front** — roteiro manual:
1. Agendas → Ver Radar de um cliente → filtrar por credenciadora e janela → Nova Trava → Garantias: o formulário abre com contratante, credenciadoras, arranjos e datas semeados, e valores monetários em branco.
2. Submeter e confirmar que o contrato aparece na lista dentro do cliente em Contratos.
3. Abrir o contrato → aba Histórico → verificar evento de criação e, após o webhook, o `webhook_recebido`.
4. Forçar uma rejeição estrutural e confirmar que os erros da CERC ficam legíveis na timeline.
5. Inativar um contrato `REGISTRADO` a partir do cliente e ver a transição refletida na lista.
6. Confirmar que "Registro CERC" sumiu do menu expandido e do recolhido.
7. `npx tsc --noEmit -p tsconfig.app.json` não acusa erro novo, e os três de `ScheduleView` sobre `cnpj`/`segment` desaparecem.

---

## 9. Riscos

| Risco | Mitigação |
|---|---|
| A derivação de credenciadoras/arranjos a partir de URs filtradas pode produzir listas longas, enquanto o formulário aceita "todas" via sentinela `99T` (`NewContratoModal.tsx:127`) | Acima de 10 valores distintos, semear o campo como "todas" e sinalizar isso na tela |
| `documento_contratante` sem índice hoje; a listagem por cliente vira scan | Índice na mesma migração do endpoint |
| Expor `request_body` da CERC mostra ISPB, agência e conta do domicílio | Endpoint nasce com `@jwt_required` e checagem de tenant (§3.3); no front, bloco recolhido por padrão |
| Remover a única entrada de menu deixa contratos alcançáveis apenas por cliente | Decisão explícita do usuário (§1, decisão 2); reverter é reinserir duas linhas no `Sidebar` e um `case` no `App` |

---

## 10. Pendência aberta fora do escopo

**As rotas de leitura de contratos estão sem autenticação em produção.** `GET /api/v1/contratos/<financiador_id>` e `GET /api/v1/contratos/<financiador_id>/<contrato_id>` respondem 200 sem `Authorization`, num Cloud Run público, com o tenant vindo apenas do path. Quem souber a URL e um CNPJ de financiador lista os contratos dele: referências, identificadores, CNPJs de contratante e detentor, saldo devedor, limites, vencimentos e as URs alcançadas por cada garantia.

O agenda-service trata a mesma classe de dado de forma oposta — `@jwt_required` com `financiador_id` vindo do claim, jamais da URL (`shared/jwt_auth.py:60-64`).

Esta spec não fecha essa lacuna porque ela precede o trabalho aqui descrito e tem decisão própria a tomar (rotação de chave, tratamento de 401 no front, janela de deploy coordenada entre front e back). O que esta spec faz é parar de aumentá-la: o endpoint novo, que seria o mais sensível dos três, nasce protegido.

Recomendação: tratar como item próprio logo em seguida.
