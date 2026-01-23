
import React from 'react';
import { Task, Status, Project, User } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { CheckCircle2, Circle, Calendar as CalendarIcon, Hash } from 'lucide-react';

interface MyTasksProps {
  currentUser: User;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

const MyTasks: React.FC<MyTasksProps> = ({ currentUser, tasks, projects, onSelectTask, onUpdateTask }) => {
  const myTasks = tasks.filter(t => t.assignee.id === currentUser.id);
  const today = new Date().toISOString().split('T')[0];
  
  const sections = [
    { title: 'Urgent / Aujourd\'hui', tasks: myTasks.filter(t => t.dueDate === today && t.status !== Status.DONE) },
    { title: 'À venir', tasks: myTasks.filter(t => t.dueDate > today && t.status !== Status.DONE) },
    { title: 'Terminé', tasks: myTasks.filter(t => t.status === Status.DONE) },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              {section.title}
            </h3>
            <span className="text-[10px] font-bold text-gray-300">{section.tasks.length}</span>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {section.tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">Aucune tâche ici. Profitez-en pour souffler !</div>
            ) : (
              section.tasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div 
                    key={task.id}
                    className="group flex items-center p-4 hover:bg-indigo-50/30 transition-all cursor-pointer"
                    onClick={() => onSelectTask(task)}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTask({ ...task, status: task.status === Status.DONE ? Status.TODO : Status.DONE });
                      }}
                      className={`mr-4 transition-all transform hover:scale-110 ${task.status === Status.DONE ? 'text-green-500' : 'text-gray-200 hover:text-indigo-400'}`}
                    >
                      {task.status === Status.DONE ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate ${task.status === Status.DONE ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                          <Hash className="w-2.5 h-2.5" style={{ color: project?.color }} />
                          <span>{project?.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyTasks;
