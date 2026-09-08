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
CREATE INDEX ON contrato (documento_contratante, enviado_em DESC);
```

Liderar o índice por `cnpj_participante` não serviria: `listar_contratos_do_financiador` nunca filtra por essa coluna, porque o isolamento de tenant neste serviço acontece por banco separado (`get_db(financiador_id)`), não por coluna. Um índice composto só permite busca eficiente quando há predicado de igualdade na coluna líder; sem ele, a consulta varreria o índice inteiro, o mesmo custo que ele deveria evitar. Liderando por `documento_contratante` — a coluna do filtro novo — e incluindo `enviado_em DESC`, o índice serve o filtro e a ordenação da mesma consulta numa passada só.

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

Os dois índices de suporte que essa consulta precisa já existem, criados em `sql/schema/02-contratos-schema-fixes.sql`: `contrato_evento (contrato_id, ocorrido_em)` e `cerc_requisicao (correlacao_id)`.

**Fontes e correlação.** Os eventos vêm de `contrato_evento` (populado hoje em `views.py:338` — `ContratoSubgarantido`, `:355` — `webhook_recebido`, e `:629` — `rejeicao_estrutural`). As requisições vêm de `cerc_requisicao`, correlacionadas pelo `correlacao_id`, que é gravado como `referencia_externa` na criação (`views.py:579`) e como `{referencia_externa}:{tipo_operacao}` nas operações pós-registro (`views.py:710`). A consulta filtra `correlacao_id IN (ref, ref:I, ref:B)` para o contrato em questão, e cada requisição é anexada ao evento imediatamente anterior a ela no tempo; requisições sem evento correspondente aparecem como entradas próprias de tipo `requisicao_cerc`, para que uma falha de rede sem evento de domínio continue visível.

### 3.3 Autenticação — o endpoint novo nasce protegido

`request_body` e `response_body` de `cerc_requisicao` carregam o domicílio de pagamento: ISPB, agência e número da conta. Isso é material que não pode ser servido sem autenticação.

As rotas de leitura de contratos hoje **não têm** `jwt_required` (`views.py:456` e `:509` só têm `@require_GET`), e o `contratosApi.ts` não envia header `Authorization`. Verificado contra o ambiente real em 2026-09-07:

```
GET https://contratos-service-...run.app/api/v1/contratos/38138785000136?limit=1  →  200 sem auth
```

Portanto:

- `shared/jwt_auth.py` **é portado para o `ap-back-contratos`**, onde hoje não existe (o diretório tem `cloudsql_client`, `pubsub_auth`, `pubsub_client`, `secrets` e `tenant_config`). A fonte é `ap-back-consulta-agenda/shared/jwt_auth.py`, que valida RS256 contra `IAM_JWT_PUBLIC_KEY` com emissor `IAM_JWT_ISSUER` e exige o claim `financiador_id`. Isso traz junto duas variáveis de ambiente novas e a leitura do segredo `IAM_JWT_PUBLIC_KEY` já existente no projeto.
- O endpoint de eventos nasce com `@jwt_required`, recusando quando o `financiador_id` do claim diverge do da URL.
- `contratosApi.ts` passa a enviar `Authorization: Bearer` no `request()`, alinhado ao que o `agendaApi.ts:60` já faz.

**Proteger as rotas de leitura já existentes fica fora desta spec** e está registrado como pendência em §10. Com o `jwt_auth` portado e o Bearer já sendo enviado por `contratosApi.ts`, adicionar `@jwt_required` a elas passa a ser uma alteração de uma linha por rota.

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
  onSelecionarContrato: (id: string) => void;
  recarregarToken?: number;
}
```

É a tabela atual (`ContratosCercModule.tsx:125-160`), com os mapas `STATUS_LABEL`/`STATUS_COLOR` e os formatadores movidos junto. Com `documentoContratante` preenchido, chama `listContratos({ documentoContratante })`; a busca por texto e o filtro de status continuam client-side como hoje.

O componente entrega barra de filtros e tabela, sem cabeçalho: com o item de menu removido, o único consumidor é a seção do `ClientDetail`, que já traz título e botão próprios. Uma prop para suprimir um cabeçalho que ninguém usa seria código morto no dia em que nasce.

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

- `<ContratosCercList documentoContratante={client.document} onSelecionarContrato={...} recarregarToken={...} />`
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

Isso já é conhecido do time: está registrado em `ap-back-contratos/contratos/docs/superpowers/specs/2026-09-04-deploy-gcp-contratos-design.md:28`, que sugere exatamente reaproveitar o JWT do optin. O que esta spec acrescenta é a verificação de que a exposição está de pé em produção, e o porte do `jwt_auth` que torna o fechamento uma linha por rota.

Esta spec não fecha essa lacuna porque ela precede o trabalho aqui descrito e tem decisão própria a tomar (rotação de chave, tratamento de 401 no front, janela de deploy coordenada entre front e back). O que esta spec faz é parar de aumentá-la: o endpoint novo, que seria o mais sensível dos três, nasce protegido.

Recomendação: tratar como item próprio logo em seguida.

---

## 11. Verificado em 2026-09-08

A verificação de ponta a ponta prevista na Task 11 exige navegador e um webhook real da CERC, e não pôde ser executada nesta sessão. O que segue é o que foi confirmado por execução, o que não pôde ser, e o que fica pendente.

### Confirmado por execução

- `ap-back-contratos`: `shared/tests/test_jwt_auth.py` passa 10 de 10, sem depender de banco. Cobre validação de token, expiração, emissor errado, claim `financiador_id` ausente ou malformado, resposta 503 quando falta configuração de JWT (nas duas variáveis), e a garantia de que header ausente continua 401 e não 503.
- `ap-back-contratos`: os dois testes de segurança do endpoint de eventos passam sem tocar banco — sem JWT devolve 401, e JWT com `financiador_id` divergente do da URL devolve 403. A recusa acontece antes de qualquer acesso a dados.
- `ap-front`: `npx tsc --noEmit -p tsconfig.app.json` fecha em 99 erros pré-existentes, nenhum novo em arquivo tocado pela migração. O baseline caiu de 102 para 99: três erros `TS2339` reais foram corrigidos (`client.cnpj` e `client.segment`, campos que não existem no tipo `Client`).
- `ap-front`: `npm run build` conclui com sucesso. O único aviso é sobre tamanho de chunk, pré-existente.

### Não pôde ser verificado, e por quê

- Todos os testes do `ap-back-contratos` que tocam Cloud SQL falham nesta máquina com `403 boss::NOT_AUTHORIZED: missing permission cloudsql.instances.get on instances/contratos-db`, no projeto `registradora-506000`. A conta disponível não tem acesso a essa instância. Isso inclui os testes do filtro por contratante, os da timeline de eventos, e os do endpoint que devolve a timeline em camelCase.
- `test_contrato_inexistente_devolve_404` ficou deliberadamente vermelho: passou a assertar o corpo da resposta, e não só o código. Antes, o teste passava pelo caminho errado — colhia o 404 de uma falha de conexão, sem exercitar o tratamento de contrato inexistente. Ele só fica verde com acesso ao Cloud SQL; essa falha é o comportamento correto de um teste que não consegue provar o que promete.
- Nenhum fluxo foi exercitado em navegador. O front não tem suíte automatizada, e esta migração não introduziu uma.
- O endpoint de eventos não foi exercitado contra o serviço em execução: existe apenas no código, sem deploy, e as variáveis de JWT não foram configuradas no Cloud Run.

### Pendências para o usuário

1. Aplicar o índice: a partir de `C:\DEV\ap\ap-back-contratos\contratos`, rodar `python scripts/apply_schema.py sql/schema/03-contrato-indices-contratante.sql`. O arquivo é argumento obrigatório — sem ele o script imprime o uso e sai com código 1. Não foi executado nesta sessão por ser DDL contra banco compartilhado. **Armadilha do caminho:** o controle de "já aplicado" (tabela `schema_aplicado`) é chaveado pela string do caminho exatamente como foi passada no comando. Rodar de novo com o caminho escrito de outra forma (absoluto, ou com barras invertidas) não casa o registro anterior e reexecuta o arquivo — e o `CREATE INDEX` dele não tem nome nem `IF NOT EXISTS`, então não falha: cria um segundo índice idêntico. Use sempre exatamente o caminho relativo acima.
2. Configurar `IAM_JWT_PUBLIC_KEY` (do Secret Manager, segredo que já existe no projeto) e `IAM_JWT_ISSUER=brikz-iam` no serviço Cloud Run do contratos. Sem isso, a aba de Histórico responde 503 `SERVICO_MAL_CONFIGURADO`.
3. Rodar a suíte do `ap-back-contratos` numa conta com acesso ao projeto `registradora-506000`, para validar os testes bloqueados aqui.
4. Percorrer o roteiro manual de 7 passos da §8.
5. Regenerar o token de desenvolvimento quando expirar, em 2026-10-07, com o comando documentado nesta spec.

### Duas questões de segurança anteriores a esta migração, ainda abertas

Nenhuma das duas foi introduzida por este trabalho, e nenhuma foi corrigida por ele.

- **`DEBUG=True` ativo em produção nos dois serviços.** `config/settings.py` calcula `DEBUG = ENVIRONMENT != "production"`, e o `cloudbuild.yaml` fixa `_ENVIRONMENT: homolog`. Verificado contra os serviços reais: uma rota inexistente devolve a página de debug do Django, que lista as rotas configuradas; um erro 500 entregaria stack trace, código-fonte e variáveis locais. A correção é de uma linha por serviço.
- **As rotas de leitura de contratos continuam sem autenticação**, conforme §10. O que mudou nesta migração é que o módulo de JWT agora existe no repositório e o front já envia Bearer em todas as chamadas — fechar essa lacuna passou a ser acrescentar um decorador e a checagem de tenant por rota, mais os testes correspondentes.
