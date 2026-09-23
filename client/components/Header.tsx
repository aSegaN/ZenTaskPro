
import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, User as UserIcon, Settings, Command } from 'lucide-react';
import { Notification, User } from '../types';
import ThemeToggle from './ThemeToggle';
import { Theme } from '../hooks/useTheme';

interface HeaderProps {
  currentUser: User;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, notifications, onMarkRead, onMarkAllRead, onLogout, theme, onToggleTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 glass sticky top-0 z-30 flex items-center justify-between px-10 border-b border-line">
      <div className="flex items-center w-1/2">
        <div className="relative w-full max-w-lg group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-inkmuted group-focus-within:text-brand transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Recherche intelligente..."
            className="block w-full bg-surface2 border border-transparent rounded-2xl py-2.5 pl-11 pr-12 text-[13.5px] font-medium placeholder:text-inkmuted focus:outline-none focus:bg-surface focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all"
          />
          <div className="absolute inset-y-0 right-3 flex items-center">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-line bg-surface text-[10px] font-bold text-inkmuted">
              <Command className="w-2.5 h-2.5 mr-1" /> K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Bascule de thème */}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="icon" />

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-3 rounded-2xl relative transition-all duration-200 ${showNotifications ? 'bg-brandsoft text-brand shadow-inner' : 'text-inksoft hover:bg-surface2 hover:text-ink'}`}
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-indigo-600 border-2 border-surface rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-[380px] bg-surface border border-line rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 ring-1 ring-slate-900/5">
              <div className="px-6 py-5 border-b border-linesoft flex justify-between items-center bg-surface2">
                <h3 className="font-extrabold text-[11px] uppercase tracking-wide text-inkmuted">Centre de notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className="text-[10px] text-brand font-bold hover:underline tracking-tight">Vider tout</button>
                )}
              </div>
              <div className="max-h-[450px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center px-10">
                    <div className="w-16 h-16 bg-surface2 rounded-full flex items-center justify-center mx-auto mb-4 text-inkmuted">
                      <Bell className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-ink mb-1">C'est tout pour le moment</p>
                    <p className="text-xs text-inkmuted leading-relaxed">Nous vous tiendrons informé dès qu'une action importante se produit.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => onMarkRead(n.id)} 
                      className={`px-6 py-5 hover:bg-surface2 cursor-pointer border-b border-linesoft transition-colors ${!n.read ? 'bg-brandsoft' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.read ? 'bg-indigo-600' : 'bg-transparent border border-line'}`}></div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] text-ink leading-tight mb-1">{n.title}</p>
                          <p className="text-xs text-inksoft leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-inkmuted font-bold mt-2.5 uppercase tracking-wide">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative ml-2">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center space-x-3 p-1.5 rounded-2xl transition-all duration-200 border border-transparent ${showProfile ? 'bg-surface shadow-xl shadow-slate-200/50 border-line' : 'hover:bg-surface2'}`}
          >
            <div className="relative">
              <img src={currentUser.avatar} className="w-9 h-9 rounded-xl object-cover ring-2 ring-surface shadow-sm" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-surface rounded-full"></div>
            </div>
            <div className="text-left hidden lg:block pr-2">
              <p className="text-[13px] font-extrabold text-ink leading-none mb-1">{currentUser.firstName}</p>
              <p className="text-[10px] text-inkmuted font-bold uppercase tracking-wide">{currentUser.role}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-inkmuted transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-4 w-64 bg-surface border border-line rounded-2xl shadow-2xl z-50 overflow-hidden py-3 animate-in fade-in slide-in-from-top-3 duration-300 ring-1 ring-slate-900/5">
              <div className="px-6 py-4 border-b border-linesoft mb-2 bg-surface2">
                 <p className="text-[10px] text-inkmuted font-bold uppercase tracking-wide mb-1">{currentUser.department || 'Système'}</p>
                 <p className="text-xs font-bold text-ink truncate">{currentUser.email}</p>
              </div>
              <button className="w-full text-left px-6 py-2.5 text-[13px] font-bold text-inksoft hover:bg-surface2 flex items-center gap-3 transition-colors">
                <UserIcon className="w-4 h-4 text-inkmuted" /> Mon Compte
              </button>
              <button className="w-full text-left px-6 py-2.5 text-[13px] font-bold text-inksoft hover:bg-surface2 flex items-center gap-3 transition-colors">
                <Settings className="w-4 h-4 text-inkmuted" /> Préférences
              </button>
              <div className="h-px bg-surface2 my-2 mx-6"></div>
              <button 
                onClick={onLogout}
                className="w-full text-left px-6 py-2.5 text-[13px] font-extrabold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
