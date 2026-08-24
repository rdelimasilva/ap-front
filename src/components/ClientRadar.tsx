import React, { useState } from 'react';
import { Client } from '../types';
import { ArrowLeft, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { NewContractModal } from './NewContractModal';
import { ReceivablesIndicator } from './ReceivablesIndicator';

interface ClientRadarProps {
  client: Client;
  onBack: () => void;
}

type PeriodPreset = '7days' | '15days' | '30days' | '60days' | '90days' | '180days' | 'custom';

interface RadarData {
  date: string;
  toLiquidate: number;
  blocked: number;
  available: number;
  isPast: boolean;
}

export const ClientRadar: React.FC<ClientRadarProps> = ({ client, onBack }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>('30days');
  const [customRangeStart, setCustomRangeStart] = useState('');
  const [customRangeEnd, setCustomRangeEnd] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [showAcquirers, setShowAcquirers] = useState(false);
  const [showTimelineChart, setShowTimelineChart] = useState(false);
  const [showPastReceivables, setShowPastReceivables] = useState(false);
  const [showPastAcquirers, setShowPastAcquirers] = useState(false);
  const [pastFilter, setPastFilter] = useState<'month' | 'bimonthly' | 'quarter' | 'semester' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const periodPresets: { key: PeriodPreset; label: string }[] = [
    { key: '7days', label: '7D' },
    { key: '15days', label: '15D' },
    { key: '30days', label: '30D' },
    { key: '60days', label: '60D' },
    { key: '90days', label: '90D' },
    { key: '180days', label: '180D' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generateRadarData = (): RadarData[] => {
    const today = new Date('2025-11-10');
    const data: RadarData[] = [];

    let periodDays: number;
    let intervalDays: number;
    let baseMultiplier: number;

    if (selectedPeriod === 'custom' && customRangeStart && customRangeEnd) {
      const start = new Date(customRangeStart);
      const end = new Date(customRangeEnd);
      const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      periodDays = totalDays;
      intervalDays = totalDays <= 14 ? 1 : totalDays <= 60 ? 3 : totalDays <= 120 ? 7 : 14;
      baseMultiplier = totalDays <= 14 ? 0.15 : totalDays <= 60 ? 0.5 : totalDays <= 120 ? 1.5 : 3;

      for (let i = 0; i <= totalDays; i += intervalDays) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const isPast = date <= today;
        const progress = i / totalDays;
        const trend = 0.8 + progress * 0.5;
        const variation = 0.8 + Math.random() * 0.4;

        data.push({
          date: date.toISOString().split('T')[0],
          toLiquidate: Math.round(45000 * baseMultiplier * trend * variation),
          blocked: Math.round(25000 * baseMultiplier * trend * variation * 0.9),
          available: Math.round(30000 * baseMultiplier * trend * variation * 1.1),
          isPast
        });
      }
      return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    switch (selectedPeriod) {
      case '7days':
        periodDays = 7;
        intervalDays = 1;
        baseMultiplier = 0.15;
        break;
      case '15days':
        periodDays = 15;
        intervalDays = 1;
        baseMultiplier = 0.3;
        break;
      case '30days':
        periodDays = 30;
        intervalDays = 3;
        baseMultiplier = 0.5;
        break;
      case '60days':
        periodDays = 60;
        intervalDays = 5;
        baseMultiplier = 1;
        break;
      case '90days':
        periodDays = 90;
        intervalDays = 7;
        baseMultiplier = 1.5;
        break;
      case '180days':
        periodDays = 180;
        intervalDays = 14;
        baseMultiplier = 3;
        break;
      default:
        periodDays = 30;
        intervalDays = 3;
        baseMultiplier = 0.5;
    }

    const pastDays = Math.floor(periodDays / 2);
    const futureDays = periodDays - pastDays;

    for (let i = -pastDays; i <= futureDays; i += intervalDays) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const isPast = i <= 0;

      let trend: number;
      if (isPast) {
        const daysFromStart = pastDays + i;
        trend = 0.8 + (daysFromStart / pastDays) * 0.2;
      } else {
        trend = 1 + (i / futureDays) * 0.3;
      }

      const variation = 0.8 + Math.random() * 0.4;

      data.push({
        date: date.toISOString().split('T')[0],
        toLiquidate: Math.round(45000 * baseMultiplier * trend * variation),
        blocked: Math.round(25000 * baseMultiplier * trend * variation * 0.9),
        available: Math.round(30000 * baseMultiplier * trend * variation * 1.1),
        isPast
      });
    }

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const radarData = generateRadarData();

  const futureData = radarData.filter(d => !d.isPast);
  const pastData = radarData.filter(d => d.isPast);

  const getFilteredPastData = () => {
    const today = new Date('2025-11-10');
    const startDate = new Date(today);

    if (pastFilter === 'custom' && customStartDate && customEndDate) {
      return pastData.filter(d => {
        const date = new Date(d.date);
        return date >= new Date(customStartDate) && date <= new Date(customEndDate);
      });
    }

    switch (pastFilter) {
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'bimonthly':
        startDate.setMonth(today.getMonth() - 2);
        break;
      case 'quarter':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'semester':
        startDate.setMonth(today.getMonth() - 6);
        break;
    }

    return pastData.filter(d => new Date(d.date) >= startDate);
  };

  const filteredPastData = getFilteredPastData();

  const totalPastBlocked = filteredPastData.reduce((sum, d) => sum + d.blocked, 0);
  const totalPastAvailable = filteredPastData.reduce((sum, d) => sum + d.available, 0);
  const totalPastLiquidated = totalPastBlocked + totalPastAvailable;

  const debitRatio = 0.65;
  const creditRatio = 0.35;

  const totalPastDebitBlocked = Math.round(totalPastBlocked * debitRatio);
  const totalPastDebitAvailable = Math.round(totalPastAvailable * debitRatio);
  const totalPastDebit = totalPastDebitBlocked + totalPastDebitAvailable;

  const totalPastCreditBlocked = Math.round(totalPastBlocked * creditRatio);
  const totalPastCreditAvailable = Math.round(totalPastAvailable * creditRatio);
  const totalPastCredit = totalPastCreditBlocked + totalPastCreditAvailable;

  const totalFutureBlocked = futureData.reduce((sum, d) => sum + d.blocked, 0);
  const totalFutureAvailable = futureData.reduce((sum, d) => sum + d.available, 0);
  const totalFutureLiquidate = totalFutureBlocked + totalFutureAvailable;

  const maxValue = Math.max(...radarData.map(d => d.toLiquidate + d.blocked + d.available));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Disponibilidade de Recebíveis</h3>
        </div>

        {/* Period selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {periodPresets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => { setSelectedPeriod(preset.key); setShowCalendar(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === preset.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCalendar(!showCalendar);
                  if (selectedPeriod !== 'custom') {
                    setSelectedPeriod('custom');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Personalizado</span>
              </button>
              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
                      <input
                        type="date"
                        value={customRangeStart}
                        onChange={(e) => setCustomRangeStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
                      <input
                        type="date"
                        value={customRangeEnd}
                        onChange={(e) => setCustomRangeEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => setShowCalendar(false)}
                      disabled={!customRangeStart || !customRangeEnd}
                      className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {selectedPeriod === 'custom' && customRangeStart && customRangeEnd && (
            <p className="text-xs text-gray-500 mt-2">
              Período: {new Date(customRangeStart).toLocaleDateString('pt-BR')} — {new Date(customRangeEnd).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              A busca automática de URs filtra somente as credenciadoras ativas para o CNPJ nos últimos 12 meses.
            </p>
          </div>
        </div>

        <ReceivablesIndicator
          total={totalFutureLiquidate}
          locked={totalFutureBlocked}
          available={totalFutureAvailable}
          size="lg"
          showLabels={true}
        />

        <div className="mt-6">
          <button
            onClick={() => setShowAcquirers(!showAcquirers)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium text-gray-900">Credenciadoras</span>
            {showAcquirers ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </button>

          {showAcquirers && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Cielo', 'Rede', 'Stone', 'GetNet'].map(acquirer => {
                const total = Math.floor(totalFutureLiquidate / 4);
                const locked = Math.floor(totalFutureBlocked / 4);
                const available = Math.floor(totalFutureAvailable / 4);

                return (
                  <div key={acquirer} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">{acquirer}</h4>
                    <ReceivablesIndicator
                      total={total}
                      locked={locked}
                      available={available}
                      size="sm"
                      showLabels={false}
                    />
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disponível:</span>
                        <span className="font-medium text-green-600">{formatCurrency(available)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <button
          onClick={() => setShowPastReceivables(!showPastReceivables)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <div className="text-left">
            <div className="font-medium text-gray-900">Recebíveis Passados</div>
            <p className="text-sm text-gray-600">Histórico de recebíveis já processados</p>
          </div>
          {showPastReceivables ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>

        {showPastReceivables && (
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtro de Período</label>
                <select
                  value={pastFilter}
                  onChange={(e) => setPastFilter(e.target.value as typeof pastFilter)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="month">Último Mês</option>
                  <option value="bimonthly">Últimos 2 Meses</option>
                  <option value="quarter">Último Trimestre</option>
                  <option value="semester">Último Semestre</option>
                  <option value="custom">Período Personalizado</option>
                </select>
              </div>

              {pastFilter === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Total Geral</h4>
              <ReceivablesIndicator
                total={totalPastLiquidated}
                locked={totalPastBlocked}
                available={totalPastAvailable}
                size="lg"
                showLabels={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Débito</h4>
                <ReceivablesIndicator
                  total={totalPastDebit}
                  locked={totalPastDebitBlocked}
                  available={totalPastDebitAvailable}
                  size="md"
                  showLabels={true}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Crédito</h4>
                <ReceivablesIndicator
                  total={totalPastCredit}
                  locked={totalPastCreditBlocked}
                  available={totalPastCreditAvailable}
                  size="md"
                  showLabels={true}
                />
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowPastAcquirers(!showPastAcquirers)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <span className="font-medium text-gray-900">Credenciadoras</span>
                {showPastAcquirers ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
              </button>

              {showPastAcquirers && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['Cielo', 'Rede', 'Stone', 'GetNet'].map(acquirer => {
                    const total = Math.floor(totalPastLiquidated / 4);
                    const locked = Math.floor(totalPastBlocked / 4);
                    const available = Math.floor(totalPastAvailable / 4);

                    return (
                      <div key={acquirer} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">{acquirer}</h4>
                        <ReceivablesIndicator
                          total={total}
                          locked={locked}
                          available={available}
                          size="sm"
                          showLabels={false}
                        />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{formatCurrency(total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Disponível:</span>
                            <span className="font-medium text-green-600">{formatCurrency(available)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <button
          onClick={() => setShowTimelineChart(!showTimelineChart)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <div className="text-left">
            <div className="font-medium text-gray-900">Evolução Temporal</div>
            <p className="text-sm text-gray-600">Distribuição de volumes ao longo do tempo</p>
          </div>
          {showTimelineChart ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>

        {showTimelineChart && (
          <div className="mt-6">

        <div className="relative">
          <div
            className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9ca3af #e5e7eb'
            }}
          >
            <div className="relative" style={{ width: `${radarData.length * 24}px`, minWidth: '100%' }}>
              <div className="relative h-96 border-b-2 border-gray-300">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                  <defs>
                    <linearGradient id="averageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points={radarData.map((data, index) => {
                      const total = data.toLiquidate + data.blocked + data.available;
                      const availablePercent = (data.available / total) * 100;
                      const barWidth = 24;
                      const x = index * barWidth + barWidth / 2;
                      const y = (100 - availablePercent) * 3.84;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="url(#averageGradient)"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                  {radarData.map((data, index) => {
                    const total = data.toLiquidate + data.blocked + data.available;
                    const availablePercent = (data.available / total) * 100;
                    const barWidth = 24;
                    const x = index * barWidth + barWidth / 2;
                    const y = (100 - availablePercent) * 3.84;
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#10b981"
                          className="transition-all"
                        />
                      </g>
                    );
                  })}
                </svg>

                <div className="flex items-end gap-1 h-full">
                  {radarData.map((data, index) => {
                    const total = data.toLiquidate + data.blocked + data.available;
                    const totalHeight = (total / maxValue) * 100;
                    return (
                      <div key={index} className="flex flex-col justify-end items-center group relative h-full" style={{ width: '20px', minWidth: '20px' }}>
                        <div className={`w-full flex flex-col-reverse justify-start relative ${data.isPast ? 'opacity-50' : 'opacity-100'}`} style={{ height: `${totalHeight}%`, minHeight: '4px' }}>
                          <div
                            className="w-full rounded-t transition-all duration-200 bg-blue-600 group-hover:brightness-110 cursor-pointer relative"
                            style={{ flexGrow: data.available }}
                          >
                          </div>
                          <div
                            className="w-full transition-all duration-200 bg-red-600 group-hover:brightness-110 cursor-pointer relative"
                            style={{ flexGrow: data.blocked }}
                          >
                          </div>
                          <div
                            className="w-full rounded-t transition-all duration-200 bg-green-600 group-hover:brightness-110 cursor-pointer relative"
                            style={{ flexGrow: data.toLiquidate }}
                          >
                          </div>
                        </div>
                        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap pointer-events-none z-20">
                          <div className="font-semibold mb-1">{new Date(data.date).toLocaleDateString('pt-BR')}</div>
                          <div className="text-green-400">A Liquidar: {formatCurrency(data.toLiquidate)}</div>
                          <div className="text-red-400">Bloqueado: {formatCurrency(data.blocked)}</div>
                          <div className="text-blue-400">Disponível: {formatCurrency(data.available)}</div>
                          <div>Total: {formatCurrency(total)}</div>
                        </div>
                        {!data.isPast && index > 0 && radarData[index - 1].isPast && (
                          <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gray-900 opacity-40 pointer-events-none" style={{ height: '384px' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-1 pt-3 pb-4">
                {radarData.map((data, index) => {
                  const date = new Date(data.date);
                  const showLabel = index % 5 === 0;
                  return (
                    <div key={index} className="flex justify-center items-start" style={{ width: '20px', minWidth: '20px' }}>
                      {showLabel && (
                        <div className="text-xs text-gray-700 font-medium whitespace-nowrap">
                          {date.getDate()}/{date.getMonth() + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Liquidado / A Liquidar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Bloqueado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Disponível</span>
            </div>
          </div>
        </div>
          </div>
        )}
      </div>

      <NewContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        clientName={client.name}
      />
    </div>
  );
};
