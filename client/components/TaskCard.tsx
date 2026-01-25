
import React from 'react';
import { Task, Priority, Status } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { Calendar, CheckSquare, MessageSquare, MoreHorizontal, Ban, Paperclip, AlertCircle } from 'lucide-react';

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
      className={`bg-white p-6 rounded-[2rem] border border-slate-200/60 premium-shadow premium-card transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 ${isCancelled ? 'opacity-60' : ''} ${isNew ? 'border-dashed border-indigo-300 bg-indigo-50/20' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
          {isCancelled && (
            <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
              Annulé
            </span>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className={`font-extrabold text-[15px] mb-2 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors ${isCancelled ? 'text-slate-400 line-through' : isNew ? 'text-indigo-400 italic' : 'text-slate-900'}`}>
        {isNew ? 'Nouvelle tâche sans titre...' : task.title}
      </h4>
      
      {!isNew && task.description && (
        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-5 leading-relaxed">{task.description}</p>
      )}

      {(totalSubtasks > 0 || isNew) && (
        <div className="flex items-center space-x-4 mb-6">
          {totalSubtasks > 0 && (
            <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black tracking-tight">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {isNew && (
            <div className="flex items-center space-x-1.5 text-indigo-500 bg-white px-2 py-1 rounded-lg border border-indigo-100 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">À définir</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors ${
          new Date(task.dueDate) < new Date() && !isCancelled && task.status !== Status.DONE
          ? 'bg-rose-50 text-rose-600 border-rose-100'
          : 'bg-slate-50 text-slate-500 border-slate-100'
        }`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>{task.dueDate}</span>
        </div>
        <div className="relative">
          <img 
            src={task.assignee.avatar} 
            className="w-7 h-7 rounded-xl object-cover ring-2 ring-white shadow-sm" 
            alt={task.assignee.name} 
          />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
