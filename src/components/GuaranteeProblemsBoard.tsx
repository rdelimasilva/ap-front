import React, { useState } from 'react';
import { GuaranteeProblem } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  TrendingDown,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Settings,
  Phone,
  FileX,
  AlertCircle,
  Eye
} from 'lucide-react';

interface GuaranteeProblemsBoard {
  problems: GuaranteeProblem[];
  onContractClick: (contractId: string) => void;
  productType?: string;
  title?: string;
}

export const GuaranteeProblemsBoard: React.FC<GuaranteeProblemsBoard> = ({ 
  problems, 
  onContractClick,
  productType = 'guarantee',
  title = 'Problemas de Garantias'
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showProblemsSection, setShowProblemsSection] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeIcon = (type: GuaranteeProblem['type']) => {
    switch (type) {
      case 'onus_application': return <Target className="w-5 h-5" />;
      case 'ownership_transfer': return <ArrowRightLeft className="w-5 h-5" />;
      case 'settlement': return <DollarSign className="w-5 h-5" />;
      case 'chargeback': return <TrendingDown className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: GuaranteeProblem['type']) => {
    switch (type) {
      case 'onus_application': return 'Aplicação de Ônus';
      case 'ownership_transfer': return 'Troca de Titularidade';
      case 'settlement': return 'Liquidação';
      case 'chargeback': return 'Chargeback';
      default: return 'Desconhecido';
    }
  };

  const getTypeColor = (type: GuaranteeProblem['type']) => {
    switch (type) {
      case 'onus_application': return 'text-blue-600 bg-blue-100';
      case 'ownership_transfer': return 'text-purple-600 bg-purple-100';
      case 'settlement': return 'text-green-600 bg-green-100';
      case 'chargeback': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: GuaranteeProblem['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: GuaranteeProblem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: GuaranteeProblem['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'in_progress': return 'text-blue-700 bg-blue-100';
      case 'resolved': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusLabel = (status: GuaranteeProblem['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvido';
      case 'failed': return 'Falhou';
      default: return 'Desconhecido';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'retry': return <RefreshCw className="w-4 h-4" />;
      case 'manual_intervention': return <Settings className="w-4 h-4" />;
      case 'contact_acquirer': return <Phone className="w-4 h-4" />;
      case 'replace_receivables': return <FileX className="w-4 h-4" />;
      case 'escalate': return <AlertCircle className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  // Filter problems based on selected filters
  const filteredProblems = problems.filter(problem => {
    if (selectedType !== 'all' && problem.type !== selectedType) return false;
    if (selectedSeverity !== 'all' && problem.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && problem.status !== selectedStatus) return false;
    if (searchTerm && !problem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !problem.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Calculate summary statistics
  const stats = {
    total: problems.length,
    pending: problems.filter(p => p.status === 'pending').length,
    inProgress: problems.filter(p => p.status === 'in_progress').length,
    critical: problems.filter(p => p.severity === 'critical').length,
    totalValue: problems.reduce((sum, p) => {
      return sum + (p.details.missingValue || p.details.chargebackValue || p.details.settlementValue || 0);
    }, 0)
  };

  const handleExecuteAction = (_problemId: string, _actionId: string) => {
    // Here you would implement the actual action execution
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pontos de Atenção</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Impactado</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white" style={{ backgroundColor: '#CC1717' }}>
              {problems.length}
            </span>
            <button
              onClick={() => setShowProblemsSection(!showProblemsSection)}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showProblemsSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center space-x-2 px-3 text-gray-600 hover:text-gray-800 transition-colors h-8 text-sm font-normal"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cliente ou contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="onus_application">Aplicação de Ônus</option>
                <option value="ownership_transfer">Troca de Titularidade</option>
                <option value="settlement">Liquidação</option>
                <option value="chargeback">Chargeback</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severidade</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvido</option>
                <option value="failed">Falhou</option>
              </select>
            </div>
          </div>
        )}

        {showProblemsSection && (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Mostrando {filteredProblems.length} de {problems.length} problemas
            </div>

            {/* Problems List */}
            <div className="space-y-4">
              {filteredProblems.map((problem) => (
                <div
                  key={problem.id}
                  className={`border-2 rounded-lg p-4 hover:shadow-md transition-all duration-200 ${getSeverityColor(problem.severity)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(problem.type)}`}>
                        {getTypeIcon(problem.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{getTypeLabel(problem.type)}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                            <span className="flex items-center">
                              {getStatusIcon(problem.status)}
                              <span className="ml-1">{getStatusLabel(problem.status)}</span>
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{problem.clientName} • {problem.contractNumber}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(problem.updatedAt)}</p>
                      <button
                        onClick={() => onContractClick(problem.contractId)}
                        className="text-blue-600 hover:text-blue-800 transition-colors mt-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{problem.description}</p>

                  {/* Problem Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
                    {problem.details.requestedValue && (
                      <div>
                        <p className="text-xs text-gray-500">Valor Solicitado</p>
                        <p className="font-medium text-gray-900">{formatCurrency(problem.details.requestedValue)}</p>
                      </div>
                    )}
                    {problem.details.achievedValue !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500">Valor Alcançado</p>
                        <p className="font-medium text-green-600">{formatCurrency(problem.details.achievedValue)}</p>
                      </div>
                    )}
                    {problem.details.missingValue && (
                      <div>
                        <p className="text-xs text-gray-500">Valor Faltante</p>
                        <p className="font-medium text-red-600">{formatCurrency(problem.details.missingValue)}</p>
                      </div>
                    )}
                    {problem.details.settlementValue && (
                      <div>
                        <p className="text-xs text-gray-500">Valor de Liquidação</p>
                        <p className="font-medium text-blue-600">{formatCurrency(problem.details.settlementValue)}</p>
                      </div>
                    )}
                    {problem.details.chargebackValue && (
                      <div>
                        <p className="text-xs text-gray-500">Valor do Chargeback</p>
                        <p className="font-medium text-red-600">{formatCurrency(problem.details.chargebackValue)}</p>
                      </div>
                    )}
                    {problem.details.affectedReceivables && (
                      <div>
                        <p className="text-xs text-gray-500">URs Afetadas</p>
                        <p className="font-medium text-gray-900">{problem.details.affectedReceivables}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {problem.actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Ações Disponíveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {problem.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleExecuteAction(problem.id, action.id)}
                            disabled={!action.available}
                            className={`flex items-center justify-center space-x-2 px-3 rounded-lg transition-colors h-8 text-sm font-normal ${
                              action.urgent
                                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
                            } disabled:cursor-not-allowed`}
                            title={action.description}
                          >
                            <span className="flex items-center">
                              {getActionIcon(action.type)}
                            </span>
                            <span className="whitespace-nowrap">{action.label}</span>
                            {action.urgent && <span className="text-xs">⚡</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredProblems.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum problema encontrado</h4>
                  <p className="text-gray-600">
                    {problems.length === 0 
                      ? `Não há problemas de ${
                          productType === 'guarantee' ? 'garantias' : 
                          productType === 'extra-limit' ? 'crédito pontual' : 
                          productType === 'debt-settlement' ? 'quitação' : 
                          productType === 'anticipation' ? 'antecipação' : 
                          'operações'
                        } no momento.`
                      : 'Tente ajustar os filtros para ver mais resultados.'
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};