import type { ContaCorrenteEntry } from '../types/contaCorrente';

const ESTABLISHMENTS = [
  { merchantId: 'MERCH001', cnpj: '12.345.678/0001-90', nome: 'Loja Centro - Matriz' },
  { merchantId: 'MERCH002', cnpj: '23.456.789/0001-01', nome: 'Loja Norte' },
  { merchantId: 'MERCH029', cnpj: '56.789.012/0001-34', nome: 'Academia Fitness Pro Norte' },
  { merchantId: 'MERCH027', cnpj: '45.678.901/0001-23', nome: 'Farmácia Saúde Total - Loja 1' },
  { merchantId: 'MERCH028', cnpj: '67.890.123/0001-45', nome: 'Loja de Eletrônicos MAX' },
];

const addDays = (d: Date, days: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Gera massa de dados para conta corrente cobrindo todo o ciclo de vida das URs */
export function generateContaCorrenteEntries(referenceDate: Date = new Date()): ContaCorrenteEntry[] {
  const today = toDateOnly(referenceDate);
  const entries: ContaCorrenteEntry[] = [];
  let idSeq = 1;

  const newId = () => `evt-${String(idSeq++).padStart(4, '0')}`;
  const newUrId = (n: number) => `ur-${String(n).padStart(4, '0')}`;

  const est = ESTABLISHMENTS[0]; // Loja Centro
  const contractDate = addDays(today, -35);
  const contractNumber = 'CTR-2024-001';

  // 1. Contrato criado - 10.000 (débito)
  entries.push({
    id: newId(),
    urId: newUrId(101),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'Dock',
    cardBrand: 'Visa',
    evento: 'contrato_criado',
    valorEsperado: 10000,
    valorAtual: 10000,
    dataEsperada: addDays(contractDate, 2),
    dataEvento: contractDate,
    isFuturo: false,
    debito: 10000,
    credito: 0,
  });

  // 2. Liquidação total - UR 102 - crédito 3.500 (liquidou na data)
  const liqDate = addDays(contractDate, 5);
  entries.push({
    id: newId(),
    urId: newUrId(102),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'Cielo',
    cardBrand: 'Mastercard',
    evento: 'liquidacao_total',
    valorEsperado: 3500,
    valorLiquidado: 3500,
    valorAtual: 3500,
    dataEsperada: addDays(contractDate, 2),
    dataEfetiva: liqDate,
    dataEvento: liqDate,
    isFuturo: false,
    debito: 0,
    credito: 3500,
  });

  // 3. Liquidação parcial - UR 103 - esperado 2.000, liquidou 1.200
  const partialDate = addDays(contractDate, 8);
  entries.push({
    id: newId(),
    urId: newUrId(103),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'PagSeguro',
    cardBrand: 'Elo',
    evento: 'liquidacao_parcial',
    valorEsperado: 2000,
    valorLiquidado: 1200,
    valorAtual: 800,
    dataEsperada: addDays(contractDate, 3),
    dataEfetiva: partialDate,
    dataEvento: partialDate,
    isFuturo: false,
    debito: 0,
    credito: 1200,
    isParcial: true,
  });

  // 4. Não liquidada na data - UR 104 - esperava 2.500, não liquidou (mantém débito)
  const notSettledUrDate = addDays(contractDate, 4);
  entries.push({
    id: newId(),
    urId: newUrId(104),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'Stone',
    cardBrand: 'Visa',
    evento: 'nao_liquidada_na_data',
    valorEsperado: 2500,
    valorAtual: 2500,
    dataEsperada: notSettledUrDate,
    dataEvento: notSettledUrDate,
    isFuturo: false,
    debito: 2500,
    credito: 0,
  });

  // 5. Chargeback - UR 105 - era 1.800, chargeback 500, valor atual 1.300
  const cbDate = addDays(contractDate, 12);
  entries.push({
    id: newId(),
    urId: newUrId(105),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'Dock',
    cardBrand: 'Mastercard',
    evento: 'chargeback',
    valorEsperado: 1800,
    valorAtual: 1300,
    chargebackValor: 500,
    dataEsperada: addDays(contractDate, 2),
    dataEvento: cbDate,
    isFuturo: false,
    debito: 500,
    credito: 0,
  });

  // 6. Liquidação prevista - UR 106 - futuro, 4.000
  const futureDate = addDays(today, 3);
  entries.push({
    id: newId(),
    urId: newUrId(106),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'Cielo',
    cardBrand: 'Elo',
    evento: 'liquidacao_prevista',
    valorEsperado: 4000,
    valorAtual: 4000,
    dataEsperada: futureDate,
    dataEvento: contractDate,
    isFuturo: true,
    debito: 0,
    credito: 4000,
  });

  // 7. Liquidação prevista com chargeback - UR 107 - esperado 4.000, chargeback 500, atual 3.500
  const futureCbDate = addDays(today, 5);
  entries.push({
    id: newId(),
    urId: newUrId(107),
    contractId: '1',
    contractNumber,
    merchantId: est.merchantId,
    cnpj: est.cnpj,
    nomeEstabelecimento: est.nome,
    acquirer: 'PagSeguro',
    cardBrand: 'Visa',
    evento: 'liquidacao_prevista_com_chargeback',
    valorEsperado: 4000,
    valorAtual: 3500,
    chargebackValor: 500,
    dataEsperada: futureCbDate,
    dataEvento: contractDate,
    isFuturo: true,
    debito: 0,
    credito: 3500,
  });

  // --- Academia Fitness Pro Norte (mais eventos) ---
  const est2 = ESTABLISHMENTS[2];
  const contractDate2 = addDays(today, -20);

  entries.push({
    id: newId(),
    urId: newUrId(201),
    contractId: '2',
    contractNumber: 'CTR-2024-002',
    merchantId: est2.merchantId,
    cnpj: est2.cnpj,
    nomeEstabelecimento: est2.nome,
    acquirer: 'PagSeguro',
    cardBrand: 'Elo',
    evento: 'contrato_criado',
    valorEsperado: 7500,
    valorAtual: 7500,
    dataEsperada: addDays(contractDate2, 2),
    dataEvento: contractDate2,
    isFuturo: false,
    debito: 7500,
    credito: 0,
  });

  entries.push({
    id: newId(),
    urId: newUrId(202),
    contractId: '2',
    contractNumber: 'CTR-2024-002',
    merchantId: est2.merchantId,
    cnpj: est2.cnpj,
    nomeEstabelecimento: est2.nome,
    acquirer: 'Dock',
    cardBrand: 'Mastercard',
    evento: 'liquidacao_total',
    valorEsperado: 750,
    valorLiquidado: 750,
    valorAtual: 750,
    dataEsperada: addDays(contractDate2, 2),
    dataEfetiva: addDays(contractDate2, 2),
    dataEvento: addDays(contractDate2, 2),
    isFuturo: false,
    debito: 0,
    credito: 750,
  });

  entries.push({
    id: newId(),
    urId: newUrId(203),
    contractId: '2',
    contractNumber: 'CTR-2024-002',
    merchantId: est2.merchantId,
    cnpj: est2.cnpj,
    nomeEstabelecimento: est2.nome,
    acquirer: 'Cielo',
    cardBrand: 'Visa',
    evento: 'liquidacao_prevista',
    valorEsperado: 2500,
    valorAtual: 2500,
    dataEsperada: addDays(today, 7),
    dataEvento: contractDate2,
    isFuturo: true,
    debito: 0,
    credito: 2500,
  });

  // --- Farmácia Saúde Total ---
  const est3 = ESTABLISHMENTS[3];
  const contractDate3 = addDays(today, -15);

  entries.push({
    id: newId(),
    urId: newUrId(301),
    contractId: '3',
    contractNumber: 'CTR-2024-003',
    merchantId: est3.merchantId,
    cnpj: est3.cnpj,
    nomeEstabelecimento: est3.nome,
    acquirer: 'Stone',
    cardBrand: 'Elo',
    evento: 'contrato_criado',
    valorEsperado: 15000,
    valorAtual: 15000,
    dataEsperada: addDays(contractDate3, 2),
    dataEvento: contractDate3,
    isFuturo: false,
    debito: 15000,
    credito: 0,
  });

  entries.push({
    id: newId(),
    urId: newUrId(302),
    contractId: '3',
    contractNumber: 'CTR-2024-003',
    merchantId: est3.merchantId,
    cnpj: est3.cnpj,
    nomeEstabelecimento: est3.nome,
    acquirer: 'Rede',
    cardBrand: 'Mastercard',
    evento: 'liquidacao_parcial',
    valorEsperado: 5000,
    valorLiquidado: 3000,
    valorAtual: 2000,
    dataEsperada: addDays(contractDate3, 3),
    dataEfetiva: addDays(contractDate3, 4),
    dataEvento: addDays(contractDate3, 4),
    isFuturo: false,
    debito: 0,
    credito: 3000,
    isParcial: true,
  });

  entries.push({
    id: newId(),
    urId: newUrId(303),
    contractId: '3',
    contractNumber: 'CTR-2024-003',
    merchantId: est3.merchantId,
    cnpj: est3.cnpj,
    nomeEstabelecimento: est3.nome,
    acquirer: 'Dock',
    cardBrand: 'Visa',
    evento: 'liquidacao_prevista_com_chargeback',
    valorEsperado: 6000,
    valorAtual: 5200,
    chargebackValor: 800,
    dataEsperada: addDays(today, 4),
    dataEvento: contractDate3,
    isFuturo: true,
    debito: 0,
    credito: 5200,
  });

  // --- Loja Norte ---
  const est4 = ESTABLISHMENTS[1];
  const contractDate4 = addDays(today, -10);

  entries.push({
    id: newId(),
    urId: newUrId(401),
    contractId: '4',
    contractNumber: 'CTR-2024-004',
    merchantId: est4.merchantId,
    cnpj: est4.cnpj,
    nomeEstabelecimento: est4.nome,
    acquirer: 'Cielo',
    cardBrand: 'Mastercard',
    evento: 'contrato_criado',
    valorEsperado: 8000,
    valorAtual: 8000,
    dataEsperada: addDays(contractDate4, 2),
    dataEvento: contractDate4,
    isFuturo: false,
    debito: 8000,
    credito: 0,
  });

  entries.push({
    id: newId(),
    urId: newUrId(402),
    contractId: '4',
    contractNumber: 'CTR-2024-004',
    merchantId: est4.merchantId,
    cnpj: est4.cnpj,
    nomeEstabelecimento: est4.nome,
    acquirer: 'PagSeguro',
    cardBrand: 'Elo',
    evento: 'nao_liquidada_na_data',
    valorEsperado: 1500,
    valorAtual: 1500,
    dataEsperada: addDays(contractDate4, 2),
    dataEvento: addDays(contractDate4, 2),
    isFuturo: false,
    debito: 1500,
    credito: 0,
  });

  return entries;
}

export const mockContaCorrenteEntries = generateContaCorrenteEntries();

export const getEstablishmentsFromEntries = () => {
  const map = new Map<string, { merchantId: string; cnpj: string; nome: string }>();
  mockContaCorrenteEntries.forEach((e) => {
    if (!map.has(e.merchantId)) map.set(e.merchantId, { merchantId: e.merchantId, cnpj: e.cnpj, nome: e.nomeEstabelecimento });
  });
  return Array.from(map.values());
};
