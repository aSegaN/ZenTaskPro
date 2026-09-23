import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ============================================
// CONFIGURATION
// ============================================

const DISABLE_RATE_LIMIT = process.env.DISABLE_RATE_LIMIT === 'true';

/**
 * Créer une réponse d'erreur rate limit
 */
const createRateLimitResponse = (type: string) => (_req: Request, res: Response) => {
    res.status(429).json({
        error: 'Trop de requêtes',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Limite ${type} atteinte. Réessayez plus tard.`,
    });
};

// ============================================
// LIMITERS
// ============================================

/**
 * Limiter général: 100 requêtes/minute
 */
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: DISABLE_RATE_LIMIT ? 0 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitResponse('générale'),
    skip: () => DISABLE_RATE_LIMIT,
});

/**
 * Limiter authentification: 5 requêtes/minute
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: DISABLE_RATE_LIMIT ? 0 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitResponse('authentification'),
    skip: () => DISABLE_RATE_LIMIT,
});

/**
 * Limiter inscription: 3 requêtes/heure
 */
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: DISABLE_RATE_LIMIT ? 0 : 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitResponse('inscription'),
    skip: () => DISABLE_RATE_LIMIT,
});

/**
 * Limiter opérations sensibles: 20 requêtes/minute
 */
export const sensitiveLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: DISABLE_RATE_LIMIT ? 0 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitResponse('opération sensible'),
    skip: () => DISABLE_RATE_LIMIT,
});

// ============================================
// LOGGING
// ============================================

export const logRateLimitConfig = () => {
    if (DISABLE_RATE_LIMIT) {
        console.log('║  ⚠️  Rate Limit: DÉSACTIVÉ                                ║');
    } else {
        console.log('║  🛡️  Rate Limit:                                          ║');
        console.log('║      • General:   100 req/min                            ║');
        console.log('║      • Auth:      5 req/min                              ║');
        console.log('║      • Register:  3 req/hour                             ║');
        console.log('║      • Sensitive: 20 req/min                             ║');
    }
};
