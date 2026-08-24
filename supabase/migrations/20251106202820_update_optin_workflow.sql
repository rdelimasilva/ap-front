/*
  # Atualização do Workflow de Opt-in

  ## Alterações

  ### Novos Status
  Altera o campo `status` na tabela `opt_in_requests` para incluir dois estados pendentes:
  - `pending_signature` - Pendente de assinatura do cliente
  - `pending_registry` - Assinado, pendente de encaminhamento para registradora

  Status anterior `pending` é migrado para `pending_signature`.

  ### Novo Campo
  - `sent_to_registry_at` (timestamptz, nullable) - Data/hora do envio para registradora

  ## Workflow Atualizado
  1. Opt-in criado → `pending_signature`
  2. Cliente assina → `pending_registry`
  3. Encaminhado para registradora → `signed`

  ## Segurança
  - Atualiza políticas RLS para novos status
*/

-- Adicionar novo campo sent_to_registry_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opt_in_requests' AND column_name = 'sent_to_registry_at'
  ) THEN
    ALTER TABLE opt_in_requests ADD COLUMN sent_to_registry_at timestamptz;
  END IF;
END $$;

-- Remover constraint antiga
ALTER TABLE opt_in_requests DROP CONSTRAINT IF EXISTS opt_in_requests_status_check;

-- Adicionar nova constraint com status atualizados
ALTER TABLE opt_in_requests
  ADD CONSTRAINT opt_in_requests_status_check
  CHECK (status IN ('pending_signature', 'pending_registry', 'signed', 'expired', 'cancelled'));

-- Migrar dados existentes: 'pending' → 'pending_signature'
UPDATE opt_in_requests
SET status = 'pending_signature'
WHERE status = 'pending';

-- Atualizar políticas RLS para incluir novos status

-- Remover política antiga
DROP POLICY IF EXISTS "Public can update signature by token" ON opt_in_requests;

-- Criar nova política com status atualizados
CREATE POLICY "Public can update signature by token"
  ON opt_in_requests
  FOR UPDATE
  TO anon
  USING (status = 'pending_signature')
  WITH CHECK (status IN ('pending_registry', 'pending_signature'));

-- Criar índice no novo campo para performance
CREATE INDEX IF NOT EXISTS idx_opt_in_sent_to_registry_at
  ON opt_in_requests(sent_to_registry_at)
  WHERE sent_to_registry_at IS NOT NULL;

-- Comentários explicativos
COMMENT ON COLUMN opt_in_requests.status IS 'Status: pending_signature (aguardando assinatura), pending_registry (assinado, pendente de envio para registradora), signed (processo completo), expired (vencido), cancelled (cancelado)';
COMMENT ON COLUMN opt_in_requests.sent_to_registry_at IS 'Data e hora em que o opt-in foi encaminhado para a registradora';
