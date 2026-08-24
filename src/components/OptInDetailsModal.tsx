import React from 'react';
import { X, FileText, CheckCircle, Calendar, Mail, Phone, MapPin, User, Hash, Clock, Send } from 'lucide-react';
import { showToast } from '../hooks/useToast';

interface OptInClient {
  id: string;
  client_name: string;
  client_document: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'signed' | 'pending_registry';
  created_at: string;
  expiry_date: string;
  signature_token: string;
  signed_at?: string;
}

interface OptInDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: OptInClient | null;
  onSendToRegistry?: (client: OptInClient) => void;
}

export const OptInDetailsModal: React.FC<OptInDetailsModalProps> = ({ isOpen, onClose, client, onSendToRegistry }) => {
  if (!isOpen || !client) return null;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatDateShort = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: OptInClient['status']) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: OptInClient['status']) => {
    switch (status) {
      case 'signed': return 'Assinado';
      case 'expired': return 'Vencido';
      case 'pending': return 'Pendente de Assinatura';
      case 'pending_registry': return 'Pendente - Encaminhar p/ Registradora';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const signatureUrl = `${window.location.origin}/optin-signature/${client.signature_token}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dados do Opt-In</h2>
              <p className="text-sm text-gray-600">Informações detalhadas do consentimento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(client.status)}`}>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">Status do Opt-In</p>
                <p className="text-sm">{getStatusLabel(client.status)}</p>
              </div>
            </div>
            {client.signed_at && (
              <div className="text-right text-sm">
                <p className="font-medium">Assinado em:</p>
                <p>{formatDateShort(client.signed_at)}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Cliente</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-base text-gray-900">{client.client_name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">CNPJ/CPF</p>
                  <p className="text-base text-gray-900">{client.client_document}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">E-mail</p>
                  <p className="text-base text-gray-900">{client.client_email}</p>
                </div>
              </div>

              {client.client_phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p className="text-base text-gray-900">{client.client_phone}</p>
                  </div>
                </div>
              )}

              {client.client_address && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Endereço</p>
                    <p className="text-base text-gray-900">{client.client_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Consentimento</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                  <p className="text-base text-gray-900">{formatDate(client.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Data de Vencimento</p>
                  <p className="text-base text-gray-900">{formatDate(client.expiry_date)}</p>
                </div>
              </div>

              {client.signed_at && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Data de Assinatura</p>
                    <p className="text-base text-gray-900">{formatDate(client.signed_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {client.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                    Link de Assinatura
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    O cliente ainda não assinou o termo. Compartilhe o link abaixo:
                  </p>
                  <div className="bg-white border border-yellow-300 rounded p-3 flex items-center justify-between">
                    <code className="text-sm text-gray-700 break-all">{signatureUrl}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(signatureUrl);
                        showToast('info', 'Link copiado!');
                      }}
                      className="ml-3 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors whitespace-nowrap"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            {client.status === 'pending_registry' && onSendToRegistry && (
              <button
                onClick={() => {
                  onSendToRegistry(client);
                  onClose();
                }}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Encaminhar p/ Registradora</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
