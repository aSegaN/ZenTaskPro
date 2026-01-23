
import React, { useState } from 'react';
import { Task, Priority, Project } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, projects, onSelectTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startOffset = (firstDayOfMonth(year, month) + 6) % 7; // Ajustement pour commencer par Lundi

  // Jours vides au début
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  // Jours du mois
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.dueDate === dateStr);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-xl font-black text-gray-900 capitalize">{monthName}</h2>
        <div className="flex items-center space-x-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all">
            Aujourd'hui
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map(d => (
          <div key={d} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r last:border-0 border-gray-100">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[140px]">
        {days.map((day, idx) => (
          <div 
            key={idx} 
            className={`border-r border-b border-gray-50 p-2 overflow-y-auto last:border-r-0 ${day === null ? 'bg-gray-50/30' : 'bg-white'}`}
          >
            {day && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${
                    day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
                    ? 'w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full'
                    : 'text-gray-400'
                  }`}>
                    {day}
                  </span>
                </div>
                <div className="space-y-1">
                  {getTasksForDay(day).map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <div 
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`px-2 py-1 rounded text-[9px] font-bold truncate cursor-pointer transition-all hover:brightness-95 border-l-2 shadow-sm ${
                          task.priority === Priority.URGENT ? 'bg-red-50 text-red-700 border-red-500' : 
                          task.priority === Priority.HIGH ? 'bg-orange-50 text-orange-700 border-orange-500' :
                          'bg-indigo-50 text-indigo-700 border-indigo-500'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
