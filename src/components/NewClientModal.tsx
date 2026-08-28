import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { CPFCNPJInput } from './MaskedInput';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';
import { createCliente, OptinApiError } from '../services/optinApi';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (clientData: NewClientData | NewClientData[]) => void;
}

interface NewClientData {
  id: string;
  name: string;
  email: string;
  document: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  collateralValue: number;
  status: 'pending';
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSave }) => {
  const [cnpjList, setCnpjList] = useState<string[]>(['']);
  const [nameList, setNameList] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEscapeKey(() => {
    if (isOpen && !isSubmitting) onClose();
  });

  if (!isOpen) return null;

  const handleCnpjChange = (index: number, value: string) => {
    const newList = [...cnpjList];
    newList[index] = value;
    setCnpjList(newList);
    if (errors[`cnpj-${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`cnpj-${index}`];
      setErrors(newErrors);
    }
  };

  const handleNameChange = (index: number, value: string) => {
    const newList = [...nameList];
    newList[index] = value;
    setNameList(newList);
    if (errors[`nome-${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`nome-${index}`];
      setErrors(newErrors);
    }
  };

  const addCnpjField = () => {
    setCnpjList([...cnpjList, '']);
    setNameList([...nameList, '']);
  };

  const removeCnpjField = (index: number) => {
    if (cnpjList.length > 1) {
      setCnpjList(cnpjList.filter((_, i) => i !== index));
      setNameList(nameList.filter((_, i) => i !== index));
    }
  };

  const validateCNPJ = (cnpj: string): boolean => {
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weights1[i];
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cnpj[12]) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weights2[i];
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cnpj[13]) !== digit2) return false;

    return true;
  };

  const validateCPF = (cpf: string): boolean => {
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    const digito = (base: string, pesos: number[]) => {
      const soma = base.split('').reduce((acc, d, i) => acc + parseInt(d) * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const dv1 = digito(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (parseInt(cpf[9]) !== dv1) return false;
    const dv2 = digito(cpf.slice(0, 9) + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return parseInt(cpf[10]) === dv2;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    cnpjList.forEach((documento, index) => {
      const cleanDoc = documento.replace(/\D/g, '');
      if (!cleanDoc) {
        newErrors[`cnpj-${index}`] = 'CPF/CNPJ é obrigatório';
      } else if (cleanDoc.length === 11) {
        if (!validateCPF(cleanDoc)) {
          newErrors[`cnpj-${index}`] = 'CPF inválido. Verifique os dígitos informados.';
        }
      } else if (cleanDoc.length === 14) {
        if (!validateCNPJ(cleanDoc)) {
          newErrors[`cnpj-${index}`] = 'CNPJ inválido. Verifique os dígitos informados.';
        }
      } else {
        newErrors[`cnpj-${index}`] = 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos';
      }
    });

    nameList.forEach((nome, index) => {
      if (!nome.trim()) {
        newErrors[`nome-${index}`] = 'Nome é obrigatório';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const criados: NewClientData[] = [];
    let indiceFalha = -1;

    for (let i = 0; i < cnpjList.length; i++) {
      try {
        const cliente = await createCliente({
          documento: cnpjList[i].replace(/\D/g, ''),
          nome: nameList[i],
        });
        criados.push({
          id: cliente.id,
          name: cliente.nome,
          email: cliente.email ?? '',
          document: cliente.documento,
          phone: cliente.telefone ?? '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          totalLimit: 0,
          usedLimit: 0,
          availableLimit: 0,
          collateralValue: 0,
          status: 'pending',
        });
      } catch (err) {
        indiceFalha = i;
        const mensagem = err instanceof OptinApiError ? err.message : 'Erro desconhecido ao cadastrar cliente';
        setErrors(prev => ({ ...prev, [`cnpj-${i}`]: mensagem }));
        setSubmitError(`Falha ao cadastrar CPF/CNPJ ${i + 1}: ${mensagem}`);
        break;
      }
    }

    setIsSubmitting(false);

    if (indiceFalha === -1) {
      if (onSave) {
        onSave(criados.length === 1 ? criados[0] : criados);
      }
      handleClose();
      return;
    }

    setCnpjList(prev => prev.slice(indiceFalha));
    setNameList(prev => prev.slice(indiceFalha));
    setErrors(prev => {
      const reindexado: Record<string, string> = {};
      Object.entries(prev).forEach(([chave, valor]) => {
        const match = chave.match(/^(cnpj|nome)-(\d+)$/);
        if (!match) return;
        const indiceAntigo = Number(match[2]);
        if (indiceAntigo < indiceFalha) return;
        reindexado[`${match[1]}-${indiceAntigo - indiceFalha}`] = valor;
      });
      return reindexado;
    });
  };

  const handleClose = () => {
    setCnpjList(['']);
    setNameList(['']);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Novo Cliente</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          <div className="space-y-4">
            {cnpjList.map((cnpj, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ {index + 1} <span className="text-red-500">*</span>
                  </label>
                  <CPFCNPJInput
                    value={cnpj}
                    onChange={(e) => {
                      handleCnpjChange(index, e.target.value);
                    }}
                    placeholder="CPF ou CNPJ"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`cnpj-${index}`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    name={`cnpj-${index}`}
                  />
                  {errors[`cnpj-${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`cnpj-${index}`]}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome {index + 1} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameList[index] ?? ''}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder="Razão social"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`nome-${index}`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`nome-${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`nome-${index}`]}</p>
                  )}
                </div>
                {cnpjList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCnpjField(index)}
                    className="mt-7 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addCnpjField}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Adicionar outro CPF/CNPJ</span>
            </button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Cadastrando...' : `Criar ${cnpjList.length > 1 ? `${cnpjList.length} Clientes` : 'Cliente'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
