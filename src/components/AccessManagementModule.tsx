import React, { useState } from 'react';
import {
  Users, Shield, FileText, Plus, Search, Edit2, Trash2,
  CheckCircle, XCircle, Clock, Filter, Eye, ChevronDown,
} from 'lucide-react';

interface AccessManagementModuleProps {
  section: 'user-management' | 'role-permissions' | 'access-logs';
}

/* ───────────── Mock data ───────────── */

const mockUsers = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@empresa.com', role: 'Admin', status: 'active' as const, lastAccess: '2026-02-27 09:12' },
  { id: '2', name: 'Ricardo Souza', email: 'ricardo.souza@empresa.com', role: 'Gerente', status: 'active' as const, lastAccess: '2026-02-27 08:45' },
  { id: '3', name: 'Mariana Costa', email: 'mariana.costa@empresa.com', role: 'Analista', status: 'active' as const, lastAccess: '2026-02-26 17:30' },
  { id: '4', name: 'Pedro Oliveira', email: 'pedro.oliveira@empresa.com', role: 'Visualizador', status: 'inactive' as const, lastAccess: '2026-01-15 11:00' },
  { id: '5', name: 'Juliana Mendes', email: 'juliana.mendes@empresa.com', role: 'Analista', status: 'active' as const, lastAccess: '2026-02-27 07:55' },
  { id: '6', name: 'Carlos Ferreira', email: 'carlos.ferreira@empresa.com', role: 'Gerente', status: 'pending' as const, lastAccess: '—' },
  { id: '7', name: 'Fernanda Lima', email: 'fernanda.lima@empresa.com', role: 'Visualizador', status: 'active' as const, lastAccess: '2026-02-25 14:22' },
];

const mockRoles = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    color: 'red',
    permissions: {
      'Gerenciar usuários': true,
      'Gerenciar perfis': true,
      'Ver logs de acesso': true,
      'Gerenciar operações': true,
      'Aprovar contratos': true,
      'Configurações do sistema': true,
      'Gerenciar clientes': true,
      'Exportar relatórios': true,
    },
  },
  {
    id: 'manager',
    name: 'Gerente',
    description: 'Gestão de operações e equipe',
    color: 'blue',
    permissions: {
      'Gerenciar usuários': false,
      'Gerenciar perfis': false,
      'Ver logs de acesso': true,
      'Gerenciar operações': true,
      'Aprovar contratos': true,
      'Configurações do sistema': false,
      'Gerenciar clientes': true,
      'Exportar relatórios': true,
    },
  },
  {
    id: 'analyst',
    name: 'Analista',
    description: 'Operações e análise de dados',
    color: 'emerald',
    permissions: {
      'Gerenciar usuários': false,
      'Gerenciar perfis': false,
      'Ver logs de acesso': false,
      'Gerenciar operações': true,
      'Aprovar contratos': false,
      'Configurações do sistema': false,
      'Gerenciar clientes': true,
      'Exportar relatórios': true,
    },
  },
  {
    id: 'viewer',
    name: 'Visualizador',
    description: 'Apenas leitura',
    color: 'gray',
    permissions: {
      'Gerenciar usuários': false,
      'Gerenciar perfis': false,
      'Ver logs de acesso': false,
      'Gerenciar operações': false,
      'Aprovar contratos': false,
      'Configurações do sistema': false,
      'Gerenciar clientes': false,
      'Exportar relatórios': false,
    },
  },
];

const mockLogs = [
  { id: '1', user: 'Ana Silva', action: 'Login realizado', ip: '192.168.1.10', date: '2026-02-27 09:12:03' },
  { id: '2', user: 'Ricardo Souza', action: 'Contrato aprovado #CTR-0042', ip: '192.168.1.22', date: '2026-02-27 08:55:18' },
  { id: '3', user: 'Ana Silva', action: 'Usuário criado: Carlos Ferreira', ip: '192.168.1.10', date: '2026-02-27 08:50:45' },
  { id: '4', user: 'Mariana Costa', action: 'Relatório exportado', ip: '10.0.0.5', date: '2026-02-26 17:32:11' },
  { id: '5', user: 'Ricardo Souza', action: 'Permissão alterada: Analista', ip: '192.168.1.22', date: '2026-02-26 16:20:00' },
  { id: '6', user: 'Juliana Mendes', action: 'Login realizado', ip: '10.0.0.8', date: '2026-02-26 15:10:33' },
  { id: '7', user: 'Ana Silva', action: 'Cliente editado: Empresa ABC', ip: '192.168.1.10', date: '2026-02-26 14:05:22' },
  { id: '8', user: 'Pedro Oliveira', action: 'Logout', ip: '192.168.1.45', date: '2026-02-26 12:00:00' },
  { id: '9', user: 'Fernanda Lima', action: 'Login realizado', ip: '10.0.0.12', date: '2026-02-25 14:22:10' },
  { id: '10', user: 'Ricardo Souza', action: 'Contrato criado #CTR-0041', ip: '192.168.1.22', date: '2026-02-25 11:30:45' },
];

/* ───────────── Sub-components ───────────── */

const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'pending' }> = ({ status }) => {
  const config = {
    active: { label: 'Ativo', style: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    inactive: { label: 'Inativo', style: 'bg-gray-100 text-gray-600', icon: XCircle },
    pending: { label: 'Pendente', style: 'bg-yellow-100 text-yellow-800', icon: Clock },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.style}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

/* ───────────── User Management Tab ───────────── */

const UserManagementTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = mockUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os perfis</option>
              <option value="Admin">Admin</option>
              <option value="Gerente">Gerente</option>
              <option value="Analista">Analista</option>
              <option value="Visualizador">Visualizador</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Último acesso</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{user.role}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{user.lastAccess}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title="Remover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          {filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

/* ───────────── Role Permissions Tab ───────────── */

const RolePermissionsTab: React.FC = () => {
  const [roles, setRoles] = useState(mockRoles);

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' },
  };

  const togglePermission = (roleId: string, permission: string) => {
    setRoles(prev =>
      prev.map(r =>
        r.id === roleId
          ? { ...r, permissions: { ...r.permissions, [permission]: !r.permissions[permission as keyof typeof r.permissions] } }
          : r
      )
    );
  };

  const permissionCount = (role: typeof mockRoles[0]) =>
    Object.values(role.permissions).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roles.map((role) => {
        const colors = colorMap[role.color] || colorMap.gray;
        return (
          <div key={role.id} className={`rounded-xl border ${colors.border} overflow-hidden`}>
            <div className={`px-5 py-4 ${colors.bg} border-b ${colors.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${colors.text}`}>{role.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {permissionCount(role)}/{Object.keys(role.permissions).length}
                </span>
              </div>
            </div>
            <div className="p-4 bg-white space-y-2">
              {Object.entries(role.permissions).map(([perm, enabled]) => (
                <label key={perm} className="flex items-center gap-3 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => togglePermission(role.id, perm)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={`text-sm ${enabled ? 'text-gray-700' : 'text-gray-400'} group-hover:text-gray-700 transition-colors`}>
                    {perm}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────── Access Logs Tab ───────────── */

const AccessLogsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = mockLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const logDate = log.date.slice(0, 10);
    const matchesFrom = !dateFrom || logDate >= dateFrom;
    const matchesTo = !dateTo || logDate <= dateTo;
    return matchesSearch && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuário ou ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">De:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500">Até:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ação</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{log.user}</td>
                  <td className="px-4 py-3 text-gray-600">{log.action}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{log.ip}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Nenhum log encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

/* ───────────── Main Component ───────────── */

const TAB_CONFIG = [
  { id: 'user-management' as const, label: 'Usuários', icon: Users },
  { id: 'role-permissions' as const, label: 'Perfis e Permissões', icon: Shield },
  { id: 'access-logs' as const, label: 'Logs de Acesso', icon: FileText },
];

export const AccessManagementModule: React.FC<AccessManagementModuleProps> = ({ section }) => {
  const activeTab = section;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </div>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'user-management' && <UserManagementTab />}
      {activeTab === 'role-permissions' && <RolePermissionsTab />}
      {activeTab === 'access-logs' && <AccessLogsTab />}
    </div>
  );
};
