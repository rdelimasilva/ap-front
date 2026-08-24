import React, { useState } from 'react';
import {
  Save,
  Bell,
  Mail,
  Plus,
  AlertTriangle,
  Shield,
  CreditCard,
  Users,
  Settings,
  Trash2,
  Edit,
  Search,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { showToast } from '../hooks/useToast';

interface NotificationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  permissions: string[]; // Permissões que determinam quais notificações podem receber
  active: boolean;
  createdAt: Date;
}

interface NotificationSettings {
  lockNotApplied: {
    enabled: boolean;
    users: string[];
  };
  domicileChangeNotCompleted: {
    enabled: boolean;
    users: string[];
  };
  chargebackReceived: {
    enabled: boolean;
    users: string[];
  };
}

// Mapeamento de quais permissões são necessárias para cada tipo de notificação
const NOTIFICATION_PERMISSIONS = {
  lockNotApplied: ['operations', 'risk', 'management'],
  domicileChangeNotCompleted: ['operations', 'finance', 'management'],
  chargebackReceived: ['risk', 'finance', 'management', 'operations']
};

const NOTIFICATION_LABELS = {
  lockNotApplied: 'Trava não aplicada',
  domicileChangeNotCompleted: 'Troca de domicílio não realizada',
  chargebackReceived: 'Chargeback recebido'
};

const NOTIFICATION_DESCRIPTIONS = {
  lockNotApplied: 'Notificação quando a aplicação de trava/ônus falha ou não é concluída',
  domicileChangeNotCompleted: 'Notificação quando a troca de domicílio bancário não é efetivada',
  chargebackReceived: 'Notificação quando um chargeback é identificado nas operações'
};

export const NotificationsModule: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<keyof NotificationSettings>>(
    new Set(['lockNotApplied', 'domicileChangeNotCompleted', 'chargebackReceived'])
  );
  const [users, setUsers] = useState<NotificationUser[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      role: 'Gerente de Operações',
      department: 'Operações',
      permissions: ['operations', 'management'],
      active: true,
      createdAt: new Date('2024-01-10')
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      role: 'Analista de Risco',
      department: 'Risco',
      permissions: ['risk'],
      active: true,
      createdAt: new Date('2024-01-08')
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro.costa@empresa.com',
      role: 'Supervisor Financeiro',
      department: 'Financeiro',
      permissions: ['finance'],
      active: false,
      createdAt: new Date('2024-01-05')
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      email: 'ana.oliveira@empresa.com',
      role: 'Coordenadora Geral',
      department: 'Gestão',
      permissions: ['management', 'operations'],
      active: true,
      createdAt: new Date('2024-01-12')
    },
    {
      id: '5',
      name: 'Carlos Mendes',
      email: 'carlos.mendes@empresa.com',
      role: 'Analista Financeiro',
      department: 'Financeiro',
      permissions: ['finance'],
      active: true,
      createdAt: new Date('2024-01-07')
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    lockNotApplied: {
      enabled: true,
      users: ['1', '2'] // Apenas usuários com permissões adequadas
    },
    domicileChangeNotCompleted: {
      enabled: true,
      users: ['1', '4'] // Apenas operações e gestão
    },
    chargebackReceived: {
      enabled: true,
      users: ['2', '4', '5'] // Risco, gestão e financeiro
    }
  });

  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<NotificationUser | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    permissions: [] as string[]
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  const handleToggleSection = (type: keyof NotificationSettings) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Função para verificar se um usuário pode receber determinada notificação
  const canUserReceiveNotification = (user: NotificationUser, notificationType: keyof NotificationSettings): boolean => {
    if (!user.active) return false;
    
    const requiredPermissions = NOTIFICATION_PERMISSIONS[notificationType];
    return requiredPermissions.some(permission => user.permissions.includes(permission));
  };

  // Função para obter usuários elegíveis para uma notificação específica
  const getEligibleUsersForNotification = (notificationType: keyof NotificationSettings): NotificationUser[] => {
    return users.filter(user => canUserReceiveNotification(user, notificationType));
  };

  const handleNotificationToggle = (type: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
    setHasChanges(true);
  };

  const handleUserToggleForNotification = (type: keyof NotificationSettings, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !canUserReceiveNotification(user, type)) {
      return; // Não permite selecionar usuários sem permissão
    }

    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        users: prev[type].users.includes(userId)
          ? prev[type].users.filter(id => id !== userId)
          : [...prev[type].users, userId]
      }
    }));
    setHasChanges(true);
  };

  const handleSelectAllUsersForNotification = (type: keyof NotificationSettings) => {
    const eligibleUsers = getEligibleUsersForNotification(type);
    const eligibleUserIds = eligibleUsers.map(user => user.id);
    const allSelected = eligibleUserIds.every(id => settings[type].users.includes(id));
    
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        users: allSelected ? [] : eligibleUserIds
      }
    }));
    setHasChanges(true);
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.role && newUser.department && newUser.permissions.length > 0) {
      const user: NotificationUser = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        permissions: newUser.permissions,
        active: true,
        createdAt: new Date()
      };
      setUsers(prev => [...prev, user]);
      setNewUser({ name: '', email: '', role: '', department: '', permissions: [] });
      setShowAddUser(false);
      setHasChanges(true);
    }
  };

  const handleEditUser = (user: NotificationUser) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: [...user.permissions]
    });
    setShowAddUser(true);
  };

  const handleUpdateUser = () => {
    if (editingUser && newUser.name && newUser.email && newUser.role && newUser.department && newUser.permissions.length > 0) {
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              name: newUser.name, 
              email: newUser.email, 
              role: newUser.role,
              department: newUser.department,
              permissions: newUser.permissions
            }
          : user
      ));
      
      // Remove usuário de notificações para as quais ele não tem mais permissão
      setSettings(prev => {
        const newSettings = { ...prev };
        Object.keys(newSettings).forEach(notificationType => {
          const type = notificationType as keyof NotificationSettings;
          const updatedUser = users.find(u => u.id === editingUser.id);
          if (updatedUser && !canUserReceiveNotification({...updatedUser, permissions: newUser.permissions}, type)) {
            newSettings[type].users = newSettings[type].users.filter(id => id !== editingUser.id);
          }
        });
        return newSettings;
      });
      
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: '', department: '', permissions: [] });
      setShowAddUser(false);
      setHasChanges(true);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmDeleteUserId(userId);
  };

  const confirmDeleteUser = () => {
    if (!confirmDeleteUserId) return;
    setUsers(prev => prev.filter(user => user.id !== confirmDeleteUserId));
    // Remove user from all notification settings
    setSettings(prev => ({
      lockNotApplied: {
        ...prev.lockNotApplied,
        users: prev.lockNotApplied.users.filter(id => id !== confirmDeleteUserId)
      },
      domicileChangeNotCompleted: {
        ...prev.domicileChangeNotCompleted,
        users: prev.domicileChangeNotCompleted.users.filter(id => id !== confirmDeleteUserId)
      },
      chargebackReceived: {
        ...prev.chargebackReceived,
        users: prev.chargebackReceived.users.filter(id => id !== confirmDeleteUserId)
      }
    }));
    setHasChanges(true);
    showToast('success', 'Usuário excluído');
    setConfirmDeleteUserId(null);
  };

  const handleToggleUserActive = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, active: !user.active } : user
    ));
    
    // Remove usuário inativo de todas as notificações
    if (!users.find(u => u.id === userId)?.active) {
      setSettings(prev => ({
        lockNotApplied: {
          ...prev.lockNotApplied,
          users: prev.lockNotApplied.users.filter(id => id !== userId)
        },
        domicileChangeNotCompleted: {
          ...prev.domicileChangeNotCompleted,
          users: prev.domicileChangeNotCompleted.users.filter(id => id !== userId)
        },
        chargebackReceived: {
          ...prev.chargebackReceived,
          users: prev.chargebackReceived.users.filter(id => id !== userId)
        }
      }));
    }
    
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Saving notification settings:', settings);
    console.log('Saving users:', users);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setShowAddUser(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: '', department: '', permissions: [] });
  };

  const handlePermissionToggle = (permission: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.active) ||
                         (statusFilter === 'inactive' && !user.active);
    
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const NotificationCard: React.FC<{
    type: keyof NotificationSettings;
    color: string;
  }> = ({ type, color }) => {
    const eligibleUsers = getEligibleUsersForNotification(type);
    const selectedCount = settings[type].users.length;
    const allSelected = eligibleUsers.length > 0 && eligibleUsers.every(user => settings[type].users.includes(user.id));
    const isExpanded = expandedSections.has(type);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-3 rounded-t-xl transition-colors"
          onClick={() => handleToggleSection(type)}
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
              {type === 'lockNotApplied' && <Shield className="w-5 h-5 text-red-600" />}
              {type === 'domicileChangeNotCompleted' && <CreditCard className="w-5 h-5 text-orange-600" />}
              {type === 'chargebackReceived' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{NOTIFICATION_LABELS[type]}</h3>
              <p className="text-sm text-gray-600">{NOTIFICATION_DESCRIPTIONS[type]}</p>
              {settings[type].enabled && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedCount} de {eligibleUsers.length} usuários elegíveis selecionados
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationToggle(type);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings[type].enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[type].enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex items-center space-x-1">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {settings[type].enabled && isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Usuários elegíveis:</p>
                <p className="text-xs text-gray-500">
                  Apenas usuários com permissões adequadas aparecem aqui
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSelectAllUsersForNotification(type)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                    allSelected 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {allSelected ? (
                    <>
                      <UserX className="w-4 h-4" />
                      <span>Desmarcar Todos</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Selecionar Todos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eligibleUsers.map(user => (
                <label 
                  key={user.id} 
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                    settings[type].users.includes(user.id)
                      ? 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100'
                      : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={settings[type].users.includes(user.id)}
                    onChange={() => handleUserToggleForNotification(type, user.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role} • {user.department}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.permissions.map(permission => (
                        <span key={permission} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </label>
              ))}
            </div>

            {eligibleUsers.length === 0 && (
              <div className="text-center py-8">
                <UserX className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum usuário elegível para esta notificação</p>
                <p className="text-xs text-gray-400 mt-1">
                  Adicione usuários com permissões: {NOTIFICATION_PERMISSIONS[type].join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Collapsed state summary */}
        {settings[type].enabled && !isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-3 rounded-b-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {selectedCount > 0 ? (
                  <>
                    <span className="font-medium text-gray-900">{selectedCount}</span> usuário(s) selecionado(s)
                  </>
                ) : (
                  <span className="text-gray-500">Nenhum usuário selecionado</span>
                )}
              </span>
              <span className="text-gray-500">
                {eligibleUsers.length} elegível(is)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeUsers = users.filter(user => user.active);
  const totalNotifications = Object.values(settings).filter(setting => setting.enabled).length;
  const departments = [...new Set(users.map(user => user.department))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </button>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 font-medium">Alterações não salvas</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Notificações Ativas</p>
              <p className="text-2xl font-bold text-blue-600">{totalNotifications}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departamentos</p>
              <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
            </div>
            <Settings className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emails Configurados</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(settings).reduce((sum, setting) => sum + setting.users.length, 0)}
              </p>
            </div>
            <Mail className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Tipos de Notificação</h2>
        
        <NotificationCard type="lockNotApplied" color="text-red-600" />
        <NotificationCard type="domicileChangeNotCompleted" color="text-orange-600" />
        <NotificationCard type="chargebackReceived" color="text-yellow-600" />
      </div>

      {/* Users Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors h-8 flex items-center justify-center text-sm font-normal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit User Form */}
        {showAddUser && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">
              {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                <input
                  type="text"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Gerente de Operações"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecionar departamento</option>
                  <option value="Operações">Operações</option>
                  <option value="Risco">Risco</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Gestão">Gestão</option>
                  <option value="TI">TI</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissões *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['operations', 'risk', 'finance', 'management'].map(permission => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{permission}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                As permissões determinam quais notificações o usuário pode receber
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors h-8 flex items-center justify-center text-sm font-normal"
              >
                Cancelar
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                disabled={!newUser.name || !newUser.email || !newUser.role || !newUser.department || newUser.permissions.length === 0}
                className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-8 flex items-center justify-center text-sm font-normal"
              >
                {editingUser ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissões
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.role}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {user.department}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map(permission => (
                        <span key={permission} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleUserActive(user.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          user.active ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            user.active ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-medium ${user.active ? 'text-green-600' : 'text-gray-500'}`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">
                {users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado'}
              </div>
              <div className="text-sm text-gray-400">
                {users.length === 0 
                  ? 'Adicione usuários para receber notificações'
                  : 'Tente ajustar os filtros de busca'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Sistema Inteligente de Notificações</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• <strong>Baseado em Permissões:</strong> Apenas usuários com permissões adequadas aparecem em cada notificação</li>
              <li>• <strong>Filtro por Departamento:</strong> Usuários são organizados por departamento e função</li>
              <li>• <strong>Contexto Inteligente:</strong> Analistas de risco só veem notificações de risco, etc.</li>
              <li>• <strong>Gestão Automática:</strong> Usuários inativos são removidos automaticamente das notificações</li>
              <li>• <strong>Validação de Contexto:</strong> Sistema impede seleções inadequadas baseadas no perfil do usuário</li>
            </ul>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!confirmDeleteUserId}
        title="Excluir usuário"
        message="Tem certeza que deseja excluir este usuário? Ele será removido de todas as configurações de notificação."
        confirmText="Excluir"
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmDeleteUserId(null)}
      />
    </div>
  );
};