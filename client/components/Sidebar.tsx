import React from 'react';
import { Project, AppView, UserRole, User } from '../types';
import { LayoutDashboard, CheckCircle, Calendar, Plus, Users, Settings, Trash2, Mail, Layers, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  activeProjectId: string;
  projects: Project[];
  currentUser: User;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onAddProject: () => void;
  onGoToDashboard: () => void;
  onGoToMyTasks: () => void;
  onGoToCalendar: () => void;
  onGoToUserManagement: () => void;
  onGoToEmailLogs: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  activeProjectId, 
  projects,
  currentUser,
  onSelectProject, 
  onDeleteProject,
  onAddProject,
  onGoToDashboard, 
  onGoToMyTasks, 
  onGoToCalendar,
  onGoToUserManagement,
  onGoToEmailLogs
}) => {
  const NavItem = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`group relative flex items-center w-full px-5 py-3 my-1 rounded-2xl transition-all duration-300 ${
        isActive 
        ? 'bg-accent text-white shadow-xl shadow-slate-200/50 sidebar-active-glow' 
        : 'text-inksoft hover:bg-surface2 hover:text-ink'
      }`}
    >
      <Icon className={`w-5 h-5 mr-4 transition-transform duration-300 ${isActive ? 'text-indigo-400' : 'group-hover:scale-110'}`} />
      <span className="text-[14px] font-bold tracking-tight">{label}</span>
      {isActive && (
          <div className="absolute right-4 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
      )}
    </button>
  );

  return (
    <aside className="w-[280px] border-r border-line bg-surface h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-10 pb-6 flex items-center space-x-3">
        <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-6 group-hover:rotate-0 transition-all duration-500">
          <Layers className="text-white w-6 h-6" />
        </div>
        <div className="leading-none">
          <span className="text-[22px] font-bold text-ink tracking-tighter">ZenTask</span>
          <p className="text-[9px] font-bold text-brand uppercase tracking-wider mt-1 ml-0.5">Workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-6 overflow-y-auto py-6 custom-scrollbar">
        <div className="space-y-1">
          <NavItem icon={LayoutDashboard} label="Tableau de bord" isActive={currentView === 'dashboard'} onClick={onGoToDashboard} />
          <NavItem icon={CheckCircle} label="Mes tâches" isActive={currentView === 'my-tasks'} onClick={onGoToMyTasks} />
          <NavItem icon={Calendar} label="Calendrier" isActive={currentView === 'calendar'} onClick={onGoToCalendar} />
        </div>

        <div className="mt-12 mb-4 px-4 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Projets</h3>
          <button 
            onClick={onAddProject}
            className="p-1.5 text-inkmuted hover:text-brand hover:bg-brandsoft rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {projects.map((project) => (
            <div key={project.id} className="group relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectProject(project.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectProject(project.id)}
                className={`flex items-center w-full px-5 py-3 rounded-2xl transition-all duration-300 text-left cursor-pointer ${
                  activeProjectId === project.id
                    ? 'bg-accent text-white shadow-xl shadow-slate-200/50 sidebar-active-glow'
                    : 'text-inksoft hover:bg-surface2 hover:text-ink'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-lg mr-4 ring-4 ring-opacity-20 transition-transform group-hover:scale-125" 
                  style={{ 
                    backgroundColor: project.color, 
                    ringColor: project.color 
                  }} 
                />
                <span className="text-[14px] font-bold tracking-tight flex-1 truncate">{project.name}</span>
                {activeProjectId === project.id && (
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse mr-2"></div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-inkmuted hover:text-red-500 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 mb-4 px-4">
          <h3 className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Gestion</h3>
        </div>
        <div className="space-y-1">
          <NavItem 
            icon={Users} 
            label={currentUser.role === UserRole.ADMIN ? 'Équipe & Accès' : 'Collègues'} 
            isActive={currentView === 'user-management'} 
            onClick={onGoToUserManagement} 
          />
          {currentUser.role === UserRole.ADMIN && (
            <NavItem icon={Mail} label="Logs Système" isActive={currentView === 'email-logs'} onClick={onGoToEmailLogs} />
          )}
        </div>
      </nav>

      <div className="p-8 border-t border-linesoft">
        <div className="bg-surface2 rounded-2xl p-4 mb-6 border border-linesoft flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface shadow-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand" />
            </div>
            <div>
                <p className="text-[11px] font-bold text-ink uppercase tracking-tight leading-none mb-1">IA Assistant</p>
                <p className="text-[9px] text-inksoft font-bold">Actif sur le projet</p>
            </div>
        </div>
        <button className="flex items-center space-x-3 w-full p-4 text-inksoft hover:bg-accent hover:text-white hover:shadow-2xl hover:shadow-slate-200 rounded-xl transition-all group">
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
          <span className="text-[14px] font-bold tracking-tight">Paramètres</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;