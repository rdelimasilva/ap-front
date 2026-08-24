export interface Client {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  collateralValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  type: 'guarantee' | 'extra-limit' | 'debt-settlement' | 'anticipation';
  description: string;
  clientsCount: number;
  totalValue: number;
  activeOperations: number;
}

export interface DashboardMetrics {
  totalLimitGranted: number;
  limitUsed: number;
  totalGuarantees: number;
  guaranteePercentage: number;
  totalClientsUnderCollateral: number;
  valueUnderCollateral: number;
  successRate: number;
}

export interface ReceivableReport {
  id: string;
  clientId: string;
  clientName: string;
  requestedValue: number;
  achievedValue: number;
  missingValue: number;
  releasedValue: number;
  newAchievedValue: number;
  date: Date;
  status: 'complete' | 'partial' | 'pending';
}

export interface ContractApproval {
  id: string;
  approverName: string;
  approverRole: string;
  approvedAt: Date;
}

export interface Contract {
  id: string;
  clientId: string;
  contractNumber: string;
  status: 'pending_approval' | 'active' | 'closed';
  hasRevolvency: boolean;
  productType: 'guarantee' | 'extra-limit' | 'debt-settlement' | 'anticipation';
  createdAt: Date;
  closedAt?: Date;
  expiryDate?: Date;
  startDate?: Date;
  endDate?: Date;
  hasAutomaticCapture: boolean;
  operationMode: 'credit' | 'debit' | 'both';
  hasRecaptureTrigger: boolean;
  requestedValue: number;
  encumberedValue: number;
  expectedSettlementValue: number;
  actualSettlementValue: number;
  acquirers: string[];
  cardBrands: string[];
  chargeback: {
    quantity: number;
    totalValue: number;
    percentage: number;
  };
  operations: ContractOperation[];
  /** Número de aprovações necessárias (1 = simples, 2 = dupla) */
  requiredApprovals: number;
  /** Aprovações já realizadas */
  approvals: ContractApproval[];
}

export interface ContractOperation {
  id: string;
  contractId: string;
  date: Date;
  type: 'oneration_request' | 'release' | 'settlement' | 'retry_oneration' | 'chargeback';
  requestedValue?: number;
  achievedValue?: number;
  achievedPercentage?: number;
  releasedValue?: number;
  settledValue?: number;
  chargebackValue?: number;
  status: 'completed' | 'partial' | 'failed';
  description: string;
  retryAttempt?: number;
}

export interface GuaranteeProblem {
  id: string;
  contractId: string;
  contractNumber: string;
  clientName: string;
  type: 'onus_application' | 'ownership_transfer' | 'settlement' | 'chargeback';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'resolved' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  description: string;
  details: {
    requestedValue?: number;
    achievedValue?: number;
    missingValue?: number;
    expectedTransferDate?: Date;
    actualTransferDate?: Date;
    settlementValue?: number;
    chargebackValue?: number;
    affectedReceivables?: number;
  };
  actions: GuaranteeProblemAction[];
}

export interface GuaranteeProblemAction {
  id: string;
  type: 'retry' | 'manual_intervention' | 'contact_acquirer' | 'replace_receivables' | 'escalate';
  label: string;
  description: string;
  available: boolean;
  urgent?: boolean;
}

export interface Receivable {
  id: string;
  contractId: string;
  acquirer: string;
  cardBrand: string;
  transactionDate: Date;
  settlementDate: Date;
  settledAt?: Date;
  originalValue: number;
  encumberedValue: number;
  status: 'available' | 'encumbered' | 'settled' | 'chargeback' | 'pending';
  merchantId: string;
  terminalId: string;
  authorizationCode: string;
  nsu: string;
  installments: number;
  installmentNumber: number;
  fee: number;
  netValue: number;
  chargebackDate?: Date;
  chargebackReason?: string;
  operationType: 'credit' | 'debit';
}

export interface AutomaticGuaranteeRule {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  clientSelectionType: 'all' | 'filtered' | 'specific';
  affectedClientsCount: number;
  acquirers: string[];
  cardBrands: string[];
  valuePriority: 'any' | 'lower' | 'higher';
}

export interface RegistryStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastUpdate: Date;
  schedulesReceived: number;
}

export interface RegistryProblem {
  id: string;
  type: 'domicile_change_rejected' | 'chargeback' | 'lock_application_failed';
  acquirer: string;
  registry: string;
  count: number;
  totalValue?: number;
  lastOccurrence: Date;
  details: {
    affectedReceivables?: number;
    rejectedDomicileChanges?: number;
    chargebackValue?: number;
    failedLocks?: number;
  };
}

export interface OptInRequest {
  id: string;
  client_name: string;
  client_document: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  status: 'pending' | 'signed' | 'expired' | 'cancelled';
  signature_token: string;
  document_url?: string;
  signed_at?: string;
  signature_ip?: string;
  signature_data?: {
    signature: string;
  };
  expiry_date: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DailyAction {
  id: string;
  type: 'approve_release' | 'review_problem' | 'adjust_automation' | 'execute_urs' | 'review_chargeback';
  priority: 'critical' | 'high' | 'medium' | 'low';
  contractId: string;
  contractNumber: string;
  clientName: string;
  title: string;
  description: string;
  createdAt: Date;
  dueDate?: Date;
}

export interface BurnupDataPoint {
  date: Date;
  total: number;
  pagoRecebido: number;
  futuro: number;
  naoRealizado: number;
}

export interface ContractMonitoring {
  id: string;
  contractId: string;
  contractNumber: string;
  clientName: string;
  windowStartDate: Date;
  windowEndDate: Date;
  targetValue: number;
  capturedValue: number;
  capturedPercentage: number;
  /** Valor já liquidado (pagoRecebido) */
  liquidatedValue: number;
  /** Percentual já liquidado do contrato */
  liquidatedPercentage: number;
  /** Valor com problema (não liquidado, chargeback, parcial faltante) - exclui liquidação futura */
  valorProblema: number;
  status: 'functional' | 'insufficient' | 'no_generation';
  dailyTrend: {
    date: Date;
    capturedValue: number;
    expectedValue: number;
  }[];
  currentVelocity: number;
  requiredVelocity: number;
  projectedCompletionDate: Date;
  daysRemaining: number;
  burnupData?: BurnupDataPoint[];
  valorFuturo?: number;
}

export interface ClientReceivables {
  clientId: string;
  clientName: string;
  clientDocument: string;
  totalReceivables: number;
  lockedReceivables: number;
  availableReceivables: number;
  receivablesByAcquirer: {
    acquirer: string;
    total: number;
    locked: number;
    available: number;
  }[];
  optInConfirmed?: boolean;
}

export interface BatchLockOperation {
  clientId: string;
  availableReceivables: number;
  amountToLock: number;
  valid: boolean;
  errorMessage?: string;
}

export interface BatchLockSummary {
  totalClients: number;
  totalAvailable: number;
  totalToLock: number;
  validOperations: number;
  invalidOperations: number;
  operations: BatchLockOperation[];
}