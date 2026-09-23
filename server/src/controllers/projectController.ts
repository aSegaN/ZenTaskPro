import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { getValidatedId } from '../middlewares/validateMiddleware';
import { AppError, createErrorResponse } from '../utils/errors';

// ============================================
// PROJECT CONTROLLER
// ============================================

class ProjectController {
    /**
     * GET /api/projects
     */
    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const projects = await projectService.getAll();
            res.json(projects);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * GET /api/projects/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const project = await projectService.getById(id);
            res.json(project);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * POST /api/projects
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const project = await projectService.create(req.body, req.user!.userId);
            res.status(201).json(project);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * PUT /api/projects/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const project = await projectService.update(
                id,
                req.body,
                req.user!.userId,
                req.user!.role
            );
            res.json(project);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * DELETE /api/projects/:id
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const result = await projectService.delete(
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

export default new ProjectController();
