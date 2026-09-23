import React from 'react';
import { 
    Lock, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    PlayCircle, 
    Eye, 
    XCircle,
    ChevronRight,
    Info
} from 'lucide-react';
import { Task, Status } from '../types';
import { useTaskWorkflow, STATUS_LABELS, STATUS_COLORS } from '../hooks/useTaskWorkflow';

// ============================================
// TYPES
// ============================================

interface WorkflowIndicatorProps {
    task: Task;
    onStatusChange?: (newStatus: Status) => void;
    showTransitions?: boolean;
    compact?: boolean;
}

// ============================================
// HELPERS
// ============================================

const StatusIcon: React.FC<{ status: Status; className?: string }> = ({ status, className = 'w-4 h-4' }) => {
    switch (status) {
        case Status.TODO:
            return <Clock className={className} />;
        case Status.IN_PROGRESS:
            return <PlayCircle className={className} />;
        case Status.REVIEW:
            return <Eye className={className} />;
        case Status.DONE:
            return <CheckCircle2 className={className} />;
        case Status.CANCELLED:
            return <XCircle className={className} />;
        default:
            return <Clock className={className} />;
    }
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({
    task,
    onStatusChange,
    showTransitions = true,
    compact = false
}) => {
    const workflow = useTaskWorkflow(task);
    const colors = workflow.getStatusColor(task.status);

    // Version compacte (pour les cards)
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                    <StatusIcon status={task.status} className="w-3.5 h-3.5" />
                    <span>{STATUS_LABELS[task.status]}</span>
                </div>
                {workflow.isLocked && (
                    <Lock className="w-3.5 h-3.5 text-inkmuted" />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Statut actuel + Lock indicator */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${colors.bg} ${colors.text} border ${colors.border}`}>
                        <StatusIcon status={task.status} className="w-5 h-5" />
                        <span className="font-semibold">{STATUS_LABELS[task.status]}</span>
                    </div>
                    
                    {workflow.isLocked && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2 text-inksoft rounded-lg text-sm">
                            <Lock className="w-4 h-4" />
                            <span>Verrouillée</span>
                        </div>
                    )}
                </div>

                {/* Progression des sous-tâches */}
                {workflow.subtaskStats.total > 0 && (
                    <div className="text-right">
                        <div className="text-sm font-medium text-inksoft">
                            {workflow.subtaskStats.completed}/{workflow.subtaskStats.total} sous-tâches
                        </div>
                        <div className="w-32 h-2 bg-surface2 rounded-full mt-1 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                    workflow.subtaskStats.allCompleted 
                                        ? 'bg-green-500' 
                                        : workflow.subtaskStats.completed > 0 
                                            ? 'bg-blue-500' 
                                            : 'bg-line'
                                }`}
                                style={{ width: `${workflow.subtaskStats.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Message de workflow */}
            {workflow.lockReason && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 rounded-xl text-amber-800 dark:text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{workflow.lockReason}</span>
                </div>
            )}

            {/* Transitions disponibles */}
            {showTransitions && !workflow.isLocked && onStatusChange && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-inksoft uppercase tracking-wide">
                        Changer le statut
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {workflow.availableStatuses
                            .filter(s => s.value !== task.status)
                            .map(statusOption => {
                                const statusColors = STATUS_COLORS[statusOption.value];
                                
                                return (
                                    <button
                                        key={statusOption.value}
                                        onClick={() => statusOption.allowed && onStatusChange(statusOption.value)}
                                        disabled={!statusOption.allowed}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                                            transition-all duration-200
                                            ${statusOption.allowed 
                                                ? `${statusColors.bg} ${statusColors.text} hover:opacity-80 cursor-pointer border ${statusColors.border}`
                                                : 'bg-surface2 text-inkmuted cursor-not-allowed'
                                            }
                                        `}
                                        title={statusOption.reason || undefined}
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                        <StatusIcon status={statusOption.value} className="w-4 h-4" />
                                        <span>{statusOption.label}</span>
                                        {!statusOption.allowed && statusOption.reason && (
                                            <Info className="w-3.5 h-3.5 ml-1" />
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                    
                    {/* Aide contextuelle */}
                    {task.status === Status.REVIEW && (
                        <p className="text-xs text-inksoft mt-2 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Toutes les sous-tâches sont terminées. Vous pouvez marquer cette tâche comme terminée.
                        </p>
                    )}
                    
                    {task.status !== Status.REVIEW && workflow.subtaskStats.total > 0 && !workflow.subtaskStats.allCompleted && (
                        <p className="text-xs text-inksoft mt-2 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Terminez toutes les sous-tâches pour passer en révision.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================
// COMPOSANT BADGE SIMPLE
// ============================================

export const StatusBadge: React.FC<{ status: Status; size?: 'sm' | 'md' | 'lg' }> = ({ 
    status, 
    size = 'md' 
}) => {
    const colors = STATUS_COLORS[status];
    
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5',
        lg: 'px-3 py-1.5 text-base gap-2'
    };
    
    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4'
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]}`}>
            <StatusIcon status={status} className={iconSizes[size]} />
            {STATUS_LABELS[status]}
        </span>
    );
};

// ============================================
// COMPOSANT WORKFLOW MINI (pour sidebar/liste)
// ============================================

export const WorkflowMini: React.FC<{ task: Task }> = ({ task }) => {
    const workflow = useTaskWorkflow(task);
    
    return (
        <div className="flex items-center gap-2">
            <StatusBadge status={task.status} size="sm" />
            {workflow.subtaskStats.total > 0 && (
                <span className="text-xs text-inksoft">
                    {workflow.subtaskStats.completed}/{workflow.subtaskStats.total}
                </span>
            )}
            {workflow.isLocked && (
                <Lock className="w-3 h-3 text-inkmuted" />
            )}
        </div>
    );
};

export default WorkflowIndicator;
