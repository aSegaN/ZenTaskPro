import { Response, NextFunction } from 'express';
import attachmentService from '../services/attachmentService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { getValidatedId } from '../middlewares/validateMiddleware';
import { AppError, createErrorResponse } from '../utils/errors';

// ============================================
// ATTACHMENT CONTROLLER
// ============================================

class AttachmentController {
    /**
     * POST /api/attachments/task/:taskId
     * Upload fichiers pour une tâche
     */
    async uploadForTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const taskId = String(req.params.taskId);
            const files = req.files as Express.Multer.File[];
            
            const attachments = await attachmentService.uploadForTask(taskId, files);
            res.status(201).json({ success: true, attachments });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * POST /api/attachments/subtask/:subtaskId
     * Upload fichiers pour une sous-tâche
     */
    async uploadForSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const subtaskId = String(req.params.subtaskId);
            const files = req.files as Express.Multer.File[];
            
            const attachments = await attachmentService.uploadForSubtask(subtaskId, files);
            res.status(201).json({ success: true, attachments });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * GET /api/attachments/task/:taskId
     * Récupérer les attachments d'une tâche
     */
    async getByTaskId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const taskId = String(req.params.taskId);
            const attachments = await attachmentService.getByTaskId(taskId);
            res.json(attachments);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * DELETE /api/attachments/:id
     * Supprimer un attachment
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const result = await attachmentService.delete(id);
            res.json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }
}

export default new AttachmentController();
