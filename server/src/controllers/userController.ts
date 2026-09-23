import { Response, NextFunction } from 'express';
import userService from '../services/userService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { getValidatedId } from '../middlewares/validateMiddleware';
import { AppError, createErrorResponse } from '../utils/errors';

// ============================================
// USER CONTROLLER
// ============================================

class UserController {
    /**
     * GET /api/users
     */
    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const users = await userService.getAll();
            res.json(users);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * GET /api/users/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const user = await userService.getById(id);
            res.json(user);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * PUT /api/users/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const user = await userService.update(
                id,
                req.body,
                req.user!.userId,
                req.user!.role
            );
            res.json(user);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * DELETE /api/users/:id
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const id = getValidatedId(req);
            const result = await userService.delete(
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

export default new UserController();
