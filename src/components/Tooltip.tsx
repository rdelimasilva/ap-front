import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Ajuda"
      >
        {children || <HelpCircle className="w-4 h-4" />}
      </button>

      {isVisible && (
        <div
          className={`absolute ${getPositionClasses()} z-50 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg animate-fade-in`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${
              position === 'top'
                ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
                : position === 'bottom'
                ? 'top-[-4px] left-1/2 -translate-x-1/2'
                : position === 'left'
                ? 'right-[-4px] top-1/2 -translate-y-1/2'
                : 'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};
