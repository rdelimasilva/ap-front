import React from 'react';

interface ContractMetricCardProps {
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

export const ContractMetricCard: React.FC<ContractMetricCardProps> = ({
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 h-28 flex flex-col justify-between"
      title={tooltip}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline space-x-2 mb-1">
          <p 
            className="text-xl font-bold text-gray-900"
            title={tooltip}
          >
            {formatValue(value)}
          </p>
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">vs. mês anterior</span>
            </div>
          )}
        </div>
      </div>
      {customSubtitle && (
        <p className="text-sm text-gray-500 mt-auto">{customSubtitle}</p>
      )}
      {subtitle && !customSubtitle && (
        <p className="text-sm text-gray-500 mt-auto">{subtitle}</p>
      )}
    </div>
  );
};