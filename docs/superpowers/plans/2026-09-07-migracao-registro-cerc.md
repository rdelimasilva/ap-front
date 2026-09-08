# Migração do Registro CERC para Agendas e Contratos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover a jornada de registro de contrato CERC-AP007 do item de menu autônomo para dois pontos de uso reais — o card "Garantias" do botão "Nova Trava" no radar do cliente, e uma seção por cliente em Contratos com lista, criação, gestão e timeline de eventos.

**Architecture:** O `ContratosCercModule` se dissolve em dois componentes com contexto opcional (`CercGarantiaJourney`, `ContratosCercList`), montados nos dois destinos. O backend ganha um filtro por contratante na listagem, um endpoint de eventos protegido por JWT, e o módulo `shared/jwt_auth.py` portado do agenda-service.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind (`ap-front`); Django (sem ORM, acesso via `shared/cloudsql_client`) + pytest + PyJWT (`ap-back-contratos`).

**Spec:** `ap-front/docs/superpowers/specs/2026-09-07-migracao-registro-cerc-design.md`

## Global Constraints

- **Dois repositórios.** Tasks 1–4 em `C:\DEV\ap\ap-back-contratos`; Tasks 5–11 em `C:\DEV\ap\ap-front`. Cada uma commita no seu próprio repo.
- **Ordem obrigatória.** As tasks de front consomem o backend das tasks 1–4. Não inverta.
- **Testes do backend exigem o projeto GCP `registradora-506000`.** Com outra conta, a suíte falha em Cloud SQL; isso não indica defeito de código. Confirme a conta ativa com `gcloud config get-value account` antes de rodar pytest.
- **Comentários e mensagens de commit em português**, seguindo o estilo dos arquivos vizinhos: comentário explica o porquê de uma decisão, nunca reafirma o que o código já diz.
- **Front sem suíte automatizada.** A verificação do front é `npx tsc --noEmit -p tsconfig.app.json` mais o roteiro manual da Task 11. Nenhuma task de front introduz framework de teste.
- **O projeto tem 102 erros de `tsc` pré-existentes.** O critério é "nenhum erro novo", nunca "zero erros".
- **`financiador_id` do claim manda.** Em qualquer rota nova, o `financiador_id` da URL é conferido contra o claim do JWT, jamais usado sozinho.
- **`npm run build` não roda typecheck** (`vite build` puro). Sempre rode `tsc` explicitamente.

---

## Estrutura de arquivos

### `ap-back-contratos`

| Arquivo | Responsabilidade |
|---|---|
| `contratos/shared/jwt_auth.py` (criar) | Validação Bearer RS256 e decorador `jwt_required`, portado do agenda-service |
| `contratos/shared/tests/test_jwt_auth.py` (criar) | Testes do decorador, sem rede |
| `contratos/.env.example` (modificar) | Documentar `IAM_JWT_PUBLIC_KEY` e `IAM_JWT_ISSUER` |
| `contratos/apps/contratos/contrato_repository.py` (modificar) | `documento_contratante` na listagem; `listar_eventos_do_contrato` |
| `contratos/apps/contratos/views.py` (modificar) | Filtro na `listar_contratos`; view `eventos_contrato` |
| `contratos/apps/contratos/urls.py` (modificar) | Rota de eventos |
| `contratos/sql/schema/03-contrato-indices-contratante.sql` (criar) | Índice `(cnpj_participante, documento_contratante)` |
| `contratos/apps/contratos/tests/test_views_eventos_contrato.py` (criar) | Testes do endpoint de eventos |

### `ap-front`

| Arquivo | Responsabilidade |
|---|---|
| `src/services/contratosApi.ts` (modificar) | Bearer no `request()`; filtro `documentoContratante`; `getEventosContrato` |
| `src/components/CercGarantiaJourney.tsx` (criar) | Jornada de criação com contexto opcional |
| `src/components/ContratosCercList.tsx` (criar) | Tabela de contratos, filtrável por contratante |
| `src/components/NewContratoModal.tsx` (modificar) | Aceitar `contextoInicial` |
| `src/components/ContratoDetailModal.tsx` (modificar) | Abas Detalhe / Histórico |
| `src/components/ScheduleView.tsx` (modificar) | Card "Garantias" abre a jornada CERC; correção de `client.cnpj` |
| `src/components/ClientDetail.tsx` (modificar) | Seção "Contratos CERC" |
| `src/components/Sidebar.tsx` (modificar) | Remover item de menu |
| `src/App.tsx` (modificar) | Remover rota e breadcrumb |
| `src/components/ContratosCercModule.tsx` (remover) | Substituído pelos dois componentes acima |

---

## Task 1: Portar `jwt_auth` para o contratos-service

**Files:**
- Create: `contratos/shared/jwt_auth.py`
- Create: `contratos/shared/tests/test_jwt_auth.py`
- Modify: `contratos/.env.example`
- Reference: `C:\DEV\ap\ap-back-consulta-agenda\shared\jwt_auth.py` (fonte), `C:\DEV\ap\ap-back-consulta-agenda\shared\tests\test_jwt_auth.py` (padrão dos testes)

**Interfaces:**
- Consumes: nada.
- Produces: `validar_bearer_token(authorization_header: str) -> dict`, `jwt_required(view_func)`, `JwtAuthError`. Views decoradas recebem `request.jwt_claims: dict` e `request.financiador_id: str`.

- [ ] **Step 1: Confirmar que PyJWT está disponível**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -c "import jwt; print(jwt.__version__)"`

Se falhar, adicione `PyJWT` e `cryptography` a `requirements.txt` no mesmo formato das outras linhas e instale antes de seguir. O `services/cerc/token_provider.py` já usa JWT, então o mais provável é que já esteja.

- [ ] **Step 2: Escrever o teste que falha**

Crie `contratos/shared/tests/test_jwt_auth.py`. Ele gera um par RSA em memória, então não depende de rede, de banco, nem de segredo de ambiente:

```python
"""Testes do jwt_auth portado do agenda-service. Par RSA gerado em memória:
sem rede, sem banco, sem segredo de ambiente."""
import time

import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.http import JsonResponse
from django.test import RequestFactory

from shared.jwt_auth import JwtAuthError, jwt_required, validar_bearer_token

ISSUER = "brikz-iam"
FINANCIADOR = "12345678000199"


@pytest.fixture
def chaves(monkeypatch):
    chave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    privada = chave.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    publica = chave.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    monkeypatch.setenv("IAM_JWT_PUBLIC_KEY", publica)
    monkeypatch.setenv("IAM_JWT_ISSUER", ISSUER)
    return privada


def _token(privada, **overrides):
    agora = int(time.time())
    claims = {
        "iss": ISSUER, "sub": "teste", "iat": agora,
        "exp": agora + 3600, "financiador_id": FINANCIADOR,
    }
    claims.update(overrides)
    return pyjwt.encode(claims, privada, algorithm="RS256")


def test_token_valido_devolve_claims(chaves):
    claims = validar_bearer_token(f"Bearer {_token(chaves)}")
    assert claims["financiador_id"] == FINANCIADOR


def test_header_ausente_levanta(chaves):
    with pytest.raises(JwtAuthError):
        validar_bearer_token("")


def test_token_expirado_levanta(chaves):
    with pytest.raises(JwtAuthError, match="expirado"):
        validar_bearer_token(f"Bearer {_token(chaves, exp=int(time.time()) - 10)}")


def test_emissor_errado_levanta(chaves):
    with pytest.raises(JwtAuthError):
        validar_bearer_token(f"Bearer {_token(chaves, iss='outro-idp')}")


def test_decorador_recusa_sem_header(chaves):
    @jwt_required
    def view(request):
        return JsonResponse({"ok": True})

    resposta = view(RequestFactory().get("/x"))
    assert resposta.status_code == 401


def test_decorador_recusa_financiador_id_malformado(chaves):
    @jwt_required
    def view(request):
        return JsonResponse({"ok": True})

    token = _token(chaves, financiador_id="123")
    resposta = view(RequestFactory().get("/x", HTTP_AUTHORIZATION=f"Bearer {token}"))
    assert resposta.status_code == 401


def test_decorador_expoe_financiador_id_na_request(chaves):
    capturado = {}

    @jwt_required
    def view(request):
        capturado["financiador_id"] = request.financiador_id
        return JsonResponse({"ok": True})

    token = _token(chaves)
    resposta = view(RequestFactory().get("/x", HTTP_AUTHORIZATION=f"Bearer {token}"))
    assert resposta.status_code == 200
    assert capturado["financiador_id"] == FINANCIADOR
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest shared/tests/test_jwt_auth.py -v`
Expected: FAIL com `ModuleNotFoundError: No module named 'shared.jwt_auth'`

- [ ] **Step 4: Criar o módulo**

Copie `C:\DEV\ap\ap-back-consulta-agenda\shared\jwt_auth.py` para `contratos/shared/jwt_auth.py` **sem alterar o código**. Ajuste apenas o docstring do topo, trocando a referência ao design doc do agenda pela do contratos:

```python
"""Autenticação Bearer JWT do IdP corporativo, portado do agenda-service.

Chave pública RS256 fixa (IAM_JWT_PUBLIC_KEY) e emissor esperado
(IAM_JWT_ISSUER) — sem JWKS/rede, mesmo padrão de shared/secrets.py para
segredos estáticos. Rotas isentas (health, push do Pub/Sub, webhook da
CERC) simplesmente não usam @jwt_required — não há middleware global com
exceção por path.

Multi-tenancy: exige o claim `financiador_id` (CNPJ, 14 dígitos) em todo
JWT válido e o expõe em `request.financiador_id`, além de
`request.jwt_claims`. Nas rotas que também trazem o financiador no path,
a view compara os dois e recusa a divergência — o claim é a autoridade.
"""
```

O restante do arquivo é idêntico à fonte.

- [ ] **Step 5: Rodar e ver passar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest shared/tests/test_jwt_auth.py -v`
Expected: PASS, 7 testes

- [ ] **Step 6: Documentar as variáveis no `.env.example`**

Acrescente ao final de `contratos/.env.example`:

```bash
# JWT do IdP corporativo (mesmo par de chaves do optin e do agenda — este
# serviço só valida, nunca emite). Chave pública PEM numa linha só, com \n
# literais; o jwt_auth desescapa. Em homolog/produção vem do Secret Manager
# no segredo IAM_JWT_PUBLIC_KEY, que já existe no projeto.
IAM_JWT_PUBLIC_KEY=
IAM_JWT_ISSUER=brikz-iam
```

- [ ] **Step 7: Commit**

```bash
cd C:\DEV\ap\ap-back-contratos
git add contratos/shared/jwt_auth.py contratos/shared/tests/test_jwt_auth.py contratos/.env.example
git commit -m "feat: porta shared/jwt_auth do agenda-service para o contratos"
```

---

## Task 2: Filtro `documentoContratante` na listagem

**Files:**
- Modify: `contratos/apps/contratos/contrato_repository.py:191-200`
- Modify: `contratos/apps/contratos/views.py:479-505`
- Create: `contratos/sql/schema/03-contrato-indices-contratante.sql`
- Test: `contratos/apps/contratos/tests/test_views_listar_contratos.py`

**Interfaces:**
- Consumes: nada da Task 1.
- Produces: `GET /api/v1/contratos/<financiador_id>?documentoContratante=<doc>` devolvendo `{"dados": [...]}` no mesmo formato de hoje. `listar_contratos_do_financiador(financiador_id, status=None, limit=None, documento_contratante=None)`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescente ao final de `contratos/apps/contratos/tests/test_views_listar_contratos.py`. Os helpers `_payload_minimo`, `_limpar`, `FINANCIADOR_TESTE` e `URL_LISTA` já existem no topo do arquivo:

```python
def test_listar_filtra_por_documento_contratante():
    ref_alvo, ref_outro = "CTR-FILTRO-ALVO", "CTR-FILTRO-OUTRO"
    doc_alvo, doc_outro = "22751826000125", "11222333000181"
    _limpar(ref_alvo)
    _limpar(ref_outro)
    try:
        for ref, doc in ((ref_alvo, doc_alvo), (ref_outro, doc_outro)):
            payload = {
                **_payload_minimo(ref), "documentoContratante": doc,
                "garantias": [], "identificacaoContratosAnteriores": [], "parcelas": [],
            }
            inserir_contrato_criado(
                FINANCIADOR_TESTE, payload, status=state_machine.AGUARDANDO_WEBHOOK,
                protocolo=f"proto-{ref}", id_contrato_cerc=f"cerc-{ref}",
            )

        response = Client().get(f"{URL_LISTA}?documentoContratante={doc_alvo}")
        assert response.status_code == 200
        referencias = [c["referenciaExterna"] for c in response.json()["dados"]]
        assert ref_alvo in referencias
        assert ref_outro not in referencias
    finally:
        _limpar(ref_alvo)
        _limpar(ref_outro)


def test_listar_sem_filtro_preserva_comportamento_atual():
    ref = "CTR-FILTRO-SEM"
    _limpar(ref)
    try:
        payload = {
            **_payload_minimo(ref), "documentoContratante": "22751826000125",
            "garantias": [], "identificacaoContratosAnteriores": [], "parcelas": [],
        }
        inserir_contrato_criado(
            FINANCIADOR_TESTE, payload, status=state_machine.AGUARDANDO_WEBHOOK,
            protocolo="proto-sem", id_contrato_cerc="cerc-sem",
        )
        response = Client().get(URL_LISTA)
        assert response.status_code == 200
        assert ref in [c["referenciaExterna"] for c in response.json()["dados"]]
    finally:
        _limpar(ref)


def test_listar_filtro_combina_com_status():
    ref = "CTR-FILTRO-STATUS"
    doc = "22751826000125"
    _limpar(ref)
    try:
        payload = {
            **_payload_minimo(ref), "documentoContratante": doc,
            "garantias": [], "identificacaoContratosAnteriores": [], "parcelas": [],
        }
        inserir_contrato_criado(
            FINANCIADOR_TESTE, payload, status=state_machine.AGUARDANDO_WEBHOOK,
            protocolo="proto-status", id_contrato_cerc="cerc-status",
        )
        casa = Client().get(f"{URL_LISTA}?documentoContratante={doc}&status={state_machine.AGUARDANDO_WEBHOOK}")
        assert ref in [c["referenciaExterna"] for c in casa.json()["dados"]]

        nao_casa = Client().get(f"{URL_LISTA}?documentoContratante={doc}&status={state_machine.REGISTRADO}")
        assert ref not in [c["referenciaExterna"] for c in nao_casa.json()["dados"]]
    finally:
        _limpar(ref)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest apps/contratos/tests/test_views_listar_contratos.py -v -k filtro`
Expected: FAIL — o filtro é ignorado, `ref_outro` aparece na lista

- [ ] **Step 3: Adicionar o parâmetro no repositório**

Em `contrato_repository.py`, substitua a função inteira (linhas 191-200):

```python
def listar_contratos_do_financiador(
    financiador_id: str,
    status: str | None = None,
    limit: int | None = None,
    documento_contratante: str | None = None,
) -> list[dict]:
    """Lista as linhas de `contrato` do tenant, mais recente primeiro
    (`enviado_em` desc). Filtros opcionais por `status` (SPEC-02 §8) e por
    `documento_contratante` (o cliente da operação — o front usa este para
    montar a lista de contratos dentro da ficha de um cliente)."""
    query = get_db(financiador_id).table("contrato").select("*")
    if status:
        query = query.eq("status", status)
    if documento_contratante:
        query = query.eq("documento_contratante", documento_contratante)
    query = query.order("enviado_em", desc=True)
    if limit:
        query = query.limit(limit)
    return query.execute().data
```

- [ ] **Step 4: Ler o parâmetro na view**

Em `views.py`, dentro de `listar_contratos`, logo após a linha `status = request.GET.get("status") or None`, acrescente:

```python
    documento_contratante = request.GET.get("documentoContratante") or None
```

E na chamada dentro do `try`, passe o argumento:

```python
        contratos = listar_contratos_do_financiador(
            financiador_id, status=status, limit=limit,
            documento_contratante=documento_contratante,
        )
```

Atualize também o docstring da view para citar o filtro novo:

```python
    """GET /api/v1/contratos/<financiador_id> — lista os contratos do
    financiador, mais recente primeiro. Filtros opcionais via querystring:
    ?status=, ?limit=, ?documentoContratante=."""
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest apps/contratos/tests/test_views_listar_contratos.py -v`
Expected: PASS, incluindo os testes que já existiam

- [ ] **Step 6: Criar a migração do índice**

Crie `contratos/sql/schema/03-contrato-indices-contratante.sql`:

```sql
-- A listagem passou a aceitar ?documentoContratante= (front monta a lista de
-- contratos dentro da ficha de um cliente). Sem este índice a consulta vira
-- scan da tabela inteira do tenant: os índices existentes são
-- (cnpj_participante, status) e (status), nenhum cobre o contratante.
CREATE INDEX ON contrato (cnpj_participante, documento_contratante);
```

- [ ] **Step 7: Aplicar o índice**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python scripts/apply_schema.py`

O script controla o que já foi aplicado pela tabela `schema_aplicado`, então rodá-lo de novo é seguro. Confirme na saída que `03-contrato-indices-contratante.sql` aparece como aplicado.

- [ ] **Step 8: Commit**

```bash
cd C:\DEV\ap\ap-back-contratos
git add contratos/apps/contratos/contrato_repository.py contratos/apps/contratos/views.py contratos/apps/contratos/tests/test_views_listar_contratos.py contratos/sql/schema/03-contrato-indices-contratante.sql
git commit -m "feat: filtro documentoContratante na listagem de contratos"
```

---

## Task 3: Leitura de eventos no repositório

**Files:**
- Modify: `contratos/apps/contratos/contrato_repository.py` (acrescentar ao final)
- Test: `contratos/apps/contratos/tests/test_contrato_repository.py` (acrescentar ao final)

**Interfaces:**
- Consumes: nada.
- Produces: `listar_eventos_do_contrato(financiador_id: str, contrato_id: str) -> list[dict] | None`, devolvendo `None` quando o contrato não existe, e dicts snake_case com as chaves `tipo`, `ocorrido_em`, `payload`, `requisicoes` (lista, possivelmente vazia) quando existe. A conversão para camelCase é da view, seguindo o padrão do módulo.

- [ ] **Step 1: Escrever o teste que falha**

Acrescente ao final de `contratos/apps/contratos/tests/test_contrato_repository.py`:

```python
def test_listar_eventos_ordena_e_correlaciona_requisicoes():
    """Eventos em ordem cronológica, cada um levando as requisições CERC
    que o antecedem. correlacao_id é gravado como `referencia_externa` na
    criação e `referencia_externa:<tipo>` nas operações pós-registro."""
    from datetime import datetime, timedelta, timezone
    import uuid

    from apps.contratos.contrato_repository import listar_eventos_do_contrato

    referencia = "CTR-EVENTOS-REPO"
    _limpar(referencia)
    db = get_db(FINANCIADOR_TESTE)
    payload = {
        **_payload_minimo(referencia), "garantias": [],
        "identificacaoContratosAnteriores": [], "parcelas": [],
    }
    contrato = inserir_contrato_criado(
        FINANCIADOR_TESTE, payload, status=state_machine.AGUARDANDO_WEBHOOK,
        protocolo="proto-eventos", id_contrato_cerc="cerc-eventos",
    )
    contrato_id = contrato["id"]
    base = datetime(2026, 9, 1, 12, 0, 0, tzinfo=timezone.utc)
    try:
        db.table("cerc_requisicao").insert({
            "id": str(uuid.uuid4()), "recurso": "/contratos",
            "correlacao_id": referencia, "http_status": 207,
            "request_body": {"tipoOperacao": "C"}, "response_body": {"ok": True},
            "tentativa": 1, "criado_em": base.isoformat(),
        }).execute()
        db.table("contrato_evento").insert([
            {"contrato_id": contrato_id, "tipo": "webhook_recebido",
             "payload": {"a": 1}, "ocorrido_em": (base + timedelta(minutes=5)).isoformat()},
            {"contrato_id": contrato_id, "tipo": "rejeicao_estrutural",
             "payload": {"erros": []}, "ocorrido_em": (base + timedelta(minutes=1)).isoformat()},
        ]).execute()

        eventos = listar_eventos_do_contrato(FINANCIADOR_TESTE, contrato_id)

        assert [e["tipo"] for e in eventos] == ["rejeicao_estrutural", "webhook_recebido"]
        assert len(eventos[0]["requisicoes"]) == 1
        assert eventos[0]["requisicoes"][0]["http_status"] == 207
        assert eventos[1]["requisicoes"] == []
    finally:
        db.table("cerc_requisicao").delete().eq("correlacao_id", referencia).execute()
        _limpar(referencia)


def test_listar_eventos_requisicao_orfa_vira_entrada_propria():
    """Uma requisição CERC anterior a qualquer evento (ex.: timeout de rede,
    que não gera evento de domínio) precisa continuar visível."""
    from datetime import datetime, timezone
    import uuid

    from apps.contratos.contrato_repository import listar_eventos_do_contrato

    referencia = "CTR-EVENTOS-ORFA"
    _limpar(referencia)
    db = get_db(FINANCIADOR_TESTE)
    payload = {
        **_payload_minimo(referencia), "garantias": [],
        "identificacaoContratosAnteriores": [], "parcelas": [],
    }
    contrato = inserir_contrato_criado(
        FINANCIADOR_TESTE, payload, status=state_machine.AGUARDANDO_WEBHOOK,
        protocolo="proto-orfa", id_contrato_cerc="cerc-orfa",
    )
    try:
        db.table("cerc_requisicao").insert({
            "id": str(uuid.uuid4()), "recurso": "/contratos",
            "correlacao_id": referencia, "http_status": None,
            "request_body": {"tipoOperacao": "C"}, "response_body": None,
            "tentativa": 1,
            "criado_em": datetime(2026, 9, 1, 12, 0, 0, tzinfo=timezone.utc).isoformat(),
        }).execute()

        eventos = listar_eventos_do_contrato(FINANCIADOR_TESTE, contrato["id"])

        assert len(eventos) == 1
        assert eventos[0]["tipo"] == "requisicao_cerc"
        assert len(eventos[0]["requisicoes"]) == 1
    finally:
        db.table("cerc_requisicao").delete().eq("correlacao_id", referencia).execute()
        _limpar(referencia)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest apps/contratos/tests/test_contrato_repository.py -v -k eventos`
Expected: FAIL com `ImportError: cannot import name 'listar_eventos_do_contrato'`

- [ ] **Step 3: Implementar**

Acrescente ao final de `contrato_repository.py`:

```python
# Operações que a CERC recebe com correlacao_id sufixado (views.py:710); a
# criação usa a referência crua (views.py:579). Enumerado em vez de LIKE:
# `LIKE 'ref%'` casaria uma referência que é prefixo de outra.
_SUFIXOS_CORRELACAO = ("", ":I", ":B")


def listar_eventos_do_contrato(financiador_id: str, contrato_id: str) -> list[dict] | None:
    """Timeline do contrato: linhas de `contrato_evento` em ordem cronológica,
    cada uma carregando as requisições HTTP à CERC (`cerc_requisicao`) que a
    antecedem. Devolve None quando o contrato não existe.

    As duas tabelas não têm FK entre si — `cerc_requisicao` é gravada pelo
    client HTTP (services/cerc/client.py), que não conhece o id do contrato,
    e se correlaciona pelo `correlacao_id`. A associação por janela temporal
    é aproximada de propósito: serve para depurar uma rejeição, não como
    trilha de auditoria formal.

    Requisições anteriores ao primeiro evento viram entradas próprias de tipo
    `requisicao_cerc`, para que uma falha de rede — que não gera evento de
    domínio nenhum — continue visível na tela.
    """
    db = get_db(financiador_id)
    contrato = db.table("contrato").select("referencia_externa").eq("id", contrato_id).execute().data
    if not contrato:
        return None
    referencia_externa = contrato[0]["referencia_externa"]

    eventos = (
        db.table("contrato_evento").select("*")
        .eq("contrato_id", contrato_id).order("ocorrido_em").execute().data
    )
    correlacoes = [f"{referencia_externa}{sufixo}" for sufixo in _SUFIXOS_CORRELACAO]
    requisicoes = (
        db.table("cerc_requisicao").select("*")
        .in_("correlacao_id", correlacoes).order("criado_em").execute().data
    )

    timeline = [{**e, "requisicoes": []} for e in eventos]
    orfas = []
    for requisicao in requisicoes:
        anterior = None
        for entrada in timeline:
            if str(entrada["ocorrido_em"]) >= str(requisicao["criado_em"]):
                anterior = entrada
                break
        if anterior is None:
            orfas.append(requisicao)
        else:
            anterior["requisicoes"].append(requisicao)

    for requisicao in orfas:
        timeline.append({
            "tipo": "requisicao_cerc", "payload": {},
            "ocorrido_em": requisicao["criado_em"], "requisicoes": [requisicao],
        })

    return sorted(timeline, key=lambda e: str(e["ocorrido_em"]))
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest apps/contratos/tests/test_contrato_repository.py -v`
Expected: PASS, incluindo os testes que já existiam

- [ ] **Step 5: Commit**

```bash
cd C:\DEV\ap\ap-back-contratos
git add contratos/apps/contratos/contrato_repository.py contratos/apps/contratos/tests/test_contrato_repository.py
git commit -m "feat: leitura da timeline de eventos do contrato com requisicoes CERC"
```

---

## Task 4: Endpoint `GET .../eventos` protegido por JWT

**Files:**
- Modify: `contratos/apps/contratos/views.py`
- Modify: `contratos/apps/contratos/urls.py`
- Create: `contratos/apps/contratos/tests/test_views_eventos_contrato.py`

**Interfaces:**
- Consumes: `jwt_required` da Task 1; `listar_eventos_do_contrato` da Task 3.
- Produces: `GET /api/v1/contratos/<financiador_id>/<contrato_id>/eventos` → `{"dados": [{tipo, ocorridoEm, payload, requisicoes: [{recurso, httpStatus, tentativa, requestBody, responseBody, criadoEm}]}]}`. Consumido pela Task 5.

- [ ] **Step 1: Escrever os testes que falham**

Crie `contratos/apps/contratos/tests/test_views_eventos_contrato.py`. O `conftest` de `apps/contratos/tests/` já configura o Django; siga o padrão dos vizinhos para os helpers:

```python
"""Testes do GET /contratos/<fin>/<id>/eventos. Diferente das outras rotas
de leitura, esta exige JWT: o corpo carrega request/response crus da CERC,
que incluem ISPB, agência e conta do domicílio de pagamento."""
import time

import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import Client

from apps.contratos import state_machine
from apps.contratos.contrato_repository import inserir_contrato_criado
from shared.cloudsql_client import get_db

FINANCIADOR_TESTE = "12345678000199"
OUTRO_FINANCIADOR = "98765432000188"
ISSUER = "brikz-iam"
UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000"


@pytest.fixture
def chave_privada(monkeypatch):
    chave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    privada = chave.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    publica = chave.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    monkeypatch.setenv("IAM_JWT_PUBLIC_KEY", publica)
    monkeypatch.setenv("IAM_JWT_ISSUER", ISSUER)
    return privada


def _auth(privada, financiador_id=FINANCIADOR_TESTE):
    agora = int(time.time())
    token = pyjwt.encode(
        {"iss": ISSUER, "sub": "teste", "iat": agora,
         "exp": agora + 3600, "financiador_id": financiador_id},
        privada, algorithm="RS256",
    )
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def _payload_minimo(referencia_externa):
    return {
        "referenciaExterna": referencia_externa,
        "identificadorContrato": "OP-TESTE-EVENTOS",
        "documentoContratante": "22751826000125",
        "cnpjDetentor": FINANCIADOR_TESTE,
        "tipoEfeito": "2",
        "saldoDevedor": 150000.00,
        "limiteOperacaoGarantida": 200000.00,
        "valorMantido": 180000.00,
        "dataAssinatura": "2026-08-15",
        "dataVencimento": "2027-08-15",
        "identificacaoGestaoEntidadeRegistradora": "2",
        "modalidadeOperacao": "1",
        "repactuacao": "0",
        "garantias": [], "identificacaoContratosAnteriores": [], "parcelas": [],
    }


def _limpar(referencia_externa):
    db = get_db(FINANCIADOR_TESTE)
    db.table("cerc_requisicao").delete().eq("correlacao_id", referencia_externa).execute()
    for row in db.table("contrato").select("id").eq("referencia_externa", referencia_externa).execute().data:
        db.table("contrato_evento").delete().eq("contrato_id", row["id"]).execute()
        db.table("contrato").delete().eq("id", row["id"]).execute()


def _criar(referencia):
    _limpar(referencia)
    return inserir_contrato_criado(
        FINANCIADOR_TESTE, _payload_minimo(referencia),
        status=state_machine.AGUARDANDO_WEBHOOK,
        protocolo=f"proto-{referencia}", id_contrato_cerc=f"cerc-{referencia}",
    )


def test_sem_jwt_devolve_401(chave_privada):
    url = f"/api/v1/contratos/{FINANCIADOR_TESTE}/{UUID_INEXISTENTE}/eventos"
    assert Client().get(url).status_code == 401


def test_financiador_do_claim_divergente_devolve_403(chave_privada):
    url = f"/api/v1/contratos/{FINANCIADOR_TESTE}/{UUID_INEXISTENTE}/eventos"
    resposta = Client().get(url, **_auth(chave_privada, financiador_id=OUTRO_FINANCIADOR))
    assert resposta.status_code == 403


def test_contrato_inexistente_devolve_404(chave_privada):
    url = f"/api/v1/contratos/{FINANCIADOR_TESTE}/{UUID_INEXISTENTE}/eventos"
    resposta = Client().get(url, **_auth(chave_privada))
    assert resposta.status_code == 404


def test_devolve_timeline_em_camelcase(chave_privada):
    referencia = "CTR-EVENTOS-VIEW"
    contrato = _criar(referencia)
    db = get_db(FINANCIADOR_TESTE)
    try:
        db.table("contrato_evento").insert({
            "contrato_id": contrato["id"], "tipo": "rejeicao_estrutural",
            "payload": {"erros": [{"codigo": "C07", "mensagem": "detentor inválido"}]},
            "ocorrido_em": "2026-09-01T12:01:00+00:00",
        }).execute()

        url = f"/api/v1/contratos/{FINANCIADOR_TESTE}/{contrato['id']}/eventos"
        resposta = Client().get(url, **_auth(chave_privada))

        assert resposta.status_code == 200
        dados = resposta.json()["dados"]
        assert dados[0]["tipo"] == "rejeicao_estrutural"
        assert "ocorridoEm" in dados[0]
        assert dados[0]["payload"]["erros"][0]["codigo"] == "C07"
        assert dados[0]["requisicoes"] == []
    finally:
        _limpar(referencia)


def test_contrato_sem_eventos_devolve_lista_vazia(chave_privada):
    referencia = "CTR-EVENTOS-VAZIO"
    contrato = _criar(referencia)
    try:
        url = f"/api/v1/contratos/{FINANCIADOR_TESTE}/{contrato['id']}/eventos"
        resposta = Client().get(url, **_auth(chave_privada))
        assert resposta.status_code == 200
        assert resposta.json()["dados"] == []
    finally:
        _limpar(referencia)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest apps/contratos/tests/test_views_eventos_contrato.py -v`
Expected: FAIL com 404 do Django em todos (a rota não existe)

- [ ] **Step 3: Escrever a view**

Em `views.py`, acrescente o import no topo, junto dos outros de `shared`:

```python
from shared.jwt_auth import jwt_required
```

E a view, logo após `listar_contratos`:

```python
def _requisicao_para_dto(requisicao: dict) -> dict:
    return {
        "recurso": requisicao["recurso"],
        "httpStatus": requisicao["http_status"],
        "tentativa": requisicao["tentativa"],
        "requestBody": requisicao["request_body"],
        "responseBody": requisicao["response_body"],
        "criadoEm": requisicao["criado_em"],
    }


def _evento_para_dto(evento: dict) -> dict:
    return {
        "tipo": evento["tipo"],
        "ocorridoEm": evento["ocorrido_em"],
        "payload": evento["payload"],
        "requisicoes": [_requisicao_para_dto(r) for r in evento["requisicoes"]],
    }


@jwt_required
@require_GET
def eventos_contrato(request, financiador_id: str, contrato_id: str):
    """GET /api/v1/contratos/<financiador_id>/<contrato_id>/eventos — timeline
    do contrato para a aba de histórico do front.

    Única rota de leitura deste serviço com JWT: o corpo devolve os
    request/response crus trocados com a CERC, que carregam ISPB, agência e
    conta do domicílio de pagamento. O financiador do claim manda — o da URL
    só é aceito quando coincide.
    """
    if request.financiador_id != financiador_id:
        return JsonResponse({"erro": "financiador do token não confere com o da URL"}, status=403)

    try:
        eventos = listar_eventos_do_contrato(financiador_id, contrato_id)
    except Exception:
        # Mesmo raciocínio de listar_contratos: financiador_id desconhecido faz
        # get_db levantar RuntimeError puro. Não vaza se o tenant existe.
        return JsonResponse({"erro": "financiador não encontrado"}, status=404)

    if eventos is None:
        return JsonResponse({"erro": "contrato não encontrado"}, status=404)

    return JsonResponse({"dados": [_evento_para_dto(e) for e in eventos]})
```

Acrescente `listar_eventos_do_contrato` ao import de `contrato_repository` que já existe no topo do arquivo.

- [ ] **Step 4: Registrar a rota**

Em `urls.py`, acrescente **antes** da linha de `detalhar_contrato`, para que o sufixo `/eventos` não seja engolido pelo padrão mais curto:

```python
    re_path(r"^contratos/(?P<financiador_id>\d{14})/(?P<contrato_id>[0-9a-f-]{36})/eventos$", views.eventos_contrato),
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest apps/contratos/tests/test_views_eventos_contrato.py -v`
Expected: PASS, 5 testes

- [ ] **Step 6: Rodar a suíte inteira**

Run: `cd C:\DEV\ap\ap-back-contratos\contratos && python -m pytest -q`
Expected: nenhuma falha nova em relação ao estado antes da Task 1

- [ ] **Step 7: Commit**

```bash
cd C:\DEV\ap\ap-back-contratos
git add contratos/apps/contratos/views.py contratos/apps/contratos/urls.py contratos/apps/contratos/tests/test_views_eventos_contrato.py
git commit -m "feat: endpoint de eventos do contrato protegido por JWT"
```

- [ ] **Step 8: Configurar as variáveis no Cloud Run**

O deploy precisa de `IAM_JWT_PUBLIC_KEY` (do Secret Manager, segredo já existente no projeto) e `IAM_JWT_ISSUER=brikz-iam`. Siga o runbook do serviço em `contratos/docs/runbooks/` para o comando de update do serviço, no mesmo padrão em que as outras variáveis já são passadas. Sem isso, o endpoint novo responde 500 ao tentar ler a chave.

---

## Task 5: Camada de API do front

**Files:**
- Modify: `src/services/contratosApi.ts`

**Interfaces:**
- Consumes: os endpoints das Tasks 2 e 4.
- Produces: `listContratos({status?, limit?, documentoContratante?})`; `getEventosContrato(id: string): Promise<EventoContratoDTO[]>`; tipos `EventoContratoDTO` e `RequisicaoCercDTO`. Consumidos pelas Tasks 6, 7 e 9.

- [ ] **Step 1: Acrescentar os tipos**

Logo após `OperacaoPosRegistroResultado` em `contratosApi.ts`:

```ts
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
```

- [ ] **Step 2: Enviar o Bearer no `request()`**

O `request()` atual monta apenas `Content-Type`. Substitua o bloco de headers pelo mesmo padrão de `agendaApi.ts:58-61`, e declare a env var junto de `BASE_URL`/`FINANCIADOR_ID`:

```ts
const DEV_JWT = import.meta.env.VITE_CONTRATOS_DEV_JWT as string;
```

```ts
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
```

- [ ] **Step 3: Acrescentar o filtro e a função de eventos**

Substitua a assinatura de `listContratos` e acrescente `getEventosContrato` ao final do arquivo:

```ts
export function listContratos(
  filtros: { status?: string; limit?: number; documentoContratante?: string } = {},
): Promise<ContratoDTO[]> {
  return request<{ dados: ContratoDTO[] }>('GET', `/contratos/${FINANCIADOR_ID}${buildQuery(filtros)}`).then(r => r.dados);
}

export function getEventosContrato(id: string): Promise<EventoContratoDTO[]> {
  return request<{ dados: EventoContratoDTO[] }>('GET', `/contratos/${FINANCIADOR_ID}/${id}/eventos`).then(r => r.dados);
}
```

`buildQuery` já ignora valores `undefined` e string vazia, então nenhuma mudança é necessária nele.

- [ ] **Step 4: Configurar a env var**

Em `.env`, acrescente `VITE_CONTRATOS_DEV_JWT` com o mesmo valor de `VITE_AGENDA_DEV_JWT` — os dois serviços validam contra o mesmo par de chaves e o mesmo emissor. Em `.env.example`, acrescente a linha com valor vazio e um comentário no estilo das vizinhas.

Para gerar um token novo quando este expirar:

```bash
cd C:\DEV\ap\ap-back-optin\optin
python scripts/gerar_jwt.py --chave keys/homolog/jwt_private.pem --financiador 38138785000136 --horas 720
```

- [ ] **Step 5: Verificar o typecheck**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro novo em `contratosApi.ts`

- [ ] **Step 6: Commit**

```bash
cd C:\DEV\ap\ap-front
git add src/services/contratosApi.ts .env.example
git commit -m "feat: filtro por contratante, eventos e Bearer no contratosApi"
```

---

## Task 6: `NewContratoModal` aceita contexto inicial

**Files:**
- Modify: `src/components/NewContratoModal.tsx:13-17` (props), `:59` (estado inicial)

**Interfaces:**
- Consumes: nada.
- Produces: tipo `ContextoTrava` exportado; prop `contextoInicial?: ContextoTrava` no `NewContratoModal`. Consumido pela Task 7.

- [ ] **Step 1: Declarar e exportar o tipo**

Acrescente acima de `interface NewContratoModalProps`:

```ts
// Semeia o formulário a partir de onde o usuário veio (radar de URs de um
// cliente, ou a ficha do cliente). Todo campo semeado continua editável.
export interface ContextoTrava {
  documentoContratante?: string;
  documentoUsuarioFinalRecebedor?: string;
  listaCnpjCredenciadora?: string[];
  listaCodigoArranjoPagamento?: string[];
  dataInicio?: string;
  dataFim?: string;
}
```

E acrescente a prop:

```ts
interface NewContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contextoInicial?: ContextoTrava;
}
```

- [ ] **Step 2: Aplicar o contexto ao estado inicial**

O componente hoje inicializa o form com `ESTADO_INICIAL`. Acrescente uma função que mescla o contexto e um `useEffect` que a reaplica a cada abertura, para que o formulário nunca traga o contexto do cliente anterior:

```ts
function comContexto(contexto?: ContextoTrava): FormState {
  if (!contexto) return ESTADO_INICIAL;
  return {
    ...ESTADO_INICIAL,
    documentoContratante: contexto.documentoContratante ?? '',
    definicaoDocumentoUfr: contexto.documentoUsuarioFinalRecebedor ?? '',
    definicaoDataInicio: contexto.dataInicio ?? '',
    definicaoDataFim: contexto.dataFim ?? '',
  };
}
```

Troque a linha `:178` de `const [form, setForm] = useState<FormState>(ESTADO_INICIAL);` para:

```ts
  const [form, setForm] = useState<FormState>(() => comContexto(contextoInicial));
```

Troque o import da linha 1 para `import React, { useState, useEffect } from 'react';`.

- [ ] **Step 3: Semear credenciadoras, arranjos e resetar a cada abertura**

As duas listas vivem em estado próprio, separado do `FormState`: `todasCredenciadoras`/`credenciadorasRaw` (`:180-181`) e `todosArranjos`/`arranjosRaw` (`:182-183`), lidos por `montarPayload` em `:127-128`. Acrescente logo após a declaração de `isSubmitting` (`:186`):

```ts
  // Acima disto a lista deixa de ser um recorte útil e vira ruído: cai para a
  // sentinela "todas" (99T), que é o que o formulário já envia nesse caso.
  const LIMITE_LISTA = 10;

  // Reaplica o contexto a cada abertura, para que o formulário nunca traga o
  // cliente da vez anterior. Vale também para as duas listas, que ficam fora
  // do FormState e por isso não são cobertas por comContexto.
  useEffect(() => {
    if (!isOpen) return;
    setForm(comContexto(contextoInicial));
    setParcelas([]);
    setErros({});
    setBannerErro(null);

    const semear = (
      valores: string[] | undefined,
      setTodos: (v: boolean) => void,
      setRaw: (v: string) => void,
    ) => {
      if (!valores || valores.length === 0 || valores.length > LIMITE_LISTA) {
        setTodos(true);
        setRaw('');
        return;
      }
      setTodos(false);
      setRaw(valores.join(', '));
    };

    semear(contextoInicial?.listaCnpjCredenciadora, setTodasCredenciadoras, setCredenciadorasRaw);
    semear(contextoInicial?.listaCodigoArranjoPagamento, setTodosArranjos, setArranjosRaw);
  }, [isOpen, contextoInicial]);
```

`listaDeTexto` já consome o formato separado por vírgula que `join(', ')` produz.

- [ ] **Step 4: Verificar o typecheck**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro novo em `NewContratoModal.tsx`

- [ ] **Step 5: Commit**

```bash
cd C:\DEV\ap\ap-front
git add src/components/NewContratoModal.tsx
git commit -m "feat: NewContratoModal aceita contexto inicial de trava"
```

---

## Task 7: Componentes `CercGarantiaJourney` e `ContratosCercList`

**Files:**
- Create: `src/components/CercGarantiaJourney.tsx`
- Create: `src/components/ContratosCercList.tsx`

**Interfaces:**
- Consumes: `ContextoTrava` da Task 6; `listContratos` da Task 5.
- Produces: `CercGarantiaJourney` com props `{isOpen, onClose, onCreated, contexto?}`; `ContratosCercList` com props `{documentoContratante?, onSelecionarContrato, recarregarToken?}`. Consumidos pelas Tasks 8 e 10.

- [ ] **Step 1: Criar `CercGarantiaJourney`**

```tsx
import React from 'react';
import { NewContratoModal, type ContextoTrava } from './NewContratoModal';

export type { ContextoTrava };

interface CercGarantiaJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contexto?: ContextoTrava;
}

// Ponto de entrada único da jornada de registro de garantia CERC-AP007. Existe
// para que os dois lugares que a abrem (card "Garantias" do seletor de Nova
// Trava, e a seção de contratos dentro do cliente) dependam de uma interface
// só, sem conhecer o formulário por dentro.
export const CercGarantiaJourney: React.FC<CercGarantiaJourneyProps> = ({ isOpen, onClose, onCreated, contexto }) => (
  <NewContratoModal
    isOpen={isOpen}
    onClose={onClose}
    onCreated={onCreated}
    contextoInicial={contexto}
  />
);
```

Se `NewContratoModal` for exportado como default no arquivo original, ajuste o import.

- [ ] **Step 2: Criar `ContratosCercList`**

Mova para cá `STATUS_LABEL`, `STATUS_COLOR`, `formatarData` e `formatarValor` de `ContratosCercModule.tsx:8-56`, sem alterá-los, e a tabela de `:107-160`:

```tsx
import React, { useEffect, useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import { listContratos, type ContratoDTO } from '../services/contratosApi';

// (STATUS_LABEL, STATUS_COLOR, formatarData e formatarValor entram aqui,
// idênticos aos de ContratosCercModule.tsx)

interface ContratosCercListProps {
  documentoContratante?: string;
  onSelecionarContrato: (id: string) => void;
  // Muda de valor quando algo externo (criação, inativação, baixa) precisa
  // forçar recarga da lista.
  recarregarToken?: number;
}

// Barra de filtros e tabela, sem cabeçalho: quem monta a lista já tem o seu.
export const ContratosCercList: React.FC<ContratosCercListProps> = ({
  documentoContratante, onSelecionarContrato, recarregarToken = 0,
}) => {
  const [contratos, setContratos] = useState<ContratoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setIsLoading(true);
      try {
        const dados = await listContratos({
          ...(statusFiltro ? { status: statusFiltro } : {}),
          ...(documentoContratante ? { documentoContratante } : {}),
        });
        if (!cancelado) setContratos(dados);
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar contratos:', err);
          showToast('error', 'Erro ao carregar contratos');
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    };
    carregar();
    return () => { cancelado = true; };
  }, [statusFiltro, documentoContratante, recarregarToken]);

  const contratosFiltrados = contratos.filter(c =>
    !searchTerm ||
    c.referenciaExterna.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identificadorContrato.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
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
        <button onClick={recarregar} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
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
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onSelecionarContrato(c.id)}>
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
    </div>
  );
};
```

O botão "Atualizar" usa um contador local, no mesmo padrão do `recarregarToken` externo. Declare junto dos outros estados e inclua no array de dependências do `useEffect`:

```ts
  const [recargaLocal, setRecargaLocal] = useState(0);
  const recarregar = () => setRecargaLocal(n => n + 1);
```

```ts
  }, [statusFiltro, documentoContratante, recarregarToken, recargaLocal]);
```

Chamar `setStatusFiltro` com o mesmo valor não serviria: o React descarta o re-render e o efeito nunca reexecuta.

A flag `cancelado` existe porque a lista remonta ao trocar de cliente: sem ela, a resposta de um cliente anterior pode chegar depois e sobrescrever a do atual.

- [ ] **Step 3: Verificar o typecheck**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro novo nos dois arquivos criados

- [ ] **Step 4: Commit**

```bash
cd C:\DEV\ap\ap-front
git add src/components/CercGarantiaJourney.tsx src/components/ContratosCercList.tsx
git commit -m "feat: extrai jornada e lista de contratos CERC em componentes reusaveis"
```

---

## Task 8: Card "Garantias" abre a jornada CERC no radar

**Files:**
- Modify: `src/components/ScheduleView.tsx` — imports, estado (`:203-231`), despachos (`:1003` e `:1047`), JSX das jornadas (`:1016-1021`), e as linhas `:1154`, `:1159`, `:1200`

**Interfaces:**
- Consumes: `CercGarantiaJourney` e `ContextoTrava` da Task 7.
- Produces: nada para tasks posteriores.

- [ ] **Step 1: Corrigir os acessos a campos inexistentes**

`Client` (`src/types/index.ts:1-14`) tem `document`, sem `cnpj` nem `segment`. O `tsc` acusa os três acessos. Aplique:

**`:1152-1155`** — a `div` de subtítulo do nome renderiza `{client.segment}`, campo que não existe. Como `Client` não tem equivalente, a linha inteira sai; o nome fica sozinho na célula:

```tsx
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </div>
```

**`:1159`**:

```tsx
                    <div className="text-sm text-gray-900">{client.document}</div>
```

**`:1200`** — dentro do objeto passado a `setSelectedOptInClient`:

```tsx
                            client_document: client.document,
```

- [ ] **Step 2: Confirmar que os três erros sumiram**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep ScheduleView`
Expected: apenas os erros `TS6133` de variáveis não usadas (`_formatDate`, `_averageTicket`, `_growthRate`, `_utilizationRate`, `_concentration`), que são pré-existentes e ficam fora do escopo

- [ ] **Step 3: Commit da correção isolada**

```bash
cd C:\DEV\ap\ap-front
git add src/components/ScheduleView.tsx
git commit -m "fix: usa client.document no lugar de client.cnpj inexistente"
```

- [ ] **Step 4: Trocar o estado da jornada de garantias**

Substitua `const [isGuaranteesOpen, setIsGuaranteesOpen] = useState(false);` (`:216`) por:

```tsx
  const [isCercGarantiaOpen, setIsCercGarantiaOpen] = useState(false);
```

Remova o import de `GuaranteesJourney` (`:7`). O componente continua existindo no repositório, alcançável por outros pontos do `App`.

- [ ] **Step 5: Derivar o contexto das URs filtradas**

Acrescente, depois da declaração de `filteredClientURs` (`:416`):

```tsx
  // Acima disto a lista deixa de ser um recorte útil e o formulário cai para
  // a sentinela "todas" (99T) — ver NewContratoModal e spec §9.
  const LIMITE_LISTA_CONTEXTO = 10;

  // O contexto sai das URs, e não do estado dos filtros: urAcquirerFilter e
  // urBrandFilter guardam rótulos legíveis (nome da credenciadora, descrição
  // do arranjo), enquanto a CERC exige CNPJ e código.
  const contextoTrava: ContextoTrava | undefined = useMemo(() => {
    if (!selectedClient) return undefined;
    const distintos = (valores: string[]) => Array.from(new Set(valores.filter(Boolean))).sort();
    const credenciadoras = distintos(filteredClientURs.map(ur => ur.cnpjCredenciadora));
    const arranjos = distintos(filteredClientURs.map(ur => ur.codigoArranjo));
    const ufrs = distintos(filteredClientURs.map(ur => ur.documentoUsuarioFinalRecebedor));
    const datas = filteredClientURs.map(ur => ur.settlementDate).sort();
    return {
      documentoContratante: selectedClient.document,
      documentoUsuarioFinalRecebedor: ufrs.length === 1 ? ufrs[0] : undefined,
      listaCnpjCredenciadora: credenciadoras.length <= LIMITE_LISTA_CONTEXTO ? credenciadoras : undefined,
      listaCodigoArranjoPagamento: arranjos.length <= LIMITE_LISTA_CONTEXTO ? arranjos : undefined,
      dataInicio: datas[0],
      dataFim: datas[datas.length - 1],
    };
  }, [selectedClient, filteredClientURs]);
```

Importe o tipo: `import { CercGarantiaJourney, type ContextoTrava } from './CercGarantiaJourney';`

- [ ] **Step 6: Trocar o despacho e a montagem**

Nos dois blocos de `OperationSelectorModal` (`:1003` e `:1047`), troque `else if (op === 'guarantees') setIsGuaranteesOpen(true);` por `else if (op === 'guarantees') setIsCercGarantiaOpen(true);`.

No bloco do radar (`:1017`), substitua a linha da `GuaranteesJourney` por:

```tsx
      <CercGarantiaJourney
        isOpen={isCercGarantiaOpen}
        onClose={() => setIsCercGarantiaOpen(false)}
        onCreated={() => setIsCercGarantiaOpen(false)}
        contexto={contextoTrava}
      />
```

No bloco da lista de clientes (onde não há cliente nem URs em contexto), a mesma montagem sem a prop `contexto`.

- [ ] **Step 7: Verificar o typecheck**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep ScheduleView`
Expected: apenas os `TS6133` pré-existentes

- [ ] **Step 8: Commit**

```bash
cd C:\DEV\ap\ap-front
git add src/components/ScheduleView.tsx
git commit -m "feat: card Garantias do Nova Trava abre a jornada CERC real"
```

---

## Task 9: Aba de histórico no `ContratoDetailModal`

**Files:**
- Modify: `src/components/ContratoDetailModal.tsx`

**Interfaces:**
- Consumes: `getEventosContrato` e `EventoContratoDTO` da Task 5.
- Produces: nada para tasks posteriores.

- [ ] **Step 1: Acrescentar o estado das abas e dos eventos**

```tsx
const EVENTO_LABEL: Record<string, string> = {
  webhook_recebido: 'Confirmação recebida da CERC',
  rejeicao_estrutural: 'Rejeitado pela CERC',
  ContratoSubgarantido: 'Contrato subgarantido',
  requisicao_cerc: 'Requisição à CERC',
};
```

```tsx
  const [aba, setAba] = useState<'detalhe' | 'historico'>('detalhe');
  const [eventos, setEventos] = useState<EventoContratoDTO[] | null>(null);
  const [erroEventos, setErroEventos] = useState<string | null>(null);
  const [carregandoEventos, setCarregandoEventos] = useState(false);
```

- [ ] **Step 2: Carregar sob demanda**

```tsx
  const carregarEventos = useCallback(async () => {
    if (!contratoId) return;
    setCarregandoEventos(true);
    setErroEventos(null);
    try {
      setEventos(await getEventosContrato(contratoId));
    } catch (err) {
      setErroEventos(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setCarregandoEventos(false);
    }
  }, [contratoId]);

  // Só busca quando o usuário abre a aba: a maioria das visitas ao modal quer
  // o detalhe, e a timeline traz request/response inteiros.
  useEffect(() => {
    if (aba === 'historico' && eventos === null && !carregandoEventos) carregarEventos();
  }, [aba, eventos, carregandoEventos, carregarEventos]);

  // Contrato diferente, timeline diferente.
  useEffect(() => {
    setAba('detalhe');
    setEventos(null);
    setErroEventos(null);
  }, [contratoId]);
```

- [ ] **Step 3: Renderizar as abas**

Abaixo do `<h2>Detalhe do contrato</h2>` (`:89`), acrescente a barra de abas. A cor emerald é a mesma que o `Sidebar` usa para item ativo:

```tsx
<div className="flex gap-1 border-b border-gray-200 mt-3">
  {([['detalhe', 'Detalhe'], ['historico', 'Histórico']] as const).map(([chave, rotulo]) => (
    <button
      key={chave}
      onClick={() => setAba(chave)}
      className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
        aba === chave
          ? 'border-emerald-600 text-emerald-700 font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-900'
      }`}
    >
      {rotulo}
    </button>
  ))}
</div>
```

Todo o conteúdo atual do corpo do modal (`:100-160`, os blocos de campos, garantias e indicadores) passa a ficar envolto em `{aba === 'detalhe' && ( ... )}`. Os botões de inativar e baixar (`:165-180`) ficam fora das abas, no rodapé, visíveis nas duas.

A aba Histórico:

```tsx
{aba === 'historico' && (
  <div className="space-y-3">
    {carregandoEventos && <p className="text-sm text-gray-400">Carregando histórico...</p>}
    {erroEventos && (
      <div className="text-sm">
        <p className="text-red-600">Falha ao carregar o histórico: {erroEventos}</p>
        <button onClick={carregarEventos} className="mt-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
          Tentar de novo
        </button>
      </div>
    )}
    {eventos?.length === 0 && (
      <p className="text-sm text-gray-400">
        Nenhum evento registrado ainda. A confirmação da CERC chega por webhook.
      </p>
    )}
    {eventos?.map((evento, i) => (
      <div key={i} className="border-l-2 border-gray-200 pl-4 pb-3">
        <p className="text-sm font-medium text-gray-900">{EVENTO_LABEL[evento.tipo] ?? evento.tipo}</p>
        <p className="text-xs text-gray-500">{formatarDataHora(evento.ocorridoEm)}</p>
        {errosDoEvento(evento).map((erro, j) => (
          <p key={j} className="text-xs text-red-600 mt-1">{erro}</p>
        ))}
        {evento.requisicoes.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer">Detalhe técnico</summary>
            {evento.requisicoes.map((r, k) => (
              <div key={k} className="mt-2 text-xs">
                <p className="text-gray-600">{r.recurso} — HTTP {r.httpStatus ?? 'sem resposta'} (tentativa {r.tentativa})</p>
                <pre className="bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(r.requestBody, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(r.responseBody, null, 2)}</pre>
              </div>
            ))}
          </details>
        )}
      </div>
    ))}
  </div>
)}
```

Com os dois auxiliares no topo do arquivo:

```tsx
function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

// A rejeição estrutural é o único evento cujo payload interessa em texto: são
// os códigos que a CERC devolveu, hoje visíveis só no toast do momento da
// submissão.
function errosDoEvento(evento: EventoContratoDTO): string[] {
  const payload = evento.payload as { erros?: Array<{ codigo?: string; mensagem?: string }> } | null;
  if (!payload?.erros) return [];
  return payload.erros.map(e => [e.codigo, e.mensagem].filter(Boolean).join(' — '));
}
```

O `<details>` fica recolhido por padrão: esse bloco carrega ISPB, agência e conta do domicílio de pagamento.

- [ ] **Step 4: Verificar o typecheck**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep ContratoDetailModal`
Expected: nenhum erro

- [ ] **Step 5: Commit**

```bash
cd C:\DEV\ap\ap-front
git add src/components/ContratoDetailModal.tsx
git commit -m "feat: aba de historico com timeline e diagnostico tecnico"
```

---

## Task 10: Seção "Contratos CERC" no `ClientDetail` e remoção do menu

**Files:**
- Modify: `src/components/ClientDetail.tsx`
- Modify: `src/components/Sidebar.tsx:12,104,286`
- Modify: `src/App.tsx:311,448` e o import do `ContratosCercModule`
- Delete: `src/components/ContratosCercModule.tsx`

**Interfaces:**
- Consumes: `ContratosCercList` e `CercGarantiaJourney` da Task 7; `ContratoDetailModal` da Task 9.
- Produces: nada para tasks posteriores.

- [ ] **Step 1: Acrescentar o estado no `ClientDetail`**

```tsx
  const [isCercJourneyOpen, setIsCercJourneyOpen] = useState(false);
  const [contratoCercSelecionado, setContratoCercSelecionado] = useState<string | null>(null);
  const [recarregarContratosCerc, setRecarregarContratosCerc] = useState(0);
```

- [ ] **Step 2: Acrescentar a seção**

Logo após a seção "Contratos de Recebíveis" (`:340-445`), no mesmo padrão de cabeçalho colapsável que ela usa (`toggleSection`, `collapsedSections.has`, ícone `ChevronRight`/`ChevronDown`):

```tsx
{/* Contratos CERC */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
    <button onClick={() => toggleSection('cerc-contracts')} className="flex items-center gap-3 text-left flex-1">
      <FileSignature className="w-5 h-5 text-emerald-600" />
      <h3 className="text-lg font-semibold text-gray-900">Contratos CERC</h3>
    </button>
    <div className="flex items-center gap-3">
      <button
        onClick={() => setIsCercJourneyOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
      >
        <Plus className="w-4 h-4" /> Novo contrato CERC
      </button>
      <button onClick={() => toggleSection('cerc-contracts')} aria-label="Expandir seção">
        {collapsedSections.has('cerc-contracts') ? (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  </div>

  {!collapsedSections.has('cerc-contracts') && (
    <div className="p-4 border-t border-gray-100">
      <ContratosCercList
        documentoContratante={client.document}
        onSelecionarContrato={setContratoCercSelecionado}
        recarregarToken={recarregarContratosCerc}
      />
    </div>
  )}
</div>
```

O cabeçalho aqui é uma `div` com dois botões, e não um botão único como a seção vizinha: o "Novo contrato CERC" precisa ficar no cabeçalho sem virar um botão dentro de outro, que é HTML inválido e engole o clique.

Acrescente `FileSignature` e `Plus` ao import de `lucide-react` do arquivo, se ainda não estiverem lá.

E, no final do componente, junto dos outros modais:

```tsx
<CercGarantiaJourney
  isOpen={isCercJourneyOpen}
  onClose={() => setIsCercJourneyOpen(false)}
  onCreated={() => {
    setIsCercJourneyOpen(false);
    setRecarregarContratosCerc(n => n + 1);
  }}
  contexto={{ documentoContratante: client.document }}
/>

<ContratoDetailModal
  contratoId={contratoCercSelecionado}
  onClose={() => setContratoCercSelecionado(null)}
  onChanged={() => setRecarregarContratosCerc(n => n + 1)}
/>
```

A seção "Contratos de Recebíveis" mockada fica intocada.

- [ ] **Step 3: Remover do `Sidebar`**

- `:104` — remover a entrada `{ id: 'contratos-cerc', label: 'Registro CERC', icon: FileSignature }` de `collapsedPrincipalItems`.
- `:286` — remover `{renderSimple('contratos-cerc', FileSignature, 'Registro CERC')}`.
- `:12` — remover `FileSignature` do import de `lucide-react`, agora sem uso.

- [ ] **Step 4: Remover do `App`**

- `:448` — remover o `case 'contratos-cerc': return <ContratosCercModule />;`
- `:311` — remover `'contratos-cerc': 'Registro CERC',` do mapa de breadcrumb.
- Remover o import do `ContratosCercModule`.

- [ ] **Step 5: Apagar o módulo**

```bash
cd C:\DEV\ap\ap-front
git rm src/components/ContratosCercModule.tsx
```

- [ ] **Step 6: Confirmar que nada mais o referencia**

Run: `cd C:\DEV\ap\ap-front && grep -rn "ContratosCercModule\|contratos-cerc" src/`
Expected: nenhuma ocorrência

- [ ] **Step 7: Verificar o typecheck**

Run: `cd C:\DEV\ap\ap-front && npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro novo; a contagem total deve ficar igual ou menor que 102

- [ ] **Step 8: Commit**

```bash
cd C:\DEV\ap\ap-front
git add src/components/ClientDetail.tsx src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: contratos CERC dentro do cliente; remove item de menu"
```

---

## Task 11: Verificação de ponta a ponta

**Files:** nenhum.

**Interfaces:**
- Consumes: tudo.
- Produces: o registro do resultado.

- [ ] **Step 1: Subir front e backend**

O backend precisa estar rodando com `IAM_JWT_PUBLIC_KEY` e `IAM_JWT_ISSUER` configurados, ou o front apontando para o Cloud Run já atualizado (Task 4, Step 8). Suba o front:

Run: `cd C:\DEV\ap\ap-front && npm run dev`

O `.env` é lido na inicialização do Vite, então reinicie o dev server depois de qualquer mudança nele.

- [ ] **Step 2: Confirmar o token válido**

```bash
cd C:\DEV\ap\ap-front
TOKEN=$(grep '^VITE_CONTRATOS_DEV_JWT=' .env | cut -d= -f2-)
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  "https://contratos-service-6sy5bhymwq-rj.a.run.app/api/v1/contratos/38138785000136?limit=1"
```

Expected: 200. Um 401 com "token expirado" significa gerar um token novo (Task 5, Step 4).

- [ ] **Step 3: Percorrer o roteiro**

1. Agendas → Ver Radar de um cliente → filtrar por credenciadora e janela → Nova Trava → Garantias: o formulário abre com contratante, credenciadoras, arranjos e datas semeados, e os campos monetários em branco.
2. Submeter e confirmar que o contrato aparece na lista dentro do cliente em Contratos.
3. Abrir o contrato → aba Histórico → verificar o evento de criação e, depois do webhook, o `webhook_recebido`.
4. Forçar uma rejeição estrutural (`cnpjDetentor` diferente do financiador) e confirmar que os códigos de erro da CERC ficam legíveis na timeline.
5. Inativar um contrato `REGISTRADO` a partir do cliente e ver a transição refletida na lista.
6. Confirmar que "Registro CERC" sumiu do menu expandido e do recolhido.
7. Confirmar que a coluna CNPJ da tabela de clientes em Agendas mostra o documento.

- [ ] **Step 4: Registrar o resultado**

Acrescente ao final da spec (`docs/superpowers/specs/2026-09-07-migracao-registro-cerc-design.md`) uma seção "Verificado em <data>" com o que passou, o que falhou, e qualquer desvio do plano — no mesmo estilo das notas "Feito em ..." dos runbooks do agenda.

- [ ] **Step 5: Commit**

```bash
cd C:\DEV\ap\ap-front
git add docs/superpowers/specs/2026-09-07-migracao-registro-cerc-design.md
git commit -m "docs: registra verificacao E2E da migracao do Registro CERC"
```

---

## Pendência deixada em aberto

Spec §10: `GET /api/v1/contratos/<fin>` e `GET /api/v1/contratos/<fin>/<id>` continuam sem autenticação depois deste plano. Com a Task 1 entregue e a Task 5 enviando Bearer em todas as chamadas, fechar isso vira acrescentar `@jwt_required` e a checagem de `financiador_id` às duas views, mais os testes correspondentes. É trabalho de uma sessão curta, e vale agendá-lo em seguida.
