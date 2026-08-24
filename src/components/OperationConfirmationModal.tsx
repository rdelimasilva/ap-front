import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface OperationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  clientName?: string;
}

export const OperationConfirmationModal: React.FC<OperationConfirmationModalProps> = ({
  isOpen,
  onClose,
  title = 'Operação Enviada para Aprovação',
  message = 'Contrato enviado para aprovação',
  clientName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {message}
            </h4>
            {clientName && (
              <p className="text-gray-600 mb-4">
                Cliente: <span className="font-medium">{clientName}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-4">
              A operação foi registrada com sucesso e está aguardando aprovação.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                Acompanhe o status desta operação no <strong>menu de Operações</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
