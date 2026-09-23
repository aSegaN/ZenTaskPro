import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticate, adminOnly } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateMiddleware';
import { sensitiveLimiter } from '../middlewares/rateLimitMiddleware';
import { updateUserSchema, userIdParamSchema } from '../schemas/validation';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// ============================================
// ROUTES
// ============================================

// GET /api/users - Liste des utilisateurs
router.get('/', userController.getAll);

// GET /api/users/:id - Détail d'un utilisateur
router.get('/:id',
    validateParams(userIdParamSchema),
    userController.getById
);

// PUT /api/users/:id - Modifier un utilisateur
router.put('/:id',
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    userController.update
);

// DELETE /api/users/:id - Supprimer un utilisateur (admin only)
router.delete('/:id',
    adminOnly,
    sensitiveLimiter,
    validateParams(userIdParamSchema),
    userController.delete
);

export default router;
