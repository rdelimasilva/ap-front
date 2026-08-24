import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface DailyValue {
  day: number;
  valorTotal: number;
  valorLivre: number;
  valorAntecipado: number;
  valorGravamado: number;
  valorBloqueado: number;
}

interface MonthlyValue {
  month: string;
  monthNumber: number;
  valorTotal: number;
  valorLivre: number;
  valorAntecipado: number;
  valorGravamado: number;
  valorBloqueado: number;
  dailyValues: DailyValue[];
}

interface YearlyValue {
  year: number;
  valorTotal: number;
  valorLivre: number;
  valorAntecipado: number;
  valorGravamado: number;
  valorBloqueado: number;
  months: MonthlyValue[];
}

export const HistoricalValuesTable: React.FC = () => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(3).replace('.', ',')}Mi`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  // Mock data baseado na imagem
  const historicalData: YearlyValue[] = [
    {
      year: 2025,
      valorTotal: 15470124,
      valorLivre: 3716311,
      valorAntecipado: 148959,
      valorGravamado: 11753814,
      valorBloqueado: 72817,
      months: [
        {
          month: 'Mar',
          monthNumber: 3,
          valorTotal: 0,
          valorLivre: 0,
          valorAntecipado: 0,
          valorGravamado: 0,
          valorBloqueado: 0,
          dailyValues: []
        },
        {
          month: 'Jun',
          monthNumber: 6,
          valorTotal: 478443,
          valorLivre: 22079,
          valorAntecipado: 15989,
          valorGravamado: 456364,
          valorBloqueado: 8045,
          dailyValues: [
            { day: 1, valorTotal: 15000, valorLivre: 800, valorAntecipado: 500, valorGravamado: 14200, valorBloqueado: 300 },
            { day: 2, valorTotal: 18500, valorLivre: 1200, valorAntecipado: 600, valorGravamado: 17300, valorBloqueado: 400 },
            { day: 3, valorTotal: 22000, valorLivre: 1500, valorAntecipado: 800, valorGravamado: 20700, valorBloqueado: 500 },
            // ... mais dias
          ]
        },
        {
          month: 'Jul',
          monthNumber: 7,
          valorTotal: 4721805,
          valorLivre: 206204,
          valorAntecipado: 131187,
          valorGravamado: 4515681,
          valorBloqueado: 62088,
          dailyValues: [
            { day: 1, valorTotal: 150000, valorLivre: 8000, valorAntecipado: 5000, valorGravamado: 142000, valorBloqueado: 3000 },
            { day: 2, valorTotal: 165000, valorLivre: 9500, valorAntecipado: 5500, valorGravamado: 155500, valorBloqueado: 3500 },
            // ... mais dias
          ]
        },
        {
          month: 'Ago',
          monthNumber: 8,
          valorTotal: 3098124,
          valorLivre: 495834,
          valorAntecipado: 487,
          valorGravamado: 2692910,
          valorBloqueado: 487,
          dailyValues: []
        },
        {
          month: 'Set',
          monthNumber: 9,
          valorTotal: 2702332,
          valorLivre: 978926,
          valorAntecipado: 517,
          valorGravamado: 1723407,
          valorBloqueado: 517,
          dailyValues: []
        },
        {
          month: 'Out',
          monthNumber: 10,
          valorTotal: 1965039,
          valorLivre: 843998,
          valorAntecipado: 471,
          valorGravamado: 1121041,
          valorBloqueado: 471,
          dailyValues: []
        },
        {
          month: 'Nov',
          monthNumber: 11,
          valorTotal: 1374576,
          valorLivre: 640989,
          valorAntecipado: 154,
          valorGravamado: 733586,
          valorBloqueado: 154,
          dailyValues: []
        },
        {
          month: 'Dez',
          monthNumber: 12,
          valorTotal: 1129105,
          valorLivre: 618280,
          valorAntecipado: 154,
          valorGravamado: 510825,
          valorBloqueado: 154,
          dailyValues: []
        }
      ]
    },
    {
      year: 2026,
      valorTotal: 1604270,
      valorLivre: 1126938,
      valorAntecipado: 154,
      valorGravamado: 477332,
      valorBloqueado: 154,
      months: [
        {
          month: 'Jan',
          monthNumber: 1,
          valorTotal: 1604270,
          valorLivre: 1126938,
          valorAntecipado: 154,
          valorGravamado: 477332,
          valorBloqueado: 154,
          dailyValues: [
            { day: 1, valorTotal: 50000, valorLivre: 35000, valorAntecipado: 5, valorGravamado: 15000, valorBloqueado: 5 },
            { day: 2, valorTotal: 52000, valorLivre: 36000, valorAntecipado: 8, valorGravamado: 16000, valorBloqueado: 8 },
            // ... mais dias
          ]
        }
      ]
    }
  ];

  // Ordenar por ano decrescente
  const sortedData = [...historicalData].sort((a, b) => b.year - a.year);

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
      // Remove todos os meses expandidos deste ano
      const yearMonthKeys = historicalData
        .find(y => y.year === year)?.months
        .map(m => `${year}-${m.monthNumber}`) || [];
      yearMonthKeys.forEach(key => {
        const newExpandedMonths = new Set(expandedMonths);
        newExpandedMonths.delete(key);
        setExpandedMonths(newExpandedMonths);
      });
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonth = (year: number, monthNumber: number) => {
    const key = `${year}-${monthNumber}`;
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedMonths(newExpanded);
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              Período
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Livre
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Antecipado
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Gravamado
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Bloqueado
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((yearData, yearIndex) => (
            <React.Fragment key={yearData.year}>
              {/* Year Row */}
              <tr 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => toggleYear(yearData.year)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {expandedYears.has(yearData.year) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-semibold text-gray-900">{yearData.year}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyCompact(yearData.valorTotal)}
                    </span>
                    {yearIndex < sortedData.length - 1 && getChangeIcon(
                      yearData.valorTotal, 
                      sortedData[yearIndex + 1].valorTotal
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-green-600">
                    {formatCurrencyCompact(yearData.valorLivre)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-blue-600">
                    {formatCurrencyCompact(yearData.valorAntecipado)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-orange-600">
                    {formatCurrencyCompact(yearData.valorGravamado)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-red-600">
                    {formatCurrencyCompact(yearData.valorBloqueado)}
                  </span>
                </td>
              </tr>

              {/* Month Rows */}
              {expandedYears.has(yearData.year) && yearData.months.map((monthData) => (
                <React.Fragment key={`${yearData.year}-${monthData.monthNumber}`}>
                  <tr 
                    className="bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                    onClick={() => toggleMonth(yearData.year, monthData.monthNumber)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-2 ml-6">
                        {monthData.dailyValues.length > 0 ? (
                          expandedMonths.has(`${yearData.year}-${monthData.monthNumber}`) ? (
                            <ChevronDown className="w-3 h-3 text-blue-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-blue-400" />
                          )
                        ) : (
                          <div className="w-3 h-3" />
                        )}
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">{monthData.month}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrencyCompact(monthData.valorTotal)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrencyCompact(monthData.valorLivre)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrencyCompact(monthData.valorAntecipado)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-sm font-medium text-orange-600">
                        {formatCurrencyCompact(monthData.valorGravamado)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrencyCompact(monthData.valorBloqueado)}
                      </span>
                    </td>
                  </tr>

                  {/* Daily Rows */}
                  {expandedMonths.has(`${yearData.year}-${monthData.monthNumber}`) && 
                   monthData.dailyValues.map((dayData) => (
                    <tr key={`${yearData.year}-${monthData.monthNumber}-${dayData.day}`} className="bg-gray-50">
                      <td className="px-4 py-1 whitespace-nowrap">
                        <div className="flex items-center space-x-2 ml-12">
                          <span className="text-xs text-gray-600">Dia {dayData.day}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <span className="text-xs text-gray-600">
                          {formatCurrency(dayData.valorTotal)}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <span className="text-xs text-green-600">
                          {formatCurrency(dayData.valorLivre)}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <span className="text-xs text-blue-600">
                          {formatCurrency(dayData.valorAntecipado)}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <span className="text-xs text-orange-600">
                          {formatCurrency(dayData.valorGravamado)}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <span className="text-xs text-red-600">
                          {formatCurrency(dayData.valorBloqueado)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}

          {/* Total Row */}
          <tr className="bg-blue-100 border-t-2 border-blue-300 font-semibold">
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-900">Total</span>
              </div>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-blue-900">
                {formatCurrencyCompact(sortedData.reduce((sum, year) => sum + year.valorTotal, 0))}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-green-700">
                {formatCurrencyCompact(sortedData.reduce((sum, year) => sum + year.valorLivre, 0))}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-blue-700">
                {formatCurrencyCompact(sortedData.reduce((sum, year) => sum + year.valorAntecipado, 0))}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-orange-700">
                {formatCurrencyCompact(sortedData.reduce((sum, year) => sum + year.valorGravamado, 0))}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-red-700">
                {formatCurrencyCompact(sortedData.reduce((sum, year) => sum + year.valorBloqueado, 0))}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};