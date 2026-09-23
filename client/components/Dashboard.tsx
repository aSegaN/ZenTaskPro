
import React, { useState } from 'react';
import { Task, Project, Status, Priority } from '../types';
import { analyzeWorkload } from '../services/geminiService';
import { PRIORITY_COLORS } from '../constants';
// Added Loader2 to the imports
import { CheckCircle2, Clock, Briefcase, Sparkles, TrendingUp, Calendar as CalendarIcon, Zap, ArrowRight, MousePointer2, Loader2 } from 'lucide-react';

export type FilterCategory = 'all' | 'urgent' | 'completed' | 'overdue' | 'cancelled';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onSelectProject: (projectId: string) => void;
  onFilterClick: (category: FilterCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, projects, onSelectTask, onSelectProject, onFilterClick }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === Status.DONE).length,
    urgent: tasks.filter(t => (t.priority === Priority.URGENT || t.priority === Priority.HIGH) && t.status !== Status.DONE && t.status !== Status.CANCELLED).length,
    overdue: tasks.filter(t => new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)) && t.status !== Status.DONE && t.status !== Status.CANCELLED).length,
  };

  const getAiInsight = async () => {
    setIsAnalyzing(true);
    const activeTasks = tasks.filter(t => t.status !== Status.CANCELLED && t.status !== Status.DONE);
    const insight = await analyzeWorkload(activeTasks);
    setAiInsight(insight);
    setIsAnalyzing(false);
  };

  const highPriorityTasks = tasks
    .filter(t => t.status !== Status.DONE && t.status !== Status.CANCELLED && (t.priority === Priority.URGENT || t.priority === Priority.HIGH))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Workload" 
          value={stats.total} 
          icon={<Briefcase className="w-5 h-5" />} 
          color="bg-accent text-white" 
          label="Tâches"
          onClick={() => onFilterClick('all')}
        />
        <StatCard 
          title="Priorités Critiques" 
          value={stats.urgent} 
          icon={<Zap className="w-5 h-5" />} 
          color="bg-amber-500 text-white" 
          label="Actives"
          onClick={() => onFilterClick('urgent')}
        />
        <StatCard 
          title="Productivité" 
          value={stats.completed} 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          color="bg-indigo-600 text-white" 
          label="Terminées"
          onClick={() => onFilterClick('completed')}
        />
        <StatCard 
          title="En Retard" 
          value={stats.overdue} 
          icon={<Clock className="w-5 h-5" />} 
          color="bg-rose-500 text-white" 
          label="Ajuster"
          onClick={() => onFilterClick('overdue')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface rounded-2xl premium-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-brand" />
                Focus Immédiat
              </h3>
              <button onClick={() => onFilterClick('urgent')} className="text-[11px] font-bold uppercase tracking-wide text-brand flex items-center gap-2 hover:gap-3 transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {highPriorityTasks.length === 0 ? (
                <div className="py-8 text-center text-inkmuted bg-surface2 rounded-xl border border-dashed border-line">
                    <p className="font-bold">Excellent travail, aucune urgence !</p>
                </div>
              ) : (
                highPriorityTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onSelectTask(task)}
                    className="flex items-center p-3.5 rounded-xl border border-linesoft hover:bg-surface2 hover:border-line cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface shadow-sm border border-linesoft flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                        <img src={task.assignee.avatar} className="w-7 h-7 rounded-lg" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm mb-0.5 line-clamp-1">{task.title}</p>
                      <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide text-inkmuted">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-3 h-3" /> {task.dueDate}</span>
                        <span className={`flex items-center gap-1.5 ${PRIORITY_COLORS[task.priority].split(' ')[1]}`}><Zap className="w-3 h-3" /> {task.priority}</span>
                      </div>
                    </div>
                    <div className="ml-3 p-2 rounded-xl text-inkmuted group-hover:text-brand group-hover:bg-surface2 transition-all">
                        <MousePointer2 className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 2).map(project => (
                  <div key={project.id} onClick={() => onSelectProject(project.id)} className="bg-surface p-5 rounded-2xl premium-card cursor-pointer group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm" style={{ backgroundColor: project.color }}>{project.name[0]}</div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-inkmuted uppercase tracking-wide leading-none mb-1">Status</p>
                            <p className="text-xs font-bold text-ink">Workspace Actif</p>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-ink mb-4 group-hover:text-brand transition-colors">{project.name}</h4>
                      <div className="w-full bg-surface2 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%', backgroundColor: project.color }}></div>
                      </div>
                  </div>
              ))}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-950 rounded-2xl p-6 text-white relative overflow-hidden group border border-white/5 shadow-xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/30 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center mb-5 border border-white/10">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-2">Stratégie IA</h3>
              <p className="text-inkmuted text-[13px] font-medium leading-relaxed mb-6">
                Gemini analyse vos objectifs pour optimiser votre flux de production quotidien.
              </p>

              <button 
                onClick={getAiInsight}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-xl ai-shimmer text-white font-semibold text-[12px] uppercase tracking-wide shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {/* Loader2 is used here */}
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Analyser Workspace</span>}
              </button>

              {aiInsight && (
                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-500">
                  <p className="text-sm italic text-slate-200 leading-relaxed font-medium">"{aiInsight}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl premium-card flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brandsoft flex items-center justify-center text-brand">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-inkmuted uppercase tracking-wide">Conseil Performance</p>
                    <p className="text-sm font-bold text-ink leading-tight">Priorisez le Deep Work ce matin.</p>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, label, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-surface p-5 rounded-2xl premium-card cursor-pointer group flex items-center justify-between"
  >
    <div>
      <p className="text-[10px] font-bold text-inkmuted uppercase tracking-wide mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-ink tracking-tight">{value}</span>
        <span className="text-[11px] font-bold text-inkmuted uppercase">{label}</span>
      </div>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${color}`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
