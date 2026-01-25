
import React, { useState } from 'react';
import { Task, Project, Status, Priority } from '../types';
import { analyzeWorkload } from '../services/geminiService';
import { PRIORITY_COLORS } from '../constants';
// Added Loader2 to the imports
import { CheckCircle2, Clock, Briefcase, Sparkles, TrendingUp, Calendar as CalendarIcon, Ban, Zap, ArrowRight, MousePointer2, Loader2 } from 'lucide-react';

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
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Workload" 
          value={stats.total} 
          icon={<Briefcase className="w-5 h-5" />} 
          color="bg-slate-900 text-white" 
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white rounded-[2.5rem] premium-card p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Focus Immédiat
              </h3>
              <button onClick={() => onFilterClick('urgent')} className="text-[11px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 hover:gap-3 transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {highPriorityTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <p className="font-bold">Excellent travail, aucune urgence !</p>
                </div>
              ) : (
                highPriorityTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onSelectTask(task)}
                    className="flex items-center p-6 rounded-3xl border border-slate-50 hover:bg-slate-50/50 hover:border-slate-200 cursor-pointer transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                        <img src={task.assignee.avatar} className="w-10 h-10 rounded-xl" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-[15px] mb-1 line-clamp-1">{task.title}</p>
                      <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-3 h-3" /> {task.dueDate}</span>
                        <span className={`flex items-center gap-1.5 ${PRIORITY_COLORS[task.priority].split(' ')[1]}`}><Zap className="w-3 h-3" /> {task.priority}</span>
                      </div>
                    </div>
                    <div className="ml-4 p-3 rounded-2xl text-slate-300 group-hover:text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <MousePointer2 className="w-5 h-5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.slice(0, 2).map(project => (
                  <div key={project.id} onClick={() => onSelectProject(project.id)} className="bg-white p-8 rounded-[2.5rem] premium-card cursor-pointer group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg" style={{ backgroundColor: project.color }}>{project.name[0]}</div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                            <p className="text-xs font-black text-slate-900">Workspace Actif</p>
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-6 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%', backgroundColor: project.color }}></div>
                      </div>
                  </div>
              ))}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/5 shadow-2xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/30 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-4">Stratégie IA</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                Gemini analyse vos objectifs pour optimiser votre flux de production quotidien.
              </p>

              <button 
                onClick={getAiInsight}
                disabled={isAnalyzing}
                className="w-full py-5 rounded-[1.25rem] ai-shimmer text-white font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {/* Loader2 is used here */}
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Analyser Workspace</span>}
              </button>

              {aiInsight && (
                <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10 animate-in slide-in-from-bottom-4 duration-500">
                  <p className="text-sm italic text-slate-200 leading-relaxed font-medium">"{aiInsight}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] premium-card flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conseil Performance</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Priorisez le Deep Work ce matin.</p>
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
    className="bg-white p-8 rounded-[2.5rem] premium-card cursor-pointer group flex items-center justify-between"
  >
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase">{label}</span>
      </div>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-current/5 group-hover:scale-110 transition-transform ${color}`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
