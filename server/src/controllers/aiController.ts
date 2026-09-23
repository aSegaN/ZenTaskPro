import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as aiService from '../services/aiService';

// ============================================
// AI CONTROLLER — proxy Gemini (clé côté serveur)
// ============================================

class AiController {
    /**
     * POST /api/ai/subtasks
     * body: { title: string, description?: string }
     */
    async subtasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { title, description } = req.body || {};
            if (!title || typeof title !== 'string') {
                res.status(400).json({ error: 'Titre requis', code: 'BAD_REQUEST' });
                return;
            }
            const result = await aiService.suggestSubtasks(title, description);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/ai/analyze
     * body: { tasks: Array<{ title, priority, status }> }
     */
    async analyze(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { tasks } = req.body || {};
            const insight = await aiService.analyzeWorkload(Array.isArray(tasks) ? tasks : []);
            res.json({ insight });
        } catch (error) {
            next(error);
        }
    }
}

export default new AiController();
