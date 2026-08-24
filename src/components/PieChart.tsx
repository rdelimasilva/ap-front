import React from 'react';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const createPath = (percentage: number, startPercentage: number) => {
    const startAngle = (startPercentage / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((startPercentage + percentage) / 100) * 2 * Math.PI - Math.PI / 2;
    
    const largeArcFlag = percentage > 50 ? 1 : 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="w-full h-full flex flex-col xl:flex-row items-center justify-center gap-2 sm:gap-4 xl:gap-6 p-2 max-h-48">
      {/* Container 5 - Container do círculo SVG - MAXIMIZADO */}
      <div className="flex-shrink-0 w-full max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[180px] xl:max-w-[160px] 2xl:max-w-[180px] aspect-square">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 200 200"
          className="transform -rotate-90 w-full h-full"
        >
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const path = createPath(percentage, cumulativePercentage);
            cumulativePercentage += percentage;
            
            return (
              <path
                key={index}
                d={path}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <title>
                  {item.name}: {item.value}%
                </title>
              </path>
            );
          })}
        </svg>
      </div>
      
      {/* Legenda - Responsiva e otimizada */}
      <div className="flex flex-col justify-center space-y-1 sm:space-y-1 w-full xl:w-auto xl:min-w-[100px] xl:max-w-[140px]">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-1 sm:space-x-2">
            <div 
              className="w-2 h-2 sm:w-2 sm:h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
              <span className="text-gray-900 font-medium text-xs sm:text-sm truncate">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};