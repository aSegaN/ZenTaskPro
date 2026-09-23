import { Response, NextFunction } from 'express';
import taskService from '../services/taskService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { getValidatedId } from '../middlewares/validateMiddleware';
import { AppError, createErrorResponse } from '../utils/errors';

// ============================================
// TASK CONTROLLER
// ============================================

class TaskController {
    /**
     * GET /api/tasks
     */
    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const tasks = await taskService.getAll();
            res.json(tasks);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * GET /api/tasks/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const task = await taskService.getById(id);
            res.json(task);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * GET /api/tasks/:id/workflow
     * Obtenir les informations de workflow d'une tâche
     */
    async getWorkflowInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const workflowInfo = await taskService.getWorkflowInfo(id);
            res.json(workflowInfo);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * POST /api/tasks
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const task = await taskService.create(req.body, req.user!.userId);
            res.status(201).json(task);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * PUT /api/tasks/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const task = await taskService.update(
                id,
                req.body,
                req.user!.userId,
                req.user!.role
            );
            res.json(task);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * DELETE /api/tasks/:id
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const result = await taskService.delete(
                id,
                req.user!.userId,
                req.user!.role
            );
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

export default new TaskController();
