
import React from 'react';
import { Task, Status } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { Calendar, CheckSquare, MoreHorizontal, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, onClick }) => {
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const isCancelled = task.status === Status.CANCELLED;
  const isNew = !task.title.trim();

  return (
    <div 
      onClick={() => onClick(task)}
      className={`bg-surface p-6 rounded-2xl border border-line premium-shadow premium-card transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 ${isCancelled ? 'opacity-60' : ''} ${isNew ? 'border-dashed border-indigo-300 bg-brandsoft' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
          {isCancelled && (
            <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-500/20 text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide">
              Annulé
            </span>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-surface2 rounded-xl text-inkmuted transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className={`font-extrabold text-[15px] mb-2 leading-tight tracking-tight group-hover:text-brand transition-colors ${isCancelled ? 'text-inkmuted line-through' : isNew ? 'text-indigo-400 italic' : 'text-ink'}`}>
        {isNew ? 'Nouvelle tâche sans titre...' : task.title}
      </h4>
      
      {!isNew && task.description && (
        <p className="text-xs text-inksoft font-medium line-clamp-2 mb-5 leading-relaxed">{task.description}</p>
      )}

      {(totalSubtasks > 0 || isNew) && (
        <div className="flex items-center space-x-4 mb-6">
          {totalSubtasks > 0 && (
            <div className="flex items-center space-x-1.5 text-inkmuted bg-surface2 px-2.5 py-1 rounded-lg border border-linesoft">
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-tight">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {isNew && (
            <div className="flex items-center space-x-1.5 text-brand bg-surface px-2 py-1 rounded-lg border border-indigo-100 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">À définir</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-linesoft">
        <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-colors ${
          new Date(task.dueDate) < new Date() && !isCancelled && task.status !== Status.DONE
          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-500/20'
          : 'bg-surface2 text-inksoft border-linesoft'
        }`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>{task.dueDate}</span>
        </div>
        <div className="relative">
          <img 
            src={task.assignee.avatar} 
            className="w-7 h-7 rounded-xl object-cover ring-2 ring-surface shadow-sm" 
            alt={task.assignee.name} 
          />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-surface rounded-full"></div>
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
