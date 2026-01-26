import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ============================================
// CONFIGURATION
// ============================================

const isDev = process.env.NODE_ENV !== 'production';

// ============================================
// MESSAGES D'ERREUR
// ============================================

const createRateLimitMessage = (type: string, retryAfter: number) => ({
    error: 'Trop de requêtes',
    code: 'RATE_LIMIT_EXCEEDED',
    message: `Vous avez dépassé la limite de ${type}. Réessayez dans ${Math.ceil(retryAfter / 1000)} secondes.`,
    retryAfter: Math.ceil(retryAfter / 1000)
});

// ============================================
// RATE LIMITER GÉNÉRAL
// 100 requêtes par minute par IP
// ============================================

export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requêtes max par fenêtre
    message: createRateLimitMessage('requêtes', 60000),
    standardHeaders: true, // Retourne les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
    
    // Handler personnalisé pour logger
    handler: (req: Request, res: Response) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        console.log(`⚠️ Rate limit général dépassé pour IP: ${ip}`);
        
        res.status(429).json(createRateLimitMessage('requêtes (100/min)', 60000));
    },

    // Skip en développement si variable d'env définie
    skip: (req: Request) => {
        if (process.env.DISABLE_RATE_LIMIT === 'true') {
            return true;
        }
        return false;
    },

    // Identifier par IP
    keyGenerator: (req: Request) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    }
});

// ============================================
// RATE LIMITER STRICT POUR AUTHENTIFICATION
// 5 requêtes par minute par IP (protection brute force)
// ============================================

export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 tentatives max par fenêtre
    message: createRateLimitMessage('tentatives de connexion', 60000),
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req: Request, res: Response) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const identifier = req.body?.identifier || 'unknown';
        console.log(`🚫 Rate limit AUTH dépassé pour IP: ${ip}, identifier: ${identifier}`);
        
        res.status(429).json({
            error: 'Trop de tentatives de connexion',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Vous avez dépassé le nombre de tentatives de connexion autorisées. Veuillez patienter 1 minute.',
            retryAfter: 60
        });
    },

    skip: (req: Request) => {
        if (process.env.DISABLE_RATE_LIMIT === 'true') {
            return true;
        }
        return false;
    },

    keyGenerator: (req: Request) => {
        // Combiner IP + identifier pour un rate limit plus précis
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const identifier = req.body?.identifier || '';
        return `${ip}:${identifier}`;
    }
});

// ============================================
// RATE LIMITER POUR CRÉATION DE COMPTE
// 3 requêtes par heure par IP (anti-spam)
// ============================================

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 inscriptions max par heure
    message: createRateLimitMessage('créations de compte', 3600000),
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req: Request, res: Response) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        console.log(`🚫 Rate limit REGISTER dépassé pour IP: ${ip}`);
        
        res.status(429).json({
            error: 'Trop de créations de compte',
            code: 'REGISTER_RATE_LIMIT_EXCEEDED',
            message: 'Vous avez dépassé le nombre de créations de compte autorisées. Veuillez patienter 1 heure.',
            retryAfter: 3600
        });
    },

    skip: (req: Request) => {
        if (process.env.DISABLE_RATE_LIMIT === 'true') {
            return true;
        }
        return false;
    }
});

// ============================================
// RATE LIMITER POUR API SENSIBLES
// 20 requêtes par minute (suppression, etc.)
// ============================================

export const sensitiveLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requêtes max
    message: createRateLimitMessage('opérations sensibles', 60000),
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req: Request, res: Response) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        console.log(`⚠️ Rate limit SENSITIVE dépassé pour IP: ${ip}, route: ${req.path}`);
        
        res.status(429).json(createRateLimitMessage('opérations sensibles (20/min)', 60000));
    },

    skip: (req: Request) => {
        if (process.env.DISABLE_RATE_LIMIT === 'true') {
            return true;
        }
        return false;
    }
});

// ============================================
// HELPER: Afficher la config au démarrage
// ============================================

export const logRateLimitConfig = () => {
    console.log('║  🛡️ Rate Limits:                                          ║');
    console.log('║  │  General:    100 req/min                               ║');
    console.log('║  │  Auth:       5 req/min                                 ║');
    console.log('║  │  Register:   3 req/hour                                ║');
    console.log('║  │  Sensitive:  20 req/min                                ║');
};
