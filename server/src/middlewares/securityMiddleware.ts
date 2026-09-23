import cors from 'cors';
import helmet from 'helmet';
import { Express, Request, Response, NextFunction } from 'express';

// ============================================
// CONFIGURATION
// ============================================

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Permettre les requêtes sans origin (apps mobiles, Postman)
        if (!origin) {
            return callback(null, true);
        }
        
        // En développement: autoriser localhost
        if (process.env.NODE_ENV !== 'production') {
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }
        }
        
        // Vérifier la whitelist
        if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        
        callback(new Error('CORS non autorisé'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining'],
    maxAge: 86400,
};

// ============================================
// SETUP
// ============================================

/**
 * Configurer la sécurité de l'application
 */
export const setupSecurity = (app: Express): void => {
    // Helmet - Headers de sécurité
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
    }));
    
    // CORS
    app.use(cors(corsOptions));
    
    // Headers supplémentaires
    app.use((_req: Request, res: Response, next: NextFunction) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });
};

// ============================================
// LOGGING
// ============================================

export const logSecurityConfig = () => {
    console.log('║  🔒 Security:                                             ║');
    console.log('║      • Helmet:  Enabled                                   ║');
    console.log('║      • CORS:    Configured                                ║');
    if (ALLOWED_ORIGINS.length > 0) {
        console.log(`║      • Origins: ${ALLOWED_ORIGINS.length} whitelisted                            ║`);
    } else {
        console.log('║      • Origins: All (dev mode)                            ║');
    }
};
