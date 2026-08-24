import React from 'react';
import { Client, Contract } from '../types';
import { MetricCard } from './MetricCard';
import { ContractDetail } from './ContractDetail';
import { HistoricalValuesTable } from './HistoricalValuesTable';
import { Breadcrumb } from './Breadcrumb';
import { EditClientModal } from './EditClientModal';
import { useData } from '../context/DataContext';
import {
  DollarSign,
  CreditCard,
  Shield,
  TrendingUp,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  BarChart3,
  Eye,
  ArrowDown,
  RotateCw,
  Edit,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack }) => {
  const { contracts, updateClient } = useData();
  const [selectedContract, setSelectedContract] = React.useState<Contract | null>(null);
  const [showEditClientModal, setShowEditClientModal] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(new Set(['client-info']));
  const contractsSectionRef = React.useRef<HTMLDivElement>(null);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };
  
  // Get contracts for this client
  const clientContracts = contracts.filter(contract => contract.clientId === client.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getProductTypeLabel = (productType: Contract['productType']) => {
    switch (productType) {
      case 'guarantee': return 'Garantia';
      case 'extra-limit': return 'Crédito Pontual';
      case 'debt-settlement': return 'Quitação';
      case 'anticipation': return 'Antecipação';
      default: return 'Desconhecido';
    }
  };

  const getProductTypeColor = (productType: Contract['productType']) => {
    switch (productType) {
      case 'guarantee': return 'bg-green-100 text-green-800';
      case 'extra-limit': return 'bg-purple-100 text-purple-800';
      case 'debt-settlement': return 'bg-red-100 text-red-800';
      case 'anticipation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductTypeIcon = (productType: Contract['productType']) => {
    switch (productType) {
      case 'guarantee': return <Shield className="w-4 h-4" />;
      case 'extra-limit': return <CreditCard className="w-4 h-4" />;
      case 'debt-settlement': return <DollarSign className="w-4 h-4" />;
      case 'anticipation': return <TrendingUp className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract);
  };

  const handleBackToClient = () => {
    setSelectedContract(null);
  };

  const handleViewActiveContracts = () => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.delete('contracts');
      return next;
    });
    setTimeout(() => {
      contractsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // If a contract is selected, show contract detail
  if (selectedContract) {
    return <ContractDetail contract={selectedContract} onBack={handleBackToClient} />;
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'Clientes', onClick: onBack },
          { label: client.name },
        ]}
      />
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 transition-colors h-8 flex items-center justify-center text-sm font-normal"
        >
          ← Voltar
        </button>
      </div>

      {/* Client Info - Collapsible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('client-info')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Informações do Cliente</h3>
              {collapsedSections.has('client-info') && (
                <p className="text-sm text-gray-500">{client.document} • Cliente desde {formatDate(client.createdAt)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowEditClientModal(true);
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50 cursor-pointer"
            >
              <Edit className="w-5 h-5" />
            </span>
            {collapsedSections.has('client-info') ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        {!collapsedSections.has('client-info') && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{client.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-900">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Cliente desde</p>
                  <p className="font-medium text-gray-900">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        <MetricCard
          title="Limite Total"
          value={formatCurrency(client.totalLimit)}
          color="text-blue-600"
        />
        <MetricCard
          title="Limite Utilizado"
          value={formatCurrency(client.usedLimit)}
          subtitle={`${((client.usedLimit / client.totalLimit) * 100).toFixed(1)}% do total`}
          color="text-green-600"
        />
        <MetricCard
          title="Limite Disponível"
          value={formatCurrency(client.availableLimit)}
          color="text-purple-600"
        />
        <MetricCard
          title="Garantia Antecipada"
          value="R$ 138.150,00"
          color="text-orange-600"
        />
      </div>

      {/* Volumes por Credenciadora */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('volumes')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Volumes por Credenciadora</h3>
          </div>
          {collapsedSections.has('volumes') ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {!collapsedSections.has('volumes') && (
          <div className="px-6 pb-6">
            {/* Resumo de totais */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Volume Total</p>
                <p className="text-xl font-bold text-gray-900">R$ 12,80Mi</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Volume Bloqueado Total</p>
                <p className="text-xl font-bold text-red-700">R$ 7,89Mi</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Bloqueado por Você</p>
                <p className="text-xl font-bold text-blue-700">R$ 4,50Mi</p>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-6 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span className="text-gray-600">Volume Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span className="text-gray-600">Bloqueado Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Bloqueado por Você</span>
              </div>
            </div>

            {/* Barras horizontais */}
            <div className="space-y-3">
              {[
                { name: 'Dock', total: 6107850, bloqueadoTotal: 4500000, bloqueadoVoce: 3200000 },
                { name: 'Cielo', total: 2165421, bloqueadoTotal: 1200000, bloqueadoVoce: 580000 },
                { name: 'PagSeguro', total: 1774691, bloqueadoTotal: 800000, bloqueadoVoce: 320000 },
                { name: 'Stone', total: 1738090, bloqueadoTotal: 950000, bloqueadoVoce: 250000 },
                { name: 'Rede', total: 738698, bloqueadoTotal: 400000, bloqueadoVoce: 150000 },
                { name: 'Getnet', total: 77226, bloqueadoTotal: 35000, bloqueadoVoce: 0 },
                { name: 'Safrapay', total: 1652, bloqueadoTotal: 800, bloqueadoVoce: 0 },
              ].map((item) => {
                const maxValue = 6107850;
                const totalW = (item.total / maxValue) * 100;
                const bloqueadoTotalW = (item.bloqueadoTotal / maxValue) * 100;
                const bloqueadoVoceW = (item.bloqueadoVoce / maxValue) * 100;

                return (
                  <div key={item.name} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 w-24">{item.name}</span>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatCurrency(item.total)}</span>
                        <span className="text-red-600">{formatCurrency(item.bloqueadoTotal)}</span>
                        <span className="text-blue-600">{formatCurrency(item.bloqueadoVoce)}</span>
                      </div>
                    </div>
                    <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gray-300 rounded transition-all"
                        style={{ width: `${totalW}%` }}
                        title={`Volume Total: ${formatCurrency(item.total)}`}
                      />
                      <div
                        className="absolute top-0 left-0 h-full bg-red-400 rounded transition-all"
                        style={{ width: `${bloqueadoTotalW}%` }}
                        title={`Bloqueado Total: ${formatCurrency(item.bloqueadoTotal)}`}
                      />
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded transition-all"
                        style={{ width: `${bloqueadoVoceW}%` }}
                        title={`Bloqueado por Você: ${formatCurrency(item.bloqueadoVoce)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* View Active Contracts Button */}
      <div className="flex justify-center my-6">
        <button
          onClick={handleViewActiveContracts}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Ver Contratos Ativos</span>
        </button>
      </div>

      {/* Contracts Section */}
      <div ref={contractsSectionRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('contracts')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contratos de Recebíveis</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {clientContracts.length} contrato(s)
            </span>
            {collapsedSections.has('contracts') ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        {!collapsedSections.has('contracts') && (
          <div className="px-6 pb-6">
            {clientContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h4>
                <p className="text-gray-600 mb-4">Este cliente ainda não possui contratos de recebíveis.</p>
                <button className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors h-8 flex items-center justify-center text-sm font-normal">
                  Criar Primeiro Contrato
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {clientContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleContractClick(contract)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{contract.contractNumber}</h4>
                        <p className="text-sm text-gray-600">
                          Criado em {formatDate(contract.createdAt)}
                          {contract.closedAt && ` • Encerrado em ${formatDate(contract.closedAt)}`}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductTypeColor(contract.productType)}`}>
                          {getProductTypeIcon(contract.productType)}
                          <span className="ml-1">{getProductTypeLabel(contract.productType)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Valor Onerado</p>
                        <p className="font-medium text-gray-900">{formatCurrency(contract.encumberedValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Liquidado</p>
                        <p className="font-medium text-gray-900">{formatCurrency(contract.actualSettlementValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Chargebacks</p>
                        <p className="font-medium text-red-600">{contract.chargeback.quantity} ({contract.chargeback.percentage.toFixed(1)}%)</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          contract.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status === 'active' ? 'Ativo' : 'Encerrado'}
                        </span>
                        <div className="flex items-center space-x-1">
                          {contract.hasRevolvency ? (
                            <RotateCw
                              className="w-4 h-4 text-green-600"
                              title="Contrato com revolvência"
                            />
                          ) : (
                            <ArrowDown
                              className="w-4 h-4 text-gray-600"
                              title="Contrato sem revolvência"
                            />
                          )}
                        </div>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Values Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('historical')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Histórico de Valores</h3>
          </div>
          {collapsedSections.has('historical') ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {!collapsedSections.has('historical') && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-end mb-4">
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="all">Todos os CNPJs</option>
                <option value="12.345.678/0001-90">12.345.678/0001-90 - ABC Comércio S.A.</option>
                <option value="12.345.678/0002-71">12.345.678/0002-71 - ABC Filial SP</option>
                <option value="12.345.678/0003-52">12.345.678/0003-52 - ABC Filial RJ</option>
              </select>
            </div>
            <HistoricalValuesTable />
          </div>
        )}
      </div>

      <EditClientModal
        isOpen={showEditClientModal}
        onClose={() => setShowEditClientModal(false)}
        client={client}
        onSave={updateClient}
      />
    </div>
  );
};