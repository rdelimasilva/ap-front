import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, X, User, FileText, ArrowRight,
  FileCheck, BarChart3, Wallet,
  CheckSquare, Building2, Users, Settings, Shield, Bell,
  Compass
} from 'lucide-react';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

type ResultType = 'client' | 'contract' | 'section';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  onClick: () => void;
}

interface SectionItem {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
}

const sections: SectionItem[] = [
  { id: 'formalization', label: 'Formalização', keywords: ['formalização', 'formalizacao', 'formalizar', 'documentos'], icon: <FileCheck className="w-4 h-4" /> },
  { id: 'contracts-monitoring', label: 'Monitoramento', keywords: ['monitoramento', 'monitor', 'acompanhar', 'acompanhamento'], icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'settlement-control', label: 'Liquidações', keywords: ['liquidação', 'liquidações', 'liquidacao', 'liquidacoes', 'settlement', 'previsto', 'realizado'], icon: <Wallet className="w-4 h-4" /> },
  { id: 'chargeback-monitoring', label: 'Chargeback', keywords: ['chargeback', 'charge back', 'estorno', 'redução valor'], icon: <Shield className="w-4 h-4" /> },
  { id: 'liquidation-problems', label: 'Problemas de liquidação', keywords: ['liquidação', 'liquidacao', 'problema', 'atraso', 'não liquidou'], icon: <Shield className="w-4 h-4" /> },
  { id: 'receivables-ledger', label: 'Conta corrente das URs', keywords: ['conta corrente', 'ur', 'urs', 'estabelecimento', 'credenciadora', 'bandeira'], icon: <FileText className="w-4 h-4" /> },
  { id: 'settlement-domicile', label: 'Domicílio de Liquidação', keywords: ['domicílio', 'domicilio', 'liquidação', 'domicilio de liquidacao'], icon: <Building2 className="w-4 h-4" /> },
  { id: 'partner-registration', label: 'Cadastro', keywords: ['cadastro', 'parceiros', 'clientes', 'parceiro', 'cliente', 'registrar', 'opt-in', 'optin', 'opt in', 'adesão', 'adesao'], icon: <Users className="w-4 h-4" /> },
  { id: 'menu-setup', label: 'Configuração de Menus', keywords: ['configuração', 'configuracao', 'menus', 'menu', 'setup', 'perfil', 'perfis'], icon: <Settings className="w-4 h-4" /> },

  { id: 'notifications', label: 'Notificações', keywords: ['notificações', 'notificacoes', 'notificação', 'alertas', 'aviso'], icon: <Bell className="w-4 h-4" /> },
  { id: 'contract-approval', label: 'Aprovação de Contratos', keywords: ['aprovação', 'aprovacao', 'aprovar', 'pendente', 'pendentes'], icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'disputes', label: 'Disputas', keywords: ['disputas', 'disputa', 'contestação', 'contestacao'], icon: <Shield className="w-4 h-4" /> },
  { id: 'reports', label: 'Relatórios', keywords: ['relatórios', 'relatorios', 'relatório', 'report'], icon: <FileText className="w-4 h-4" /> },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  clients: SearchClient[];
  contracts: SearchContract[];
  onNavigate: (type: string, id: string) => void;
}

interface SearchClient {
  id: string;
  name: string;
  document?: string;
  cnpj?: string;
  email?: string;
}

interface SearchContract {
  id: string;
  contractNumber?: string;
  clientName?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  clients,
  contracts,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEscapeKey(() => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchQuery = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search sections
    sections.forEach((section) => {
      const matchesLabel = section.label.toLowerCase().includes(searchQuery);
      const matchesKeyword = section.keywords.some(k => k.includes(searchQuery));
      if (matchesLabel || matchesKeyword) {
        allResults.push({
          id: `section-${section.id}`,
          type: 'section',
          title: section.label,
          subtitle: 'Ir para seção',
          onClick: () => {
            onNavigate('section', section.id);
            onClose();
          },
        });
      }
    });

    // Search clients
    clients.forEach((client) => {
      if (
        client.name.toLowerCase().includes(searchQuery) ||
        client.document?.toLowerCase().includes(searchQuery) ||
        client.cnpj?.toLowerCase().includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: client.cnpj || client.document || client.email || '',
          onClick: () => {
            onNavigate('client', client.id);
            onClose();
          },
        });
      }
    });

    // Search contracts
    contracts.forEach((contract) => {
      const contractNumber = contract.contractNumber || contract.id;
      if (
        contractNumber.toLowerCase().includes(searchQuery) ||
        contract.clientName?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: contract.id,
          type: 'contract',
          title: `Contrato ${contractNumber}`,
          subtitle: contract.clientName || '',
          onClick: () => {
            onNavigate('contract', contract.id);
            onClose();
          },
        });
      }
    });

    return allResults.slice(0, 12);
  }, [query, clients, contracts, onNavigate, onClose]);

  useEffect(() => {
    if (selectedIndex >= results.length && results.length > 0) {
      setSelectedIndex(results.length - 1);
    }
  }, [results, selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].onClick();
    }
  };

  const getIcon = (type: ResultType, title: string) => {
    switch (type) {
      case 'client':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'contract':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'section': {
        const section = sections.find(s => s.label === title);
        return section ? (
          <span className="text-purple-600">{section.icon}</span>
        ) : (
          <Compass className="w-5 h-5 text-purple-600" />
        );
      }
      default:
        return <Search className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: ResultType) => {
    switch (type) {
      case 'client':
        return 'Cliente';
      case 'contract':
        return 'Contrato';
      case 'section':
        return 'Seção';
      default:
        return '';
    }
  };

  const getTypeLabelColor = (type: ResultType) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-700';
      case 'contract':
        return 'bg-green-100 text-green-700';
      case 'section':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  // Group results by type
  const groupedResults = useMemo(() => {
    const sectionResults = results.filter(r => r.type === 'section');
    const clientResults = results.filter(r => r.type === 'client');
    const contractResults = results.filter(r => r.type === 'contract');
    return { sectionResults, clientResults, contractResults };
  }, [results]);

  const orderedResults = useMemo(() => {
    return [
      ...groupedResults.sectionResults,
      ...groupedResults.clientResults,
      ...groupedResults.contractResults,
    ];
  }, [groupedResults]);

  if (!isOpen) return null;

  let currentIndex = -1;

  const renderResult = (result: SearchResult) => {
    currentIndex++;
    const index = currentIndex;
    return (
      <button
        key={result.id}
        onClick={result.onClick}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`w-full flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors ${
          index === selectedIndex ? 'bg-blue-50' : ''
        }`}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          {getIcon(result.type, result.title)}
        </div>
        <div className="ml-3 flex-1 text-left">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">{result.title}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getTypeLabelColor(result.type)}`}>
              {getTypeLabel(result.type)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{result.subtitle}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300" />
      </button>
    );
  };

  const renderGroup = (label: string, items: SearchResult[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">
          {label}
        </div>
        {items.map(renderResult)}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-gray-200 px-4 py-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ir para cliente, contrato ou seção..."
            className="flex-1 ml-3 outline-none text-gray-900 placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!query.trim() && (
            <div className="p-8 text-center text-gray-500">
              <Compass className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Navegação rápida</p>
              <p className="text-xs text-gray-400 mt-1">Busque por clientes, contratos ou seções da plataforma</p>
              <div className="mt-4 text-xs space-y-1 text-gray-400">
                <p>↑↓ para navegar &middot; Enter para selecionar &middot; Esc para fechar</p>
              </div>
            </div>
          )}

          {query.trim() && orderedResults.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Nenhum resultado para "<span className="font-medium">{query}</span>"</p>
            </div>
          )}

          {query.trim() && orderedResults.length > 0 && (
            <>
              {renderGroup('Seções', groupedResults.sectionResults)}
              {renderGroup('Clientes', groupedResults.clientResults)}
              {renderGroup('Contratos', groupedResults.contractResults)}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
          <span>Ctrl + K para busca rápida</span>
          {query.trim() && <span>{orderedResults.length} resultado(s)</span>}
        </div>
      </div>
    </div>
  );
};
