import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import attachmentRoutes from './attachmentRoutes';
import aiRoutes from './aiRoutes';

const router = Router();

// ============================================
// MONTAGE DES ROUTES
// ============================================

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/ai', aiRoutes);

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
