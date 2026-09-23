/**
 * WORKFLOW HOOK - Gestion du cycle de vie des tâches côté client
 * 
 * Ce hook synchronise la logique de workflow avec le serveur
 * et fournit des helpers pour l'interface utilisateur.
 */

import { useMemo, useCallback } from 'react';
import { Task, SubTask, Status } from '../types';

// ============================================
// TYPES
// ============================================

export interface WorkflowInfo {
    isLocked: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canChangeStatus: boolean;
    availableStatuses: StatusOption[];
    subtaskStats: SubtaskStats;
    statusMessage: string;
    lockReason?: string;
}

export interface StatusOption {
    value: Status;
    label: string;
    allowed: boolean;
    reason?: string;
}

export interface SubtaskStats {
    total: number;
    completed: number;
    pending: number;
    percentage: number;
    allCompleted: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const STATUS_LABELS: Record<Status, string> = {
    [Status.TODO]: 'À faire',
    [Status.IN_PROGRESS]: 'En cours',
    [Status.REVIEW]: 'En révision',
    [Status.DONE]: 'Terminée',
    [Status.CANCELLED]: 'Annulée'
};

const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string }> = {
    [Status.TODO]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    [Status.IN_PROGRESS]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    [Status.REVIEW]: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    [Status.DONE]: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    [Status.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
};

const LOCKED_STATUSES: Status[] = [Status.DONE, Status.CANCELLED];

// Transitions manuelles autorisées (miroir du serveur)
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
    [Status.TODO]: [Status.IN_PROGRESS, Status.CANCELLED],
    [Status.IN_PROGRESS]: [Status.TODO, Status.REVIEW, Status.CANCELLED],
    [Status.REVIEW]: [Status.IN_PROGRESS, Status.DONE, Status.CANCELLED],
    [Status.DONE]: [],
    [Status.CANCELLED]: []
};

// ============================================
// HELPERS
// ============================================

/**
 * Calcule les statistiques des sous-tâches
 */
const calculateSubtaskStats = (subtasks: SubTask[] = []): SubtaskStats => {
    const total = subtasks.length;
    const completed = subtasks.filter(st => st.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
        total,
        completed,
        pending,
        percentage,
        allCompleted: total > 0 && completed === total
    };
};

/**
 * Vérifie si un statut est verrouillé
 */
const isStatusLocked = (status: Status): boolean => {
    return LOCKED_STATUSES.includes(status);
};

/**
 * Vérifie si une transition est autorisée
 */
const isTransitionAllowed = (
    fromStatus: Status,
    toStatus: Status,
    subtaskStats: SubtaskStats
): { allowed: boolean; reason?: string } => {
    // Depuis un statut verrouillé = jamais
    if (isStatusLocked(fromStatus)) {
        return { 
            allowed: false, 
            reason: `Tâche ${fromStatus === Status.DONE ? 'terminée' : 'annulée'}` 
        };
    }
    
    // Même statut = OK
    if (fromStatus === toStatus) {
        return { allowed: true };
    }
    
    // Vérifier les transitions autorisées
    const allowedTargets = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowedTargets.includes(toStatus)) {
        return { 
            allowed: false, 
            reason: 'Transition non autorisée' 
        };
    }
    
    // Règle spéciale : DONE uniquement si toutes les sous-tâches sont terminées
    if (toStatus === Status.DONE) {
        if (subtaskStats.total > 0 && !subtaskStats.allCompleted) {
            return { 
                allowed: false, 
                reason: `${subtaskStats.pending} sous-tâche(s) en attente` 
            };
        }
    }
    
    return { allowed: true };
};

/**
 * Calcule le statut qui sera appliqué automatiquement
 */
const predictAutoStatus = (currentStatus: Status, subtasks: SubTask[] = []): Status => {
    if (isStatusLocked(currentStatus)) {
        return currentStatus;
    }
    
    const stats = calculateSubtaskStats(subtasks);
    
    if (!stats.total) {
        return currentStatus;
    }
    
    if (stats.allCompleted) {
        return Status.REVIEW;
    }
    
    if (stats.completed > 0) {
        return Status.IN_PROGRESS;
    }
    
    if (currentStatus === Status.REVIEW || currentStatus === Status.IN_PROGRESS) {
        return Status.IN_PROGRESS;
    }
    
    return Status.TODO;
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export const useTaskWorkflow = (task: Task | null) => {
    const workflowInfo = useMemo((): WorkflowInfo => {
        if (!task) {
            return {
                isLocked: false,
                canEdit: true,
                canDelete: true,
                canChangeStatus: true,
                availableStatuses: [],
                subtaskStats: { total: 0, completed: 0, pending: 0, percentage: 0, allCompleted: false },
                statusMessage: ''
            };
        }

        const subtaskStats = calculateSubtaskStats(task.subtasks);
        const isLocked = isStatusLocked(task.status);
        
        // Générer les options de statut disponibles
        const availableStatuses: StatusOption[] = Object.values(Status).map(status => {
            const transition = isTransitionAllowed(task.status, status, subtaskStats);
            return {
                value: status,
                label: STATUS_LABELS[status],
                allowed: status === task.status || transition.allowed,
                reason: transition.reason
            };
        });

        // Message de statut
        let statusMessage = '';
        let lockReason: string | undefined;
        
        if (isLocked) {
            lockReason = task.status === Status.DONE 
                ? 'Cette tâche est terminée et ne peut plus être modifiée'
                : 'Cette tâche est annulée et ne peut plus être modifiée';
            statusMessage = lockReason;
        } else if (subtaskStats.total > 0) {
            statusMessage = `${subtaskStats.completed}/${subtaskStats.total} sous-tâches terminées (${subtaskStats.percentage}%)`;
        } else {
            statusMessage = 'Aucune sous-tâche';
        }

        return {
            isLocked,
            canEdit: !isLocked,
            canDelete: !isLocked,
            canChangeStatus: !isLocked,
            availableStatuses,
            subtaskStats,
            statusMessage,
            lockReason
        };
    }, [task]);

    /**
     * Prédit le nouveau statut après une action sur les sous-tâches
     */
    const predictStatusAfterSubtaskChange = useCallback((
        subtasks: SubTask[],
        subtaskId: string,
        newCompleted: boolean
    ): Status => {
        if (!task || isStatusLocked(task.status)) {
            return task?.status || Status.TODO;
        }

        // Simuler le changement
        const updatedSubtasks = subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: newCompleted } : st
        );

        return predictAutoStatus(task.status, updatedSubtasks);
    }, [task]);

    /**
     * Vérifie si une sous-tâche peut être modifiée
     */
    const canModifySubtask = useCallback((): boolean => {
        return !workflowInfo.isLocked;
    }, [workflowInfo.isLocked]);

    /**
     * Vérifie si on peut ajouter une sous-tâche
     */
    const canAddSubtask = useCallback((): boolean => {
        return !workflowInfo.isLocked;
    }, [workflowInfo.isLocked]);

    /**
     * Obtient la couleur du statut
     */
    const getStatusColor = useCallback((status: Status) => {
        return STATUS_COLORS[status] || STATUS_COLORS[Status.TODO];
    }, []);

    /**
     * Obtient le label du statut
     */
    const getStatusLabel = useCallback((status: Status) => {
        return STATUS_LABELS[status] || status;
    }, []);

    return {
        ...workflowInfo,
        predictStatusAfterSubtaskChange,
        canModifySubtask,
        canAddSubtask,
        getStatusColor,
        getStatusLabel,
        predictAutoStatus: (subtasks: SubTask[]) => task ? predictAutoStatus(task.status, subtasks) : Status.TODO
    };
};

// ============================================
// EXPORTS
// ============================================

export {
    STATUS_LABELS,
    STATUS_COLORS,
    isStatusLocked,
    calculateSubtaskStats,
    predictAutoStatus
};

export default useTaskWorkflow;
