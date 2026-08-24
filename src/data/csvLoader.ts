import type { Receivable, Contract, Client } from '../types';
import type { ContaCorrenteEntry, ContaCorrenteEvento } from '../types/contaCorrente';

export interface LiquidationProblemUr {
  id: string;
  contractId: string;
  client: string;
  acquirer: string;
  brand: string;
  expectedDate: string;
  actualDate: string | null;
  expectedAmount: number;
  realizedAmount: number;
  status: 'not_settled' | 'delayed' | 'partial';
}

export function getEstablishmentsFromEntries(entries: ContaCorrenteEntry[]): { merchantId: string; cnpj: string; nome: string }[] {
  const map = new Map<string, { merchantId: string; cnpj: string; nome: string }>();
  entries.forEach((e) => {
    if (!map.has(e.merchantId)) map.set(e.merchantId, { merchantId: e.merchantId, cnpj: e.cnpj, nome: e.nomeEstabelecimento });
  });
  return Array.from(map.values());
}

export interface LoadedData {
  receivables: Receivable[];
  contracts: Contract[];
  clients: Client[];
  contaCorrenteEntries: ContaCorrenteEntry[];
  liquidationProblems: LiquidationProblemUr[];
}

interface CsvRow {
  estabelecimento_cnpj: string;
  estabelecimento_nome: string;
  contrato_id: string;
  contrato_numero: string;
  data_inicio?: string;
  data_fim?: string;
  ur_id: string;
  client_id: string;
  merchant_id: string;
  credenciadora: string;
  bandeira: string;
  data_contrato: string;
  data_liquidacao_esperada: string;
  data_liquidacao_efetiva: string;
  tipo_evento: string;
  valor_ur_original: string;
  valor_ur_atual: string;
  valor_esperado: string;
  valor_liquidado: string;
  valor_chargeback: string;
  eh_futuro: string;
  chargeback_data: string;
  chargeback_motivo: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }

  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const output: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === 1 && values[0].trim() === '') continue;
    const record: Record<string, string> = {};
    headers.forEach((h, j) => {
      record[h] = values[j]?.trim() ?? '';
    });
    output.push(record);
  }
  return output;
}

function mapTipoEventoToContaCorrente(tipo: string, valorChargeback: number, ehFuturo: boolean): ContaCorrenteEvento {
  switch (tipo) {
    case 'LIQUIDACAO_TOTAL':
      return 'liquidacao_total';
    case 'LIQUIDACAO_PARCIAL':
      return 'liquidacao_parcial';
    case 'NAO_LIQUIDADA':
      return 'nao_liquidada_na_data';
    case 'CHARGEBACK_PRE_LIQUIDACAO':
    case 'CHARGEBACK_POS_LIQUIDACAO':
      return 'chargeback';
    case 'UR_PREVISTA':
      return ehFuturo && valorChargeback > 0 ? 'liquidacao_prevista_com_chargeback' : 'liquidacao_prevista';
    default:
      return 'liquidacao_total';
  }
}

function toReceivableStatus(tipo: string): Receivable['status'] {
  switch (tipo) {
    case 'LIQUIDACAO_TOTAL':
      return 'settled';
    case 'LIQUIDACAO_PARCIAL':
      return 'encumbered';
    case 'NAO_LIQUIDADA':
      return 'available';
    case 'CHARGEBACK_PRE_LIQUIDACAO':
    case 'CHARGEBACK_POS_LIQUIDACAO':
      return 'chargeback';
    case 'UR_PREVISTA':
      return 'encumbered';
    default:
      return 'pending';
  }
}

interface ContratoCsvRow {
  contrato_id: string;
  contrato_numero: string;
  valor_total: string;
  [key: string]: string;
}

function getCsvUrl(filename: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/${filename}`.replace(/\/+/g, '/');
}

export async function loadDataFromCsv(): Promise<LoadedData> {
  const res = await fetch(getCsvUrl('massa_ur.csv'));
  if (!res.ok) throw new Error(`CSV not found: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const rows = parseCsv(text) as unknown as CsvRow[];

  // Carrega dados explícitos de contrato (valor_total = meta) quando disponível
  const contratosExplicitos = new Map<string, number>();
  try {
    const resContratos = await fetch(getCsvUrl('massa_contratos.csv'));
    if (resContratos.ok) {
      const textContratos = await resContratos.text();
      const rowsContratos = parseCsv(textContratos) as unknown as ContratoCsvRow[];
      for (const r of rowsContratos) {
        const val = parseFloat(r.valor_total) || 0;
        if (val > 0) contratosExplicitos.set(r.contrato_id, val);
      }
    }
  } catch {
    // massa_contratos.csv opcional - usa soma das URs como fallback
  }

  const num = (s: string) => parseFloat(s) || 0;
  const date = (s: string) => {
    if (!s) return new Date(0);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  const contaCorrenteEntries: ContaCorrenteEntry[] = [];
  const receivables: Receivable[] = [];
  const contractSums = new Map<
    string,
    {
      requested: number;
      encumbered: number;
      clientId: string;
      contractNumber: string;
      merchantId: string;
      clientName: string;
      createdAt: Date;
      dataInicio: Date;
      dataFim: Date;
      cnpj: string;
      acquirer: string;
      cardBrand: string;
    }
  >();
  const clientMap = new Map<string, { id: string; name: string; document: string }>();
  const liquidationProblems: LiquidationProblemUr[] = [];
  let entryId = 0;
  const newEntryId = () => `evt-${String(++entryId).padStart(5, '0')}`;

  for (const r of rows) {
    const valorOriginal = num(r.valor_ur_original);
    const valorAtual = num(r.valor_ur_atual);
    const valorLiquidado = num(r.valor_liquidado);
    const valorChargeback = num(r.valor_chargeback);
    const ehFuturo = r.eh_futuro === 'True' || r.eh_futuro === 'true';

    if (!clientMap.has(r.client_id)) {
      clientMap.set(r.client_id, {
        id: r.client_id,
        name: r.estabelecimento_nome,
        document: r.estabelecimento_cnpj,
      });
    }

    const dataContrato = date(r.data_contrato);
    const dataInicio = r.data_inicio ? date(r.data_inicio) : dataContrato;
    const dataFim = r.data_fim ? date(r.data_fim) : dataContrato;
    const sum = contractSums.get(r.contrato_id);
    const valorForEncumbered =
      r.tipo_evento === 'LIQUIDACAO_PARCIAL' && valorLiquidado > 0 ? valorLiquidado : valorAtual;
    if (!sum) {
      contractSums.set(r.contrato_id, {
        requested: valorOriginal,
        encumbered: valorForEncumbered,
        clientId: r.client_id,
        contractNumber: r.contrato_numero,
        merchantId: r.merchant_id,
        clientName: r.estabelecimento_nome,
        createdAt: dataContrato,
        dataInicio,
        dataFim,
        cnpj: r.estabelecimento_cnpj,
        acquirer: r.credenciadora,
        cardBrand: r.bandeira,
      });
    } else {
      sum.requested += valorOriginal;
      sum.encumbered += valorForEncumbered;
      if (dataContrato < sum.createdAt) sum.createdAt = dataContrato;
    }

    const dataEfetivaPreenchida = valorLiquidado > 0 && !!r.data_liquidacao_efetiva;

    const evento = mapTipoEventoToContaCorrente(r.tipo_evento, valorChargeback, ehFuturo);

    // Para liquidacao_parcial, valorAtual = valor efetivamente recebido (valorLiquidado)
    const valorAtualFinal =
      evento === 'liquidacao_parcial' && valorLiquidado > 0 ? valorLiquidado : valorAtual;

    const contaEntry: ContaCorrenteEntry = {
      id: newEntryId(),
      urId: r.ur_id,
      contractId: r.contrato_id,
      contractNumber: r.contrato_numero,
      merchantId: r.merchant_id,
      cnpj: r.estabelecimento_cnpj,
      nomeEstabelecimento: r.estabelecimento_nome,
      acquirer: r.credenciadora,
      cardBrand: r.bandeira,
      evento,
      valorEsperado: num(r.valor_esperado),
      valorLiquidado: valorLiquidado > 0 ? valorLiquidado : undefined,
      valorAtual: valorAtualFinal,
      chargebackValor: valorChargeback > 0 ? valorChargeback : undefined,
      valorFaltante:
        evento === 'nao_liquidada_na_data'
          ? valorOriginal
          : evento === 'liquidacao_parcial'
            ? valorOriginal - valorLiquidado
            : evento === 'chargeback'
              ? valorChargeback
              : evento === 'liquidacao_prevista_com_chargeback'
                ? valorChargeback
                : undefined,
      dataEsperada: date(r.data_liquidacao_esperada),
      dataEfetiva: dataEfetivaPreenchida ? date(r.data_liquidacao_efetiva) : undefined,
      dataChargeback: r.chargeback_data ? date(r.chargeback_data) : undefined,
      dataEvento: date(r.data_contrato),
      isFuturo: ehFuturo,
      debito: 0,
      credito: evento === 'liquidacao_total' ? valorLiquidado : evento === 'liquidacao_parcial' ? valorLiquidado : evento === 'chargeback' ? valorAtualFinal : evento.startsWith('liquidacao_prevista') ? valorAtualFinal : 0,
      isParcial: evento === 'liquidacao_parcial',
    };
    contaCorrenteEntries.push(contaEntry);

    receivables.push({
      id: r.ur_id,
      contractId: r.contrato_id,
      acquirer: r.credenciadora,
      cardBrand: r.bandeira,
      transactionDate: date(r.data_contrato),
      settlementDate: date(r.data_liquidacao_esperada),
      settledAt: valorLiquidado > 0 ? date(r.data_liquidacao_efetiva) : undefined,
      originalValue: valorOriginal,
      encumberedValue: valorAtual,
      status: toReceivableStatus(r.tipo_evento),
      merchantId: r.merchant_id,
      terminalId: `TERM-${r.ur_id.slice(0, 8)}`,
      authorizationCode: `AUTH-${r.ur_id.slice(0, 8)}`,
      nsu: `NSU-${r.ur_id.slice(0, 8)}`,
      installments: 1,
      installmentNumber: 1,
      fee: 0,
      netValue: valorAtual,
      chargebackDate: r.chargeback_data ? date(r.chargeback_data) : undefined,
      chargebackReason: r.chargeback_motivo || undefined,
      operationType: 'debit',
    });

    if (r.tipo_evento === 'NAO_LIQUIDADA' || r.tipo_evento === 'LIQUIDACAO_PARCIAL') {
      liquidationProblems.push({
        id: r.ur_id,
        contractId: r.contrato_numero,
        client: r.estabelecimento_nome,
        acquirer: r.credenciadora,
        brand: r.bandeira,
        expectedDate: r.data_liquidacao_esperada,
        actualDate: r.data_liquidacao_efetiva && valorLiquidado > 0 ? r.data_liquidacao_efetiva : null,
        expectedAmount: valorOriginal,
        realizedAmount: valorLiquidado,
        status: r.tipo_evento === 'NAO_LIQUIDADA' ? 'not_settled' : 'partial',
      });
    }
  }

  for (const [contractId, s] of contractSums.entries()) {
    const firstRow = rows.find((r) => r.contrato_id === contractId);
    if (!firstRow) continue;
    const valorTotal = contratosExplicitos.get(contractId) ?? s.requested;
    const contratoCriadoEntry: ContaCorrenteEntry = {
      id: newEntryId(),
      urId: '',
      contractId,
      contractNumber: s.contractNumber,
      merchantId: s.merchantId,
      cnpj: s.cnpj,
      nomeEstabelecimento: s.clientName,
      acquirer: s.acquirer,
      cardBrand: s.cardBrand,
      evento: 'contrato_criado',
      valorEsperado: valorTotal,
      valorAtual: valorTotal,
      dataEsperada: s.dataInicio,
      dataEvento: s.dataInicio,
      isFuturo: false,
      debito: valorTotal,
      credito: 0,
    };
    contaCorrenteEntries.push(contratoCriadoEntry);
  }

  contaCorrenteEntries.sort((a, b) => {
    const cmpMerchant = a.merchantId.localeCompare(b.merchantId);
    if (cmpMerchant !== 0) return cmpMerchant;
    const dateA = a.evento === 'contrato_criado' ? a.dataEvento : (a.dataEfetiva ?? a.dataEsperada ?? a.dataEvento);
    const dateB = b.evento === 'contrato_criado' ? b.dataEvento : (b.dataEfetiva ?? b.dataEsperada ?? b.dataEvento);
    const cmpDate = dateA.getTime() - dateB.getTime();
    if (cmpDate !== 0) return cmpDate;
    const orderEvento: Record<ContaCorrenteEvento, number> = {
      contrato_criado: 0,
      liquidacao_total: 1,
      liquidacao_parcial: 2,
      nao_liquidada_na_data: 3,
      chargeback: 4,
      liquidacao_prevista: 5,
      liquidacao_prevista_com_chargeback: 6,
    };
    return orderEvento[a.evento] - orderEvento[b.evento];
  });

  const contractEntries = Array.from(contractSums.entries());
  const contracts: Contract[] = contractEntries.map(([id, s], idx) => {
    const valorBase = contratosExplicitos.get(id) ?? s.requested;
    // Escala para garantir volumes na casa dos milhões (mín ~2mm por contrato)
    const boost = [3.2, 2.8, 3.5, 2.5, 3.0, 2.6, 3.8][idx % 7];
    const valorTotal = Math.max(valorBase * boost, 2_000_000);
    // Make ~30% of contracts pending_approval so the approval board has data
    const status = idx % 3 === 0 ? 'pending_approval' as const : 'active' as const;
    const productTypes: Contract['productType'][] = ['guarantee', 'extra-limit', 'debt-settlement', 'anticipation'];
    return {
      id,
      clientId: s.clientId,
      contractNumber: s.contractNumber,
      status,
      hasRevolvency: idx % 2 === 0,
      productType: productTypes[idx % productTypes.length],
      createdAt: s.createdAt,
      startDate: s.dataInicio,
      endDate: s.dataFim,
      hasAutomaticCapture: true,
      operationMode: 'both' as const,
      hasRecaptureTrigger: false,
      requestedValue: valorTotal,
      expectedSettlementValue: valorTotal * ([0.88, 0.82, 0.91, 0.78, 0.85, 0.80, 0.93][idx % 7]),
      encumberedValue: valorTotal * ([0.72, 0.65, 0.75, 0.60, 0.68, 0.63, 0.77][idx % 7]),
      actualSettlementValue: valorTotal * ([0.55, 0.48, 0.58, 0.42, 0.52, 0.45, 0.60][idx % 7]),
      acquirers: [
        ['Cielo', 'Stone', 'Rede', 'PagSeguro', 'Dock', 'Getnet', 'Safrapay'][idx % 7],
        ...( idx % 3 === 0 ? [['Stone', 'Dock', 'Rede'][idx % 3]] : []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      cardBrands: [
        ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'Amex'][idx % 5],
        ['Mastercard', 'Visa', 'Elo', 'Hipercard', 'Amex'][(idx + 1) % 5],
      ].filter((v, i, a) => a.indexOf(v) === i),
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 },
      operations: [],
      requiredApprovals: status === 'pending_approval' && idx % 2 === 0 ? 2 : 1,
      approvals: [],
    };
  });

  // 10 contratos extras pendentes de aprovação para popular o board
  const pendingExtras: Contract[] = [
    {
      id: 'pnd-1', clientId: 'extra-1', contractNumber: 'CTR-2025-GAR-101', status: 'pending_approval',
      hasRevolvency: true, productType: 'guarantee', startDate: new Date('2025-02-10'), endDate: new Date('2025-08-10'),
      hasAutomaticCapture: true, operationMode: 'credit', hasRecaptureTrigger: true,
      createdAt: new Date('2025-02-08'), requestedValue: 1_850_000,
      expectedSettlementValue: 1_628_000, encumberedValue: 1_332_000, actualSettlementValue: 0,
      acquirers: ['Cielo', 'Stone'], cardBrands: ['Visa', 'Mastercard'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 1, approvals: [],
    },
    {
      id: 'pnd-2', clientId: 'extra-2', contractNumber: 'CTR-2025-CP-102', status: 'pending_approval',
      hasRevolvency: false, productType: 'extra-limit', startDate: new Date('2025-02-12'), endDate: new Date('2025-05-12'),
      hasAutomaticCapture: false, operationMode: 'debit', hasRecaptureTrigger: false,
      createdAt: new Date('2025-02-10'), requestedValue: 750_000,
      expectedSettlementValue: 660_000, encumberedValue: 540_000, actualSettlementValue: 0,
      acquirers: ['Rede', 'PagSeguro'], cardBrands: ['Elo', 'Hipercard'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 2, approvals: [],
    },
    {
      id: 'pnd-3', clientId: 'extra-4', contractNumber: 'CTR-2025-QD-103', status: 'pending_approval',
      hasRevolvency: false, productType: 'debt-settlement', startDate: new Date('2025-02-15'), endDate: new Date('2025-04-15'),
      hasAutomaticCapture: true, operationMode: 'both', hasRecaptureTrigger: false,
      createdAt: new Date('2025-02-13'), requestedValue: 2_400_000,
      expectedSettlementValue: 2_112_000, encumberedValue: 1_728_000, actualSettlementValue: 0,
      acquirers: ['Cielo', 'Getnet', 'Stone'], cardBrands: ['Visa', 'Mastercard', 'Elo'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 2, approvals: [
        { id: 'apv-pnd3-1', approverName: 'Carlos Mendes', approverRole: 'Analista de Crédito', approvedAt: new Date('2025-02-14T09:15:00') },
      ],
    },
    {
      id: 'pnd-4', clientId: 'extra-5', contractNumber: 'CTR-2025-ANT-104', status: 'pending_approval',
      hasRevolvency: false, productType: 'anticipation', startDate: new Date('2025-02-18'), endDate: new Date('2025-03-18'),
      hasAutomaticCapture: false, operationMode: 'credit', hasRecaptureTrigger: false,
      createdAt: new Date('2025-02-16'), requestedValue: 3_200_000,
      expectedSettlementValue: 2_816_000, encumberedValue: 2_304_000, actualSettlementValue: 0,
      acquirers: ['Stone', 'Safrapay'], cardBrands: ['Visa', 'Amex'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 1, approvals: [],
    },
    {
      id: 'pnd-5', clientId: 'extra-6', contractNumber: 'CTR-2025-GAR-105', status: 'pending_approval',
      hasRevolvency: true, productType: 'guarantee', startDate: new Date('2025-02-20'), endDate: new Date('2025-11-20'),
      hasAutomaticCapture: true, operationMode: 'both', hasRecaptureTrigger: true,
      createdAt: new Date('2025-02-18'), requestedValue: 5_100_000,
      expectedSettlementValue: 4_488_000, encumberedValue: 3_672_000, actualSettlementValue: 0,
      acquirers: ['Cielo', 'Rede', 'Dock'], cardBrands: ['Visa', 'Mastercard', 'Hipercard'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 2, approvals: [],
    },
    {
      id: 'pnd-6', clientId: 'extra-8', contractNumber: 'CTR-2025-CP-106', status: 'pending_approval',
      hasRevolvency: false, productType: 'extra-limit', startDate: new Date('2025-02-22'), endDate: new Date('2025-06-22'),
      hasAutomaticCapture: true, operationMode: 'credit', hasRecaptureTrigger: false,
      createdAt: new Date('2025-02-20'), requestedValue: 980_000,
      expectedSettlementValue: 862_400, encumberedValue: 705_600, actualSettlementValue: 0,
      acquirers: ['PagSeguro', 'Getnet'], cardBrands: ['Mastercard', 'Elo'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 1, approvals: [],
    },
    {
      id: 'pnd-7', clientId: 'extra-9', contractNumber: 'CTR-2025-ANT-107', status: 'pending_approval',
      hasRevolvency: false, productType: 'anticipation', startDate: new Date('2025-02-25'), endDate: new Date('2025-04-25'),
      hasAutomaticCapture: false, operationMode: 'debit', hasRecaptureTrigger: false,
      createdAt: new Date('2025-02-23'), requestedValue: 1_500_000,
      expectedSettlementValue: 1_320_000, encumberedValue: 1_080_000, actualSettlementValue: 0,
      acquirers: ['Stone', 'Cielo'], cardBrands: ['Visa', 'Mastercard'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 2, approvals: [
        { id: 'apv-pnd7-1', approverName: 'Ana Silva', approverRole: 'Gerente de Operações', approvedAt: new Date('2025-02-24T14:30:00') },
      ],
    },
    {
      id: 'pnd-8', clientId: 'extra-11', contractNumber: 'CTR-2025-QD-108', status: 'pending_approval',
      hasRevolvency: false, productType: 'debt-settlement', startDate: new Date('2025-02-26'), endDate: new Date('2025-05-26'),
      hasAutomaticCapture: true, operationMode: 'both', hasRecaptureTrigger: true,
      createdAt: new Date('2025-02-24'), requestedValue: 4_200_000,
      expectedSettlementValue: 3_696_000, encumberedValue: 3_024_000, actualSettlementValue: 0,
      acquirers: ['Rede', 'Dock', 'Safrapay'], cardBrands: ['Visa', 'Elo', 'Amex'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 1, approvals: [],
    },
    {
      id: 'pnd-9', clientId: 'extra-14', contractNumber: 'CTR-2025-GAR-109', status: 'pending_approval',
      hasRevolvency: true, productType: 'guarantee', startDate: new Date('2025-03-01'), endDate: new Date('2025-09-01'),
      hasAutomaticCapture: true, operationMode: 'credit', hasRecaptureTrigger: false,
      createdAt: new Date('2025-02-26'), requestedValue: 2_750_000,
      expectedSettlementValue: 2_420_000, encumberedValue: 1_980_000, actualSettlementValue: 0,
      acquirers: ['Cielo', 'Stone', 'Getnet'], cardBrands: ['Visa', 'Mastercard'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 2, approvals: [],
    },
    {
      id: 'pnd-10', clientId: 'extra-15', contractNumber: 'CTR-2025-ANT-110', status: 'pending_approval',
      hasRevolvency: false, productType: 'anticipation', startDate: new Date('2025-03-03'), endDate: new Date('2025-04-03'),
      hasAutomaticCapture: false, operationMode: 'credit', hasRecaptureTrigger: false,
      createdAt: new Date('2025-03-01'), requestedValue: 6_300_000,
      expectedSettlementValue: 5_544_000, encumberedValue: 4_536_000, actualSettlementValue: 0,
      acquirers: ['Cielo', 'Rede', 'PagSeguro', 'Stone'], cardBrands: ['Visa', 'Mastercard', 'Elo', 'Hipercard'],
      chargeback: { quantity: 0, totalValue: 0, percentage: 0 }, operations: [],
      requiredApprovals: 1, approvals: [],
    },
  ];

  contracts.push(...pendingExtras);

  const csvClients: Client[] = Array.from(clientMap.values()).map((c) => ({
    ...c,
    email: '',
    phone: '',
    status: 'active' as const,
    totalLimit: 1000000,
    usedLimit: 500000,
    availableLimit: 500000,
    collateralValue: 400000,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Clientes complementares para preencher a listagem
  const extraClients: Client[] = [
    { id: 'extra-1', name: 'Grupo Minas Empreendimentos', document: '67.123.456/0001-55', email: 'financeiro@grupominas.com.br', phone: '(31) 3456-7890', status: 'active', totalLimit: 520000, usedLimit: 340000, availableLimit: 180000, collateralValue: 420000, createdAt: new Date('2025-03-10'), updatedAt: new Date('2025-01-15') },
    { id: 'extra-2', name: 'Eletro Sul Distribuidora', document: '78.234.567/0001-66', email: 'compras@eletrosul.com', phone: '(48) 2345-6789', status: 'active', totalLimit: 390000, usedLimit: 210000, availableLimit: 180000, collateralValue: 310000, createdAt: new Date('2025-06-22'), updatedAt: new Date('2025-01-14') },
    { id: 'extra-3', name: 'Papelaria Mega Brasil', document: '89.345.678/0001-77', email: 'contato@papelariamega.com.br', phone: '(11) 1234-0000', status: 'pending', totalLimit: 110000, usedLimit: 42000, availableLimit: 68000, collateralValue: 65000, createdAt: new Date('2025-11-05'), updatedAt: new Date('2025-01-13') },
    { id: 'extra-4', name: 'Auto Peças Continental', document: '90.456.789/0001-88', email: 'vendas@autopecascontinental.com', phone: '(21) 9876-1234', status: 'active', totalLimit: 440000, usedLimit: 275000, availableLimit: 165000, collateralValue: 350000, createdAt: new Date('2025-04-18'), updatedAt: new Date('2025-01-15') },
    { id: 'extra-5', name: 'Agro Nordeste S.A.', document: '01.567.890/0001-99', email: 'diretoria@agronordeste.com.br', phone: '(85) 8765-4321', status: 'active', totalLimit: 680000, usedLimit: 490000, availableLimit: 190000, collateralValue: 550000, createdAt: new Date('2025-01-30'), updatedAt: new Date('2025-01-14') },
    { id: 'extra-6', name: 'Rede Supermercados Bom Preço', document: '12.678.901/0001-10', email: 'financeiro@bompreco.com', phone: '(81) 7654-3210', status: 'active', totalLimit: 870000, usedLimit: 620000, availableLimit: 250000, collateralValue: 710000, createdAt: new Date('2025-02-14'), updatedAt: new Date('2025-01-15') },
    { id: 'extra-7', name: 'Transportes Rápido Ltda.', document: '23.789.012/0001-21', email: 'operacoes@transportesrapido.com', phone: '(41) 6543-2109', status: 'inactive', totalLimit: 200000, usedLimit: 60000, availableLimit: 140000, collateralValue: 95000, createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-01-10') },
    { id: 'extra-8', name: 'Clínica Saúde Total', document: '34.890.123/0001-32', email: 'adm@saudetotal.com.br', phone: '(11) 5432-1098', status: 'active', totalLimit: 260000, usedLimit: 155000, availableLimit: 105000, collateralValue: 195000, createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-01-13') },
    { id: 'extra-9', name: 'Metalúrgica Aço Forte', document: '45.901.234/0001-43', email: 'contato@acoforte.com.br', phone: '(19) 4321-0987', status: 'active', totalLimit: 560000, usedLimit: 380000, availableLimit: 180000, collateralValue: 460000, createdAt: new Date('2025-05-03'), updatedAt: new Date('2025-01-14') },
    { id: 'extra-10', name: 'Editora Saber Mais', document: '56.012.345/0001-54', email: 'comercial@sabermais.com', phone: '(11) 3210-9876', status: 'pending', totalLimit: 130000, usedLimit: 48000, availableLimit: 82000, collateralValue: 75000, createdAt: new Date('2025-12-01'), updatedAt: new Date('2025-01-11') },
    { id: 'extra-11', name: 'Energia Solar Brasil S.A.', document: '67.123.456/0001-65', email: 'projetos@energiasolarbr.com.br', phone: '(31) 2109-8765', status: 'active', totalLimit: 720000, usedLimit: 510000, availableLimit: 210000, collateralValue: 600000, createdAt: new Date('2025-03-28'), updatedAt: new Date('2025-01-15') },
    { id: 'extra-12', name: 'Hotelaria Litoral Ltda.', document: '78.234.567/0001-76', email: 'reservas@hotelarialitoral.com', phone: '(47) 1098-7654', status: 'active', totalLimit: 310000, usedLimit: 185000, availableLimit: 125000, collateralValue: 240000, createdAt: new Date('2025-08-20'), updatedAt: new Date('2025-01-12') },
    { id: 'extra-13', name: 'Plásticos Recicla Verde', document: '89.345.678/0001-87', email: 'sustentabilidade@reciclaverde.com', phone: '(11) 0987-6543', status: 'inactive', totalLimit: 175000, usedLimit: 50000, availableLimit: 125000, collateralValue: 80000, createdAt: new Date('2025-10-15'), updatedAt: new Date('2025-01-09') },
    { id: 'extra-14', name: 'Consultoria Stratego', document: '90.456.789/0001-98', email: 'parceiros@stratego.com.br', phone: '(11) 9876-0000', status: 'active', totalLimit: 450000, usedLimit: 290000, availableLimit: 160000, collateralValue: 370000, createdAt: new Date('2025-06-10'), updatedAt: new Date('2025-01-14') },
    { id: 'extra-15', name: 'Frigorífico Pampa S.A.', document: '01.567.890/0001-09', email: 'exportacao@frigorificopampa.com.br', phone: '(51) 8765-0000', status: 'active', totalLimit: 920000, usedLimit: 680000, availableLimit: 240000, collateralValue: 780000, createdAt: new Date('2025-01-20'), updatedAt: new Date('2025-01-15') },
  ];

  const clients = [...csvClients, ...extraClients];

  return {
    receivables,
    contracts,
    clients,
    contaCorrenteEntries,
    liquidationProblems,
  };
}
