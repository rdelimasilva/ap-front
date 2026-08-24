/**
 * Ciclo de vida das URs - Eventos da conta corrente
 *
 * 1. Contrato criado - débito (valor do contrato)
 * 2. Liquidação total - crédito (liquidado na data)
 * 3. Liquidação parcial - crédito parcial
 * 4. Não liquidada na data - sem crédito, mantém débito (esperava liquidar, não liquidou)
 * 5. Chargeback - redução do valor
 * 6. Liquidação prevista - futuro, crédito previsto
 * 7. Liquidação prevista com chargeback - futuro, valor caiu, crédito previsto menor
 */

export type ContaCorrenteEvento =
  | 'contrato_criado'
  | 'liquidacao_total'
  | 'liquidacao_parcial'
  | 'nao_liquidada_na_data'
  | 'chargeback'
  | 'liquidacao_prevista'
  | 'liquidacao_prevista_com_chargeback';

export interface ContaCorrenteEntry {
  id: string;
  urId: string;
  contractId: string;
  contractNumber: string;
  merchantId: string;
  cnpj: string;
  nomeEstabelecimento: string;
  acquirer: string;
  cardBrand: string;

  evento: ContaCorrenteEvento;

  /** Valor original da UR quando o contrato foi criado */
  valorEsperado: number;
  /** Valor efetivamente liquidado (para liquidação total ou parcial) */
  valorLiquidado?: number;
  /** Valor atual da UR (após chargebacks, atualização diária) */
  valorAtual: number;
  /** Valor do chargeback quando aplicável */
  chargebackValor?: number;

  /** Data esperada de liquidação (geralmente contrato + 2 dias) */
  dataEsperada: Date;
  /** Data efetiva de liquidação quando ocorreu */
  dataEfetiva?: Date;
  /** Data do chargeback quando ocorreu (para queda acumulada a partir desta data) */
  dataChargeback?: Date;
  /** Data do contrato / evento */
  dataEvento: Date;

  /** true = data futura (liquidação prevista) */
  isFuturo: boolean;

  /** Débito (contrato criado, não liquidada) */
  debito: number;
  /** Crédito (liquidação total, parcial, prevista) */
  credito: number;

  /** Indicação de liquidação parcial */
  isParcial?: boolean;

  /** Valor faltante (não recebido) - exibido na tela, não computado em débito */
  valorFaltante?: number;
}
