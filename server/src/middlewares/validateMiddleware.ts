import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ============================================
// HELPERS
// ============================================

/**
 * Formater les erreurs Zod pour la réponse
 */
const formatZodErrors = (error: ZodError) => {
    return error.errors.map((err) => ({
        field: err.path.join('.') || 'unknown',
        message: err.message,
    }));
};

// ============================================
// MIDDLEWARES
// ============================================

/**
 * Valider le body de la requête
 */
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Erreur de validation',
                    code: 'VALIDATION_ERROR',
                    details: formatZodErrors(error),
                });
                return;
            }
            next(error);
        }
    };
};

/**
 * Valider les paramètres de la requête
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params) as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Paramètre invalide',
                    code: 'VALIDATION_ERROR',
                    details: formatZodErrors(error),
                });
                return;
            }
            next(error);
        }
    };
};

/**
 * Valider la query string
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Query invalide',
                    code: 'VALIDATION_ERROR',
                    details: formatZodErrors(error),
                });
                return;
            }
            next(error);
        }
    };
};

/**
 * Helper pour extraire l'ID validé depuis les params
 */
export const getValidatedId = (req: Request): string => {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
};
