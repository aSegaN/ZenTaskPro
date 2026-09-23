import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate, authenticateAllowExpired } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { authLimiter, registerLimiter } from '../middlewares/rateLimitMiddleware';
import { loginSchema, registerSchema } from '../schemas/validation';

const router = Router();

// ============================================
// ROUTES PUBLIQUES
// ============================================

// POST /api/auth/login
router.post('/login',
    authLimiter,
    validateBody(loginSchema),
    authController.login
);

// POST /api/auth/register
router.post('/register',
    registerLimiter,
    validateBody(registerSchema),
    authController.register
);

// ============================================
// ROUTES PROTÉGÉES
// ============================================

// GET /api/auth/me
router.get('/me',
    authenticate,
    authController.me
);

// POST /api/auth/refresh
router.post('/refresh',
    authenticateAllowExpired,
    authController.refresh
);

export default router;
