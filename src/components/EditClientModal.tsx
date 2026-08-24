import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Client } from '../types';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSave: (clientId: string, data: Partial<Client>) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, client, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    totalLimit: 0,
  });

  useEscapeKey(() => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        totalLimit: client.totalLimit,
      });
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usedLimit = client.usedLimit;
    onSave(client.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      totalLimit: formData.totalLimit,
      availableLimit: formData.totalLimit - usedLimit,
    });
    onClose();
  };

  const formatCurrencyInput = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={client.document}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite Total</label>
            <input
              type="number"
              value={formData.totalLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, totalLimit: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              min={0}
              step={0.01}
            />
            <p className="text-xs text-gray-500 mt-1">
              Limite utilizado: {formatCurrencyInput(client.usedLimit)} — Disponível após salvar: {formatCurrencyInput(Math.max(0, formData.totalLimit - client.usedLimit))}
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
