import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const UserRoleEnum = z.enum(['ADMIN', 'MANAGER', 'CONTRIBUTOR']);
export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// ============================================
// MESSAGES D'ERREUR PERSONNALISÉS
// ============================================

const messages = {
    required: (field: string) => `${field} est requis`,
    email: 'Format email invalide',
    minLength: (field: string, min: number) => `${field} doit contenir au moins ${min} caractères`,
    maxLength: (field: string, max: number) => `${field} ne peut pas dépasser ${max} caractères`,
    invalidEnum: (field: string, values: string[]) => `${field} doit être parmi: ${values.join(', ')}`,
    invalidUuid: (field: string) => `${field} doit être un identifiant valide`,
    invalidDate: (field: string) => `${field} doit être une date valide (YYYY-MM-DD)`,
    invalidColor: 'La couleur doit être au format hexadécimal (#RRGGBB)',
};

// ============================================
// SCHÉMAS COMMUNS (Réutilisables)
// ============================================

// ID (UUID ou CUID)
const idSchema = z.string({
    required_error: messages.required('ID'),
}).min(1, messages.required('ID'));

// Email
const emailSchema = z.string({
    required_error: messages.required('Email'),
}).email(messages.email).max(255, messages.maxLength('Email', 255));

// Mot de passe
const passwordSchema = z.string({
    required_error: messages.required('Mot de passe'),
}).min(6, messages.minLength('Mot de passe', 6)).max(100, messages.maxLength('Mot de passe', 100));

// Username
const usernameSchema = z.string({
    required_error: messages.required('Username'),
}).min(3, messages.minLength('Username', 3)).max(50, messages.maxLength('Username', 50)).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username ne peut contenir que des lettres, chiffres, tirets et underscores'
);

// Nom/Prénom
const nameSchema = z.string({
    required_error: messages.required('Ce champ'),
}).min(2, messages.minLength('Ce champ', 2)).max(100, messages.maxLength('Ce champ', 100));

// Date au format YYYY-MM-DD
const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    messages.invalidDate('Date')
).optional();

// Couleur hexadécimale
const colorSchema = z.string().regex(
    /^#[0-9A-Fa-f]{6}$/,
    messages.invalidColor
).optional();

// Téléphone (optionnel, format flexible)
const phoneSchema = z.string().max(20, messages.maxLength('Téléphone', 20)).optional().nullable();

// URL (pour avatar)
const urlSchema = z.string().url('URL invalide').optional().nullable();

// ============================================
// AUTH SCHEMAS
// ============================================

/**
 * POST /api/auth/login
 */
export const loginSchema = z.object({
    identifier: z.string({
        required_error: messages.required('Identifiant (email ou username)'),
    }).min(1, messages.required('Identifiant')),
    
    password: z.string({
        required_error: messages.required('Mot de passe'),
    }).min(1, messages.required('Mot de passe')),
});

/**
 * POST /api/auth/register
 */
export const registerSchema = z.object({
    firstName: nameSchema.describe('Prénom'),
    lastName: nameSchema.describe('Nom'),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: UserRoleEnum.optional().default('CONTRIBUTOR'),
    department: z.string().max(100).optional().nullable(),
    phone: phoneSchema,
    avatar: urlSchema,
});

// ============================================
// USER SCHEMAS
// ============================================

/**
 * PUT /api/users/:id
 */
export const updateUserSchema = z.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    role: UserRoleEnum.optional(),
    department: z.string().max(100).optional().nullable(),
    phone: phoneSchema,
    avatar: urlSchema,
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Au moins un champ doit être fourni pour la mise à jour' }
);

/**
 * Paramètre :id pour les routes users
 */
export const userIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// PROJECT SCHEMAS
// ============================================

/**
 * POST /api/projects
 */
export const createProjectSchema = z.object({
    name: z.string({
        required_error: messages.required('Nom du projet'),
    }).min(2, messages.minLength('Nom du projet', 2)).max(100, messages.maxLength('Nom du projet', 100)),
    
    color: colorSchema.default('#6366f1'),
    
    ownerId: idSchema.optional(), // Si non fourni, utilise l'utilisateur connecté
});

/**
 * Paramètre :id pour les routes projects
 */
export const projectIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// SUBTASK SCHEMA
// ============================================

const subtaskSchema = z.object({
    id: z.string().optional(), // Optionnel car généré côté serveur
    title: z.string({
        required_error: messages.required('Titre de la sous-tâche'),
    }).min(1, messages.minLength('Titre', 1)).max(200, messages.maxLength('Titre', 200)),
    
    completed: z.boolean().optional().default(false),
    dueDate: dateSchema,
    assigneeId: idSchema.optional().nullable(),
    
    // Support pour l'objet assignee envoyé par le frontend
    assignee: z.object({
        id: idSchema,
    }).optional().nullable(),
});

// ============================================
// TASK SCHEMAS
// ============================================

/**
 * POST /api/tasks
 */
export const createTaskSchema = z.object({
    title: z.string({
        required_error: messages.required('Titre de la tâche'),
    }).min(2, messages.minLength('Titre', 2)).max(200, messages.maxLength('Titre', 200)),
    
    description: z.string().max(5000, messages.maxLength('Description', 5000)).optional().nullable(),
    
    status: TaskStatusEnum.optional().default('TODO'),
    priority: TaskPriorityEnum.optional().default('MEDIUM'),
    
    dueDate: dateSchema,
    
    projectId: z.string({
        required_error: messages.required('ID du projet'),
    }).min(1, messages.required('ID du projet')),
    
    assigneeId: idSchema.optional(), // Si non fourni, utilise l'utilisateur connecté
    
    subtasks: z.array(subtaskSchema).optional().default([]),
});

/**
 * PUT /api/tasks/:id
 */
export const updateTaskSchema = z.object({
    title: z.string().min(2, messages.minLength('Titre', 2)).max(200, messages.maxLength('Titre', 200)).optional(),
    
    description: z.string().max(5000, messages.maxLength('Description', 5000)).optional().nullable(),
    
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    
    dueDate: dateSchema,
    
    projectId: idSchema.optional(),
    assigneeId: idSchema.optional().nullable(),
    
    subtasks: z.array(subtaskSchema).optional(),
});

/**
 * Paramètre :id pour les routes tasks
 */
export const taskIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// TYPE EXPORTS (pour TypeScript)
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type SubtaskInput = z.infer<typeof subtaskSchema>;

// ============================================
// HELPER: Formater les erreurs Zod
// ============================================

export const formatZodError = (error: z.ZodError): { field: string; message: string }[] => {
    return error.errors.map((err) => ({
        field: err.path.join('.') || 'unknown',
        message: err.message,
    }));
};

// ============================================
// HELPER: Créer une réponse d'erreur de validation
// ============================================

export const createValidationErrorResponse = (error: z.ZodError) => ({
    error: 'Erreur de validation',
    code: 'VALIDATION_ERROR',
    details: formatZodError(error),
});
