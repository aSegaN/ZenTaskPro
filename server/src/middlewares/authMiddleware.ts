import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ============================================
// CONFIGURATION
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'zentask-secret-change-in-production';
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '7200'); // 2 heures

/** Timestamp (ms) d'expiration d'une nouvelle session. */
export const getSessionExpiry = (): number => Date.now() + JWT_EXPIRES_IN * 1000;

// ============================================
// TYPES
// ============================================

export interface TokenPayload {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

// ============================================
// HELPERS
// ============================================

/**
 * Générer un token JWT
 */
export const generateToken = (userId: string, role: string, expiresIn: number = JWT_EXPIRES_IN): string => {
    return jwt.sign(
        { userId, role },
        JWT_SECRET,
        { expiresIn }
    );
};

/**
 * Vérifier et décoder un token
 */
export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

// ============================================
// MIDDLEWARES
// ============================================

/**
 * Middleware d'authentification - Vérifie le token JWT
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Token manquant',
            code: 'MISSING_TOKEN'
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                error: 'Token expiré',
                code: 'TOKEN_EXPIRED'
            });
        } else {
            res.status(401).json({
                error: 'Token invalide',
                code: 'INVALID_TOKEN'
            });
        }
    }
};

/**
 * Comme authenticate, mais accepte un jeton EXPIRÉ tant qu'il l'est depuis
 * moins de REFRESH_GRACE_SECONDS. Réservé à la route /auth/refresh, pour
 * permettre de prolonger une session dont le jeton vient d'expirer.
 */
export const authenticateAllowExpired = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token manquant', code: 'MISSING_TOKEN' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as TokenPayload;
        const graceSeconds = parseInt(process.env.REFRESH_GRACE_SECONDS || String(7 * 24 * 3600)); // 7 jours

        if (decoded.exp && (Math.floor(Date.now() / 1000) - decoded.exp) > graceSeconds) {
            res.status(401).json({ error: 'Session expirée depuis trop longtemps', code: 'TOKEN_EXPIRED' });
            return;
        }

        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Token invalide', code: 'INVALID_TOKEN' });
    }
};

/**
 * Middleware de vérification des rôles
 */
export const requireRoles = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Non authentifié',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Accès non autorisé',
                code: 'FORBIDDEN',
                message: `Rôle requis: ${allowedRoles.join(' ou ')}`
            });
            return;
        }

        next();
    };
};

/**
 * Middleware Admin uniquement
 */
export const adminOnly = requireRoles('ADMIN');

/**
 * Middleware Manager ou Admin
 */
export const managerOrAdmin = requireRoles('ADMIN', 'MANAGER');
