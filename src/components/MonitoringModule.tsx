import React, { useState } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Zap,
  Search,
  Calendar,
  Download
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action: string;
  details: string;
  contract: string;
  client: string;
  value?: string;
  acquirer?: string;
  cardBrand?: string;
}

export const MonitoringModule: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const activityLogs: ActivityLog[] = [
    {
      id: '1',
      timestamp: '2025-11-05 14:32:15',
      type: 'success',
      action: 'Captura de Recebíveis',
      details: 'Capturados R$ 45.000,00 em recebíveis',
      contract: 'CTR-2025-001',
      client: 'Restaurante Silva LTDA',
      value: '45.000,00',
      acquirer: 'Cielo',
      cardBrand: 'Visa'
    },
    {
      id: '2',
      timestamp: '2025-11-05 14:15:30',
      type: 'success',
      action: 'Automação Executada',
      details: 'Processo automático concluído com sucesso',
      contract: 'CTR-2025-045',
      client: 'Comercial Costa S.A.',
      value: '32.500,00',
      acquirer: 'Stone',
      cardBrand: 'Mastercard'
    },
    {
      id: '3',
      timestamp: '2025-11-05 13:47:22',
      type: 'warning',
      action: 'Valor Alvo Atingido',
      details: 'Automação pausada - valor alvo atingido',
      contract: 'CTR-2025-023',
      client: 'Padaria Moderna',
      value: '100.000,00',
      acquirer: 'Rede',
      cardBrand: 'Elo'
    },
    {
      id: '4',
      timestamp: '2025-11-05 13:20:10',
      type: 'error',
      action: 'Falha na Captura',
      details: 'Erro ao conectar com adquirente',
      contract: 'CTR-2025-012',
      client: 'Farmácia Central',
      acquirer: 'GetNet',
      cardBrand: 'Visa'
    },
    {
      id: '5',
      timestamp: '2025-11-05 12:55:40',
      type: 'success',
      action: 'Captura de Recebíveis',
      details: 'Capturados R$ 78.300,00 em recebíveis',
      contract: 'CTR-2025-067',
      client: 'Supermercado Bom Preço',
      value: '78.300,00',
      acquirer: 'PagSeguro',
      cardBrand: 'Mastercard'
    },
    {
      id: '6',
      timestamp: '2025-11-05 12:30:15',
      type: 'info',
      action: 'Automação Iniciada',
      details: 'Processo de captura automática iniciado',
      contract: 'CTR-2025-089',
      client: 'Loja de Roupas Fashion',
      acquirer: 'Cielo',
      cardBrand: 'Visa'
    },
    {
      id: '7',
      timestamp: '2025-11-05 11:45:22',
      type: 'success',
      action: 'Captura de Recebíveis',
      details: 'Capturados R$ 25.800,00 em recebíveis',
      contract: 'CTR-2025-034',
      client: 'Oficina Mecânica Souza',
      value: '25.800,00',
      acquirer: 'Stone',
      cardBrand: 'Elo'
    },
    {
      id: '8',
      timestamp: '2025-11-05 11:10:55',
      type: 'error',
      action: 'Timeout',
      details: 'Tempo limite excedido na consulta',
      contract: 'CTR-2025-056',
      client: 'Clínica Saúde e Vida',
      acquirer: 'Rede',
      cardBrand: 'Mastercard'
    },
    {
      id: '9',
      timestamp: '2025-11-05 10:35:18',
      type: 'success',
      action: 'Captura de Recebíveis',
      details: 'Capturados R$ 52.400,00 em recebíveis',
      contract: 'CTR-2025-078',
      client: 'Pet Shop Animal Feliz',
      value: '52.400,00',
      acquirer: 'Safrapay',
      cardBrand: 'Visa'
    },
    {
      id: '10',
      timestamp: '2025-11-05 10:00:00',
      type: 'info',
      action: 'Sistema Iniciado',
      details: 'Monitoramento automático iniciado',
      contract: '-',
      client: 'Sistema',
    }
  ];

  const stats = {
    totalCaptures: 6,
    successRate: 75,
    totalValue: 233500,
    errors: 2
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesFilter = selectedFilter === 'all' || log.type === selectedFilter;
    const matchesSearch = searchTerm === '' ||
      log.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.contract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoramento de Recebíveis</h1>
        <p className="text-gray-600">Acompanhe em tempo real as capturas automáticas e atividades do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Capturas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCaptures}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Volume Capturado</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(stats.totalValue / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Erros</p>
                <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Feed de Atividades</h2>
            </div>

            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedFilter('success')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'success'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sucesso
                </button>
                <button
                  onClick={() => setSelectedFilter('error')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Erros
                </button>
              </div>

              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getTypeIcon(log.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{log.action}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(log.type)}`}>
                          {log.type === 'success' ? 'Sucesso' :
                           log.type === 'error' ? 'Erro' :
                           log.type === 'warning' ? 'Aviso' : 'Info'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{log.details}</p>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {log.timestamp}
                        </span>
                        <span>Cliente: {log.client}</span>
                        <span>Contrato: {log.contract}</span>
                        {log.acquirer && <span>Adquirente: {log.acquirer}</span>}
                        {log.cardBrand && <span>Bandeira: {log.cardBrand}</span>}
                      </div>
                    </div>

                    {log.value && (
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-green-600">
                          R$ {log.value}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma atividade encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};
