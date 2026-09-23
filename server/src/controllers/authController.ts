import { Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { AppError, createErrorResponse } from '../utils/errors';

// ============================================
// AUTH CONTROLLER
// ============================================

class AuthController {
    /**
     * POST /api/auth/login
     */
    async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { identifier, password } = req.body;
            const result = await authService.login(identifier, password);
            res.json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * POST /api/auth/register
     */
    async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json(createErrorResponse(error));
            } else {
                next(error);
            }
        }
    }

    /**
     * GET /api/auth/me
     */
    async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = await authService.getCurrentUser(req.user!.userId);
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
     * POST /api/auth/refresh
     */
    async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await authService.refreshToken(req.user!.userId, req.user!.role);
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

export default new AuthController();
