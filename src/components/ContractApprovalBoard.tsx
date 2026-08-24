import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Contract, Client } from '../types';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, FileText, Clock, RefreshCw, Search, X, Users, Check, Zap, CreditCard, CalendarRange, RotateCcw, CheckCheck, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface ContractApprovalBoardProps {
  contracts: Contract[];
  clients: Client[];
  onApprove: (contractId: string) => void;
  onApproveBatch: (contractIds: string[]) => void;
  onReject: (contractId: string) => void;
}

const productTypeLabels: Record<Contract['productType'], string> = {
  'guarantee': 'Garantia',
  'extra-limit': 'Crédito Pontual',
  'debt-settlement': 'Quitação',
  'anticipation': 'Antecipação',
};

const productTypeColors: Record<Contract['productType'], string> = {
  'guarantee': 'bg-blue-100 text-blue-800',
  'extra-limit': 'bg-purple-100 text-purple-800',
  'debt-settlement': 'bg-orange-100 text-orange-800',
  'anticipation': 'bg-teal-100 text-teal-800',
};

const operationModeLabels: Record<Contract['operationMode'], string> = {
  'credit': 'Crédito',
  'debit': 'Débito',
  'both': 'Crédito e Débito',
};

const operationModeColors: Record<Contract['operationMode'], string> = {
  'credit': 'bg-green-100 text-green-800',
  'debit': 'bg-rose-100 text-rose-800',
  'both': 'bg-cyan-100 text-cyan-800',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR').format(date);

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);

type TabType = 'new' | 'changes';

interface ChangeApproval {
  id: string;
  approverName: string;
  approverRole: string;
  approvedAt: Date;
}

interface ContractChange {
  id: string;
  contractId: string;
  contractNumber: string;
  clientId: string;
  changeType: 'value' | 'term' | 'conditions';
  description: string;
  previousValue: string;
  newValue: string;
  requestedAt: Date;
  requiredApprovals: number;
  approvals: ChangeApproval[];
}

export const ContractApprovalBoard: React.FC<ContractApprovalBoardProps> = ({
  contracts,
  clients,
  onApprove,
  onApproveBatch,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock contract changes for the "Alterações" tab
  const initialChanges = useMemo<ContractChange[]>(() => {
    const allClients = clients;
    const cl = (idx: number) => allClients[idx % allClients.length]?.id || '1';
    const clName = (idx: number) => allClients[idx % allClients.length]?.name || 'Cliente';
    void clName; // used only for reference

    const changes: ContractChange[] = [
      { id: 'chg-1', contractId: 'chg-c1', contractNumber: 'CTR-2024-GAR-020', clientId: cl(0), changeType: 'value', description: 'Aumento do valor da garantia', previousValue: formatCurrency(1_500_000), newValue: formatCurrency(2_100_000), requestedAt: new Date('2025-02-20T08:30:00'), requiredApprovals: 1, approvals: [] },
      { id: 'chg-2', contractId: 'chg-c2', contractNumber: 'CTR-2024-CP-015', clientId: cl(1), changeType: 'term', description: 'Extensão do prazo do contrato', previousValue: '180 dias', newValue: '360 dias', requestedAt: new Date('2025-02-19T14:00:00'), requiredApprovals: 2, approvals: [] },
      { id: 'chg-3', contractId: 'chg-c3', contractNumber: 'CTR-2024-QD-008', clientId: cl(2), changeType: 'conditions', description: 'Inclusão de nova credenciadora (Stone)', previousValue: 'Cielo, Rede', newValue: 'Cielo, Rede, Stone', requestedAt: new Date('2025-02-18T11:15:00'), requiredApprovals: 1, approvals: [] },
      { id: 'chg-4', contractId: 'chg-c4', contractNumber: 'CTR-2025-ANT-104', clientId: cl(3), changeType: 'value', description: 'Redução do valor de antecipação', previousValue: formatCurrency(3_200_000), newValue: formatCurrency(2_800_000), requestedAt: new Date('2025-02-21T09:45:00'), requiredApprovals: 2, approvals: [
        { id: 'apv-chg4-1', approverName: 'Carlos Mendes', approverRole: 'Analista de Crédito', approvedAt: new Date('2025-02-21T16:30:00') },
      ] },
      { id: 'chg-5', contractId: 'chg-c5', contractNumber: 'CTR-2024-GAR-012', clientId: cl(4), changeType: 'conditions', description: 'Alteração de bandeiras aceitas', previousValue: 'Visa, Mastercard', newValue: 'Visa, Mastercard, Elo, Hipercard', requestedAt: new Date('2025-02-17T10:00:00'), requiredApprovals: 1, approvals: [] },
      { id: 'chg-6', contractId: 'chg-c6', contractNumber: 'CTR-2025-GAR-105', clientId: cl(5), changeType: 'value', description: 'Aumento do limite de crédito', previousValue: formatCurrency(5_100_000), newValue: formatCurrency(6_500_000), requestedAt: new Date('2025-02-22T13:20:00'), requiredApprovals: 2, approvals: [] },
      { id: 'chg-7', contractId: 'chg-c7', contractNumber: 'CTR-2024-CP-018', clientId: cl(6), changeType: 'term', description: 'Antecipação da data de vencimento', previousValue: '22/06/2025', newValue: '15/04/2025', requestedAt: new Date('2025-02-23T07:50:00'), requiredApprovals: 1, approvals: [] },
      { id: 'chg-8', contractId: 'chg-c8', contractNumber: 'CTR-2025-QD-108', clientId: cl(7), changeType: 'value', description: 'Reajuste por variação de índice', previousValue: formatCurrency(4_200_000), newValue: formatCurrency(4_452_000), requestedAt: new Date('2025-02-24T15:10:00'), requiredApprovals: 2, approvals: [
        { id: 'apv-chg8-1', approverName: 'Ana Silva', approverRole: 'Gerente de Operações', approvedAt: new Date('2025-02-25T09:00:00') },
      ] },
      { id: 'chg-9', contractId: 'chg-c9', contractNumber: 'CTR-2024-ANT-009', clientId: cl(8), changeType: 'conditions', description: 'Ativação de captura automática', previousValue: 'Inativa', newValue: 'Ativa', requestedAt: new Date('2025-02-25T11:30:00'), requiredApprovals: 1, approvals: [] },
      { id: 'chg-10', contractId: 'chg-c10', contractNumber: 'CTR-2025-GAR-109', clientId: cl(9), changeType: 'term', description: 'Extensão do prazo com renegociação', previousValue: '01/09/2025', newValue: '01/03/2026', requestedAt: new Date('2025-02-26T16:45:00'), requiredApprovals: 2, approvals: [] },
    ];
    return changes;
  }, [clients]);

  const [contractChanges, setContractChanges] = useState<ContractChange[]>([]);
  useEffect(() => { setContractChanges(initialChanges); }, [initialChanges]);

  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);
  const [rejectingChangeId, setRejectingChangeId] = useState<string | null>(null);
  const [rejectChangeReason, setRejectChangeReason] = useState('');

  const changeApprovers = [
    { name: 'Ana Silva', role: 'Gerente de Operações' },
    { name: 'Ricardo Souza', role: 'Diretor Financeiro' },
  ];

  const handleApproveChange = (changeId: string) => {
    setContractChanges(prev => prev.map(ch => {
      if (ch.id !== changeId) return ch;
      const approverIndex = ch.approvals.length % changeApprovers.length;
      const approver = changeApprovers[approverIndex];
      const newApproval: ChangeApproval = {
        id: `apv-${ch.id}-${ch.approvals.length + 1}`,
        approverName: approver.name,
        approverRole: approver.role,
        approvedAt: new Date(),
      };
      const updatedApprovals = [...ch.approvals, newApproval];
      return { ...ch, approvals: updatedApprovals };
    }).filter(ch => ch.approvals.length < ch.requiredApprovals));
  };

  const handleRejectChange = (changeId: string) => {
    setContractChanges(prev => prev.filter(ch => ch.id !== changeId));
    setRejectingChangeId(null);
    setRejectChangeReason('');
    setExpandedChangeId(null);
  };

  const toggleChange = (id: string) => {
    setExpandedChangeId(prev => prev === id ? null : id);
    setRejectingChangeId(null);
    setRejectChangeReason('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setClientSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const relevantClients = useMemo(() => {
    const clientIds = new Set(contracts.map(c => c.clientId));
    return clients.filter(c => clientIds.has(c.id));
  }, [contracts, clients]);

  const visibleDropdownClients = useMemo(() => {
    if (!clientSearch) return relevantClients;
    return relevantClients.filter(c =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [relevantClients, clientSearch]);

  const toggleClient = (clientId: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const clearClientFilter = () => {
    setSelectedClientIds(new Set());
    setClientSearch('');
  };

  const filteredContracts = useMemo(() => {
    if (selectedClientIds.size === 0) return contracts;
    return contracts.filter(c => selectedClientIds.has(c.clientId));
  }, [contracts, selectedClientIds]);

  const toggleContractSelection = (contractId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContractIds(prev => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedContractIds.size === filteredContracts.length) {
      setSelectedContractIds(new Set());
    } else {
      setSelectedContractIds(new Set(filteredContracts.map(c => c.id)));
    }
  };

  const handleApproveBatch = () => {
    const ids = Array.from(selectedContractIds);
    onApproveBatch(ids);
    setSelectedContractIds(new Set());
    setExpandedId(null);
  };

  const allSelected = filteredContracts.length > 0 && selectedContractIds.size === filteredContracts.length;

  const toggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRejectingId(null);
      setRejectReason('');
    } else {
      setExpandedId(id);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const handleApprove = (contractId: string) => {
    onApprove(contractId);
    // Não fecha o card se for dupla aprovação (pode querer ver o progresso)
    const contract = contracts.find(c => c.id === contractId);
    if (contract && contract.approvals.length + 1 >= contract.requiredApprovals) {
      setExpandedId(null);
    }
  };

  const handleStartReject = (contractId: string) => {
    setRejectingId(contractId);
    setRejectReason('');
  };

  const handleConfirmReject = (contractId: string) => {
    onReject(contractId);
    setRejectingId(null);
    setRejectReason('');
    setExpandedId(null);
  };

  const changeTypeLabels: Record<string, string> = {
    value: 'Valor',
    term: 'Prazo',
    conditions: 'Condições',
  };

  const changeTypeColors: Record<string, string> = {
    value: 'bg-green-100 text-green-800',
    term: 'bg-blue-100 text-blue-800',
    conditions: 'bg-purple-100 text-purple-800',
  };

  // Contagem de contratos por tipo de aprovação
  const approvalStats = useMemo(() => {
    const single = contracts.filter(c => c.requiredApprovals === 1).length;
    const dual = contracts.filter(c => c.requiredApprovals >= 2).length;
    const waitingSecond = contracts.filter(c => c.requiredApprovals >= 2 && c.approvals.length === 1).length;
    return { single, dual, waitingSecond };
  }, [contracts]);

  /** Badge de nível de aprovação */
  const ApprovalBadge: React.FC<{ contract: Contract }> = ({ contract }) => {
    const required = contract.requiredApprovals;
    const current = contract.approvals.length;

    if (required <= 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          <UserCheck className="w-3 h-3" />
          Aprovação simples
        </span>
      );
    }

    if (current === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <ShieldCheck className="w-3 h-3" />
          Dupla aprovação ({current}/{required})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
        <ShieldCheck className="w-3 h-3" />
        Aguardando 2ª aprovação ({current}/{required})
      </span>
    );
  };

  /** Barra de progresso de aprovação */
  const ApprovalProgress: React.FC<{ contract: Contract }> = ({ contract }) => {
    const required = contract.requiredApprovals;
    const current = contract.approvals.length;

    if (required <= 1) return null;

    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600">Progresso de aprovação</span>
          <span className="text-xs font-semibold text-gray-800">{current} de {required}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              current >= required ? 'bg-green-500' : current > 0 ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            style={{ width: `${(current / required) * 100}%` }}
          />
        </div>

        {/* Lista de aprovações já feitas */}
        {contract.approvals.length > 0 && (
          <div className="mt-3 space-y-2">
            {contract.approvals.map((apv, idx) => (
              <div key={apv.id} className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-green-800">{apv.approverName}</span>
                  <span className="text-xs text-green-600 ml-2">{apv.approverRole}</span>
                </div>
                <span className="text-xs text-green-600 flex-shrink-0">
                  {formatDateTime(apv.approvedAt)}
                </span>
              </div>
            ))}

            {/* Slot vazio para próxima aprovação */}
            {current < required && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 bg-gray-300 text-white rounded-full text-xs font-bold flex-shrink-0">
                  {current + 1}
                </div>
                <span className="text-sm text-gray-400 italic">Aguardando aprovação...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (contracts.length === 0 && contractChanges.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum contrato pendente</h3>
        <p className="text-sm text-gray-500">Todos os contratos foram analisados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo de governança */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvalStats.single}</p>
                <p className="text-xs text-gray-500">Aprovação simples</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvalStats.dual}</p>
                <p className="text-xs text-gray-500">Dupla aprovação</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvalStats.waitingSecond}</p>
                <p className="text-xs text-gray-500">Aguardando 2ª aprovação</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex">
          <button
            onClick={() => { setActiveTab('new'); setSelectedContractIds(new Set()); setExpandedId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'new'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Novos Contratos
            {contracts.length > 0 && (
              <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                activeTab === 'new' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {contracts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('changes'); setSelectedContractIds(new Set()); setExpandedId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'changes'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Alterações de Contratos
            {contractChanges.length > 0 && (
              <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                activeTab === 'changes' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {contractChanges.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* === ALTERAÇÕES DE CONTRATOS TAB === */}
      {activeTab === 'changes' && (
        <>
          {contractChanges.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma alteração pendente</h3>
              <p className="text-sm text-gray-500">Todas as alterações de contratos foram analisadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contractChanges.map(change => {
                const isChangeExpanded = expandedChangeId === change.id;
                const isChangeRejecting = rejectingChangeId === change.id;
                const isDualChange = change.requiredApprovals >= 2;
                const hasPartialChange = change.approvals.length > 0 && change.approvals.length < change.requiredApprovals;

                return (
                  <div
                    key={change.id}
                    className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
                      hasPartialChange
                        ? 'border-blue-300 ring-1 ring-blue-100'
                        : isDualChange
                          ? 'border-amber-200'
                          : 'border-gray-200'
                    }`}
                  >
                    {/* Header colapsável */}
                    <button
                      onClick={() => toggleChange(change.id)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${hasPartialChange ? 'bg-blue-100' : 'bg-amber-100'}`}>
                          <RefreshCw className={`w-5 h-5 ${hasPartialChange ? 'text-blue-600' : 'text-amber-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{change.contractNumber}</span>
                            <span className="text-sm text-gray-500">—</span>
                            <span className="text-sm text-gray-700 truncate">{getClientName(change.clientId)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${changeTypeColors[change.changeType] || 'bg-gray-100 text-gray-700'}`}>
                              {changeTypeLabels[change.changeType] || change.changeType}
                            </span>
                            <span className="text-xs text-gray-500">{change.description}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(change.requestedAt)}
                            </span>
                            {/* Badge de aprovação */}
                            {isDualChange ? (
                              hasPartialChange ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                                  <ShieldCheck className="w-3 h-3" />
                                  Aguardando 2ª aprovação ({change.approvals.length}/{change.requiredApprovals})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  <ShieldCheck className="w-3 h-3" />
                                  Dupla aprovação ({change.approvals.length}/{change.requiredApprovals})
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                <UserCheck className="w-3 h-3" />
                                Aprovação simples
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {isChangeExpanded
                          ? <ChevronUp className="w-5 h-5 text-gray-400" />
                          : <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Conteúdo expandido */}
                    {isChangeExpanded && (
                      <div className="border-t border-gray-200 px-6 py-5 bg-gray-50 space-y-5">
                        {/* Valores da alteração */}
                        <div className="grid grid-cols-2 gap-4 bg-white rounded-xl border border-gray-200 p-4">
                          <div>
                            <span className="text-xs text-gray-500">Valor Anterior</span>
                            <p className="text-sm font-medium text-gray-700 line-through mt-0.5">{change.previousValue}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Novo Valor</span>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{change.newValue}</p>
                          </div>
                        </div>

                        {/* Progresso de aprovação (somente para dupla aprovação) */}
                        {isDualChange && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-amber-500" />
                              Governança — Dupla Aprovação
                            </h4>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-gray-600">Progresso de aprovação</span>
                                <span className="text-xs font-semibold text-gray-800">{change.approvals.length} de {change.requiredApprovals}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    change.approvals.length >= change.requiredApprovals ? 'bg-green-500' : change.approvals.length > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${(change.approvals.length / change.requiredApprovals) * 100}%` }}
                                />
                              </div>
                              {change.approvals.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {change.approvals.map((apv, idx) => (
                                    <div key={apv.id} className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-green-800">{apv.approverName}</span>
                                        <span className="text-xs text-green-600 ml-2">{apv.approverRole}</span>
                                      </div>
                                      <span className="text-xs text-green-600 flex-shrink-0">
                                        {formatDateTime(apv.approvedAt)}
                                      </span>
                                    </div>
                                  ))}
                                  {change.approvals.length < change.requiredApprovals && (
                                    <div className="flex items-center gap-3 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                                      <div className="flex items-center justify-center w-6 h-6 bg-gray-300 text-white rounded-full text-xs font-bold flex-shrink-0">
                                        {change.approvals.length + 1}
                                      </div>
                                      <span className="text-sm text-gray-400 italic">Aguardando aprovação...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="border-t border-gray-200 pt-4">
                          {!isChangeRejecting ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleApproveChange(change.id)}
                                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {hasPartialChange
                                  ? 'Registrar 2ª Aprovação'
                                  : isDualChange
                                    ? 'Registrar 1ª Aprovação'
                                    : 'Aprovar Alteração'
                                }
                              </button>
                              <button
                                onClick={() => { setRejectingChangeId(change.id); setRejectChangeReason(''); }}
                                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                <XCircle className="w-4 h-4" />
                                Reprovar
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Motivo da reprovação <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={rejectChangeReason}
                                onChange={e => setRejectChangeReason(e.target.value)}
                                placeholder="Informe o motivo da reprovação da alteração..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                                autoFocus
                              />
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleRejectChange(change.id)}
                                  disabled={rejectChangeReason.trim().length === 0}
                                  className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors text-sm font-medium ${
                                    rejectChangeReason.trim().length > 0
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Confirmar Reprovação
                                </button>
                                <button
                                  onClick={() => { setRejectingChangeId(null); setRejectChangeReason(''); }}
                                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === NOVOS CONTRATOS TAB === */}
      {activeTab === 'new' && (<>

      {/* Client filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm min-w-0 sm:min-w-[220px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {selectedClientIds.size === 0
                      ? 'Filtrar por cliente'
                      : `${selectedClientIds.size} cliente${selectedClientIds.size > 1 ? 's' : ''} selecionado${selectedClientIds.size > 1 ? 's' : ''}`
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {/* Search inside dropdown */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Client list */}
                  <div className="max-h-60 overflow-y-auto py-1">
                    {visibleDropdownClients.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">Nenhum cliente encontrado</div>
                    ) : (
                      visibleDropdownClients.map(client => {
                        const isSelected = selectedClientIds.has(client.id);
                        return (
                          <button
                            key={client.id}
                            onClick={() => toggleClient(client.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                          >
                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-gray-800 truncate">{client.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer with clear */}
                  {selectedClientIds.size > 0 && (
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={clearClientFilter}
                        className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors"
                      >
                        Limpar seleção
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected client tags */}
            {selectedClientIds.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedClientIds).map(id => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
                  >
                    {getClientName(id)}
                    <button
                      onClick={() => toggleClient(id)}
                      className="hover:text-blue-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-gray-500">
              {filteredContracts.length} de {contracts.length} contratos
            </span>
          </div>
        </div>
      </div>

      {/* Batch actions bar */}
      {filteredContracts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                allSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}>
                {allSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              Selecionar todos
            </button>
            {selectedContractIds.size > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {selectedContractIds.size} selecionado{selectedContractIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={handleApproveBatch}
            disabled={selectedContractIds.size === 0}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedContractIds.size > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            {selectedContractIds.size === 0
              ? 'Aprovar em lote'
              : selectedContractIds.size === filteredContracts.length
                ? 'Aprovar todos'
                : `Aprovar ${selectedContractIds.size} contrato${selectedContractIds.size > 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {/* Cards */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum contrato encontrado</h3>
          <p className="text-sm text-gray-500">Tente ajustar o filtro de cliente.</p>
        </div>
      ) : filteredContracts.map(contract => {
        const isExpanded = expandedId === contract.id;
        const isRejecting = rejectingId === contract.id;
        const isDualApproval = contract.requiredApprovals >= 2;
        const hasPartialApproval = contract.approvals.length > 0 && contract.approvals.length < contract.requiredApprovals;

        return (
          <div
            key={contract.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
              hasPartialApproval
                ? 'border-blue-300 ring-1 ring-blue-100'
                : isDualApproval
                  ? 'border-amber-200'
                  : 'border-gray-200'
            }`}
          >
            {/* Collapsed card header */}
            <button
              onClick={() => toggle(contract.id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  onClick={(e) => toggleContractSelection(contract.id, e)}
                  className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                    selectedContractIds.has(contract.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {selectedContractIds.has(contract.id) && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`p-2 rounded-lg flex-shrink-0 ${hasPartialApproval ? 'bg-blue-100' : 'bg-blue-100'}`}>
                  <FileText className={`w-5 h-5 ${hasPartialApproval ? 'text-blue-600' : 'text-blue-600'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{contract.contractNumber}</span>
                    <span className="text-sm text-gray-500">—</span>
                    <span className="text-sm text-gray-700 truncate">{getClientName(contract.clientId)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${productTypeColors[contract.productType]}`}>
                      {productTypeLabels[contract.productType]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(contract.requestedValue)}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(contract.createdAt)}
                    </span>
                    <ApprovalBadge contract={contract} />
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                {isExpanded
                  ? <ChevronUp className="w-5 h-5 text-gray-400" />
                  : <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-gray-200 px-6 py-5 bg-gray-50 space-y-5">
                {/* Progresso de aprovação (somente para dupla aprovação) */}
                {isDualApproval && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      Governança — Dupla Aprovação
                    </h4>
                    <ApprovalProgress contract={contract} />
                  </div>
                )}

                {/* Condições do Contrato */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Condições do Contrato</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Tipo de Produto</span>
                      <div className="mt-0.5">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${productTypeColors[contract.productType]}`}>
                          {productTypeLabels[contract.productType]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Revolvência</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${contract.hasRevolvency ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-900">{contract.hasRevolvency ? 'Sim' : 'Não'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Valor Solicitado</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrency(contract.requestedValue)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Data de Criação</span>
                      <p className="text-sm text-gray-900 mt-0.5">{formatDate(contract.createdAt)}</p>
                    </div>
                    {contract.expiryDate && (
                      <div>
                        <span className="text-xs text-gray-500">Data de Expiração</span>
                        <p className="text-sm text-gray-900 mt-0.5">{formatDate(contract.expiryDate)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Nível de Aprovação</span>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {contract.requiredApprovals >= 2 ? 'Dupla aprovação' : 'Aprovação simples'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visão Avançada */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Visão Avançada</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Início do Contrato</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{contract.startDate ? formatDate(contract.startDate) : '—'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Fim do Contrato</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{contract.endDate ? formatDate(contract.endDate) : '—'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Modalidade</span>
                      <div className="mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${operationModeColors[contract.operationMode]}`}>
                          <CreditCard className="w-3 h-3" />
                          {operationModeLabels[contract.operationMode]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Automação de Captura</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Zap className={`w-3.5 h-3.5 ${contract.hasAutomaticCapture ? 'text-yellow-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-900">{contract.hasAutomaticCapture ? 'Ativa' : 'Inativa'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Trigger de Recaptura</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RotateCcw className={`w-3.5 h-3.5 ${contract.hasRecaptureTrigger ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-900">{contract.hasRecaptureTrigger ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parâmetros de Captura */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Parâmetros de Captura</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Credenciadoras</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {contract.acquirers.map(acq => (
                          <span key={acq} className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {acq}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Bandeiras</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {contract.cardBrands.map(brand => (
                          <span key={brand} className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-gray-200 pt-4">
                  {!isRejecting ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(contract.id)}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {hasPartialApproval
                          ? `Registrar 2ª Aprovação`
                          : isDualApproval
                            ? 'Registrar 1ª Aprovação'
                            : 'Aprovar'
                        }
                      </button>
                      <button
                        onClick={() => handleStartReject(contract.id)}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Reprovar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Motivo da reprovação <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Informe o motivo da reprovação..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleConfirmReject(contract.id)}
                          disabled={rejectReason.trim().length === 0}
                          className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors text-sm font-medium ${
                            rejectReason.trim().length > 0
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Confirmar Reprovação
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      </>)}
    </div>
  );
};
