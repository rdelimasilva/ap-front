# Workflow de Opt-in Atualizado

## 📋 Resumo das Alterações

Foi implementado um workflow de dois passos para o processo de opt-in, separando claramente os estados pendentes:

### Antes (1 estado pendente):
```
Criado → Pendente → Assinado
```

### Depois (2 estados pendentes):
```
Criado → Pendente - Aguardando Assinatura → Pendente - Encaminhar p/ Registradora → Assinado
```

---

## 🔄 Fluxo Completo

### 1. **Criação do Opt-in**
- Status inicial: `pending_signature`
- Cor: 🟡 Amarelo
- Ação disponível: **Copiar Link de Assinatura**

**Tela:** OptInModule
**Botão:** "Copiar Link" (cinza)

---

### 2. **Cliente Assina o Opt-in**
- Cliente acessa o link único de assinatura
- Assina digitalmente no canvas
- Status muda para: `pending_registry`
- Cor: 🟡 Amarelo
- Campo `signed_at` é preenchido com timestamp

**Tela:** OptInSignature
**Ação:** Assinatura digital

---

### 3. **Encaminhamento para Registradora**
- Status atual: `pending_registry`
- Ação disponível: **Encaminhar p/ Registradora**
- Após confirmação, status muda para: `signed`
- Cor: 🟢 Verde
- Campo `sent_to_registry_at` é preenchido com timestamp

**Tela:** OptInModule
**Botão:** "Encaminhar p/ Registradora" (amarelo)

---

## 📊 Dashboard de Métricas

O dashboard agora exibe 6 cards:

1. **Total de Clientes** (cinza)
2. **OPTINs Ativos** (verde) - Status `signed`
3. **Pend. Assinatura** (amarelo) - Status `pending_signature`
4. **Pend. Registradora** (amarelo) - Status `pending_registry`
5. **Vencidos** (vermelho) - Status `expired`
6. **Vencem em 30 dias** (laranja) - Ativos próximos ao vencimento

---

## 🎨 Cores dos Status

| Status | Label | Cor | Ícone |
|--------|-------|-----|-------|
| `pending_signature` | Pendente - Aguardando Assinatura | 🟡 Amarelo | Clock |
| `pending_registry` | Pendente - Encaminhar p/ Registradora | 🟡 Amarelo | Clock |
| `signed` | Assinado | 🟢 Verde | CheckCircle |
| `expired` | Vencido | 🔴 Vermelho | XCircle |
| `cancelled` | Cancelado | ⚪ Cinza | AlertTriangle |

---

## 🔘 Botões de Ação por Status

### Status: `pending_signature`
```
[Dados do Opt-In] (azul)  [Copiar Link] (cinza)
```

### Status: `pending_registry`
```
[Dados do Opt-In] (azul)  [Encaminhar p/ Registradora] (amarelo)
```

### Status: `signed`, `expired`, `cancelled`
```
[Dados do Opt-In] (azul)
```

---

## 🗄️ Alterações no Banco de Dados

### Nova Migração: `20251106202820_update_optin_workflow.sql`

**Campo adicionado:**
- `sent_to_registry_at` (timestamptz, nullable) - Data/hora do envio

**Status atualizados:**
- Constraint CHECK modificada para incluir `pending_signature` e `pending_registry`
- Migração automática: `pending` → `pending_signature`

**Políticas RLS atualizadas:**
- Usuários anônimos podem atualizar opt-ins de `pending_signature` para `pending_registry`

---

## 📱 Filtros

O dropdown de filtro de status agora inclui:
- Todos os status
- Pendente - Aguardando Assinatura
- Pendente - Encaminhar p/ Registradora
- Assinado
- Vencido
- Cancelado

---

## ✅ Arquivos Modificados

1. **OptInModule.tsx**
   - Interface `OptInClient` atualizada
   - Funções `getStatusColor`, `getStatusLabel`, `getStatusIcon` atualizadas
   - Novo método `handleSendToRegistry`
   - Dashboard com 6 cards
   - Filtros atualizados
   - Botões condicionais por status

2. **OptInSignature.tsx**
   - Status após assinatura mudado para `pending_registry`

3. **Migração SQL**
   - `supabase/migrations/20251106202820_update_optin_workflow.sql`
   - Novo campo `sent_to_registry_at`
   - Status atualizados no CHECK constraint
   - Políticas RLS ajustadas

---

## 🎯 Benefícios

1. **Visibilidade clara do processo**: Agora é possível distinguir opt-ins aguardando assinatura dos que já foram assinados mas ainda não foram encaminhados

2. **Controle granular**: Equipe pode acompanhar exatamente em que etapa cada opt-in está

3. **Métricas precisas**: Dashboard mostra quantos opt-ins estão em cada fase do processo

4. **Workflow intuitivo**: Botões aparecem apenas quando a ação é possível

5. **Histórico completo**: Campos `signed_at` e `sent_to_registry_at` registram timestamps de cada etapa

---

## 🚀 Próximos Passos Sugeridos

1. **Notificações automáticas**: Enviar email/SMS quando cliente assina
2. **Integração com registradora**: API para envio automático
3. **Relatórios**: Tempo médio em cada etapa do processo
4. **Alertas**: Notificar equipe quando opt-ins ficam muito tempo em `pending_registry`
5. **Bulk actions**: Encaminhar múltiplos opt-ins de uma vez

---

## 📝 Exemplo de Uso

```typescript
// 1. Criar opt-in
const newOptIn = {
  client_name: "Empresa XYZ",
  status: "pending_signature",
  // ... outros campos
};

// 2. Cliente assina (OptInSignature)
// Status muda automaticamente para "pending_registry"

// 3. Equipe encaminha para registradora
handleSendToRegistry(optIn);
// Status muda para "signed"
// sent_to_registry_at é preenchido
```

---

**Implementado em:** 06/11/2024
**Build:** ✅ Sucesso
**Status:** 🚀 Pronto para produção
