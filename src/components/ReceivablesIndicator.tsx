import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ReceivablesIndicatorProps {
  total: number;
  locked: number;
  available: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function ReceivablesIndicator({
  total,
  locked,
  available,
  size = 'md',
  showLabels = true
}: ReceivablesIndicatorProps) {
  const totalReceivables = locked + available;
  const lockedPercentage = totalReceivables > 0 ? (locked / totalReceivables) * 100 : 0;
  const availablePercentage = totalReceivables > 0 ? (available / totalReceivables) * 100 : 0;

  const heightClass = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  }[size];

  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatus = () => {
    if (available === 0) return { icon: AlertCircle, color: 'text-red-600', label: 'Indisponível' };
    if (availablePercentage < 20) return { icon: AlertCircle, color: 'text-orange-600', label: 'Baixo' };
    return { icon: CheckCircle, color: 'text-green-600', label: 'Disponível' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`${status.color} w-4 h-4`} />
            <span className={`${textSizeClass} font-medium text-gray-900`}>
              Recebíveis
            </span>
          </div>
          <span className={`${textSizeClass} font-semibold ${status.color}`}>
            {formatCurrency(available)}
          </span>
        </div>
      )}

      <div className={`w-full rounded-full ${heightClass} overflow-hidden border border-gray-300`}>
        <div className="h-full flex">
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${lockedPercentage}%` }}
            title={`Travado: ${formatCurrency(locked)}`}
          />
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${availablePercentage}%` }}
            title={`Disponível: ${formatCurrency(available)}`}
          />
        </div>
      </div>

      {showLabels && (
        <div className={`flex items-center justify-between ${textSizeClass} text-gray-600`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              <span>Travado: {formatCurrency(locked)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Disponível: {formatCurrency(available)}</span>
            </div>
          </div>
          <span className="text-gray-500">
            Total: {formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
}
