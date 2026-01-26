import React, { useState, useMemo, useEffect, Suspense, lazy, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import TaskDetail from './components/TaskDetail';
import Dashboard, { FilterCategory } from './components/Dashboard';
import MyTasks from './components/MyTasks';
import Login from './components/Login';
import { authService } from './services/authService';
import { emailService } from './services/emailService';
import api from './services/api';
import { Task, Status, Priority, Project, Notification, AppView, User, UserRole, EmailLog, SubTask } from './types';
import { STATUS_LABELS } from './constants';
import { Plus, X, Check, Calendar, User as UserIcon, Tag, Briefcase, ListChecks, Trash2 } from 'lucide-react';

const CalendarView = lazy(() => import('./components/CalendarView'));
const FilteredListView = lazy(() => import('./components/FilteredListView'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const EmailLogs = lazy(() => import('./components/EmailLogs'));

const NOTIFS_STORAGE_KEY = 'zentask_notifs_v1';

// ============================================
// CONSTANTES POUR LE RAFRAÎCHISSEMENT TOKEN
// ============================================
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Vérifier toutes les 5 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // Rafraîchir si moins de 10 min restantes

const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <p className="font-bold text-[11px] uppercase tracking-[0.3em] text-indigo-500 mt-6">Synchronisation...</p>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = authService.getSession();
    return session ? session.user : null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [dashboardFilter, setDashboardFilter] = useState<FilterCategory>('all');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // ============================================
  // GESTION DES NOTIFICATIONS
  // ============================================
  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      time: 'À l\'instant',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // ============================================
  // GESTION DE LA DÉCONNEXION (centralisée)
  // ============================================
  const handleLogout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setUsers([]);
    setProjects([]);
    setTasks([]);
    setCurrentView('dashboard');
  }, []);

  // ============================================
  // RAFRAÎCHISSEMENT AUTOMATIQUE DU TOKEN
  // ============================================
  useEffect(() => {
    if (!currentUser) return;

    const refreshTokenIfNeeded = async () => {
      try {
        const expiresAt = localStorage.getItem('expiresAt');
        if (!expiresAt) {
          console.log('⚠️ Pas de expiresAt trouvé, déconnexion...');
          handleLogout();
          return;
        }

        const timeRemaining = parseInt(expiresAt) - Date.now();

        // Si le token a expiré, déconnecter
        if (timeRemaining <= 0) {
          console.log('⏰ Token expiré, déconnexion...');
          addNotification('Session expirée', 'Votre session a expiré, veuillez vous reconnecter.', 'warning');
          handleLogout();
          return;
        }

        // Si moins de 10 minutes restantes, rafraîchir
        if (timeRemaining < TOKEN_REFRESH_THRESHOLD) {
          console.log(`🔄 Token expire dans ${Math.round(timeRemaining / 1000)}s, rafraîchissement...`);
          
          const response = await api.post('/auth/refresh');
          const { token, expiresAt: newExpiresAt } = response.data;

          // Mettre à jour le localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('expiresAt', newExpiresAt.toString());

          console.log('✅ Token rafraîchi avec succès');
          addNotification('Session prolongée', 'Votre session a été automatiquement prolongée.', 'info');
        }
      } catch (error: any) {
        console.error('❌ Erreur rafraîchissement token:', error);
        
        // Si erreur 401, le token est invalide → déconnexion
        if (error.response?.status === 401) {
          addNotification('Session invalide', 'Veuillez vous reconnecter.', 'warning');
          handleLogout();
        }
      }
    };

    // Vérifier immédiatement au montage
    refreshTokenIfNeeded();

    // Puis vérifier périodiquement
    const intervalId = setInterval(refreshTokenIfNeeded, TOKEN_REFRESH_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [currentUser, handleLogout, addNotification]);

  // ============================================
  // ÉCOUTE DES ÉVÉNEMENTS DE DÉCONNEXION FORCÉE
  // ============================================
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log('🔔 Event auth:expired reçu');
      addNotification('Session expirée', 'Vous avez été déconnecté automatiquement.', 'warning');
      handleLogout();
    };

    // Écouter l'événement custom émis par l'intercepteur API
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [handleLogout, addNotification]);

  // ============================================
  // SYNC STORAGE (Notifications locales)
  // ============================================
  useEffect(() => {
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // ============================================
  // CHARGEMENT INITIAL DES DONNÉES (API)
  // ============================================
  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        try {
          const [usersRes, projectsRes, tasksRes] = await Promise.all([
            api.get('/users'),
            api.get('/projects'),
            api.get('/tasks')
          ]);

          setUsers(usersRes.data);
          setProjects(projectsRes.data);
          setTasks(tasksRes.data);

          // Définir un projet actif par défaut si nécessaire
          if (projectsRes.data.length > 0 && !activeProjectId) {
            setActiveProjectId(projectsRes.data[0].id);
          }
        } catch (error: any) {
          console.error("Erreur chargement données", error);
          
          // Ne pas afficher d'erreur si c'est un 401 (géré par l'intercepteur)
          if (error.response?.status !== 401) {
            addNotification("Erreur Connexion", "Impossible de joindre le serveur", "warning");
          }
        }
      };
      fetchData();
    }
  }, [currentUser]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    addNotification('Connexion sécurisée', `Bienvenue, ${user.firstName}. Session active pour 2h.`, 'success');
  };

  // --- GESTION DES TÂCHES (API) ---

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const payload = {
        ...taskData,
        assigneeId: taskData.assignee?.id,
        projectId: taskData.projectId || activeProjectId
      };

      const response = await api.post('/tasks', payload);
      const newTask = response.data;

      setTasks(prev => [newTask, ...prev]);
      addNotification('Tâche créée', `"${newTask.title}" sauvegardée en base.`, 'success');
      setShowTaskModal(false);
    } catch (e) {
      console.error(e);
      addNotification('Erreur', 'La création a échoué.', 'warning');
    }
  };

  const updateTask = async (updatedTask: Task) => {
    // Mise à jour Optimiste (UI immédiate)
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);

    try {
      await api.put(`/tasks/${updatedTask.id}`, {
        ...updatedTask,
        assigneeId: updatedTask.assignee.id,
        subtasks: updatedTask.subtasks
      });

      if (updatedTask.status === Status.DONE) {
        addNotification('Tâche terminée', `"${updatedTask.title}" est archivée.`, 'success');
      }
    } catch (e) {
      console.error(e);
      addNotification('Erreur', 'Sauvegarde échouée.', 'warning');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      setSelectedTask(null);
      addNotification('Tâche supprimée', 'L\'élément a été retiré de la base de données.', 'info');
    } catch (e) {
      addNotification('Erreur', 'Impossible de supprimer la tâche.', 'warning');
    }
  };

  // --- GESTION DES PROJETS (API) ---

  const addProject = async (name: string, color: string) => {
    try {
      if (!currentUser) return;
      const response = await api.post('/projects', {
        name,
        color,
        ownerId: currentUser.id
      });
      const newProject = response.data;
      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newProject.id);
      setCurrentView('project');
      addNotification('Nouveau Projet', `Workspace "${name}" créé.`, 'success');
    } catch (error) {
      addNotification('Erreur', "Impossible de sauvegarder le projet.", 'warning');
    }
  };

  const deleteProject = async (id: string) => {
    if (currentUser?.role === UserRole.ADMIN) {
      try {
        await api.delete(`/projects/${id}`);
        setProjects(prev => prev.filter(p => p.id !== id));
        setTasks(prev => prev.filter(t => t.projectId !== id));
        if (activeProjectId === id) setCurrentView('dashboard');
        addNotification('Projet supprimé', 'Le workspace a été effacé.', 'info');
      } catch (error) {
        addNotification('Erreur', "Impossible de supprimer le projet.", 'warning');
      }
    }
  };

  // --- GESTION DES UTILISATEURS (API) ---

  const handleAddUser = async (user: User) => {
    try {
      const response = await api.post('/auth/register', {
        ...user,
        password: user.password || 'password123'
      });

      setUsers(prev => [...prev, response.data]);
      addNotification('Succès', `Utilisateur ${user.firstName} ajouté à la base de données.`, 'success');
    } catch (error) {
      console.error(error);
      addNotification('Erreur', "Impossible de créer l'utilisateur (Email/User existe déjà ?).", 'warning');
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      const response = await api.put(`/users/${user.id}`, user);
      setUsers(prev => prev.map(u => u.id === user.id ? response.data : u));
      addNotification('Succès', 'Utilisateur mis à jour.', 'success');
    } catch (error) {
      console.error(error);
      addNotification('Erreur', 'Impossible de mettre à jour l\'utilisateur.', 'warning');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      addNotification('Succès', 'Utilisateur supprimé.', 'success');
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Impossible de supprimer l\'utilisateur.';
      addNotification('Erreur', message, 'warning');
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const activeProject = useMemo(() =>
    projects.find(p => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]);

  const filteredTasksForProject = useMemo(() =>
    tasks.filter(t => t.projectId === activeProjectId),
    [tasks, activeProjectId]);

  // ============================================
  // RENDER
  // ============================================

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        currentView={currentView}
        activeProjectId={currentView === 'project' ? activeProjectId : ''}
        projects={projects}
        currentUser={currentUser}
        onSelectProject={(id) => { setActiveProjectId(id); setCurrentView('project'); }}
        onDeleteProject={deleteProject}
        onAddProject={() => setShowProjectModal(true)}
        onGoToDashboard={() => setCurrentView('dashboard')}
        onGoToMyTasks={() => setCurrentView('my-tasks')}
        onGoToCalendar={() => setCurrentView('calendar')}
        onGoToUserManagement={() => setCurrentView('user-management')}
        onGoToEmailLogs={() => setCurrentView('email-logs')}
      />

      <main className="flex-1 ml-[280px] flex flex-col h-screen overflow-hidden bg-slate-50/30">
        <Header
          currentUser={currentUser}
          notifications={notifications}
          onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          onMarkAllRead={() => setNotifications([])}
          onLogout={handleLogout}
        />

        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
          <Suspense fallback={<ViewLoader />}>
            {currentView === 'dashboard' && (
              <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
                      Dashboard <span className="text-indigo-600">.</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-[15px]">Aperçu stratégique de votre performance.</p>
                  </div>
                  <button onClick={() => setShowTaskModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nouvelle Tâche
                  </button>
                </header>
                <Dashboard
                  tasks={tasks}
                  projects={projects}
                  onSelectTask={setSelectedTask}
                  onSelectProject={(id) => { setActiveProjectId(id); setCurrentView('project'); }}
                  onFilterClick={(cat) => { setDashboardFilter(cat); setCurrentView('filtered-list'); }}
                />
              </div>
            )}

            {currentView === 'project' && activeProject && (
              <div className="h-full flex flex-col max-w-7xl mx-auto">
                <header className="mb-10 flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100" style={{ backgroundColor: activeProject.color }}>{activeProject.name.charAt(0)}</div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight">{activeProject.name}</h1>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Projet ID: {activeProject.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowTaskModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tâche
                  </button>
                </header>
                <div className="flex space-x-8 overflow-x-auto pb-10 flex-1 custom-scrollbar">
                  {Object.values(Status).map((status) => (
                    <div key={status} className="w-[320px] flex-shrink-0 flex flex-col">
                      <div className="flex items-center justify-between px-2 mb-6">
                        <h3 className="font-black text-[11px] text-slate-400 uppercase tracking-[0.25em]">
                          {STATUS_LABELS[status]}
                        </h3>
                        <span className="bg-white border border-slate-200 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          {filteredTasksForProject.filter(t => t.status === status).length}
                        </span>
                      </div>
                      <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredTasksForProject.filter(t => t.status === status).map(task => <TaskCard key={task.id} task={task} onClick={setSelectedTask} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'user-management' && (
              <UserManagement
                currentUser={currentUser}
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
            {currentView === 'email-logs' && <EmailLogs logs={emailLogs} onBack={() => setCurrentView('dashboard')} />}
            {currentView === 'my-tasks' && <MyTasks currentUser={currentUser} tasks={tasks} projects={projects} onSelectTask={setSelectedTask} onUpdateTask={updateTask} />}
            {currentView === 'calendar' && <CalendarView tasks={tasks} projects={projects} onSelectTask={setSelectedTask} />}
            {currentView === 'filtered-list' && <FilteredListView category={dashboardFilter} tasks={tasks} projects={projects} onBack={() => setCurrentView('dashboard')} onSelectTask={setSelectedTask} />}
          </Suspense>
        </div>
      </main>

      {/* Modals */}
      {showProjectModal && (
        <ProjectCreateModal onClose={() => setShowProjectModal(false)} onSubmit={addProject} />
      )}

      {showTaskModal && (
        <TaskCreateModal
          projects={projects}
          users={users}
          currentUser={currentUser}
          initialProjectId={currentView === 'project' ? activeProjectId : projects[0]?.id}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          currentUser={currentUser}
          users={users}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
};

// ============================================
// TASK CREATE MODAL
// ============================================
const TaskCreateModal = ({ projects, users, currentUser, initialProjectId, onClose, onSubmit }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [subtasks, setSubtasks] = useState<Partial<SubTask>[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: Math.random().toString(36).substr(2, 9), title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const assignee = users.find((u: User) => u.id === assigneeId);
    onSubmit({
      title,
      description,
      projectId,
      priority,
      assignee,
      dueDate,
      subtasks: subtasks as SubTask[]
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Nouvelle Tâche</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Conception de workflow</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Titre de l'action</label>
              <input
                autoFocus
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Rédaction du cahier des charges"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[15px] font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description détaillée</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez les objectifs et contraintes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Workspace</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-[13px] font-bold appearance-none outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {projects.map((p: Project) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Responsable</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-[13px] font-bold appearance-none outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {users.map((u: User) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Criticité</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-[13px] font-bold appearance-none outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {Object.values(Priority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <ListChecks className="w-5 h-5 text-indigo-500" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Étapes de réalisation ({subtasks.length})</h4>
            </div>

            <div className="space-y-3 mb-6">
              {subtasks.map((st: any) => (
                <div key={st.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group animate-in slide-in-from-left-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                    <span className="text-sm font-bold text-slate-700">{st.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubtask(st.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                placeholder="Nouvelle sous-tâche..."
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="px-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95"
              >
                Ajouter
              </button>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-400 font-black text-[11px] rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[11px]"
          >
            <Check className="w-5 h-5" /> Confirmer la création
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROJECT CREATE MODAL
// ============================================
const ProjectCreateModal = ({ onClose, onSubmit }: any) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Nouveau Projet</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Espace de travail</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nom du Workspace</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Design Sprint 2024"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Identité visuelle</label>
            <div className="flex gap-3">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${color === c ? 'border-slate-900 scale-125' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => { if (name.trim()) { onSubmit(name, color); onClose(); } }}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            <Check className="w-5 h-5" /> Créer le projet
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
