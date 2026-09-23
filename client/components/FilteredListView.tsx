
import React, { useState, useMemo, useRef } from 'react';
import { Task, Status, Priority, Project } from '../types';
import { PRIORITY_COLORS, STATUS_LABELS } from '../constants';
import { ArrowLeft, Hash, Calendar as CalendarIcon, Ban } from 'lucide-react';

interface FilteredListViewProps {
  category: 'all' | 'urgent' | 'completed' | 'overdue' | 'cancelled';
  tasks: Task[];
  projects: Project[];
  onBack: () => void;
  onSelectTask: (task: Task) => void;
}

// Composant de ligne mémorisé pour la performance
const TaskRow = React.memo(({ task, project, onSelectTask }: { task: Task, project?: Project, onSelectTask: (t: Task) => void }) => {
  const isCancelled = task.status === Status.CANCELLED;
  return (
    <tr 
      onClick={() => onSelectTask(task)}
      className={`hover:bg-indigo-50/20 cursor-pointer transition-colors group h-[64px] ${isCancelled ? 'bg-surface2 opacity-75' : ''}`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isCancelled && <Ban className="w-3.5 h-3.5 text-red-400" />}
          <span className={`font-semibold truncate transition-colors ${isCancelled ? 'text-inkmuted line-through' : 'text-ink group-hover:text-brand'}`}>
            {task.title}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Hash className="w-3.5 h-3.5" style={{ color: project?.color }} />
          <span className="text-sm font-medium text-inksoft truncate">{project?.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider whitespace-nowrap ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2 text-sm font-medium text-inksoft">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span className={new Date(task.dueDate) < new Date() && task.status !== Status.DONE && !isCancelled ? 'text-red-500 dark:text-red-400 font-bold' : ''}>
            {task.dueDate}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`text-xs font-bold px-2 py-1 rounded-lg inline-block min-w-[80px] text-center ${
          task.status === Status.DONE ? 'bg-green-100 text-green-700 dark:text-emerald-300' : 
          task.status === Status.CANCELLED ? 'bg-red-100 text-red-700 dark:text-red-300' :
          'bg-surface2 text-inksoft'
        }`}>
          {STATUS_LABELS[task.status]}
        </span>
      </td>
    </tr>
  );
});

const FilteredListView: React.FC<FilteredListViewProps> = ({ category, tasks, projects, onBack, onSelectTask }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 64; // Hauteur fixe pour la virtualisation
  const visibleRows = 12; // Nombre de lignes visibles estimé

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const isOverdue = new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)) && t.status !== Status.DONE && t.status !== Status.CANCELLED;
      if (category === 'urgent') return (t.priority === Priority.URGENT || t.priority === Priority.HIGH) && t.status !== Status.DONE && t.status !== Status.CANCELLED;
      if (category === 'completed') return t.status === Status.DONE;
      if (category === 'overdue') return isOverdue;
      if (category === 'cancelled') return t.status === Status.CANCELLED;
      return true;
    });
  }, [category, tasks]);

  // Calcul des indices pour la virtualisation
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endIndex = Math.min(filteredTasks.length, startIndex + visibleRows + 4);
  
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = Math.max(0, (filteredTasks.length - endIndex) * rowHeight);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const categoryTitles = {
    all: 'Toutes les tâches',
    urgent: 'Priorités Critiques',
    completed: 'Tâches Terminées',
    overdue: 'Tâches en Retard',
    cancelled: 'Tâches Annulées'
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500 h-full flex flex-col">
      <div className="mb-8 flex items-center space-x-4 flex-shrink-0">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-surface border border-transparent hover:border-line rounded-xl transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-inksoft" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">{categoryTitles[category]}</h1>
          <p className="text-inksoft font-medium">{filteredTasks.length} tâches trouvées</p>
        </div>
      </div>

      <div 
        ref={containerRef}
        onScroll={onScroll}
        className="bg-surface border border-line rounded-2xl shadow-sm overflow-y-auto flex-1 relative"
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        <table className="w-full text-left table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface2 border-b border-linesoft">
              <th className="w-2/5 px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Tâche</th>
              <th className="w-1/5 px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Projet</th>
              <th className="w-1/6 px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Priorité</th>
              <th className="w-1/6 px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Échéance</th>
              <th className="w-1/6 px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-inkmuted italic">Aucune tâche ne correspond à ce filtre.</td>
              </tr>
            ) : (
              <>
                <tr style={{ height: `${paddingTop}px` }}><td colSpan={5}></td></tr>
                {filteredTasks.slice(startIndex, endIndex).map((task) => (
                  <TaskRow 
                    key={task.id} 
                    task={task} 
                    project={projects.find(p => p.id === task.projectId)} 
                    onSelectTask={onSelectTask} 
                  />
                ))}
                <tr style={{ height: `${paddingBottom}px` }}><td colSpan={5}></td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilteredListView;
