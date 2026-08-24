import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, type TooltipProps } from 'recharts';
import { Calendar } from 'lucide-react';

interface ReceivablesFlowChartProps {
  data: {
    date: Date;
    requestedValue: number;
    achievedValue: number;
  }[];
}

type DateRange = 'day' | 'week' | 'biweekly' | 'month' | 'bimonthly' | 'semester' | 'year';

export const ReceivablesFlowChart: React.FC<ReceivablesFlowChartProps> = ({ data }) => {
  const [selectedRange, setSelectedRange] = React.useState<DateRange>('month');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  };

  const getFilteredData = () => {
    let daysToShow = 30;

    switch (selectedRange) {
      case 'day':
        daysToShow = 1;
        break;
      case 'week':
        daysToShow = 7;
        break;
      case 'biweekly':
        daysToShow = 15;
        break;
      case 'month':
        daysToShow = 30;
        break;
      case 'bimonthly':
        daysToShow = 60;
        break;
      case 'semester':
        daysToShow = 180;
        break;
      case 'year':
        daysToShow = 365;
        break;
    }

    return data.slice(-daysToShow);
  };

  const chartData = getFilteredData().map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    'Valor Solicitado': item.requestedValue,
    'Valor Alcançado': item.achievedValue,
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const fullDate = payload[0]?.payload?.fullDate;
      const dateToFormat = fullDate instanceof Date ? fullDate : new Date();
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(dateToFormat)}
          </p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {formatCurrency(Number(entry.value))}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'biweekly', label: 'Quinzena' },
    { value: 'month', label: 'Mês' },
    { value: 'bimonthly', label: 'Bimestre' },
    { value: 'semester', label: 'Semestre' },
    { value: 'year', label: 'Ano' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Fluxo de Recebíveis
          </h3>
          <p className="text-sm text-gray-600">
            Acompanhe o valor solicitado e alcançado ao longo do tempo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value as DateRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="Valor Solicitado"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Valor Alcançado"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
