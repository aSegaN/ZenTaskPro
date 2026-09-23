import { Router } from 'express';
import projectController from '../controllers/projectController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateMiddleware';
import { sensitiveLimiter } from '../middlewares/rateLimitMiddleware';
import { createProjectSchema, updateProjectSchema, projectIdParamSchema } from '../schemas/validation';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// ============================================
// ROUTES
// ============================================

// GET /api/projects - Liste des projets
router.get('/', projectController.getAll);

// GET /api/projects/:id - Détail d'un projet
router.get('/:id',
    validateParams(projectIdParamSchema),
    projectController.getById
);

// POST /api/projects - Créer un projet
router.post('/',
    validateBody(createProjectSchema),
    projectController.create
);

// PUT /api/projects/:id - Modifier un projet
router.put('/:id',
    validateParams(projectIdParamSchema),
    validateBody(updateProjectSchema),
    projectController.update
);

// DELETE /api/projects/:id - Supprimer un projet
router.delete('/:id',
    sensitiveLimiter,
    validateParams(projectIdParamSchema),
    projectController.delete
);

export default router;
