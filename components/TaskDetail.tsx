import React, { useState, useRef } from 'react';
import { Task, SubTask, Priority, Status, User, UserRole, Comment, Attachment } from '../types';
import { suggestSubtasks } from '../services/geminiService';
import { X, CheckCircle2, Circle, Sparkles, User as UserIcon, Plus, Trash2, Loader2, ChevronDown, Lock, Check, Paperclip, Send, MessageSquare, Tag, AlignLeft, Info, FileText, Image as ImageIcon, Download, ExternalLink, ListChecks, Trophy, AlertTriangle } from 'lucide-react';
import { PRIORITY_COLORS, MOCK_USERS, STATUS_LABELS, STATUS_COLORS } from '../constants';

interface TaskDetailProps {
  task: Task;
  currentUser: User;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
}

const AttachmentItem: React.FC<{ attachment: Attachment, onRemove?: () => void }> = ({ attachment, onRemove }) => {
  const isImage = attachment.type.startsWith('image/');
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl group hover:border-indigo-200 transition-all shadow-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
          {isImage ? <ImageIcon className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5" />}
        </div>
        <div className="overflow-hidden">
          <p className="text-[12px] font-bold text-slate-700 truncate">{attachment.name}</p>
          <p className="text-[10px] text-slate-400 font-medium">{attachment.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 transition-opacity">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-indigo-50 text-indigo-500 rounded-lg">
          <ExternalLink className="w-4 h-4" />
        </a>
        {onRemove && (
          <button onClick={onRemove} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const TaskDetail: React.FC<TaskDetailProps> = ({ task, currentUser, onClose, onUpdate, onDelete }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [subtaskConfirmDeleteId, setSubtaskConfirmDeleteId] = useState<string | null>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const subtaskFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubtaskIdForUpload, setActiveSubtaskIdForUpload] = useState<string | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isOwner = task.assignee.id === currentUser.id;
  const canEdit = isAdmin || isOwner;

  const totalSubtasks = task.subtasks.length;
  const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
  const progressPercentage = totalSubtasks > 0 ? Math.round((completedSubtasksCount / totalSubtasks) * 100) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'task' | 'comment' | 'subtask', subtaskId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: (file.size / 1024).toFixed(1) + ' KB',
      createdAt: new Date().toISOString(),
    };

    if (target === 'task') {
      onUpdate({ ...task, attachments: [...(task.attachments || []), newAttachment] });
    } else if (target === 'subtask' && subtaskId) {
      const newSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, attachments: [...(st.attachments || []), newAttachment] } : st
      );
      onUpdate({ ...task, subtasks: newSubtasks });
    } else if (target === 'comment') {
      const comment: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        text: `Pièce jointe : ${file.name}`,
        createdAt: new Date().toISOString(),
        attachments: [newAttachment]
      };
      onUpdate({ ...task, comments: [...(task.comments || []), comment] });
    }
    
    e.target.value = '';
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      text: newComment,
      createdAt: new Date().toISOString(),
    };
    onUpdate({ ...task, comments: [...(task.comments || []), comment] });
    setNewComment('');
  };

  const handleToggleSubtask = (id: string) => {
    if (!canEdit) return;
    const newSubtasks = task.subtasks.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: newSubtasks });
  };

  const removeSubtask = (id: string) => {
    if (!canEdit) return;
    onUpdate({ ...task, subtasks: task.subtasks.filter(st => st.id !== id) });
    setSubtaskConfirmDeleteId(null);
  };

  const removeAttachment = (id: string, target: 'task' | 'subtask', subtaskId?: string) => {
    if (target === 'task') {
      onUpdate({ ...task, attachments: task.attachments.filter(a => a.id !== id) });
    } else if (target === 'subtask' && subtaskId) {
      const newSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, attachments: st.attachments?.filter(a => a.id !== id) } : st
      );
      onUpdate({ ...task, subtasks: newSubtasks });
    }
  };

  const getAISuggestions = async () => {
    if (!canEdit || isSuggesting) return;
    setIsSuggesting(true);
    const suggestions = await suggestSubtasks(task.title, task.description);
    if (suggestions && Array.isArray(suggestions)) {
      const newSubtasks: SubTask[] = suggestions.map((s: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: s.title,
        completed: false,
        attachments: []
      }));
      onUpdate({ ...task, subtasks: [...task.subtasks, ...newSubtasks] });
    }
    setIsSuggesting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-end z-[60] animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl h-full shadow-[0_0_100px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        {/* Hidden File Inputs */}
        <input type="file" ref={taskFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'task')} />
        <input type="file" ref={commentFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'comment')} />
        <input type="file" ref={subtaskFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'subtask', activeSubtaskIdForUpload!)} />

        {/* Header */}
        <div className="h-20 px-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => canEdit && setShowStatusDropdown(!showStatusDropdown)}
                disabled={!canEdit}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl border transition-all font-extrabold text-[12px] uppercase tracking-widest shadow-sm ${STATUS_COLORS[task.status]} ${!canEdit ? 'opacity-80' : 'hover:scale-105 active:scale-95'}`}
              >
                {task.status === Status.DONE ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                <span>{STATUS_LABELS[task.status]}</span>
                {canEdit && <ChevronDown className="w-4 h-4 ml-1" />}
              </button>
              
              {showStatusDropdown && canEdit && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-[2rem] shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                  {Object.values(Status).map((s) => (
                    <button 
                      key={s}
                      onClick={() => { onUpdate({...task, status: s}); setShowStatusDropdown(false); }}
                      className={`w-full text-left px-6 py-2.5 text-[13px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-3 ${task.status === s ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[s].split(' ')[0]}`}></div>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button onClick={() => onDelete(task.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <div className="w-px h-8 bg-slate-100 mx-2"></div>
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
          {/* Title Area */}
          <section>
            <textarea 
              value={task.title}
              readOnly={!canEdit}
              rows={2}
              onChange={(e) => canEdit && onUpdate({ ...task, title: e.target.value })}
              className={`text-4xl font-black w-full focus:outline-none mb-4 border-none bg-transparent resize-none tracking-tighter ${task.status === Status.CANCELLED ? 'text-slate-300 line-through' : 'text-slate-900'}`}
            />
            
            <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200/50">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigné à</p>
                    <div className="flex items-center gap-2">
                      <img src={task.assignee.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                      <span className="text-[13px] font-extrabold text-slate-900">{task.assignee.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <span className="text-[13px] font-extrabold text-slate-900">{STATUS_LABELS[task.status]}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priorité</p>
                    <span className={`px-2 py-0.5 rounded-lg font-black uppercase text-[10px] tracking-widest border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Documents</p>
                    <span className="text-[13px] font-extrabold text-slate-900">{task.attachments?.length || 0} fichiers</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Attachments Section (Main Task) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Paperclip className="w-4 h-4" />
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Pièces Jointes</h5>
              </div>
              {canEdit && (
                <button 
                  onClick={() => taskFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              )}
            </div>
            {task.attachments && task.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {task.attachments.map(att => (
                  <AttachmentItem key={att.id} attachment={att} onRemove={canEdit ? () => removeAttachment(att.id, 'task') : undefined} />
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                <p className="text-[11px] text-slate-400 font-bold italic">Aucun document joint à cette tâche.</p>
              </div>
            )}
          </section>

          {/* Description Area */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <AlignLeft className="w-4 h-4" />
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Description</h5>
            </div>
            <textarea 
              value={task.description}
              readOnly={!canEdit}
              onChange={(e) => canEdit && onUpdate({ ...task, description: e.target.value })}
              placeholder="Ajouter une description..."
              className="w-full bg-slate-50/50 border-2 border-transparent focus:border-indigo-500/20 rounded-[2rem] p-6 text-[14px] font-medium leading-relaxed text-slate-600 focus:outline-none transition-all min-h-[120px]"
            />
          </section>

          {/* Subtasks Section - ENHANCED VISUALIZATION */}
          <section className="space-y-6">
            <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100/50 shadow-inner">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Workflow interne</h5>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wide mt-0.5">{totalSubtasks} étapes de réalisation identifiées</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Trophy className={`w-4 h-4 ${progressPercentage === 100 ? 'text-amber-500' : 'text-slate-300'}`} />
                        <span className="text-[16px] font-black text-indigo-600 leading-none">{progressPercentage}%</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{completedSubtasksCount} sur {totalSubtasks} finalisées</span>
                    </div>
                    {canEdit && (
                      <button 
                        onClick={getAISuggestions}
                        disabled={isSuggesting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 ai-glow shadow-xl shadow-slate-200"
                      >
                        {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-400" />}
                        IA Assist
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Advanced Progress Bar */}
                <div className="relative pt-2">
                  <div className="w-full bg-slate-200/50 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  {/* Milestones markers if many tasks */}
                  {totalSubtasks > 1 && Array.from({length: totalSubtasks - 1}).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-2 w-1 h-3 bg-white/40 z-10" 
                      style={{ left: `${((i + 1) / totalSubtasks) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 px-2">
              {task.subtasks.map((st, index) => (
                <div key={st.id} className="group/item space-y-2 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className={`flex items-center p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${st.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-indigo-100/50'}`}>
                    {/* Completion background pulse effect */}
                    {st.completed && <div className="absolute inset-0 bg-emerald-50/30"></div>}
                    
                    <button 
                      onClick={() => handleToggleSubtask(st.id)} 
                      disabled={!canEdit} 
                      className={`relative z-10 mr-5 w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 ${st.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-white border-2 border-slate-200 text-transparent hover:border-indigo-400 hover:bg-indigo-50/50 hover:scale-105 active:scale-95'}`}
                    >
                      {st.completed ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5 group-hover/item:text-indigo-400" />}
                    </button>
                    
                    <div className="flex-1 relative z-10">
                      <span className={`text-[15px] font-extrabold transition-all duration-500 block ${st.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {st.title}
                      </span>
                      {st.completed && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 block">Étape validée</span>}
                    </div>
                    
                    <div className="flex items-center gap-1 relative z-10">
                      {subtaskConfirmDeleteId === st.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                           <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mr-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Supprimer ?</span>
                           <button 
                            onClick={() => removeSubtask(st.id)}
                            className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                           >
                            Confirmer
                           </button>
                           <button 
                            onClick={() => setSubtaskConfirmDeleteId(null)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all"
                           >
                            Annuler
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 transition-all">
                          <button 
                            onClick={() => { setActiveSubtaskIdForUpload(st.id); subtaskFileInputRef.current?.click(); }}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                            title="Attacher un document"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button 
                              onClick={() => setSubtaskConfirmDeleteId(st.id)}
                              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                              title="Supprimer l'étape"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {st.attachments && st.attachments.length > 0 && (
                    <div className="pl-14 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                      {st.attachments.map(att => (
                        <AttachmentItem key={att.id} attachment={att} onRemove={() => removeAttachment(att.id, 'subtask', st.id)} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {canEdit && (
                <div className="relative mt-8 group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 group-focus-within:bg-indigo-600 group-focus-within:text-white group-focus-within:border-indigo-600 transition-all shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <input 
                    placeholder="Décomposer en une nouvelle étape de réalisation..."
                    className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-[2rem] py-6 pl-20 pr-8 focus:ring-[12px] focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner placeholder:text-slate-400"
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        const val = (e.target as HTMLInputElement).value;
                        if(val.trim()) {
                          const newSubtask: SubTask = { id: Math.random().toString(36).substr(2, 9), title: val, completed: false, attachments: [] };
                          onUpdate({ ...task, subtasks: [...task.subtasks, newSubtask] });
                          (e.target as HTMLInputElement).value = ''; 
                        }
                      } 
                    }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Conversation */}
          <section className="space-y-8 pt-12 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Conversation</h5>
            </div>

            <div className="space-y-8">
              {(task.comments || []).map(comment => {
                const user = MOCK_USERS.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} className="flex gap-4 group animate-in slide-in-from-left-2">
                    <img src={user?.avatar} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-lg flex-shrink-0" alt="" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-black text-slate-900">{user?.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(comment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[1.5rem] rounded-tl-none border border-slate-200/50 shadow-sm">
                        <p className="text-[14px] text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {comment.attachments.map(att => (
                              <AttachmentItem key={att.id} attachment={att} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-4 pt-8">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-2xl shadow-xl border-2 border-white object-cover" alt="" />
              <div className="flex-1 relative">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Écrire un message..."
                  className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 pr-16 text-[14px] font-medium focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all resize-none h-32 shadow-xl shadow-slate-200/30"
                />
                <div className="absolute bottom-5 right-5 flex items-center gap-2">
                   <button 
                    onClick={() => commentFileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                    title="Ajouter une pièce jointe"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 hover:scale-110 active:scale-90 disabled:opacity-20 disabled:scale-100 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="h-24 px-10 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Dernière modification le {new Date(task.createdAt).toLocaleDateString()}</p>
          <button onClick={onClose} className="px-10 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] rounded-2xl shadow-2xl shadow-slate-200 transition-all uppercase tracking-widest active:scale-95">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
