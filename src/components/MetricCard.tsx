import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  customSubtitle?: string;
  tooltip?: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  customSubtitle,
  tooltip,
  trend
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR');
    }

    // Return string values as-is (already formatted)
    return val;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 h-24 flex flex-col justify-between"
      title={tooltip}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p 
            className="text-xl font-bold text-gray-900"
            title={tooltip}
          >
            {formatValue(value)}
          </p>
        </div>
        {trend && (
          <div className="flex flex-col items-end space-y-0 ml-2 mr-2">
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap text-right">vs. mês anterior</span>
          </div>
        )}
      </div>
      <div className="mt-auto">
        {customSubtitle && (
          <p className="text-sm text-gray-500">{customSubtitle}</p>
        )}
        {subtitle && !customSubtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};