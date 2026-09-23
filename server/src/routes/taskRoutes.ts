import { Router } from 'express';
import taskController from '../controllers/taskController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateMiddleware';
import { sensitiveLimiter } from '../middlewares/rateLimitMiddleware';
import { createTaskSchema, updateTaskSchema, taskIdParamSchema } from '../schemas/validation';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// ============================================
// ROUTES
// ============================================

// GET /api/tasks - Liste des tâches
router.get('/', taskController.getAll);

// GET /api/tasks/:id - Détail d'une tâche
router.get('/:id',
    validateParams(taskIdParamSchema),
    taskController.getById
);

// GET /api/tasks/:id/workflow - Info workflow d'une tâche
router.get('/:id/workflow',
    validateParams(taskIdParamSchema),
    taskController.getWorkflowInfo
);

// POST /api/tasks - Créer une tâche
router.post('/',
    validateBody(createTaskSchema),
    taskController.create
);

// PUT /api/tasks/:id - Modifier une tâche
router.put('/:id',
    validateParams(taskIdParamSchema),
    validateBody(updateTaskSchema),
    taskController.update
);

// DELETE /api/tasks/:id - Supprimer une tâche
router.delete('/:id',
    sensitiveLimiter,
    validateParams(taskIdParamSchema),
    taskController.delete
);

export default router;
