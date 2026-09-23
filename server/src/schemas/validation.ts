import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const UserRoleEnum = z.enum(['ADMIN', 'MANAGER', 'CONTRIBUTOR']);
export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// ============================================
// SCHÉMAS DE BASE RÉUTILISABLES
// ============================================

const idSchema = z.string().min(1, 'ID requis');

const emailSchema = z.string()
    .email('Format email invalide')
    .max(255, 'Email trop long');

const passwordSchema = z.string()
    .min(6, 'Minimum 6 caractères')
    .max(100, 'Maximum 100 caractères');

const usernameSchema = z.string()
    .min(3, 'Minimum 3 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Caractères autorisés: lettres, chiffres, _ et -');

const nameSchema = z.string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères');

const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format requis: YYYY-MM-DD')
    .optional()
    .nullable();

const colorSchema = z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format requis: #RRGGBB')
    .optional();

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Email ou nom d\'utilisateur requis'),
    password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: UserRoleEnum.optional().default('CONTRIBUTOR'),
    department: z.string().max(100).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    avatar: z.string().url('URL invalide').optional().nullable(),
});

// ============================================
// USER SCHEMAS
// ============================================

export const updateUserSchema = z.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: UserRoleEnum.optional(),
    department: z.string().max(100).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    avatar: z.string().optional().nullable(),
}).passthrough();

export const userIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
    name: z.string()
        .min(2, 'Minimum 2 caractères')
        .max(100, 'Maximum 100 caractères'),
    color: colorSchema.default('#6366f1'),
    ownerId: idSchema.optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    color: colorSchema,
}).passthrough();

export const projectIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// SUBTASK SCHEMA
// ============================================

const subtaskSchema = z.object({
    id: z.string().optional(),
    title: z.string()
        .min(1, 'Titre requis')
        .max(200, 'Maximum 200 caractères'),
    completed: z.boolean().optional().default(false),
    dueDate: dateSchema,
    assigneeId: idSchema.optional().nullable(),
    // Permettre l'objet assignee envoyé par le frontend
    assignee: z.object({
        id: idSchema,
    }).passthrough().optional().nullable(),
}).passthrough();

// ============================================
// TASK SCHEMAS
// ============================================

export const createTaskSchema = z.object({
    title: z.string()
        .min(2, 'Minimum 2 caractères')
        .max(200, 'Maximum 200 caractères'),
    description: z.string()
        .max(5000, 'Maximum 5000 caractères')
        .optional()
        .nullable(),
    status: TaskStatusEnum.optional().default('TODO'),
    priority: TaskPriorityEnum.optional().default('MEDIUM'),
    dueDate: dateSchema,
    projectId: z.string().min(1, 'Projet requis'),
    assigneeId: idSchema.optional(),
    subtasks: z.array(subtaskSchema).optional().default([]),
}).passthrough();

export const updateTaskSchema = z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    dueDate: dateSchema,
    projectId: idSchema.optional(),
    assigneeId: idSchema.optional().nullable(),
    subtasks: z.array(subtaskSchema).optional(),
}).passthrough();

export const taskIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// ATTACHMENT SCHEMAS
// ============================================

export const attachmentIdParamSchema = z.object({
    id: idSchema,
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type SubtaskInput = z.infer<typeof subtaskSchema>;
