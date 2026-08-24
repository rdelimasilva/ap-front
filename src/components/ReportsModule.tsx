import React from 'react';
import { ReceivableReport } from '../types';
import { TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface ReportsModuleProps {
  reports: ReceivableReport[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ reports }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusColor = (status: ReceivableReport['status']) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ReceivableReport['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: ReceivableReport['status']) => {
    switch (status) {
      case 'complete': return 'Completo';
      case 'partial': return 'Parcial';
      case 'pending': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  // Calculate totals
  const totalRequested = reports.reduce((sum, report) => sum + report.requestedValue, 0);
  const totalAchieved = reports.reduce((sum, report) => sum + report.achievedValue, 0);
  const totalMissing = reports.reduce((sum, report) => sum + report.missingValue, 0);
  const totalReleased = reports.reduce((sum, report) => sum + report.releasedValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end space-x-3">
        <button className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 h-8 text-sm font-normal">
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
        <button className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition-colors h-8 flex items-center justify-center text-sm font-normal">
          Exportar Relatório
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Solicitado</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRequested)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Alcançado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAchieved)}</p>
              <p className="text-xs text-gray-500">
                {((totalAchieved / totalRequested) * 100).toFixed(1)}% do solicitado
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Faltante</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalMissing)}</p>
              <p className="text-xs text-gray-500">
                {((totalMissing / totalRequested) * 100).toFixed(1)}% do solicitado
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Liberado</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalReleased)}</p>
              <p className="text-xs text-gray-500">Revolvência hoje</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Relatório Detalhado por Cliente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Solicitado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Alcançado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Faltante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Liberado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.clientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(report.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(report.requestedValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {formatCurrency(report.achievedValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {formatCurrency(report.missingValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                    {formatCurrency(report.releasedValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{getStatusLabel(report.status)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revolvency Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Revolvência</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Hoje - Liberação de URs</p>
              <p className="text-sm text-gray-600">R$ 125.000,00 em recebíveis foram liberados</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-600">100% restaurado</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Ontem - Tentativa de Aplicação</p>
              <p className="text-sm text-gray-600">R$ 25.000,00 pendentes + R$ 125.000,00 liberados</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-yellow-600">83% alcançado</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Anteontem - Processo Completo</p>
              <p className="text-sm text-gray-600">R$ 200.000,00 em ônus aplicados com sucesso</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">100% alcançado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};