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
} from 'lucide-react';
import { NewOptInModal } from './NewOptInModal';
import { showToast } from '../hooks/useToast';
import { OptInRegistroModal } from './OptInRegistroModal';
import { listOptins, type OptinDTO } from '../services/optinApi';

export const OptInModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOptin, setSelectedOptin] = useState<OptinDTO | null>(null);
  const [isNewOptInModalOpen, setIsNewOptInModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [optins, setOptins] = useState<OptinDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    loadOptIns();
  }, []);

  const loadOptIns = async () => {
    setIsLoading(true);
    try {
      const dados = await listOptins();
      setOptins(dados);
    } catch (err) {
      console.error('Error loading opt-ins:', err);
      showToast('error', 'Erro ao carregar opt-ins');
    } finally {
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

  const getStatusColor = (status: OptinDTO['status']) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'REJEITADO': return 'bg-red-100 text-red-800';
      case 'FALHA_ENVIO': return 'bg-red-100 text-red-800';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: OptinDTO['status']) => {
    switch (status) {
      case 'ATIVO': return <CheckCircle className="w-4 h-4" />;
      case 'REJEITADO': return <XCircle className="w-4 h-4" />;
      case 'FALHA_ENVIO': return <XCircle className="w-4 h-4" />;
      case 'PENDENTE': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const isExpiringSoon = (vigenciaFim: string) => {
    const now = new Date();
    const fim = new Date(vigenciaFim);
    const daysUntilExpiry = Math.ceil((fim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const activeOptins = optins.filter(o => o.status === 'ATIVO');
  const inactiveOptins = optins.filter(o => o.status !== 'ATIVO');

  const currentOptins = activeTab === 'active' ? activeOptins : inactiveOptins;

  const filteredOptins = currentOptins.filter(optin => {
    const nomeCliente = optin.clienteNome ?? '';
    const matchesSearch = nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         optin.usuarioFinalRecebedor.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || optin.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (optin: OptinDTO) => {
    setSelectedOptin(optin);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <NewOptInModal
        isOpen={isNewOptInModalOpen}
        onClose={() => setIsNewOptInModalOpen(false)}
        onSuccess={loadOptIns}
      />

      <OptInRegistroModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        optin={selectedOptin}
        onUpdated={loadOptIns}
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
                  {activeOptins.length}
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
                  {inactiveOptins.length}
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
                <option value="ATIVO">Ativo</option>
                <option value="REJEITADO">Rejeitado pela CERC</option>
                <option value="FALHA_ENVIO">Falha no envio</option>
                <option value="PENDENTE">Pendente</option>
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
              {filteredOptins.map((optin) => {
                const expiringSoon = optin.status === 'ATIVO' && isExpiringSoon(optin.vigenciaFim);

                return (
                  <tr key={optin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{optin.clienteNome ?? '—'}</div>
                        <div className="text-sm text-gray-500">{optin.usuarioFinalRecebedor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(optin.status)}`}>
                        {getStatusIcon(optin.status)}
                        <span className="ml-1">{getStatusLabel(optin.status)}</span>
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
                        {formatDate(optin.criadoEm)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(optin.vigenciaFim)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(optin)}
                        className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Dados do Opt-In
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isLoading && filteredOptins.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">Nenhum opt-in encontrado</div>
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
