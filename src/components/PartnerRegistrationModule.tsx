import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, CheckSquare, X, Save, Loader2 } from 'lucide-react';
import { NewClientModal } from './NewClientModal';
import { OptInModule } from './OptInModule';
import { showToast } from '../hooks/useToast';
import { listClientes, updateCliente, OptinApiError, type ClienteDTO } from '../services/optinApi';

interface Partner {
  id: string;
  name: string;
  document: string;
  type: 'client';
  email: string;
  phone: string;
  status: ClienteDTO['status'];
}

function clienteDtoParaPartner(dto: ClienteDTO): Partner {
  return {
    id: dto.id,
    name: dto.nome,
    document: dto.documento,
    type: 'client',
    email: dto.email ?? '',
    phone: dto.telefone ?? '',
    status: dto.status,
  };
}

interface EditPartnerModalProps {
  partner: Partner;
  onClose: () => void;
  onSaved: () => void;
}

const EditPartnerModal: React.FC<EditPartnerModalProps> = ({ partner, onClose, onSaved }) => {
  const [nome, setNome] = useState(partner.name);
  const [email, setEmail] = useState(partner.email);
  const [telefone, setTelefone] = useState(partner.phone);
  const [status, setStatus] = useState<ClienteDTO['status']>(partner.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Informe o nome do cliente');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateCliente(partner.id, { nome, email, telefone, status });
      showToast('success', 'Cliente atualizado!');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof OptinApiError ? err.message : 'Erro desconhecido ao atualizar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ/CPF</label>
            <input
              type="text"
              value={partner.document}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClienteDTO['status'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pendente</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PartnerRegistrationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'opt-in'>('clients');
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const dados = await listClientes();
      setPartners(dados.map(clienteDtoParaPartner));
    } catch (err) {
      console.error('Error loading clientes:', err);
      showToast('error', 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const filteredPartners = partners.filter(
    partner =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.document.includes(searchTerm)
  );

  const handleNewPartner = () => {
    setIsNewPartnerModalOpen(true);
  };

  const handleDeactivate = async (partner: Partner) => {
    const confirmado = window.confirm(`Inativar o cliente "${partner.name}"? Ele deixa de aparecer como opção ativa, mas o cadastro é mantido (opt-ins vinculados não são afetados).`);
    if (!confirmado) return;

    setDeactivatingId(partner.id);
    try {
      await updateCliente(partner.id, { status: 'inactive' });
      showToast('success', 'Cliente inativado');
      await loadPartners();
    } catch (err) {
      showToast('error', err instanceof OptinApiError ? err.message : 'Erro ao inativar cliente');
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clients' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('opt-in')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'opt-in' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Opt-in</span>
          </button>
        </div>

        {activeTab === 'clients' && (
          <button
            onClick={handleNewPartner}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Cliente</span>
          </button>
        )}
      </div>

      {activeTab === 'opt-in' ? (
        <OptInModule />
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Carregando clientes...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                Nenhum cliente encontrado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CNPJ</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                      <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{partner.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{partner.document}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{partner.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{partner.phone}</td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              partner.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : partner.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {partner.status === 'active' ? 'Ativo' : partner.status === 'pending' ? 'Pendente' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingPartner(partner)}
                              title="Editar cliente"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(partner)}
                              disabled={deactivatingId === partner.id || partner.status === 'inactive'}
                              title={partner.status === 'inactive' ? 'Cliente já inativo' : 'Inativar cliente'}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {deactivatingId === partner.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      <NewClientModal
        isOpen={isNewPartnerModalOpen}
        onClose={() => { loadPartners(); setIsNewPartnerModalOpen(false); }}
        onSave={(clientData) => {
          const nomes = Array.isArray(clientData) ? clientData.map(c => c.name).join(', ') : clientData.name;
          showToast('success', 'Cliente criado!', `${nomes} foi adicionado com sucesso`);
          loadPartners();
          setIsNewPartnerModalOpen(false);
        }}
      />

      {editingPartner && (
        <EditPartnerModal
          partner={editingPartner}
          onClose={() => setEditingPartner(null)}
          onSaved={loadPartners}
        />
      )}
    </div>
  );
};
