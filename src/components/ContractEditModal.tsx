import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Building2, CreditCard, Repeat, Landmark, ChevronDown } from 'lucide-react';
import { Contract, SettlementAccount } from '../types';

interface ContractEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onSave: (updatedContract: Contract) => void;
}

interface PreRegisteredAccount {
  id: string;
  label: string;
  account: SettlementAccount;
}

const AVAILABLE_ACQUIRERS = ['Dock', 'Cielo', 'PagSeguro', 'Stone', 'Rede', 'Getnet', 'Safrapay', 'Mercado Pago'];
const AVAILABLE_CARD_BRANDS = ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express', 'Diners Club'];

const PRE_REGISTERED_ACCOUNTS: PreRegisteredAccount[] = [
  {
    id: '1',
    label: 'Conta Principal - Operações',
    account: { bank: 'Banco do Brasil', bankCode: '001', agency: '1234-5', accountNumber: '12345678-9', accountType: 'checking', holder: 'ABC Comércio S.A.' },
  },
  {
    id: '2',
    label: 'Conta Quitação',
    account: { bank: 'Itaú Unibanco', bankCode: '341', agency: '5678', accountNumber: '87654321-0', accountType: 'checking', holder: 'XYZ Ltda.' },
  },
  {
    id: '3',
    label: 'Conta Antecipação',
    account: { bank: 'Santander', bankCode: '033', agency: '9876', accountNumber: '11223344-5', accountType: 'checking', holder: 'Comercial Silva S.A.' },
  },
];

const EMPTY_ACCOUNT: SettlementAccount = {
  bank: '',
  bankCode: '',
  agency: '',
  accountNumber: '',
  accountType: 'checking',
  holder: '',
};

export const ContractEditModal: React.FC<ContractEditModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSave,
}) => {
  const [acquirers, setAcquirers] = useState<string[]>([]);
  const [cardBrands, setCardBrands] = useState<string[]>([]);
  const [operationMode, setOperationMode] = useState<'credit' | 'debit' | 'both'>('both');
  const [settlementAccount, setSettlementAccount] = useState<SettlementAccount>(EMPTY_ACCOUNT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setAcquirers([...contract.acquirers]);
      setCardBrands([...contract.cardBrands]);
      setOperationMode(contract.operationMode);
      setSettlementAccount(contract.settlementAccount ? { ...contract.settlementAccount } : { ...EMPTY_ACCOUNT });
      setErrors({});
    }
  }, [isOpen, contract]);

  if (!isOpen) return null;

  const toggleAcquirer = (acquirer: string) => {
    setAcquirers(prev =>
      prev.includes(acquirer)
        ? prev.filter(a => a !== acquirer)
        : [...prev, acquirer]
    );
    if (errors.acquirers) {
      setErrors(prev => { const next = { ...prev }; delete next.acquirers; return next; });
    }
  };

  const toggleCardBrand = (brand: string) => {
    setCardBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
    if (errors.cardBrands) {
      setErrors(prev => { const next = { ...prev }; delete next.cardBrands; return next; });
    }
  };

  const updateAccount = (field: keyof SettlementAccount, value: string) => {
    setSettlementAccount(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (acquirers.length === 0) newErrors.acquirers = 'Selecione ao menos uma credenciadora';
    if (cardBrands.length === 0) newErrors.cardBrands = 'Selecione ao menos uma bandeira';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const hasAccountData = settlementAccount.bank || settlementAccount.accountNumber;

    const updatedContract: Contract = {
      ...contract,
      acquirers,
      cardBrands,
      operationMode,
      settlementAccount: hasAccountData ? settlementAccount : undefined,
    };
    onSave(updatedContract);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Solicitar Alteração de Contrato</h2>
              <p className="text-sm text-gray-500">{contract.contractNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Seção 1: Credenciadoras */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Credenciadoras</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ACQUIRERS.map((acquirer) => (
                <button
                  key={acquirer}
                  type="button"
                  onClick={() => toggleAcquirer(acquirer)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    acquirers.includes(acquirer)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  {acquirer}
                </button>
              ))}
            </div>
            {errors.acquirers ? (
              <p className="text-red-500 text-xs mt-2">{errors.acquirers}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                {acquirers.length} selecionada(s)
              </p>
            )}
          </div>

          {/* Seção 2: Bandeiras */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Bandeiras de Cartão</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CARD_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleCardBrand(brand)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    cardBrands.includes(brand)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
            {errors.cardBrands ? (
              <p className="text-red-500 text-xs mt-2">{errors.cardBrands}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                {cardBrands.length} selecionada(s)
              </p>
            )}
          </div>

          {/* Seção 3: Função (operationMode) */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Repeat className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Função</label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'debit', label: 'Débito' },
                { value: 'credit', label: 'Crédito' },
                { value: 'both', label: 'Ambos' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setOperationMode(option.value)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    operationMode === option.value
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seção 4: Conta de Liquidação */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Landmark className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Conta de Liquidação</label>
            </div>
            <div className="space-y-4">
              {/* Seletor de contas pré-cadastradas */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selecionar conta cadastrada</label>
                <div className="relative">
                  <select
                    value={
                      PRE_REGISTERED_ACCOUNTS.find(
                        (p) => p.account.bankCode === settlementAccount.bankCode && p.account.accountNumber === settlementAccount.accountNumber
                      )?.id || ''
                    }
                    onChange={(e) => {
                      const selected = PRE_REGISTERED_ACCOUNTS.find((p) => p.id === e.target.value);
                      if (selected) {
                        setSettlementAccount({ ...selected.account });
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm appearance-none bg-white pr-10"
                  >
                    <option value="">-- Selecionar conta pré-cadastrada --</option>
                    {PRE_REGISTERED_ACCOUNTS.map((pa) => (
                      <option key={pa.id} value={pa.id}>
                        {pa.label} — {pa.account.bank} (Ag {pa.account.agency} / CC {pa.account.accountNumber})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Ou preencha manualmente abaixo</p>
              </div>

              <div className="border-t border-gray-100 pt-4" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
                  <input
                    type="text"
                    value={settlementAccount.bank}
                    onChange={(e) => updateAccount('bank', e.target.value)}
                    placeholder="Ex: Banco do Brasil"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                  <input
                    type="text"
                    value={settlementAccount.bankCode}
                    onChange={(e) => updateAccount('bankCode', e.target.value)}
                    placeholder="Ex: 001"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Agência</label>
                  <input
                    type="text"
                    value={settlementAccount.agency}
                    onChange={(e) => updateAccount('agency', e.target.value)}
                    placeholder="Ex: 1234-5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número da Conta</label>
                  <input
                    type="text"
                    value={settlementAccount.accountNumber}
                    onChange={(e) => updateAccount('accountNumber', e.target.value)}
                    placeholder="Ex: 12345678-9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Conta</label>
                  <select
                    value={settlementAccount.accountType}
                    onChange={(e) => updateAccount('accountType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Titular</label>
                  <input
                    type="text"
                    value={settlementAccount.holder}
                    onChange={(e) => updateAccount('holder', e.target.value)}
                    placeholder="Nome do titular"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Solicitar Alteração
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
