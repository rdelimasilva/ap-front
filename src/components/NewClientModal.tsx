import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { CNPJInput } from './MaskedInput';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEscapeKey(() => {
    if (isOpen) onClose();
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

  const addCnpjField = () => {
    setCnpjList([...cnpjList, '']);
  };

  const removeCnpjField = (index: number) => {
    if (cnpjList.length > 1) {
      const newList = cnpjList.filter((_, i) => i !== index);
      setCnpjList(newList);
    }
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned[12]) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned[13]) !== digit2) return false;

    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    cnpjList.forEach((cnpj, index) => {
      if (!cnpj.trim()) {
        newErrors[`cnpj-${index}`] = 'CNPJ é obrigatório';
      } else {
        const cleanDoc = cnpj.replace(/\D/g, '');
        if (cleanDoc.length !== 14) {
          newErrors[`cnpj-${index}`] = 'CNPJ deve ter 14 dígitos';
        } else if (!validateCNPJ(cleanDoc)) {
          newErrors[`cnpj-${index}`] = 'CNPJ inválido. Verifique os dígitos informados.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const clientsData = cnpjList.map((cnpj, index) => ({
      id: `client-${Date.now()}-${index}`,
      name: cnpj,
      email: '',
      document: cnpj,
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      totalLimit: 0,
      usedLimit: 0,
      availableLimit: 0,
      collateralValue: 0,
      status: 'pending',
    }));

    if (onSave) {
      if (clientsData.length === 1) {
        onSave(clientsData[0]);
      } else {
        onSave(clientsData);
      }
    }

    handleClose();
  };

  const handleClose = () => {
    setCnpjList(['']);
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Novo Cliente</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {cnpjList.map((cnpj, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ {index + 1} <span className="text-red-500">*</span>
                  </label>
                  <CNPJInput
                    value={cnpj}
                    onChange={(e) => {
                      handleCnpjChange(index, e.target.value);
                    }}
                    placeholder="00.000.000/0000-00"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`cnpj-${index}`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    name={`cnpj-${index}`}
                  />
                  {errors[`cnpj-${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`cnpj-${index}`]}</p>
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
              <span className="text-sm font-medium">Adicionar outro CNPJ</span>
            </button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar {cnpjList.length > 1 ? `${cnpjList.length} Clientes` : 'Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
