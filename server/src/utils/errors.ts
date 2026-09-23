// ============================================
// CLASSE D'ERREUR DE BASE
// ============================================

export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ============================================
// ERREURS SPÉCIFIQUES
// ============================================

/**
 * Erreur 404 - Ressource non trouvée
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Ressource') {
        super(
            `${resource} non trouvé(e)`,
            404,
            `${resource.toUpperCase().replace(/ /g, '_')}_NOT_FOUND`
        );
    }
}

/**
 * Erreur 401 - Non authentifié
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Non autorisé') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

/**
 * Erreur 403 - Accès interdit
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Accès interdit') {
        super(message, 403, 'FORBIDDEN');
    }
}

/**
 * Erreur 400 - Requête invalide
 */
export class BadRequestError extends AppError {
    constructor(message: string, code: string = 'BAD_REQUEST') {
        super(message, 400, code);
    }
}

/**
 * Erreur 409 - Conflit (doublon, etc.)
 */
export class ConflictError extends AppError {
    constructor(message: string, code: string = 'CONFLICT') {
        super(message, 409, code);
    }
}

/**
 * Erreur 422 - Erreur de validation
 */
export class ValidationError extends AppError {
    public details: any[];

    constructor(message: string, details: any[] = []) {
        super(message, 422, 'VALIDATION_ERROR');
        this.details = details;
    }
}

// ============================================
// HELPERS
// ============================================

/**
 * Créer une réponse d'erreur formatée
 */
export const createErrorResponse = (error: AppError) => ({
    error: error.message,
    code: error.code,
    ...(error instanceof ValidationError && error.details.length > 0 && { 
        details: error.details 
    }),
});

/**
 * Transformer les erreurs Prisma en AppError
 */
export const handlePrismaError = (error: any): AppError => {
    switch (error.code) {
        case 'P2002': {
            // Violation de contrainte unique
            const field = error.meta?.target?.[0] || 'champ';
            return new ConflictError(
                `Un enregistrement avec ce ${field} existe déjà`,
                'DUPLICATE_FIELD'
            );
        }
        case 'P2003': {
            // Violation de clé étrangère
            return new BadRequestError(
                'Référence invalide - la ressource liée n\'existe pas',
                'INVALID_REFERENCE'
            );
        }
        case 'P2025': {
            // Enregistrement non trouvé
            return new NotFoundError('Enregistrement');
        }
        case 'P2014': {
            // Violation de relation requise
            return new BadRequestError(
                'Cette opération violerait une relation requise',
                'RELATION_VIOLATION'
            );
        }
        default:
            console.error('Erreur Prisma non gérée:', error);
            return new AppError(
                'Erreur base de données',
                500,
                'DATABASE_ERROR'
            );
    }
};
