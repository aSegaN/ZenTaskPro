/**
 * WORKFLOW SERVICE - Gestion automatique du cycle de vie des tâches
 * 
 * Règles métier :
 * ===============
 * 1. Création → TODO (À faire)
 * 2. 1ère sous-tâche terminée → IN_PROGRESS (En cours)
 * 3. Toutes sous-tâches terminées → REVIEW (En révision)
 * 4. REVIEW + action utilisateur → DONE (Terminé)
 * 5. Ajout sous-tâche en REVIEW → IN_PROGRESS
 * 6. DONE/CANCELLED → Verrouillé (non modifiable)
 */

// ============================================
// TYPES
// ============================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

export interface SubtaskData {
    id?: string;
    title: string;
    completed: boolean;
    dueDate?: string | null;
    assigneeId?: string | null;
}

export interface WorkflowContext {
    currentStatus: TaskStatus;
    requestedStatus?: TaskStatus;
    existingSubtasks: SubtaskData[];
    incomingSubtasks?: SubtaskData[];
    isNewTask?: boolean;
}

export interface WorkflowResult {
    allowed: boolean;
    newStatus: TaskStatus;
    message?: string;
    error?: string;
}

// ============================================
// CONSTANTES
// ============================================

// Statuts verrouillés (non modifiables)
const LOCKED_STATUSES: TaskStatus[] = ['DONE', 'CANCELLED'];

// Transitions manuelles autorisées
const ALLOWED_MANUAL_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    'TODO': ['IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['TODO', 'REVIEW', 'CANCELLED'],
    'REVIEW': ['IN_PROGRESS', 'DONE', 'CANCELLED'],
    'DONE': [],
    'CANCELLED': [],
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifie si une tâche est verrouillée
 */
export const isTaskLocked = (status: TaskStatus): boolean => {
    return LOCKED_STATUSES.includes(status);
};

/**
 * Calcule les statistiques des sous-tâches
 */
export const getSubtaskStats = (subtasks: SubtaskData[]): {
    total: number;
    completed: number;
    pending: number;
    allCompleted: boolean;
    hasSubtasks: boolean;
    hasCompletedSubtasks: boolean;
} => {
    const total = subtasks.length;
    const completed = subtasks.filter(st => st.completed).length;
    const pending = total - completed;
    
    return {
        total,
        completed,
        pending,
        allCompleted: total > 0 && completed === total,
        hasSubtasks: total > 0,
        hasCompletedSubtasks: completed > 0,
    };
};

/**
 * Calcule le statut automatique basé sur les sous-tâches
 */
export const calculateAutoStatus = (
    currentStatus: TaskStatus,
    subtasks: SubtaskData[]
): TaskStatus => {
    // Ne pas modifier les statuts verrouillés
    if (isTaskLocked(currentStatus)) {
        return currentStatus;
    }
    
    const stats = getSubtaskStats(subtasks);
    
    // Pas de sous-tâches → garder le statut actuel (TODO par défaut)
    if (!stats.hasSubtasks) {
        return currentStatus;
    }
    
    // Toutes les sous-tâches terminées → REVIEW
    if (stats.allCompleted) {
        return 'REVIEW';
    }
    
    // Au moins une sous-tâche terminée → IN_PROGRESS
    if (stats.hasCompletedSubtasks) {
        return 'IN_PROGRESS';
    }
    
    // Aucune sous-tâche terminée mais des sous-tâches existent
    // Si on était en REVIEW ou IN_PROGRESS, revenir à IN_PROGRESS
    if (currentStatus === 'REVIEW' || currentStatus === 'IN_PROGRESS') {
        return 'IN_PROGRESS';
    }
    
    // Sinon garder TODO
    return 'TODO';
};

/**
 * Vérifie si une transition manuelle est autorisée
 */
export const isManualTransitionAllowed = (
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    subtasks: SubtaskData[]
): { allowed: boolean; reason?: string } => {
    // Même statut = toujours OK
    if (fromStatus === toStatus) {
        return { allowed: true };
    }
    
    // Depuis un statut verrouillé = jamais
    if (isTaskLocked(fromStatus)) {
        return { 
            allowed: false, 
            reason: `Une tâche ${fromStatus === 'DONE' ? 'terminée' : 'annulée'} ne peut plus être modifiée` 
        };
    }
    
    // Vérifier les transitions autorisées
    const allowedTargets = ALLOWED_MANUAL_TRANSITIONS[fromStatus] || [];
    if (!allowedTargets.includes(toStatus)) {
        return { 
            allowed: false, 
            reason: `Transition de ${fromStatus} vers ${toStatus} non autorisée` 
        };
    }
    
    // Règle spéciale : Vers DONE uniquement si toutes les sous-tâches sont terminées
    if (toStatus === 'DONE') {
        const stats = getSubtaskStats(subtasks);
        if (stats.hasSubtasks && !stats.allCompleted) {
            return { 
                allowed: false, 
                reason: `Impossible de terminer : ${stats.pending} sous-tâche(s) en attente` 
            };
        }
    }
    
    return { allowed: true };
};

// ============================================
// FONCTION PRINCIPALE DU WORKFLOW
// ============================================

/**
 * Traite le workflow et détermine le nouveau statut
 */
export const processWorkflow = (context: WorkflowContext): WorkflowResult => {
    const { 
        currentStatus, 
        requestedStatus, 
        existingSubtasks, 
        incomingSubtasks,
        isNewTask 
    } = context;
    
    // Nouvelle tâche → toujours TODO
    if (isNewTask) {
        return {
            allowed: true,
            newStatus: 'TODO',
            message: 'Nouvelle tâche créée avec statut TODO'
        };
    }
    
    // Vérifier si la tâche est verrouillée
    if (isTaskLocked(currentStatus)) {
        return {
            allowed: false,
            newStatus: currentStatus,
            error: `Cette tâche est ${currentStatus === 'DONE' ? 'terminée' : 'annulée'} et ne peut plus être modifiée`
        };
    }
    
    // Déterminer les sous-tâches à utiliser pour le calcul
    const subtasksForCalculation = incomingSubtasks ?? existingSubtasks;
    
    // Détection d'ajout de sous-tâches en REVIEW
    if (currentStatus === 'REVIEW' && incomingSubtasks) {
        const existingIds = new Set(existingSubtasks.map(st => st.id).filter(Boolean));
        const hasNewSubtasks = incomingSubtasks.some(st => !st.id || !existingIds.has(st.id));
        
        if (hasNewSubtasks) {
            // Ajout d'une sous-tâche en REVIEW → repasser à IN_PROGRESS
            return {
                allowed: true,
                newStatus: 'IN_PROGRESS',
                message: 'Nouvelle sous-tâche ajoutée, tâche repassée en cours'
            };
        }
    }
    
    // Si l'utilisateur demande un changement de statut explicite
    if (requestedStatus && requestedStatus !== currentStatus) {
        const transitionCheck = isManualTransitionAllowed(
            currentStatus, 
            requestedStatus, 
            subtasksForCalculation
        );
        
        if (!transitionCheck.allowed) {
            return {
                allowed: false,
                newStatus: currentStatus,
                error: transitionCheck.reason
            };
        }
        
        // Transition vers DONE ou CANCELLED = pas de recalcul auto
        if (requestedStatus === 'DONE' || requestedStatus === 'CANCELLED') {
            return {
                allowed: true,
                newStatus: requestedStatus,
                message: requestedStatus === 'DONE' ? 'Tâche marquée comme terminée' : 'Tâche annulée'
            };
        }
        
        // Autre transition manuelle acceptée
        return {
            allowed: true,
            newStatus: requestedStatus,
            message: `Statut changé vers ${requestedStatus}`
        };
    }
    
    // Pas de changement de statut demandé → calcul automatique basé sur les sous-tâches
    const autoStatus = calculateAutoStatus(currentStatus, subtasksForCalculation);
    
    if (autoStatus !== currentStatus) {
        return {
            allowed: true,
            newStatus: autoStatus,
            message: `Statut mis à jour automatiquement vers ${autoStatus}`
        };
    }
    
    // Aucun changement nécessaire
    return {
        allowed: true,
        newStatus: currentStatus
    };
};

// ============================================
// HELPERS POUR LES ROUTES
// ============================================

/**
 * Vérifie si une mise à jour est autorisée (pour middleware)
 */
export const canModifyTask = (status: TaskStatus): { allowed: boolean; error?: string } => {
    if (isTaskLocked(status)) {
        return {
            allowed: false,
            error: `Cette tâche est ${status === 'DONE' ? 'terminée' : 'annulée'} et ne peut plus être modifiée`
        };
    }
    return { allowed: true };
};

/**
 * Génère un message de progression
 */
export const getProgressMessage = (subtasks: SubtaskData[]): string => {
    const stats = getSubtaskStats(subtasks);
    
    if (!stats.hasSubtasks) {
        return 'Aucune sous-tâche';
    }
    
    if (stats.allCompleted) {
        return `Toutes les sous-tâches terminées (${stats.total}/${stats.total})`;
    }
    
    return `${stats.completed}/${stats.total} sous-tâches terminées`;
};

/**
 * Obtenir les transitions possibles depuis un statut
 */
export const getAvailableTransitions = (
    currentStatus: TaskStatus,
    subtasks: SubtaskData[]
): { status: TaskStatus; label: string; allowed: boolean; reason?: string }[] => {
    const allStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
    
    return allStatuses
        .filter(s => s !== currentStatus)
        .map(status => {
            const check = isManualTransitionAllowed(currentStatus, status, subtasks);
            
            let label = '';
            switch (status) {
                case 'TODO': label = 'À faire'; break;
                case 'IN_PROGRESS': label = 'En cours'; break;
                case 'REVIEW': label = 'En révision'; break;
                case 'DONE': label = 'Terminée'; break;
                case 'CANCELLED': label = 'Annulée'; break;
            }
            
            return {
                status,
                label,
                allowed: check.allowed,
                reason: check.reason
            };
        });
};

export default {
    isTaskLocked,
    getSubtaskStats,
    calculateAutoStatus,
    isManualTransitionAllowed,
    processWorkflow,
    canModifyTask,
    getProgressMessage,
    getAvailableTransitions,
};
