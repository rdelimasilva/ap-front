import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, FileText, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import { showToast } from '../hooks/useToast';

interface BankStatementReconciliationProps {
  isOpen: boolean;
  onClose: () => void;
  onReconcile: (data: ReconciliationData) => void;
}

interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  balance: number;
  type: 'credit' | 'debit';
}

interface ExpectedSettlement {
  id: string;
  contractId: string;
  client: string;
  expectedAmount: number;
  expectedDate: string;
  status: 'matched' | 'unmatched' | 'partial';
  matchedAmount?: number;
  matchedTransaction?: BankTransaction;
}

export interface ReconciliationData {
  uploadDate: string;
  fileName: string;
  totalTransactions: number;
  totalMatched: number;
  totalUnmatched: number;
  totalDivergence: number;
  settlements: ExpectedSettlement[];
}

export function BankStatementReconciliation({
  isOpen,
  onClose,
  onReconcile
}: BankStatementReconciliationProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [_transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const mockExpectedSettlements: ExpectedSettlement[] = [
    { id: '1', contractId: 'CTR-2025-001', client: 'Tech Solutions Ltda', expectedAmount: 44550, expectedDate: '2025-11-03', status: 'unmatched' },
    { id: '2', contractId: 'CTR-2025-002', client: 'Comercial Santos', expectedAmount: 31680, expectedDate: '2025-11-03', status: 'unmatched' },
    { id: '3', contractId: 'CTR-2025-003', client: 'Indústria XYZ', expectedAmount: 77220, expectedDate: '2025-11-03', status: 'unmatched' },
    { id: '4', contractId: 'CTR-2025-004', client: 'Varejo Plus', expectedAmount: 20790, expectedDate: '2025-11-03', status: 'unmatched' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const parseCSV = (text: string): BankTransaction[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const transactions: BankTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/);
      if (cols.length >= 4) {
        const amount = parseFloat(cols[2].replace(/[^\d,-]/g, '').replace(',', '.'));
        transactions.push({
          date: cols[0].trim(),
          description: cols[1].trim(),
          amount: Math.abs(amount),
          balance: parseFloat(cols[3]?.replace(/[^\d,-]/g, '').replace(',', '.') || '0'),
          type: amount >= 0 ? 'credit' : 'debit'
        });
      }
    }

    return transactions.filter(t => t.type === 'credit' && t.amount > 0);
  };

  const parseOFX = (text: string): BankTransaction[] => {
    const transactions: BankTransaction[] = [];
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = transactionRegex.exec(text)) !== null) {
      const trxContent = match[1];

      const dateMatch = trxContent.match(/<DTPOSTED>(\d{8})/);
      const amountMatch = trxContent.match(/<TRNAMT>([-\d.]+)/);
      const memoMatch = trxContent.match(/<MEMO>(.*?)(?:<|$)/);

      if (dateMatch && amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount > 0) {
          const dateStr = dateMatch[1];
          const formattedDate = `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`;

          transactions.push({
            date: formattedDate,
            description: memoMatch ? memoMatch[1].trim() : 'Crédito',
            amount: Math.abs(amount),
            balance: 0,
            type: 'credit'
          });
        }
      }
    }

    return transactions;
  };

  const parseExcel = (data: ArrayBuffer): BankTransaction[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, { header: 1 });

    const transactions: BankTransaction[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row.length >= 3) {
        const amount = parseFloat(String(row[2]).replace(/[^\d,-]/g, '').replace(',', '.'));
        if (!isNaN(amount) && amount > 0) {
          transactions.push({
            date: String(row[0] || ''),
            description: String(row[1] || ''),
            amount: Math.abs(amount),
            balance: parseFloat(String(row[3] || '0').replace(/[^\d,-]/g, '').replace(',', '.')),
            type: 'credit'
          });
        }
      }
    }

    return transactions;
  };

  const performReconciliation = (transactions: BankTransaction[]) => {
    const settlements = mockExpectedSettlements.map(settlement => {
      const matchedTrx = transactions.find(trx => {
        const amountMatch = Math.abs(trx.amount - settlement.expectedAmount) < 1;
        const dateMatch = trx.date.includes(settlement.expectedDate.split('-').reverse().join('/').substring(0, 5));
        return amountMatch && dateMatch;
      });

      if (matchedTrx) {
        return {
          ...settlement,
          status: 'matched' as const,
          matchedAmount: matchedTrx.amount,
          matchedTransaction: matchedTrx
        };
      }

      const partialMatch = transactions.find(trx => {
        const dateMatch = trx.date.includes(settlement.expectedDate.split('-').reverse().join('/').substring(0, 5));
        const partialAmount = Math.abs(trx.amount - settlement.expectedAmount) < settlement.expectedAmount * 0.1;
        return dateMatch && partialAmount;
      });

      if (partialMatch) {
        return {
          ...settlement,
          status: 'partial' as const,
          matchedAmount: partialMatch.amount,
          matchedTransaction: partialMatch
        };
      }

      return settlement;
    });

    const totalMatched = settlements.filter(s => s.status === 'matched').length;
    const totalUnmatched = settlements.filter(s => s.status === 'unmatched').length;
    const totalDivergence = settlements
      .filter(s => s.status === 'partial')
      .reduce((sum, s) => sum + Math.abs((s.matchedAmount || 0) - s.expectedAmount), 0);

    return {
      uploadDate: new Date().toISOString(),
      fileName: uploadedFile?.name || '',
      totalTransactions: transactions.length,
      totalMatched,
      totalUnmatched,
      totalDivergence,
      settlements
    };
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const text = await file.text();
      let parsedTransactions: BankTransaction[] = [];

      if (file.name.endsWith('.csv')) {
        parsedTransactions = parseCSV(text);
      } else if (file.name.endsWith('.ofx')) {
        parsedTransactions = parseOFX(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        parsedTransactions = parseExcel(arrayBuffer);
      }

      setTransactions(parsedTransactions);

      const reconciliation = performReconciliation(parsedTransactions);
      setReconciliationData(reconciliation);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      showToast('error', 'Erro ao processar arquivo', 'Verifique o formato do arquivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setTransactions([]);
    setReconciliationData(null);
    onClose();
  };

  const handleConfirmReconciliation = () => {
    if (reconciliationData) {
      onReconcile(reconciliationData);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Conciliação de Extrato Bancário</h2>
              <p className="text-sm text-gray-600">Faça upload do extrato para conciliar liquidações</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!reconciliationData ? (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {isProcessing ? 'Processando arquivo...' : 'Arraste o arquivo aqui'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Formatos suportados: CSV, OFX, XLSX
                    </p>
                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium">
                      <Upload className="w-5 h-5" />
                      Selecionar Arquivo
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.ofx,.xlsx,.xls"
                        onChange={handleChange}
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {uploadedFile && !isProcessing && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Arquivo carregado com sucesso</p>
                    <p className="text-xs text-green-700">{uploadedFile.name}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Formato esperado do arquivo</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>CSV/Excel:</strong> Data, Descrição, Valor, Saldo</p>
                  <p><strong>OFX:</strong> Formato padrão bancário</p>
                  <p className="text-xs text-blue-700 mt-3">
                    A conciliação será feita automaticamente comparando valores e datas das liquidações esperadas
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Transações</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reconciliationData.totalTransactions}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Conciliadas</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reconciliationData.totalMatched}</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-medium text-red-900">Não Conciliadas</p>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{reconciliationData.totalUnmatched}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">Divergência</p>
                  </div>
                  <p className="text-xl font-bold text-yellow-900">{formatCurrency(reconciliationData.totalDivergence)}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Resultado da Conciliação</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Esperada</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Esperado</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Encontrado</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferença</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reconciliationData.settlements.map((settlement) => {
                        const difference = settlement.matchedAmount
                          ? settlement.matchedAmount - settlement.expectedAmount
                          : 0;

                        return (
                          <tr key={settlement.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {settlement.status === 'matched' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Conciliada
                                </span>
                              )}
                              {settlement.status === 'partial' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  Parcial
                                </span>
                              )}
                              {settlement.status === 'unmatched' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                  <X className="w-3 h-3" />
                                  Não encontrada
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{settlement.contractId}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{settlement.client}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(settlement.expectedDate)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                              {formatCurrency(settlement.expectedAmount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              {settlement.matchedAmount ? formatCurrency(settlement.matchedAmount) : '-'}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${
                              difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              {settlement.matchedAmount ? formatCurrency(difference) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>

          {reconciliationData && (
            <button
              onClick={handleConfirmReconciliation}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Conciliação
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
