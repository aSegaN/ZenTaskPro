import { Router } from 'express';
import attachmentController from '../controllers/attachmentController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateParams } from '../middlewares/validateMiddleware';
import { sensitiveLimiter } from '../middlewares/rateLimitMiddleware';
import { upload, setUploadType, handleMulterError } from '../middlewares/uploadMiddleware';
import { z } from 'zod';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// ============================================
// SCHEMAS DE VALIDATION SPÉCIFIQUES
// ============================================

const _subtaskIdParamSchema = z.object({
    subtaskId: z.string().min(1, 'ID sous-tâche requis')
});

const attachmentIdParamSchema = z.object({
    id: z.string().min(1, 'ID attachment requis')
});

// ============================================
// ROUTES UPLOAD
// ============================================

// POST /api/attachments/task/:taskId - Upload fichiers pour une tâche
router.post('/task/:taskId',
    setUploadType('tasks'),
    upload.array('files', 5),
    handleMulterError,
    attachmentController.uploadForTask
);

// POST /api/attachments/subtask/:subtaskId - Upload fichiers pour une sous-tâche
router.post('/subtask/:subtaskId',
    setUploadType('subtasks'),
    upload.array('files', 5),
    handleMulterError,
    attachmentController.uploadForSubtask
);

// ============================================
// ROUTES LECTURE
// ============================================

// GET /api/attachments/task/:taskId - Liste des fichiers d'une tâche
router.get('/task/:taskId',
    attachmentController.getByTaskId
);

// ============================================
// ROUTES SUPPRESSION
// ============================================

// DELETE /api/attachments/:id - Supprimer un fichier
router.delete('/:id',
    sensitiveLimiter,
    validateParams(attachmentIdParamSchema),
    attachmentController.delete
);

export default router;
