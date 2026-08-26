import React, { useState } from 'react';
import { X, FileText, CheckCircle, Calendar, Hash, Building2, Edit2, Save, Loader2 } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import { updateOptin, OptinApiError, type OptinDTO } from '../services/optinApi';

interface OptInRegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  optin: OptinDTO | null;
  onUpdated: () => void;
}

export const OptInRegistroModal: React.FC<OptInRegistroModalProps> = ({ isOpen, onClose, optin, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vigenciaFim, setVigenciaFim] = useState('');
  const [carteira, setCarteira] = useState('');

  if (!isOpen || !optin) return null;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: OptinDTO['status']) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJEITADO': return 'bg-red-100 text-red-800 border-red-200';
      case 'FALHA_ENVIO': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: OptinDTO['status']) => {
    switch (status) {
      case 'ATIVO': return 'Ativo';
      case 'REJEITADO': return 'Rejeitado pela CERC';
      case 'FALHA_ENVIO': return 'Falha no envio';
      case 'PENDENTE': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  const startEditing = () => {
    setVigenciaFim(optin.vigenciaFim);
    setCarteira(optin.carteira ?? '');
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateOptin(optin.id, { vigenciaFim, carteira: carteira || null });
      showToast('success', 'Opt-in atualizado!');
      setIsEditing(false);
      onUpdated();
      onClose();
    } catch (err) {
      if (err instanceof OptinApiError) {
        setError(err.message);
      } else {
        setError('Erro desconhecido ao atualizar opt-in');
      }
    } finally {
      setIsSaving(false);
    }
  };

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
              <p className="text-sm text-gray-600">Registro CERC da unidade recebível</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(optin.status)}`}>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">Status do Opt-In</p>
                <p className="text-sm">{getStatusLabel(optin.status)}</p>
              </div>
            </div>
            {optin.protocoloCerc && (
              <div className="text-right text-sm">
                <p className="font-medium">Protocolo CERC:</p>
                <p>{optin.protocoloCerc}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-base text-gray-900">{optin.clienteNome ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Usuário Final Recebedor</p>
                  <p className="text-base text-gray-900">{optin.usuarioFinalRecebedor}</p>
                </div>
              </div>
              {optin.titular && (
                <div className="flex items-start space-x-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Titular</p>
                    <p className="text-base text-gray-900">{optin.titular}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">CNPJ Financiador</p>
                  <p className="text-base text-gray-900">{optin.cnpjFinanciador}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Unidade Recebível</h3>
              {optin.status === 'ATIVO' && !isEditing && (
                <button onClick={startEditing} className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                  <Edit2 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Início da Vigência</p>
                  <p className="text-base text-gray-900">{formatDate(optin.vigenciaInicio)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Fim da Vigência</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={vigenciaFim}
                      onChange={(e) => setVigenciaFim(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{formatDate(optin.vigenciaFim)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3 md:col-span-2">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Carteira</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={carteira}
                      onChange={(e) => setCarteira(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{optin.carteira ?? '—'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Credenciadoras</p>
                  <p className="text-base text-gray-900">{optin.credenciadoras.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Arranjos</p>
                  <p className="text-base text-gray-900">{optin.arranjos.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar</span>
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
