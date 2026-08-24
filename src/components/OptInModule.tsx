import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Plus,
  Copy,
  ExternalLink
} from 'lucide-react';
import { NewOptInModal } from './NewOptInModal';
import { showToast } from '../hooks/useToast';
import { OptInDetailsModal } from './OptInDetailsModal';

interface OptInClient {
  id: string;
  client_name: string;
  client_document: string;
  client_email: string;
  status: 'active' | 'expired' | 'pending_signature' | 'pending_registry' | 'cancelled' | 'signed';
  created_at: string;
  expiry_date: string;
  signature_token: string;
  signed_at?: string;
  sent_to_registry_at?: string;
}

export const OptInModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<OptInClient | null>(null);
  const [isNewOptInModalOpen, setIsNewOptInModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [clients, setClients] = useState<OptInClient[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    loadOptIns();
  }, []);

  const loadOptIns = async () => {
    try {
      const mockClients: OptInClient[] = [
        {
          id: '1',
          client_name: 'ABC Comércio S.A.',
          client_document: '12.345.678/0001-90',
          client_email: 'contato@abccomercio.com.br',
          status: 'signed',
          created_at: new Date('2024-01-15').toISOString(),
          expiry_date: new Date('2025-01-15').toISOString(),
          signature_token: 'abc123token',
          signed_at: new Date('2024-01-16').toISOString()
        },
        {
          id: '2',
          client_name: 'XYZ Indústria Ltda.',
          client_document: '23.456.789/0001-01',
          client_email: 'financeiro@xyzindustria.com.br',
          status: 'signed',
          created_at: new Date('2024-02-10').toISOString(),
          expiry_date: new Date('2025-02-10').toISOString(),
          signature_token: 'xyz456token',
          signed_at: new Date('2024-02-11').toISOString()
        },
        {
          id: '3',
          client_name: 'Tech Solutions Brasil',
          client_document: '34.567.890/0001-12',
          client_email: 'admin@techsolutions.com.br',
          status: 'pending_signature',
          created_at: new Date('2024-10-20').toISOString(),
          expiry_date: new Date('2025-10-20').toISOString(),
          signature_token: 'tech789token'
        },
        {
          id: '6',
          client_name: 'Serviços Empresariais Ltda',
          client_document: '67.890.123/0001-45',
          client_email: 'contato@servicos.com.br',
          status: 'pending_registry',
          created_at: new Date('2024-10-25').toISOString(),
          expiry_date: new Date('2025-10-25').toISOString(),
          signature_token: 'service303token',
          signed_at: new Date('2024-10-26').toISOString()
        },
        {
          id: '4',
          client_name: 'Varejo Prime Ltda.',
          client_document: '45.678.901/0001-23',
          client_email: 'contato@varejoprime.com.br',
          status: 'expired',
          created_at: new Date('2023-06-15').toISOString(),
          expiry_date: new Date('2024-06-15').toISOString(),
          signature_token: 'prime101token',
          signed_at: new Date('2023-06-16').toISOString()
        },
        {
          id: '5',
          client_name: 'Marketplace Digital Ltda',
          client_document: '56.789.012/0001-34',
          client_email: 'juridico@marketplace.com.br',
          status: 'signed',
          created_at: new Date('2024-03-05').toISOString(),
          expiry_date: new Date('2025-03-05').toISOString(),
          signature_token: 'market202token',
          signed_at: new Date('2024-03-06').toISOString()
        },
        {
          id: '6',
          client_name: 'Rede Varejista Brasil',
          client_document: '67.890.123/0001-45',
          client_email: 'comercial@redevarejista.com.br',
          status: 'signed',
          created_at: new Date('2024-04-12').toISOString(),
          expiry_date: new Date('2025-04-12').toISOString(),
          signature_token: 'rede303token',
          signed_at: new Date('2024-04-13').toISOString()
        },
        {
          id: '7',
          client_name: 'E-commerce Plus S.A.',
          client_document: '78.901.234/0001-56',
          client_email: 'suporte@ecommerceplus.com.br',
          status: 'cancelled',
          created_at: new Date('2024-05-20').toISOString(),
          expiry_date: new Date('2025-05-20').toISOString(),
          signature_token: 'ecom404token'
        },
        {
          id: '8',
          client_name: 'Supermercados Unidos',
          client_document: '89.012.345/0001-67',
          client_email: 'admin@superunidos.com.br',
          status: 'signed',
          created_at: new Date('2024-06-08').toISOString(),
          expiry_date: new Date('2025-06-08').toISOString(),
          signature_token: 'super505token',
          signed_at: new Date('2024-06-09').toISOString()
        },
        {
          id: '9',
          client_name: 'Farmácias Rede Sul',
          client_document: '90.123.456/0001-78',
          client_email: 'gestao@farmaciasul.com.br',
          status: 'pending',
          created_at: new Date('2024-10-25').toISOString(),
          expiry_date: new Date('2025-10-25').toISOString(),
          signature_token: 'farma606token'
        },
        {
          id: '10',
          client_name: 'Atacadista Nacional',
          client_document: '01.234.567/0001-89',
          client_email: 'financeiro@atacadistanacional.com.br',
          status: 'signed',
          created_at: new Date('2024-07-01').toISOString(),
          expiry_date: new Date('2025-07-01').toISOString(),
          signature_token: 'atac707token',
          signed_at: new Date('2024-07-02').toISOString()
        },
        {
          id: '11',
          client_name: 'Distribuidora Alimentos BR',
          client_document: '11.222.333/0001-44',
          client_email: 'contato@distribuidorabr.com.br',
          status: 'signed',
          created_at: new Date('2024-08-15').toISOString(),
          expiry_date: new Date('2025-08-15').toISOString(),
          signature_token: 'dist808token',
          signed_at: new Date('2024-08-16').toISOString()
        },
        {
          id: '12',
          client_name: 'Lojas Magazine Premium',
          client_document: '22.333.444/0001-55',
          client_email: 'adm@magazinepremium.com.br',
          status: 'expired',
          created_at: new Date('2023-09-10').toISOString(),
          expiry_date: new Date('2024-09-10').toISOString(),
          signature_token: 'mag909token',
          signed_at: new Date('2023-09-11').toISOString()
        },
        {
          id: '13',
          client_name: 'Boutique Fashion Store',
          client_document: '33.444.555/0001-66',
          client_email: 'vendas@boutiquefashion.com.br',
          status: 'pending',
          created_at: new Date('2024-10-28').toISOString(),
          expiry_date: new Date('2025-10-28').toISOString(),
          signature_token: 'bout111token'
        },
        {
          id: '14',
          client_name: 'Restaurante Gourmet Ltda',
          client_document: '44.555.666/0001-77',
          client_email: 'gerencia@restaurantegourmet.com.br',
          status: 'signed',
          created_at: new Date('2024-09-05').toISOString(),
          expiry_date: new Date('2025-09-05').toISOString(),
          signature_token: 'rest222token',
          signed_at: new Date('2024-09-06').toISOString()
        },
        {
          id: '15',
          client_name: 'Auto Peças Brasil S.A.',
          client_document: '55.666.777/0001-88',
          client_email: 'comercial@autopecasbr.com.br',
          status: 'cancelled',
          created_at: new Date('2024-07-22').toISOString(),
          expiry_date: new Date('2025-07-22').toISOString(),
          signature_token: 'auto333token'
        }
      ];

      setClients(mockClients);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading opt-ins:', error);
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: OptInClient['status']) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending_signature': return 'bg-yellow-100 text-yellow-800';
      case 'pending_registry': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OptInClient['status']) => {
    switch (status) {
      case 'signed': return 'Assinado';
      case 'expired': return 'Vencido';
      case 'pending_signature': return 'Pendente - Aguardando Assinatura';
      case 'pending_registry': return 'Pendente - Encaminhar p/ Registradora';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: OptInClient['status']) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'pending_signature': return <Clock className="w-4 h-4" />;
      case 'pending_registry': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const activeClients = clients.filter(c => c.status === 'signed' || c.status === 'pending_signature' || c.status === 'pending_registry');
  const inactiveClients = clients.filter(c => c.status === 'expired' || c.status === 'cancelled');

  const currentClients = activeTab === 'active' ? activeClients : inactiveClients;

  const filteredClients = currentClients.filter(client => {
    const matchesSearch = client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.client_document.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });


  const handleViewConsent = (client: OptInClient) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const handleCopyLink = async (client: OptInClient) => {
    const url = `${window.location.origin}/optin-signature/${client.signature_token}`;
    await navigator.clipboard.writeText(url);
    showToast('info', 'Link copiado!', 'Link de assinatura copiado para a área de transferência.');
  };

  const handleSendToRegistry = async (client: OptInClient) => {
    // Atualizar status para 'signed' após encaminhar
    const updatedClients = clients.map(c =>
      c.id === client.id
        ? {
            ...c,
            status: 'signed' as const,
            sent_to_registry_at: new Date().toISOString()
          }
        : c
    );
    setClients(updatedClients);
    showToast('success', 'Opt-in encaminhado!', `Cliente: ${client.client_name}`);
  };

  return (
    <div className="space-y-6">
      <NewOptInModal
        isOpen={isNewOptInModalOpen}
        onClose={() => setIsNewOptInModalOpen(false)}
        onSuccess={loadOptIns}
      />

      <OptInDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        client={selectedClient}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Opt-Ins Ativos
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {activeClients.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'inactive'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Opt-Ins Inativos
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'inactive' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {inactiveClients.length}
                </span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-60 h-9 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-9 text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="pending_signature">Pendente - Aguardando Assinatura</option>
                <option value="pending_registry">Pendente - Encaminhar p/ Registradora</option>
                <option value="signed">Assinado</option>
                <option value="expired">Vencido</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <button
                onClick={() => setIsNewOptInModalOpen(true)}
                className="px-5 py-2 h-9 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm hover:shadow-md flex items-center space-x-2 text-sm font-medium whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Opt-In</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data do Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento do OPTIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => {
                const expiringSoon = client.status === 'signed' && isExpiringSoon(client.expiry_date);

                return (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.client_name}</div>
                        <div className="text-sm text-gray-500">{client.client_document}</div>
                        <div className="text-xs text-gray-400">{client.client_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                        {getStatusIcon(client.status)}
                        <span className="ml-1">{getStatusLabel(client.status)}</span>
                      </span>
                      {expiringSoon && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Vence em breve
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(client.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(client.expiry_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewConsent(client)}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Dados do Opt-In
                        </button>
                        {client.status === 'pending_signature' && (
                          <button
                            onClick={() => handleCopyLink(client)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar Link
                          </button>
                        )}
                        {client.status === 'pending_registry' && (
                          <button
                            onClick={() => handleSendToRegistry(client)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-yellow-600 text-white hover:bg-yellow-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Encaminhar p/ Registradora
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">Nenhum cliente encontrado</div>
              <div className="text-sm text-gray-400">
                Tente ajustar os filtros ou termos de busca
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
