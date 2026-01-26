import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createValidationErrorResponse } from '../schemas/validation';

// ============================================
// TYPES
// ============================================

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidateOptions {
    /** Cible de la validation (body, params, query) */
    target?: ValidationTarget;
    /** Si true, supprime les champs non définis dans le schéma */
    stripUnknown?: boolean;
}

// ============================================
// MIDDLEWARE DE VALIDATION
// ============================================

/**
 * Middleware générique de validation avec Zod
 * 
 * @example
 * // Valider le body
 * app.post('/users', validate(createUserSchema), handler);
 * 
 * // Valider les params
 * app.get('/users/:id', validate(userIdSchema, { target: 'params' }), handler);
 * 
 * // Valider plusieurs cibles
 * app.put('/users/:id', 
 *   validate(userIdSchema, { target: 'params' }),
 *   validate(updateUserSchema, { target: 'body' }),
 *   handler
 * );
 */
export const validate = <T extends ZodSchema>(
    schema: T,
    options: ValidateOptions = {}
) => {
    const { target = 'body', stripUnknown = true } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Récupérer les données à valider selon la cible
            const dataToValidate = req[target];

            // Parser et valider avec Zod
            const result = await schema.safeParseAsync(dataToValidate);

            if (!result.success) {
                // Log l'erreur en développement
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`❌ Validation error on ${target}:`, result.error.errors);
                }

                res.status(400).json(createValidationErrorResponse(result.error));
                return;
            }

            // Remplacer les données par les données validées et transformées
            // Cela applique aussi les valeurs par défaut définies dans le schéma
            if (target === 'body') {
                req.body = result.data;
            } else if (target === 'params') {
                req.params = result.data as any;
            } else if (target === 'query') {
                req.query = result.data as any;
            }

            next();
        } catch (error) {
            console.error('❌ Erreur inattendue lors de la validation:', error);
            res.status(500).json({
                error: 'Erreur interne de validation',
                code: 'INTERNAL_VALIDATION_ERROR'
            });
        }
    };
};

/**
 * Raccourci pour valider le body
 */
export const validateBody = <T extends ZodSchema>(schema: T) => 
    validate(schema, { target: 'body' });

/**
 * Raccourci pour valider les params
 */
export const validateParams = <T extends ZodSchema>(schema: T) => 
    validate(schema, { target: 'params' });

/**
 * Raccourci pour valider la query string
 */
export const validateQuery = <T extends ZodSchema>(schema: T) => 
    validate(schema, { target: 'query' });

// ============================================
// MIDDLEWARE COMBINÉ
// ============================================

interface CombinedValidation {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

/**
 * Valide plusieurs cibles en une seule fois
 * 
 * @example
 * app.put('/users/:id', validateAll({
 *   params: userIdSchema,
 *   body: updateUserSchema
 * }), handler);
 */
export const validateAll = (schemas: CombinedValidation) => {
    const middlewares: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[] = [];

    if (schemas.params) {
        middlewares.push(validate(schemas.params, { target: 'params' }));
    }
    if (schemas.query) {
        middlewares.push(validate(schemas.query, { target: 'query' }));
    }
    if (schemas.body) {
        middlewares.push(validate(schemas.body, { target: 'body' }));
    }

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        for (const middleware of middlewares) {
            let shouldContinue = true;
            
            await new Promise<void>((resolve) => {
                middleware(req, res, (err?: any) => {
                    if (err || res.headersSent) {
                        shouldContinue = false;
                    }
                    resolve();
                });
            });

            if (!shouldContinue) {
                return;
            }
        }
        next();
    };
};

// ============================================
// HELPER: Extraire l'ID validé des params
// ============================================

/**
 * Helper pour extraire l'ID de manière sûre après validation
 * À utiliser avec validateParams(idParamSchema)
 */
export const getValidatedId = (req: Request): string => {
    // Après validation, params.id est garanti d'être une string
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
};
