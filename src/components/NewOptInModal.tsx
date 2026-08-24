import React, { useState, useEffect } from 'react';
import { X, FileText, Send, Loader2, Search, Plus, Upload, ChevronRight } from 'lucide-react';
import { NewClientModal } from './NewClientModal';
import { ImportClientsModal } from './ImportClientsModal';
import { showToast } from '../hooks/useToast';

interface NewOptInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Client {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
}

interface NewClientPayload {
  document: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Credenciadoras e arranjos de pagamento disponíveis para a definição da unidade recebível (CERC-AP004).
// "99T" no envio real significa "todas" — ver handleSubmit.
const CREDENCIADORAS = ['Cielo', 'Rede', 'Stone', 'GetNet', 'Dock'];
const ARRANJOS_PAGAMENTO = ['VISA', 'MASTERCARD', 'ELO', 'HIPERCARD'];

export const NewOptInModal: React.FC<NewOptInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'select-client' | 'opt-in-details'>('select-client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState({
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tipoOperacao: 'C' as 'C' | 'A',
    referenciaExterna: `OPTIN-${Date.now()}`,
    dataAssinaturaOptIn: new Date().toISOString().split('T')[0],
    dataInicioVigencia: new Date().toISOString().split('T')[0],
    carteira: '',
    documentoTitular: '',
  });
  const [todasCredenciadoras, setTodasCredenciadoras] = useState(true);
  const [credenciadorasSelecionadas, setCredenciadorasSelecionadas] = useState<string[]>([]);
  const [todosArranjos, setTodosArranjos] = useState(true);
  const [arranjosSelecionados, setArranjosSelecionados] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && step === 'select-client') {
      loadClients();
    }
  }, [isOpen, step]);

  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/clients?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleSaveNewClient = async (clientData: NewClientPayload | NewClientPayload[]) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const clientsToCreate = Array.isArray(clientData) ? clientData : [clientData];

      for (const client of clientsToCreate) {
        const response = await fetch(`${supabaseUrl}/rest/v1/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name: client.document,
            document: client.document,
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || ''
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao criar cliente');
        }
      }

      await loadClients();
      setShowNewClientModal(false);
    } catch (err) {
      console.error('Error creating client:', err);
      showToast('error', 'Erro ao criar cliente');
    }
  };

  const handleImportClients = async (importedClients: NewClientPayload[]) => {
    await handleSaveNewClient(importedClients);
    setShowImportModal(false);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setStep('opt-in-details');
  };

  const handleBack = () => {
    setStep('select-client');
    setSelectedClient(null);
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCredenciadora = (acquirer: string) => {
    setCredenciadorasSelecionadas(prev =>
      prev.includes(acquirer) ? prev.filter(a => a !== acquirer) : [...prev, acquirer]
    );
  };

  const toggleArranjo = (arranjo: string) => {
    setArranjosSelecionados(prev =>
      prev.includes(arranjo) ? prev.filter(a => a !== arranjo) : [...prev, arranjo]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      setError('Por favor, selecione um cliente');
      return;
    }

    if (!todasCredenciadoras && credenciadorasSelecionadas.length === 0) {
      setError('Selecione ao menos uma credenciadora ou marque "Todas as credenciadoras"');
      return;
    }

    if (!todosArranjos && arranjosSelecionados.length === 0) {
      setError('Selecione ao menos um arranjo de pagamento ou marque "Todos os arranjos de pagamento"');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // cnpjSolicitante/cnpjFinanciador vêm do CNPJ já cadastrado do cliente (Cadastro).
      const cnpjSolicitante = selectedClient.document;
      const cnpjFinanciador = selectedClient.document;

      const listaCnpjCredenciadora = todasCredenciadoras ? ['99T'] : credenciadorasSelecionadas;
      const listaCodigoArranjoPagamento = todosArranjos ? ['99T'] : arranjosSelecionados;

      const response = await fetch(`${supabaseUrl}/rest/v1/opt_in_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          client_name: selectedClient.name,
          client_document: selectedClient.document,
          client_email: selectedClient.email,
          client_phone: selectedClient.phone,
          client_address: selectedClient.address,
          expiry_date: new Date(formData.expiryDate).toISOString(),
          status: 'pending_signature',
          // Campos exigidos pelo contrato CERC-AP004 (POST /opt_in)
          tipo_operacao: formData.tipoOperacao,
          referencia_externa: formData.referenciaExterna,
          cnpj_solicitante: cnpjSolicitante,
          cnpj_financiador: cnpjFinanciador,
          data_assinatura_opt_in: new Date(formData.dataAssinaturaOptIn).toISOString(),
          carteira: formData.carteira || null,
          documento_titular: formData.documentoTitular || null,
          definicao_unidade_recebivel: {
            listaCnpjCredenciadora,
            listaCodigoArranjoPagamento,
            dataInicio: new Date(formData.dataInicioVigencia).toISOString(),
            dataFim: new Date(formData.expiryDate).toISOString(),
            documentoUsuarioFinalRecebedor: selectedClient.document,
            documentoTitular: formData.documentoTitular || undefined,
          },
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar opt-in');
      }

      const [createdOptIn] = await response.json();

      const signatureUrl = `${window.location.origin}/optin-signature/${createdOptIn.signature_token}`;

      await navigator.clipboard.writeText(signatureUrl);

      showToast('success', 'Opt-in criado com sucesso!', 'Link de assinatura copiado para a área de transferência.');

      setFormData({
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipoOperacao: 'C',
        referenciaExterna: `OPTIN-${Date.now()}`,
        dataAssinaturaOptIn: new Date().toISOString().split('T')[0],
        dataInicioVigencia: new Date().toISOString().split('T')[0],
        carteira: '',
        documentoTitular: '',
      });
      setTodasCredenciadoras(true);
      setCredenciadorasSelecionadas([]);
      setTodosArranjos(true);
      setArranjosSelecionados([]);
      setStep('select-client');
      setSelectedClient(null);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document.includes(searchTerm)
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Novo Opt-In</h2>
                <p className="text-sm text-gray-600">
                  {step === 'select-client' ? 'Selecione um cliente' : 'Dados do opt-in'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {step === 'select-client' ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                </button>
              </div>

              {isLoadingClients ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum cliente encontrado</p>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewClientModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Cliente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importar Clientes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.document}</div>
                          {client.email && (
                            <div className="text-xs text-gray-400">{client.email}</div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {selectedClient && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Cliente Selecionado</h3>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Alterar
                    </button>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{selectedClient.name}</div>
                    <div className="text-gray-600">{selectedClient.document}</div>
                    {selectedClient.email && <div className="text-gray-500">{selectedClient.email}</div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="block text-gray-400">CNPJ Solicitante</span>
                      <span className="text-gray-700">{selectedClient.document}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">CNPJ Financiador</span>
                      <span className="text-gray-700">{selectedClient.document}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Operação
                    </label>
                    <select
                      name="tipoOperacao"
                      value={formData.tipoOperacao}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="C">Criação</option>
                      <option value="A">Alteração</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referência Externa
                    </label>
                    <input
                      type="text"
                      name="referenciaExterna"
                      value={formData.referenciaExterna}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Assinatura do Opt-In
                    </label>
                    <input
                      type="date"
                      name="dataAssinaturaOptIn"
                      value={formData.dataAssinaturaOptIn}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carteira <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      name="carteira"
                      value={formData.carteira}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento do Titular <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      name="documentoTitular"
                      value={formData.documentoTitular}
                      onChange={handleInputChange}
                      placeholder="CPF/CNPJ do titular da conta"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Definição da Unidade Recebível</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Início da Vigência
                      </label>
                      <input
                        type="date"
                        name="dataInicioVigencia"
                        value={formData.dataInicioVigencia}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fim da Vigência (Vencimento do Opt-In)
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={todasCredenciadoras}
                        onChange={(e) => setTodasCredenciadoras(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Todas as credenciadoras (99T)</span>
                    </label>
                    {!todasCredenciadoras && (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {CREDENCIADORAS.map((acquirer) => (
                          <label
                            key={acquirer}
                            className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition-colors ${
                              credenciadorasSelecionadas.includes(acquirer)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={credenciadorasSelecionadas.includes(acquirer)}
                              onChange={() => toggleCredenciadora(acquirer)}
                              className="sr-only"
                            />
                            {acquirer}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={todosArranjos}
                        onChange={(e) => setTodosArranjos(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Todos os arranjos de pagamento (99T)</span>
                    </label>
                    {!todosArranjos && (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {ARRANJOS_PAGAMENTO.map((arranjo) => (
                          <label
                            key={arranjo}
                            className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition-colors ${
                              arranjosSelecionados.includes(arranjo)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={arranjosSelecionados.includes(arranjo)}
                              onChange={() => toggleArranjo(arranjo)}
                              className="sr-only"
                            />
                            {arranjo}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Como funciona?
                    </h4>
                    <p className="text-sm text-blue-700">
                      Ao criar o opt-in, um link exclusivo de assinatura será gerado.
                      Envie este link para o cliente assinar o termo de consentimento digitalmente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Criar Opt-In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSave={handleSaveNewClient}
      />

      <ImportClientsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportClients}
      />
    </>
  );
};
