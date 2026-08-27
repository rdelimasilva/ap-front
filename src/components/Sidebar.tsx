import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  FileText,
  CalendarDays,
  FolderOpen,
  FileSignature,
  ClipboardCheck,
  UserPlus,
  Settings,
  FileCode,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onHelpClick?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  subItems?: { id: string; label: string }[];
}

// Ocultos temporariamente para reduzir a UI ativa; os módulos continuam no código (lazy-loaded) para reativação futura.
const SHOW_ACOMPANHAMENTO = true;
const SHOW_CONFIGURACOES = false;

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, collapsed, onToggleCollapse, onHelpClick: _onHelpClick }) => {
  const [monitoringExpanded, setMonitoringExpanded] = useState(true);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [disputesExpanded, setDisputesExpanded] = useState(false);
  const [accessManagementExpanded, setAccessManagementExpanded] = useState(false);

  const btnClass = (active: boolean) =>
    `w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
      active
        ? 'bg-emerald-50 text-emerald-700 font-medium'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const iconClass = (active: boolean) =>
    `w-[18px] h-[18px] mr-3 flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400'}`;

  const subBtnClass = (active: boolean) =>
    `w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
      active
        ? 'text-emerald-700 font-medium bg-emerald-50'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const expandBtnClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
      active
        ? 'bg-emerald-50 text-emerald-700 font-medium'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const monitoringSubItems = [
    { id: 'contracts-monitoring', label: 'Contratos' },
    { id: 'liquidation-problems', label: 'Problemas de liquidação' },
    { id: 'chargeback-monitoring', label: 'Chargeback' },
  ];

  const reportsSubItems = [
    { id: 'settlement-control', label: 'Liquidações' },
    { id: 'receivables-ledger', label: 'Conta corrente das URs' },
  ];

  const configSubItems = [
    { id: 'financial', label: 'Financeiro' },
    { id: 'settlement-domicile', label: 'Domicílio de Liquidação' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'menu-setup', label: 'Configuração de Menus' },
  ];

  const disputesSubItems = [
    { id: 'disputes', label: 'Contestações abertas' },
  ];

  const accessManagementSubItems = [
    { id: 'user-management', label: 'Gerenciamento de Usuários' },
    { id: 'role-permissions', label: 'Perfis e Permissões' },
    { id: 'access-logs', label: 'Logs de Acesso' },
  ];

  // Mini-icon items for collapsed sidebar — PRINCIPAL
  const collapsedPrincipalItems: NavItem[] = [
    { id: 'partner-registration', label: 'Cadastro', icon: UserPlus },
    { id: 'schedule-view', label: 'Agendas', icon: CalendarDays },
    { id: 'contracts', label: 'Contratos', icon: FolderOpen },
    { id: 'contratos-cerc', label: 'Registro CERC', icon: FileSignature },
  ];

  // Mini-icon items — ACOMPANHAMENTO
  const collapsedAcompanhamentoItems: NavItem[] = [
    { id: 'monitoring', label: 'Monitoramento', icon: BarChart3, subItems: monitoringSubItems },
    { id: 'settlement-control', label: 'Relatórios', icon: FileText, subItems: reportsSubItems },
    { id: 'disputes', label: 'Contestação', icon: ShieldAlert, subItems: disputesSubItems },
  ];

  // Mini-icon items — CONFIGURAÇÕES
  const collapsedConfigItems: NavItem[] = [
    { id: 'financial', label: 'Geral', icon: Settings, subItems: configSubItems },
    { id: 'user-management', label: 'Gestão de acessos', icon: Shield, subItems: accessManagementSubItems },
  ];

  // Collapsed sidebar view (mini-icons only)
  if (collapsed) {
    const isActive = (item: NavItem) => {
      if (activeSection === item.id) return true;
      if (item.subItems) return item.subItems.some(sub => activeSection === sub.id);
      return false;
    };

    const renderCollapsedItem = (item: NavItem) => {
      const Icon = item.icon;
      const active = isActive(item);
      return (
        <div key={item.id} className="relative group">
          <button
            onClick={() => {
              if (item.subItems) {
                setActiveSection(item.subItems[0].id);
              } else {
                setActiveSection(item.id);
              }
              onToggleCollapse();
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              active
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            aria-label={item.label}
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
          {/* Tooltip on hover */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white border-r border-gray-100 h-screen w-16 fixed left-0 top-0 z-30 flex-col hidden lg:flex">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-gray-100">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Expandir menu"
            aria-label="Expandir menu"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation icons */}
        <nav className="flex-1 overflow-y-auto py-4 flex flex-col items-center space-y-1">
          {collapsedPrincipalItems.map(renderCollapsedItem)}

          {SHOW_ACOMPANHAMENTO && (
            <>
              <div className="w-6 border-t border-gray-200 my-2" />
              {collapsedAcompanhamentoItems.map(renderCollapsedItem)}
            </>
          )}

          {SHOW_CONFIGURACOES && (
            <>
              <div className="w-6 border-t border-gray-200 my-2" />
              {collapsedConfigItems.map(renderCollapsedItem)}
            </>
          )}
        </nav>

      </div>
    );
  }

  const renderExpandable = (
    key: string,
    icon: React.ElementType,
    label: string,
    expanded: boolean,
    setExpanded: (v: boolean) => void,
    subItems: { id: string; label: string }[],
  ) => {
    const Icon = icon;
    const isAnyActive = subItems.some(sub => activeSection === sub.id);
    return (
      <div key={key}>
        <button
          onClick={() => setExpanded(!expanded)}
          className={expandBtnClass(isAnyActive)}
          aria-expanded={expanded}
        >
          <div className="flex items-center">
            <Icon className={iconClass(isAnyActive)} />
            <span>{label}</span>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {expanded && (
          <div className="mt-1 ml-5 pl-4 border-l border-gray-200 space-y-1">
            {subItems.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => setActiveSection(subItem.id)}
                className={subBtnClass(activeSection === subItem.id)}
              >
                {subItem.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSimple = (id: string, icon: React.ElementType, label: string) => {
    const Icon = icon;
    const active = activeSection === id;
    return (
      <button
        key={id}
        onClick={() => setActiveSection(id)}
        className={btnClass(active)}
      >
        <Icon className={iconClass(active)} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        onClick={onToggleCollapse}
      />

      <div className="bg-white border-r border-gray-100 h-screen w-[280px] sm:w-64 fixed left-0 top-0 z-30 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-end px-5 h-16 flex-shrink-0 border-b border-gray-100">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Recolher menu"
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pt-6">
          {/* PRINCIPAL section */}
          <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Principal</p>

          <div className="space-y-1">
            {renderSimple('partner-registration', UserPlus, 'Cadastro')}
            {renderSimple('schedule-view', CalendarDays, 'Agendas')}
            {renderSimple('contracts', FolderOpen, 'Contratos')}
            {renderSimple('contratos-cerc', FileSignature, 'Registro CERC')}
          </div>

          {/* ACOMPANHAMENTO section — oculta temporariamente */}
          {SHOW_ACOMPANHAMENTO && (
            <>
              <p className="px-3 mt-8 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Acompanhamento</p>
              <div className="space-y-1">
                {renderExpandable('monitoring-group', BarChart3, 'Monitoramento', monitoringExpanded, setMonitoringExpanded, monitoringSubItems)}
                {renderExpandable('reports-group', FileText, 'Relatórios', reportsExpanded, setReportsExpanded, reportsSubItems)}
                {renderExpandable('disputes-group', ShieldAlert, 'Contestação', disputesExpanded, setDisputesExpanded, disputesSubItems)}
              </div>
            </>
          )}

          {/* CONFIGURACOES section (inclui Gestão de acessos) — oculta temporariamente */}
          {SHOW_CONFIGURACOES && (
            <>
              <p className="px-3 mt-8 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Configurações</p>
              <div className="space-y-1">
                {renderExpandable('config-group', Settings, 'Geral', configExpanded, setConfigExpanded, configSubItems)}
                {renderExpandable('access-management-group', Shield, 'Gestão de acessos', accessManagementExpanded, setAccessManagementExpanded, accessManagementSubItems)}
              </div>
            </>
          )}
        </nav>
      </div>
    </>
  );
};
