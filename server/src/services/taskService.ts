import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { formatTask, formatTasks, taskInclude } from '../utils/formatters';
import { deleteFileByUrl } from '../middlewares/uploadMiddleware';
import {
    processWorkflow,
    isTaskLocked,
    getSubtaskStats,
    TaskStatus,
    SubtaskData
} from './workflowService';

// ============================================
// TYPES
// ============================================

interface CreateTaskData {
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    projectId: string;
    assigneeId?: string;
    subtasks?: SubtaskData[];
}

interface UpdateTaskData {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    projectId?: string;
    assigneeId?: string | null;
    subtasks?: SubtaskData[];
}

// ============================================
// TASK SERVICE
// ============================================

class TaskService {
    /**
     * Récupérer toutes les tâches
     */
    async getAll() {
        const tasks = await prisma.task.findMany({
            include: taskInclude,
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`📝 GET /tasks - ${tasks.length} tâches`);
        return formatTasks(tasks);
    }

    /**
     * Récupérer une tâche par ID
     */
    async getById(id: string) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: taskInclude
        });

        if (!task) {
            throw new AppError('Tâche non trouvée', 404, 'TASK_NOT_FOUND');
        }

        return formatTask(task);
    }

    /**
     * Créer une tâche (statut forcé à TODO par le workflow)
     */
    async create(data: CreateTaskData, currentUserId: string) {
        const { title, description, priority, dueDate, projectId, assigneeId, subtasks } = data;
        const finalAssigneeId = assigneeId || currentUserId;

        // Vérifier que le projet existe
        const projectExists = await prisma.project.findUnique({ 
            where: { id: projectId } 
        });
        if (!projectExists) {
            throw new AppError('Projet non trouvé', 400, 'INVALID_PROJECT');
        }

        // Vérifier que l'assigné existe
        const assigneeExists = await prisma.user.findUnique({ 
            where: { id: finalAssigneeId } 
        });
        if (!assigneeExists) {
            throw new AppError('Utilisateur assigné non trouvé', 400, 'INVALID_ASSIGNEE');
        }

        // WORKFLOW: Nouvelle tâche → toujours TODO
        const task = await prisma.task.create({
            data: {
                title,
                description,
                status: 'TODO', // Forcé par le workflow
                priority: priority || 'MEDIUM',
                dueDate,
                projectId,
                assigneeId: finalAssigneeId,
                subtasks: {
                    create: subtasks?.map((st) => ({
                        title: st.title,
                        completed: st.completed || false,
                        dueDate: st.dueDate,
                        assigneeId: st.assigneeId || (st as any).assignee?.id || null
                    })) || []
                }
            },
            include: taskInclude
        });

        console.log(`✅ Tâche créée: ${task.title} (status: TODO)`);
        return formatTask(task);
    }

    /**
     * Mettre à jour une tâche avec gestion du workflow
     */
    async update(id: string, data: UpdateTaskData, currentUserId: string, currentUserRole: string) {
        const { title, description, status, priority, dueDate, assigneeId, projectId, subtasks } = data;

        // Récupérer la tâche existante avec ses subtasks
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { 
                subtasks: { include: { attachments: true } },
                attachments: true 
            }
        });

        if (!existingTask) {
            throw new AppError('Tâche non trouvée', 404, 'TASK_NOT_FOUND');
        }

        // WORKFLOW: Vérifier si la tâche est verrouillée (DONE ou CANCELLED)
        if (isTaskLocked(existingTask.status as TaskStatus)) {
            throw new AppError(
                `Cette tâche est ${existingTask.status === 'DONE' ? 'terminée' : 'annulée'} et ne peut plus être modifiée`,
                403,
                'TASK_LOCKED'
            );
        }

        // Vérifier les permissions
        const canEdit =
            currentUserRole === 'ADMIN' ||
            currentUserRole === 'MANAGER' ||
            existingTask.assigneeId === currentUserId;

        if (!canEdit) {
            throw new AppError('Vous n\'avez pas la permission de modifier cette tâche', 403, 'FORBIDDEN');
        }

        // Préparer les sous-tâches pour le calcul du workflow
        const existingSubtasksData: SubtaskData[] = existingTask.subtasks.map((st: any) => ({
            id: st.id,
            title: st.title,
            completed: st.completed,
            dueDate: st.dueDate,
            assigneeId: st.assigneeId
        }));

        const incomingSubtasksData: SubtaskData[] | undefined = subtasks?.map(st => ({
            id: st.id,
            title: st.title,
            completed: st.completed || false,
            dueDate: st.dueDate,
            assigneeId: st.assigneeId || (st as any).assignee?.id || null
        }));

        // WORKFLOW: Calculer le nouveau statut
        const workflowResult = processWorkflow({
            currentStatus: existingTask.status as TaskStatus,
            requestedStatus: status as TaskStatus | undefined,
            existingSubtasks: existingSubtasksData,
            incomingSubtasks: incomingSubtasksData
        });

        if (!workflowResult.allowed) {
            throw new AppError(workflowResult.error || 'Transition non autorisée', 400, 'WORKFLOW_ERROR');
        }

        // Gestion des sous-tâches
        if (subtasks !== undefined) {
            const existingSubtaskIds = existingTask.subtasks.map((st: any) => st.id);
            const incomingSubtaskIds = subtasks.filter((st) => st.id).map((st) => st.id!);
            
            // Subtasks à supprimer
            const subtasksToDelete = existingSubtaskIds.filter((id: string) => !incomingSubtaskIds.includes(id));
            
            // Supprimer les fichiers associés aux subtasks supprimées
            for (const subtaskId of subtasksToDelete) {
                const subtask = existingTask.subtasks.find((st: any) => st.id === subtaskId);
                if (subtask && subtask.attachments) {
                    for (const att of subtask.attachments) {
                        deleteFileByUrl(att.url);
                    }
                }
            }

            // Supprimer les subtasks en base
            if (subtasksToDelete.length > 0) {
                await prisma.attachment.deleteMany({
                    where: { subtaskId: { in: subtasksToDelete } }
                });
                await prisma.subTask.deleteMany({
                    where: { id: { in: subtasksToDelete } }
                });
            }

            // Mettre à jour ou créer les subtasks
            for (const st of subtasks) {
                const subtaskAssigneeId = st.assigneeId || (st as any).assignee?.id || null;
                
                if (st.id && existingSubtaskIds.includes(st.id)) {
                    // Mise à jour d'une subtask existante
                    await prisma.subTask.update({
                        where: { id: st.id },
                        data: {
                            title: st.title,
                            completed: st.completed || false,
                            dueDate: st.dueDate || null,
                            assigneeId: subtaskAssigneeId
                        }
                    });
                } else {
                    // Création d'une nouvelle subtask
                    await prisma.subTask.create({
                        data: {
                            title: st.title,
                            completed: st.completed || false,
                            dueDate: st.dueDate || null,
                            assigneeId: subtaskAssigneeId,
                            taskId: id
                        }
                    });
                }
            }
        }

        // Mettre à jour la tâche avec le statut calculé par le workflow
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title,
                description,
                status: workflowResult.newStatus,
                priority,
                dueDate,
                assigneeId,
                projectId,
            },
            include: taskInclude
        });

        // Log du changement de statut si différent
        if (workflowResult.newStatus !== existingTask.status) {
            console.log(`🔄 Workflow: ${existingTask.status} → ${workflowResult.newStatus} (${workflowResult.message || 'auto'})`);
        }

        console.log(`✏️ Tâche mise à jour: ${updatedTask.title}`);
        return formatTask(updatedTask);
    }

    /**
     * Supprimer une tâche
     */
    async delete(id: string, currentUserId: string, currentUserRole: string) {
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: {
                attachments: true,
                subtasks: { include: { attachments: true } }
            }
        });

        if (!existingTask) {
            throw new AppError('Tâche non trouvée', 404, 'TASK_NOT_FOUND');
        }

        // Vérifier les permissions
        const canDelete =
            currentUserRole === 'ADMIN' ||
            currentUserRole === 'MANAGER' ||
            existingTask.assigneeId === currentUserId;

        if (!canDelete) {
            throw new AppError('Vous n\'avez pas la permission de supprimer cette tâche', 403, 'FORBIDDEN');
        }

        // Supprimer les fichiers physiques de la tâche
        for (const att of existingTask.attachments) {
            deleteFileByUrl(att.url);
        }
        
        // Supprimer les fichiers physiques des subtasks
        for (const subtask of existingTask.subtasks) {
            for (const att of subtask.attachments) {
                deleteFileByUrl(att.url);
            }
        }

        // Supprimer la tâche (cascade delete en base)
        await prisma.task.delete({ where: { id } });
        
        console.log(`🗑️ Tâche supprimée: ${id}`);
        return { success: true, message: 'Tâche supprimée' };
    }

    /**
     * Obtenir les informations de workflow d'une tâche
     */
    async getWorkflowInfo(id: string) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: { subtasks: true }
        });

        if (!task) {
            throw new AppError('Tâche non trouvée', 404, 'TASK_NOT_FOUND');
        }

        const subtasksData: SubtaskData[] = task.subtasks.map((st: any) => ({
            id: st.id,
            title: st.title,
            completed: st.completed,
            dueDate: st.dueDate,
            assigneeId: st.assigneeId
        }));

        const stats = getSubtaskStats(subtasksData);
        const isLocked = isTaskLocked(task.status as TaskStatus);

        return {
            taskId: id,
            currentStatus: task.status,
            isLocked,
            canEdit: !isLocked,
            subtaskStats: stats,
            message: isLocked 
                ? `Tâche ${task.status === 'DONE' ? 'terminée' : 'annulée'} - modifications bloquées`
                : stats.hasSubtasks 
                    ? `${stats.completed}/${stats.total} sous-tâches terminées`
                    : 'Aucune sous-tâche'
        };
    }
}

export default new TaskService();
