import React, { useState } from 'react';
import { User, LogOut, Settings, Bell, Search, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Trava não aplicada',
    message: 'Cliente ABC Ltda. teve trava rejeitada pela registradora.',
    time: 'Há 10 min',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Contrato aprovado',
    message: 'Contrato #2024-0087 foi aprovado com sucesso.',
    time: 'Há 1 hora',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Novo opt-in recebido',
    message: 'Cliente XYZ S.A. assinou o opt-in de recebíveis.',
    time: 'Há 3 horas',
    read: true,
  },
];

interface HeaderProps {
  onLogout: () => void;
  sidebarCollapsed: boolean;
  pageTitle: string;
  onSearchClick?: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, sidebarCollapsed, pageTitle, onSearchClick, onSettingsClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50';
      case 'success':
        return 'bg-green-50';
      case 'info':
        return 'bg-blue-50';
    }
  };

  return (
    <div className={`fixed top-0 left-0 ${sidebarCollapsed ? 'lg:left-16' : 'lg:left-64'} right-0 bg-white border-b border-gray-100 z-20 transition-all duration-300`}>
      <div className="px-3 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Left — page title */}
        <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate ml-10 lg:ml-0">{pageTitle}</h1>

        {/* Center — search */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 md:mx-8 hidden sm:block">
          <button
            onClick={onSearchClick}
            className="w-full flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors bg-gray-50/50"
          >
            <Search className="w-4 h-4" />
            <span>Ir para...</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right — actions + user */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full ring-2 ring-white text-[10px] font-bold text-white px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhuma notificação</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-blue-50/30' : ''
                          }`}
                          onClick={() => {
                            setNotifications(prev =>
                              prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                            );
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationBg(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                              <div className="flex items-center gap-1 mt-1 text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px]">{notification.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

          {/* User */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Menu do usuário"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">Ricardo Lima</p>
                <p className="text-xs text-gray-500 leading-tight">ricardo.lima@ideen.tech</p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Ricardo Lima</p>
                    <p className="text-xs text-gray-500">ricardo.lima@ideen.tech</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
