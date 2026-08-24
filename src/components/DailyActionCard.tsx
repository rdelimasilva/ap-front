import React from 'react';
import { DailyAction } from '../types';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Shield,
  DollarSign,
  Settings,
  XCircle
} from 'lucide-react';

interface DailyActionCardProps {
  action: DailyAction;
  onActionClick: (action: DailyAction) => void;
}

export const DailyActionCard: React.FC<DailyActionCardProps> = ({ action, onActionClick }) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-red-200 bg-red-50',
          badge: 'bg-red-600 text-white',
          icon: 'text-red-600'
        };
      case 'high':
        return {
          border: 'border-orange-200 bg-orange-50',
          badge: 'bg-orange-600 text-white',
          icon: 'text-orange-600'
        };
      case 'medium':
        return {
          border: 'border-yellow-200 bg-yellow-50',
          badge: 'bg-yellow-600 text-white',
          icon: 'text-yellow-600'
        };
      case 'low':
        return {
          border: 'border-blue-200 bg-blue-50',
          badge: 'bg-blue-600 text-white',
          icon: 'text-blue-600'
        };
      default:
        return {
          border: 'border-gray-200 bg-white',
          badge: 'bg-gray-600 text-white',
          icon: 'text-gray-600'
        };
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'review_problem':
        return <AlertCircle className="w-5 h-5" />;
      case 'execute_urs':
        return <DollarSign className="w-5 h-5" />;
      case 'review_chargeback':
        return <XCircle className="w-5 h-5" />;
      case 'adjust_automation':
        return <Settings className="w-5 h-5" />;
      case 'approve_release':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'Crítico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Médio';
      case 'low':
        return 'Baixo';
      default:
        return priority;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) {
      return 'Atrasado';
    } else if (hours < 24) {
      return `${hours}h restantes`;
    } else {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };

  const styles = getPriorityStyles(action.priority);

  return (
    <div
      onClick={() => onActionClick(action)}
      className={`${styles.border} border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className={`${styles.icon} mt-1`}>
            {getActionIcon(action.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{action.title}</h3>
            <p className="text-xs text-gray-600">{action.description}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span className="font-medium">{action.contractNumber}</span>
          <span className="text-gray-400">•</span>
          <span>{action.clientName}</span>
        </div>

        <div className="flex items-center space-x-2">
          {action.dueDate && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{formatDate(action.dueDate)}</span>
            </div>
          )}
          <span className={`${styles.badge} px-2 py-0.5 rounded-full text-xs font-medium`}>
            {getPriorityLabel(action.priority)}
          </span>
        </div>
      </div>
    </div>
  );
};
