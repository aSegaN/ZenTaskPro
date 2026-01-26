import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

// ============================================
// TYPES
// ============================================

export interface JwtPayload {
    userId: string;
    role: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR';
    iat: number;  // Issued at
    exp: number;  // Expiration
}

// Extension du type Request pour inclure l'utilisateur authentifié
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

// ============================================
// CONFIGURATION
// ============================================

const getSecretKey = (): Secret => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('⚠️ JWT_SECRET non défini! Utilisation de la clé par défaut (DANGER en prod)');
        return 'zentask_secret_key_change_me';
    }
    return secret;
};

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token dans le header Authorization
 */
export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        // 1. Extraire le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                error: 'Token manquant',
                code: 'NO_TOKEN',
                message: 'Le header Authorization est requis'
            });
            return;
        }

        // 2. Vérifier le format "Bearer <token>"
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({
                error: 'Format de token invalide',
                code: 'INVALID_FORMAT',
                message: 'Le format attendu est: Bearer <token>'
            });
            return;
        }

        const token = parts[1];

        // 3. Vérifier et décoder le token
        const decoded = jwt.verify(token, getSecretKey()) as JwtPayload;

        // 4. Vérifier l'expiration (jwt.verify le fait déjà, mais on ajoute un log)
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = decoded.exp - now;

        if (timeRemaining < 300) { // Moins de 5 minutes restantes
            console.log(`⏰ Token expire bientôt pour user ${decoded.userId} (${timeRemaining}s restantes)`);
        }

        // 5. Attacher l'utilisateur à la requête
        req.user = decoded;

        // 6. Log de debug (à désactiver en prod)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔐 Auth OK: ${decoded.userId} (${decoded.role})`);
        }

        next();
    } catch (error) {
        handleJwtError(error, res);
    }
};

// ============================================
// MIDDLEWARE DE VÉRIFICATION DES RÔLES
// ============================================

/**
 * Middleware pour restreindre l'accès à certains rôles
 * @param allowedRoles - Tableau des rôles autorisés
 */
export const requireRoles = (...allowedRoles: Array<'ADMIN' | 'MANAGER' | 'CONTRIBUTOR'>) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Non authentifié',
                code: 'NOT_AUTHENTICATED',
                message: 'Authentification requise avant vérification des rôles'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            console.log(`🚫 Accès refusé: ${req.user.userId} (${req.user.role}) → nécessite ${allowedRoles.join(' ou ')}`);
            res.status(403).json({
                error: 'Accès non autorisé',
                code: 'FORBIDDEN',
                message: `Cette action nécessite l'un des rôles suivants: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next();
    };
};

/**
 * Raccourci: Réservé aux administrateurs
 */
export const adminOnly = requireRoles('ADMIN');

/**
 * Raccourci: Réservé aux managers et admins
 */
export const managerOrAdmin = requireRoles('ADMIN', 'MANAGER');

// ============================================
// MIDDLEWARE OPTIONNEL (pour routes mixtes)
// ============================================

/**
 * Middleware qui tente d'authentifier mais ne bloque pas si pas de token
 * Utile pour les routes qui fonctionnent différemment selon l'auth
 */
export const optionalAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        // Pas de token = utilisateur anonyme, on continue
        next();
        return;
    }

    // Si un token est présent, on le vérifie
    authenticate(req, res, next);
};

// ============================================
// GESTION DES ERREURS JWT
// ============================================

const handleJwtError = (error: unknown, res: Response): void => {
    if (error instanceof jwt.TokenExpiredError) {
        console.log('⏰ Token expiré');
        res.status(401).json({
            error: 'Token expiré',
            code: 'TOKEN_EXPIRED',
            message: 'Votre session a expiré, veuillez vous reconnecter',
            expiredAt: error.expiredAt
        });
        return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
        console.log('❌ Token invalide:', error.message);
        res.status(401).json({
            error: 'Token invalide',
            code: 'INVALID_TOKEN',
            message: 'Le token fourni est invalide ou corrompu'
        });
        return;
    }

    if (error instanceof jwt.NotBeforeError) {
        console.log('⏰ Token pas encore actif');
        res.status(401).json({
            error: 'Token pas encore actif',
            code: 'TOKEN_NOT_ACTIVE',
            message: 'Ce token n\'est pas encore valide'
        });
        return;
    }

    // Erreur inattendue
    console.error('❌ Erreur auth inattendue:', error);
    res.status(500).json({
        error: 'Erreur d\'authentification',
        code: 'AUTH_ERROR',
        message: 'Une erreur inattendue est survenue lors de l\'authentification'
    });
};

// ============================================
// UTILITAIRES
// ============================================

/**
 * Génère un token JWT pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @param role - Rôle de l'utilisateur
 * @param expiresInSeconds - Durée de validité en secondes (défaut: 7200 = 2h)
 */
export const generateToken = (userId: string, role: string, expiresInSeconds: number = 7200): string => {
    const payload = { userId, role };
    const options: SignOptions = { 
        expiresIn: expiresInSeconds 
    };
    
    return jwt.sign(payload, getSecretKey(), options);
};

/**
 * Décode un token sans le vérifier (utile pour debug)
 */
export const decodeToken = (token: string): JwtPayload | null => {
    try {
        return jwt.decode(token) as JwtPayload;
    } catch {
        return null;
    }
};

/**
 * Vérifie si un token est proche de l'expiration
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 300): boolean => {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return (decoded.exp - now) < thresholdSeconds;
};
