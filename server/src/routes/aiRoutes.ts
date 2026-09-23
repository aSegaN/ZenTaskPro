import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticate } from '../middlewares/authMiddleware';
import { sensitiveLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

// Toutes les routes IA sont protégées (utilisateur authentifié)
router.use(authenticate);

// POST /api/ai/subtasks — suggestions de sous-tâches
router.post('/subtasks', sensitiveLimiter, aiController.subtasks);

// POST /api/ai/analyze — analyse de charge
router.post('/analyze', sensitiveLimiter, aiController.analyze);

export default router;
