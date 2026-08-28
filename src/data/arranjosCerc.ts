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
