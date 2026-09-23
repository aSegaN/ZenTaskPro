import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { formatUploadedFile, deleteFileByUrl } from '../middlewares/uploadMiddleware';

// ============================================
// ATTACHMENT SERVICE
// ============================================

class AttachmentService {
    /**
     * Upload fichiers pour une tâche
     */
    async uploadForTask(taskId: string, files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new AppError('Aucun fichier fourni', 400, 'NO_FILES');
        }

        // Vérifier que la tâche existe
        const task = await prisma.task.findUnique({ 
            where: { id: taskId } 
        });
        
        if (!task) {
            // Supprimer les fichiers uploadés car la tâche n'existe pas
            files.forEach(f => deleteFileByUrl(`/uploads/tasks/${f.filename}`));
            throw new AppError('Tâche non trouvée', 404, 'TASK_NOT_FOUND');
        }

        // Créer les attachments en base
        const attachments = await Promise.all(
            files.map(async (file) => {
                const formatted = formatUploadedFile(file);
                return prisma.attachment.create({
                    data: {
                        name: formatted.name,
                        url: formatted.url,
                        type: formatted.type,
                        size: formatted.size,
                        taskId,
                    }
                });
            })
        );

        console.log(`📎 ${attachments.length} fichier(s) uploadé(s) pour tâche ${taskId}`);
        return attachments;
    }

    /**
     * Upload fichiers pour une sous-tâche
     */
    async uploadForSubtask(subtaskId: string, files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new AppError('Aucun fichier fourni', 400, 'NO_FILES');
        }

        // Vérifier que la sous-tâche existe
        const subtask = await prisma.subTask.findUnique({ 
            where: { id: subtaskId } 
        });
        
        if (!subtask) {
            // Supprimer les fichiers uploadés car la sous-tâche n'existe pas
            files.forEach(f => deleteFileByUrl(`/uploads/subtasks/${f.filename}`));
            throw new AppError('Sous-tâche non trouvée', 404, 'SUBTASK_NOT_FOUND');
        }

        // Créer les attachments en base
        const attachments = await Promise.all(
            files.map(async (file) => {
                const formatted = formatUploadedFile(file);
                return prisma.attachment.create({
                    data: {
                        name: formatted.name,
                        url: formatted.url,
                        type: formatted.type,
                        size: formatted.size,
                        subtaskId,
                    }
                });
            })
        );

        console.log(`📎 ${attachments.length} fichier(s) uploadé(s) pour sous-tâche ${subtaskId}`);
        return attachments;
    }

    /**
     * Récupérer les attachments d'une tâche
     */
    async getByTaskId(taskId: string) {
        // Vérifier que la tâche existe
        const task = await prisma.task.findUnique({ 
            where: { id: taskId } 
        });
        
        if (!task) {
            throw new AppError('Tâche non trouvée', 404, 'TASK_NOT_FOUND');
        }

        const attachments = await prisma.attachment.findMany({
            where: { taskId },
            orderBy: { createdAt: 'desc' }
        });

        return attachments;
    }

    /**
     * Récupérer les attachments d'une sous-tâche
     */
    async getBySubtaskId(subtaskId: string) {
        // Vérifier que la sous-tâche existe
        const subtask = await prisma.subTask.findUnique({ 
            where: { id: subtaskId } 
        });
        
        if (!subtask) {
            throw new AppError('Sous-tâche non trouvée', 404, 'SUBTASK_NOT_FOUND');
        }

        const attachments = await prisma.attachment.findMany({
            where: { subtaskId },
            orderBy: { createdAt: 'desc' }
        });

        return attachments;
    }

    /**
     * Récupérer un attachment par ID
     */
    async getById(id: string) {
        const attachment = await prisma.attachment.findUnique({
            where: { id }
        });

        if (!attachment) {
            throw new AppError('Fichier non trouvé', 404, 'ATTACHMENT_NOT_FOUND');
        }

        return attachment;
    }

    /**
     * Supprimer un attachment
     */
    async delete(id: string) {
        const attachment = await prisma.attachment.findUnique({
            where: { id }
        });

        if (!attachment) {
            throw new AppError('Fichier non trouvé', 404, 'ATTACHMENT_NOT_FOUND');
        }

        // Supprimer le fichier physique
        const deleted = deleteFileByUrl(attachment.url);
        if (!deleted) {
            console.warn(`⚠️ Fichier physique non trouvé: ${attachment.url}`);
        }

        // Supprimer en base
        await prisma.attachment.delete({
            where: { id }
        });

        console.log(`🗑️ Attachment supprimé: ${attachment.name}`);
        return { success: true, message: 'Fichier supprimé' };
    }

    /**
     * Supprimer tous les attachments d'une tâche
     */
    async deleteAllForTask(taskId: string) {
        const attachments = await prisma.attachment.findMany({
            where: { taskId }
        });

        // Supprimer les fichiers physiques
        for (const att of attachments) {
            deleteFileByUrl(att.url);
        }

        // Supprimer en base
        const result = await prisma.attachment.deleteMany({
            where: { taskId }
        });

        console.log(`🗑️ ${result.count} attachment(s) supprimé(s) pour tâche ${taskId}`);
        return { success: true, count: result.count };
    }

    /**
     * Supprimer tous les attachments d'une sous-tâche
     */
    async deleteAllForSubtask(subtaskId: string) {
        const attachments = await prisma.attachment.findMany({
            where: { subtaskId }
        });

        // Supprimer les fichiers physiques
        for (const att of attachments) {
            deleteFileByUrl(att.url);
        }

        // Supprimer en base
        const result = await prisma.attachment.deleteMany({
            where: { subtaskId }
        });

        console.log(`🗑️ ${result.count} attachment(s) supprimé(s) pour sous-tâche ${subtaskId}`);
        return { success: true, count: result.count };
    }
}

export default new AttachmentService();
