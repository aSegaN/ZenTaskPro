import express from 'express';
import path from 'path';
import { setupSecurity } from './middlewares/securityMiddleware';
import { generalLimiter } from './middlewares/rateLimitMiddleware';
import { ensureUploadDirs } from './middlewares/uploadMiddleware';
import routes from './routes';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { captureException } from './utils/sentry';

// ============================================
// CRÉER L'APPLICATION EXPRESS
// ============================================

const app = express();

// Logs structurés par requête
app.use(pinoHttp({ logger }));

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================

// Sécurité (Helmet, CORS)
setupSecurity(app);

// Parser JSON et URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting général
app.use(generalLimiter);

// ============================================
// FICHIERS STATIQUES (uploads)
// ============================================

ensureUploadDirs();
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// ROUTES API
// ============================================

app.use('/api', routes);

// ============================================
// GESTION DES ERREURS
// ============================================

// Route 404
app.use((_req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        code: 'NOT_FOUND'
    });
});

// Gestionnaire d'erreurs global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, err.message);
    captureException(err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erreur serveur interne';
    const code = err.code || 'INTERNAL_ERROR';
    
    res.status(statusCode).json({
        error: message,
        code: code,
    });
});

export default app;
