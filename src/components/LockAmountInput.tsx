import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface LockAmountInputProps {
  available: number;
  suggested?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function LockAmountInput({
  available,
  suggested,
  value,
  onChange,
  disabled = false
}: LockAmountInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const parseValue = (str: string): number => {
    const cleanStr = str.replace(/[^\d]/g, '');
    return cleanStr ? parseInt(cleanStr, 10) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    const numericValue = parseValue(rawValue);
    onChange(numericValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setInputValue(value.toString());
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const useSuggested = () => {
    if (suggested) {
      onChange(suggested);
    }
  };

  const isValid = value <= available && value > 0;
  const isOverLimit = value > available;
  const percentage = available > 0 ? (value / available) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={isFocused ? inputValue : formatCurrency(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled || available === 0}
          className={`w-full pl-3 pr-10 py-2 border rounded-lg text-right font-medium transition-colors ${
            disabled || available === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isOverLimit
              ? 'border-red-300 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500'
              : isValid
              ? 'border-green-300 bg-green-50 text-green-900 focus:ring-2 focus:ring-green-500'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
          }`}
          placeholder="0"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isValid && value > 0 && (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
          {isOverLimit && (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isValid && value > 0 && (
            <span className="text-green-600 font-medium">
              {percentage.toFixed(1)}% do disponível
            </span>
          )}
          {isOverLimit && (
            <span className="text-red-600 font-medium">
              Excede em {formatCurrency(value - available)}
            </span>
          )}
          {!isValid && value === 0 && available > 0 && (
            <span className="text-gray-500">
              Defina o valor para pagamento
            </span>
          )}
          {available === 0 && (
            <span className="text-gray-500">
              Sem recebíveis disponíveis
            </span>
          )}
        </div>

        {suggested && suggested <= available && value !== suggested && (
          <div className="flex items-center gap-1">
            <button
              onClick={useSuggested}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
            >
              Usar sugerido ({formatCurrency(suggested)})
            </button>
            <span className="relative group/tip inline-flex">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none">
                Valor sugerido com base no volume de URs disponíveis a liquidar, livres de gravames, nos próximos 30 dias.
                <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
              </span>
            </span>
          </div>
        )}
      </div>

      {percentage > 80 && percentage <= 100 && (
        <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Alto percentual de utilização ({percentage.toFixed(0)}%). Considere deixar margem para variações.
          </span>
        </div>
      )}
    </div>
  );
}
