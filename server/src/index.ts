import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Middlewares
import {
    authenticate,
    adminOnly,
    managerOrAdmin,
    generateToken,
    AuthenticatedRequest
} from './middlewares/authMiddleware';

import {
    validateBody,
    validateParams,
    getValidatedId
} from './middlewares/validateMiddleware';

import {
    generalLimiter,
    authLimiter,
    registerLimiter,
    sensitiveLimiter,
    logRateLimitConfig
} from './middlewares/rateLimitMiddleware';

import {
    initializeSecurity,
    logSecurityConfig
} from './middlewares/securityMiddleware';

import {
    upload,
    setUploadType,
    ensureUploadDirs,
    formatUploadedFile,
    deleteFileByUrl,
    handleMulterError,
    logUploadConfig
} from './middlewares/uploadMiddleware';

// Schémas de validation
import {
    loginSchema,
    registerSchema,
    updateUserSchema,
    userIdParamSchema,
    createProjectSchema,
    projectIdParamSchema,
    createTaskSchema,
    updateTaskSchema,
    taskIdParamSchema
} from './schemas/validation';

// ============================================
// CONFIGURATION
// ============================================

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Créer les dossiers d'upload
ensureUploadDirs();

// Sécurité: Helmet + CORS + Headers personnalisés
initializeSecurity(app);

// Parser JSON
app.use(express.json());

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Trust proxy pour obtenir la vraie IP derrière un reverse proxy
app.set('trust proxy', 1);

// Rate limiting général (100 req/min)
app.use('/api', generalLimiter);

// ============================================
// ROUTES PUBLIQUES (pas d'authentification)
// ============================================

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 * @body    { identifier: string, password: string }
 */
app.post('/api/auth/login',
    authLimiter,
    validateBody(loginSchema),
    async (req: Request, res: Response): Promise<void> => {
        const { identifier, password } = req.body;

        try {
            const user = await prisma.user.findFirst({
                where: { OR: [{ email: identifier }, { username: identifier }] }
            });

            if (!user || !bcrypt.compareSync(password, user.password)) {
                res.status(401).json({
                    error: "Identifiants invalides",
                    code: "INVALID_CREDENTIALS",
                    message: "Email/username ou mot de passe incorrect"
                });
                return;
            }

            const token = generateToken(user.id, user.role, 7200);
            const { password: _, ...userWithoutPassword } = user;

            console.log(`✅ Login réussi: ${user.username} (${user.role})`);

            res.json({
                token,
                user: { ...userWithoutPassword, name: `${user.firstName} ${user.lastName}` },
                expiresAt: Date.now() + 7200000
            });
        } catch (error) {
            console.error('❌ Erreur login:', error);
            res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   POST /api/auth/register
 * @desc    Inscription utilisateur
 * @access  Public
 */
app.post('/api/auth/register',
    registerLimiter,
    validateBody(registerSchema),
    async (req: Request, res: Response): Promise<void> => {
        const { firstName, lastName, username, email, password, role, department, phone, avatar } = req.body;

        const hashedPassword = bcrypt.hashSync(password, 10);

        try {
            const user = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    username,
                    email,
                    password: hashedPassword,
                    role: role || 'CONTRIBUTOR',
                    department,
                    phone,
                    avatar
                }
            });
            const { password: _, ...userWithoutPassword } = user;
            console.log(`✅ Inscription réussie: ${user.username}`);
            res.json({ ...userWithoutPassword, name: `${user.firstName} ${user.lastName}` });
        } catch (e: any) {
            console.error('❌ Erreur register:', e);
            if (e.code === 'P2002') {
                const field = e.meta?.target?.[0] || 'email ou username';
                res.status(400).json({
                    error: "Utilisateur existe déjà",
                    code: "USER_EXISTS",
                    message: `Un utilisateur avec ce ${field} existe déjà`
                });
            } else {
                res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
            }
        }
    }
);

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer l'utilisateur connecté
 * @access  Private
 */
app.get('/api/auth/me',
    authenticate,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    avatar: true,
                    role: true,
                    department: true,
                    phone: true
                }
            });

            if (!user) {
                res.status(404).json({ error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" });
                return;
            }

            res.json({ ...user, name: `${user.firstName} ${user.lastName}` });
        } catch (error) {
            console.error('❌ Erreur GET /auth/me:', error);
            res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir le token
 * @access  Private
 */
app.post('/api/auth/refresh',
    authenticate,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const newToken = generateToken(req.user!.userId, req.user!.role, 7200);
            console.log(`🔄 Token rafraîchi pour: ${req.user!.userId}`);
            res.json({
                token: newToken,
                expiresAt: Date.now() + 7200000
            });
        } catch (error) {
            console.error('❌ Erreur refresh token:', error);
            res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
        }
    }
);

// ============================================
// ROUTES PROTÉGÉES - USERS
// ============================================

/**
 * @route   GET /api/users
 * @desc    Liste tous les utilisateurs
 * @access  Private
 */
app.get('/api/users',
    authenticate,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    avatar: true,
                    role: true,
                    department: true,
                    phone: true
                }
            });
            const formatted = users.map(u => ({ ...u, name: `${u.firstName} ${u.lastName}` }));
            console.log(`📋 GET /users - ${formatted.length} utilisateurs`);
            res.json(formatted);
        } catch (error) {
            console.error('❌ Erreur GET /users:', error);
            res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Modifier un utilisateur
 * @access  Private (Admin ou soi-même)
 */
app.put('/api/users/:id',
    authenticate,
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const id = getValidatedId(req);
        const { firstName, lastName, username, email, role, department, phone, avatar } = req.body;

        if (req.user!.role !== 'ADMIN' && req.user!.userId !== id) {
            res.status(403).json({
                error: "Accès non autorisé",
                code: "FORBIDDEN",
                message: "Vous ne pouvez modifier que votre propre profil"
            });
            return;
        }

        if (req.user!.role !== 'ADMIN' && role && role !== req.user!.role) {
            res.status(403).json({
                error: "Action non autorisée",
                code: "FORBIDDEN",
                message: "Seul un admin peut modifier les rôles"
            });
            return;
        }

        try {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: { firstName, lastName, username, email, role, department, phone, avatar }
            });
            const { password: _, ...userWithoutPassword } = updatedUser;
            console.log(`✏️ User mis à jour: ${updatedUser.username}`);
            res.json({ ...userWithoutPassword, name: `${updatedUser.firstName} ${updatedUser.lastName}` });
        } catch (e: any) {
            console.error('❌ Erreur PUT /users:', e);
            if (e.code === 'P2025') {
                res.status(404).json({ error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" });
            } else if (e.code === 'P2002') {
                res.status(400).json({
                    error: "Conflit de données",
                    code: "DUPLICATE_FIELD",
                    message: "Email ou username déjà utilisé"
                });
            } else {
                res.status(500).json({ error: "Erreur mise à jour", code: "SERVER_ERROR" });
            }
        }
    }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (Admin only)
 */
app.delete('/api/users/:id',
    sensitiveLimiter,
    authenticate,
    adminOnly,
    validateParams(userIdParamSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const id = getValidatedId(req);

        if (req.user!.userId === id) {
            res.status(400).json({
                error: "Action non autorisée",
                code: "SELF_DELETE",
                message: "Vous ne pouvez pas supprimer votre propre compte"
            });
            return;
        }

        try {
            await prisma.user.delete({ where: { id } });
            console.log(`🗑️ User supprimé: ${id}`);
            res.json({ success: true, message: "Utilisateur supprimé" });
        } catch (e: any) {
            console.error('❌ Erreur DELETE /users:', e);
            if (e.code === 'P2025') {
                res.status(404).json({ error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" });
            } else {
                res.status(500).json({ error: "Erreur suppression", code: "SERVER_ERROR" });
            }
        }
    }
);

// ============================================
// ROUTES PROTÉGÉES - PROJECTS
// ============================================

/**
 * @route   GET /api/projects
 * @desc    Liste tous les projets
 * @access  Private
 */
app.get('/api/projects',
    authenticate,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const projects = await prisma.project.findMany({
                include: {
                    owner: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            });
            console.log(`📁 GET /projects - ${projects.length} projets`);
            res.json(projects);
        } catch (error) {
            console.error('❌ Erreur GET /projects:', error);
            res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   POST /api/projects
 * @desc    Créer un projet
 * @access  Private (Admin ou Manager)
 */
app.post('/api/projects',
    authenticate,
    managerOrAdmin,
    validateBody(createProjectSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { name, color, ownerId } = req.body;
        const finalOwnerId = ownerId || req.user!.userId;

        try {
            const project = await prisma.project.create({
                data: { name, color: color || '#6366f1', ownerId: finalOwnerId }
            });
            console.log(`✅ Projet créé: ${project.name}`);
            res.json(project);
        } catch (e: any) {
            console.error('❌ Erreur POST /projects:', e);
            if (e.code === 'P2003') {
                res.status(400).json({
                    error: "Propriétaire invalide",
                    code: "INVALID_OWNER",
                    message: "L'utilisateur propriétaire n'existe pas"
                });
            } else {
                res.status(500).json({ error: "Erreur création projet", code: "SERVER_ERROR" });
            }
        }
    }
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Supprimer un projet
 * @access  Private (Admin ou Owner)
 */
app.delete('/api/projects/:id',
    sensitiveLimiter,
    authenticate,
    validateParams(projectIdParamSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const id = getValidatedId(req);

        try {
            const project = await prisma.project.findUnique({ where: { id } });

            if (!project) {
                res.status(404).json({ error: "Projet non trouvé", code: "PROJECT_NOT_FOUND" });
                return;
            }

            if (req.user!.role !== 'ADMIN' && project.ownerId !== req.user!.userId) {
                res.status(403).json({
                    error: "Accès non autorisé",
                    code: "FORBIDDEN",
                    message: "Seul l'owner ou un admin peut supprimer ce projet"
                });
                return;
            }

            await prisma.project.delete({ where: { id } });
            console.log(`🗑️ Projet supprimé: ${id}`);
            res.json({ success: true, message: "Projet supprimé" });
        } catch (e) {
            console.error('❌ Erreur DELETE /projects:', e);
            res.status(500).json({ error: "Erreur suppression", code: "SERVER_ERROR" });
        }
    }
);

// ============================================
// ROUTES PROTÉGÉES - UPLOADS (ATTACHMENTS)
// ============================================

/**
 * @route   POST /api/attachments/task/:taskId
 * @desc    Uploader des fichiers pour une tâche
 * @access  Private
 */
app.post('/api/attachments/task/:taskId',
    authenticate,
    setUploadType('tasks'),
    upload.array('files', 5),
    handleMulterError,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const taskId = req.params.taskId;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ error: "Aucun fichier fourni", code: "NO_FILES" });
            return;
        }

        try {
            // Vérifier que la tâche existe
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) {
                res.status(404).json({ error: "Tâche non trouvée", code: "TASK_NOT_FOUND" });
                return;
            }

            // Créer les attachements en base
            const attachments = await Promise.all(
                files.map(file => {
                    const formatted = formatUploadedFile(file, 'tasks');
                    return prisma.attachment.create({
                        data: {
                            name: formatted.name,
                            url: formatted.url,
                            type: formatted.type,
                            size: formatted.size,
                            taskId: taskId
                        }
                    });
                })
            );

            console.log(`📎 ${attachments.length} fichiers uploadés pour tâche: ${taskId}`);
            res.json({ success: true, attachments });
        } catch (error) {
            console.error('❌ Erreur upload attachments:', error);
            res.status(500).json({ error: "Erreur upload", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   POST /api/attachments/subtask/:subtaskId
 * @desc    Uploader des fichiers pour une sous-tâche
 * @access  Private
 */
app.post('/api/attachments/subtask/:subtaskId',
    authenticate,
    setUploadType('subtasks'),
    upload.array('files', 5),
    handleMulterError,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const subtaskId = req.params.subtaskId;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ error: "Aucun fichier fourni", code: "NO_FILES" });
            return;
        }

        try {
            // Vérifier que la sous-tâche existe
            const subtask = await prisma.subTask.findUnique({ where: { id: subtaskId } });
            if (!subtask) {
                res.status(404).json({ error: "Sous-tâche non trouvée", code: "SUBTASK_NOT_FOUND" });
                return;
            }

            // Créer les attachements en base
            const attachments = await Promise.all(
                files.map(file => {
                    const formatted = formatUploadedFile(file, 'subtasks');
                    return prisma.attachment.create({
                        data: {
                            name: formatted.name,
                            url: formatted.url,
                            type: formatted.type,
                            size: formatted.size,
                            subtaskId: subtaskId
                        }
                    });
                })
            );

            console.log(`📎 ${attachments.length} fichiers uploadés pour sous-tâche: ${subtaskId}`);
            res.json({ success: true, attachments });
        } catch (error) {
            console.error('❌ Erreur upload attachments:', error);
            res.status(500).json({ error: "Erreur upload", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Supprimer un attachment
 * @access  Private
 */
app.delete('/api/attachments/:id',
    authenticate,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const id = req.params.id;
        const idValue = Array.isArray(id) ? id[0] : id;

        try {
            const attachment = await prisma.attachment.findUnique({ where: { id: idValue } });

            if (!attachment) {
                res.status(404).json({ error: "Fichier non trouvé", code: "ATTACHMENT_NOT_FOUND" });
                return;
            }

            // Supprimer le fichier physique
            deleteFileByUrl(attachment.url);

            // Supprimer l'entrée en base
            await prisma.attachment.delete({ where: { id: idValue } });

            console.log(`🗑️ Attachment supprimé: ${id}`);
            res.json({ success: true, message: "Fichier supprimé" });
        } catch (error) {
            console.error('❌ Erreur DELETE attachment:', error);
            res.status(500).json({ error: "Erreur suppression", code: "SERVER_ERROR" });
        }
    }
);

// ============================================
// ROUTES PROTÉGÉES - TASKS
// ============================================

// Include commun pour les tâches
const taskInclude = {
    assignee: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            username: true,
            phone: true
        }
    },
    subtasks: {
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            },
            attachments: true // Inclure les attachments des subtasks
        }
    },
    comments: {
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            }
        }
    },
    attachments: true // Inclure les attachments de la tâche
};

// Helper pour formater une tâche
const formatTask = (task: any) => ({
    ...task,
    assignee: task.assignee ? {
        ...task.assignee,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`
    } : null,
    subtasks: task.subtasks.map((st: any) => ({
        ...st,
        assignee: st.assignee ? {
            ...st.assignee,
            name: `${st.assignee.firstName} ${st.assignee.lastName}`
        } : null
    })),
    comments: task.comments.map((c: any) => ({
        ...c,
        user: {
            ...c.user,
            name: `${c.user.firstName} ${c.user.lastName}`
        }
    }))
});

/**
 * @route   GET /api/tasks
 * @desc    Liste toutes les tâches
 * @access  Private
 */
app.get('/api/tasks',
    authenticate,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tasks = await prisma.task.findMany({
                include: taskInclude,
                orderBy: { createdAt: 'desc' }
            });

            const formattedTasks = tasks.map(formatTask);
            console.log(`📝 GET /tasks - ${formattedTasks.length} tâches`);
            res.json(formattedTasks);
        } catch (error) {
            console.error('❌ Erreur GET /tasks:', error);
            res.status(500).json({ error: "Erreur serveur", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   POST /api/tasks
 * @desc    Créer une tâche
 * @access  Private
 */
app.post('/api/tasks',
    authenticate,
    validateBody(createTaskSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { title, description, status, priority, dueDate, projectId, assigneeId, subtasks } = req.body;
        const finalAssigneeId = assigneeId || req.user!.userId;

        try {
            const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
            if (!projectExists) {
                res.status(400).json({
                    error: "Projet invalide",
                    code: "INVALID_PROJECT",
                    message: "Le projet spécifié n'existe pas"
                });
                return;
            }

            const assigneeExists = await prisma.user.findUnique({ where: { id: finalAssigneeId } });
            if (!assigneeExists) {
                res.status(400).json({
                    error: "Assigné invalide",
                    code: "INVALID_ASSIGNEE",
                    message: "L'utilisateur assigné n'existe pas"
                });
                return;
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    status: status || 'TODO',
                    priority: priority || 'MEDIUM',
                    dueDate,
                    projectId,
                    assigneeId: finalAssigneeId,
                    subtasks: {
                        create: subtasks?.map((st: any) => ({
                            title: st.title,
                            completed: st.completed || false,
                            dueDate: st.dueDate,
                            assigneeId: st.assigneeId || st.assignee?.id || null
                        })) || []
                    }
                },
                include: taskInclude
            });

            console.log(`✅ Tâche créée: ${task.title}`);
            res.json(formatTask(task));
        } catch (error) {
            console.error('❌ Erreur POST /tasks:', error);
            res.status(500).json({ error: "Erreur création tâche", code: "SERVER_ERROR" });
        }
    }
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Modifier une tâche (PRÉSERVE les subtasks et leurs attachements)
 * @access  Private (Admin, Manager, ou Assignee)
 */
app.put('/api/tasks/:id',
    authenticate,
    validateParams(taskIdParamSchema),
    validateBody(updateTaskSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const id = getValidatedId(req);
        const { title, description, status, priority, dueDate, assigneeId, projectId, subtasks } = req.body;

        try {
            // Récupérer la tâche existante avec ses subtasks
            const existingTask = await prisma.task.findUnique({
                where: { id },
                include: { 
                    subtasks: { include: { attachments: true } },
                    attachments: true 
                }
            });

            if (!existingTask) {
                res.status(404).json({ error: "Tâche non trouvée", code: "TASK_NOT_FOUND" });
                return;
            }

            const canEdit =
                req.user!.role === 'ADMIN' ||
                req.user!.role === 'MANAGER' ||
                existingTask.assigneeId === req.user!.userId;

            if (!canEdit) {
                res.status(403).json({
                    error: "Accès non autorisé",
                    code: "FORBIDDEN",
                    message: "Vous ne pouvez pas modifier cette tâche"
                });
                return;
            }

            // Préparer les données de mise à jour
            const updateData: any = {
                title,
                description,
                status,
                priority,
                dueDate,
                assigneeId,
                projectId,
            };

            // Gestion intelligente des subtasks si fournies
            if (subtasks !== undefined) {
                const existingSubtaskIds = existingTask.subtasks.map(st => st.id);
                const incomingSubtaskIds = subtasks.filter((st: any) => st.id).map((st: any) => st.id);
                
                // Subtasks à supprimer (présentes en base mais pas dans la requête)
                const subtasksToDelete = existingSubtaskIds.filter(id => !incomingSubtaskIds.includes(id));
                
                // Supprimer les fichiers associés aux subtasks supprimées
                for (const subtaskId of subtasksToDelete) {
                    const subtask = existingTask.subtasks.find(st => st.id === subtaskId);
                    if (subtask && subtask.attachments) {
                        for (const att of subtask.attachments) {
                            deleteFileByUrl(att.url);
                        }
                    }
                }

                // Supprimer les subtasks qui ne sont plus dans la liste
                if (subtasksToDelete.length > 0) {
                    await prisma.attachment.deleteMany({
                        where: { subtaskId: { in: subtasksToDelete } }
                    });
                    await prisma.subTask.deleteMany({
                        where: { id: { in: subtasksToDelete } }
                    });
                }

                // Mettre à jour ou créer les subtasks
                for (const st of subtasks) {
                    const subtaskAssigneeId = st.assignee?.id || st.assigneeId || null;
                    
                    if (st.id && existingSubtaskIds.includes(st.id)) {
                        // Mise à jour d'une subtask existante
                        await prisma.subTask.update({
                            where: { id: st.id },
                            data: {
                                title: st.title,
                                completed: st.completed || false,
                                dueDate: st.dueDate || null,
                                assigneeId: subtaskAssigneeId
                            }
                        });
                    } else {
                        // Création d'une nouvelle subtask
                        await prisma.subTask.create({
                            data: {
                                title: st.title,
                                completed: st.completed || false,
                                dueDate: st.dueDate || null,
                                assigneeId: subtaskAssigneeId,
                                taskId: id
                            }
                        });
                    }
                }
            }

            // Mettre à jour la tâche principale
            const updatedTask = await prisma.task.update({
                where: { id },
                data: updateData,
                include: taskInclude
            });

            console.log(`✏️ Tâche mise à jour: ${updatedTask.title}`);
            res.json(formatTask(updatedTask));
        } catch (e: any) {
            console.error('❌ Erreur PUT /tasks:', e);
            if (e.code === 'P2003') {
                res.status(400).json({
                    error: "Référence invalide",
                    code: "INVALID_REFERENCE",
                    message: "Le projet ou l'assigné spécifié n'existe pas"
                });
            } else {
                res.status(500).json({ error: "Erreur update tâche", code: "SERVER_ERROR" });
            }
        }
    }
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Supprimer une tâche (et ses fichiers associés)
 * @access  Private (Admin, Manager, ou Assignee)
 */
app.delete('/api/tasks/:id',
    sensitiveLimiter,
    authenticate,
    validateParams(taskIdParamSchema),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const id = getValidatedId(req);

        try {
            const existingTask = await prisma.task.findUnique({
                where: { id },
                include: {
                    attachments: true,
                    subtasks: { include: { attachments: true } }
                }
            });

            if (!existingTask) {
                res.status(404).json({ error: "Tâche non trouvée", code: "TASK_NOT_FOUND" });
                return;
            }

            const canDelete =
                req.user!.role === 'ADMIN' ||
                req.user!.role === 'MANAGER' ||
                existingTask.assigneeId === req.user!.userId;

            if (!canDelete) {
                res.status(403).json({
                    error: "Accès non autorisé",
                    code: "FORBIDDEN",
                    message: "Vous ne pouvez pas supprimer cette tâche"
                });
                return;
            }

            // Supprimer les fichiers physiques des attachments de la tâche
            for (const att of existingTask.attachments) {
                deleteFileByUrl(att.url);
            }

            // Supprimer les fichiers physiques des attachments des subtasks
            for (const subtask of existingTask.subtasks) {
                for (const att of subtask.attachments) {
                    deleteFileByUrl(att.url);
                }
            }

            // Supprimer la tâche (cascade delete en base)
            await prisma.task.delete({ where: { id } });
            console.log(`🗑️ Tâche supprimée: ${id}`);
            res.json({ success: true, message: "Tâche supprimée" });
        } catch (e) {
            console.error('❌ Erreur DELETE /tasks:', e);
            res.status(500).json({ error: "Erreur suppression", code: "SERVER_ERROR" });
        }
    }
);

// ============================================
// HEALTH CHECK (Public)
// ============================================

app.get('/api/health', (req: Request, res: Response): void => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.5.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
            authentication: true,
            validation: 'zod',
            rateLimiting: true,
            helmet: true,
            cors: true,
            fileUpload: true,
            database: 'sqlite/prisma'
        }
    });
});

// ============================================
// DÉMARRAGE SERVEUR
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           🚀 ZenTask Pro Backend v1.5.0                  ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Server:     http://localhost:${PORT}                    ║`);
    console.log(`║  🔐 Auth:       JWT (2h expiration)                      ║`);
    console.log(`║  ✅ Validation: Zod schemas                              ║`);
    console.log(`║  💾 Database:   SQLite via Prisma                        ║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    logSecurityConfig();
    console.log('╠══════════════════════════════════════════════════════════╣');
    logRateLimitConfig();
    console.log('╠══════════════════════════════════════════════════════════╣');
    logUploadConfig();
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  📡 Endpoints:                                           ║');
    console.log('║  ├─ PUBLIC                                               ║');
    console.log('║  │  POST /api/auth/login                                 ║');
    console.log('║  │  POST /api/auth/register                              ║');
    console.log('║  │  GET  /api/health                                     ║');
    console.log('║  ├─ UPLOADS                                              ║');
    console.log('║  │  POST /api/attachments/task/:taskId                   ║');
    console.log('║  │  POST /api/attachments/subtask/:subtaskId             ║');
    console.log('║  │  DELETE /api/attachments/:id                          ║');
    console.log('║  │  GET  /uploads/*  (static files)                      ║');
    console.log('║  ├─ PROTECTED                                            ║');
    console.log('║  │  GET/PUT/DELETE /api/users                            ║');
    console.log('║  │  GET/POST/DELETE /api/projects                        ║');
    console.log('║  │  GET/POST/PUT/DELETE /api/tasks                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
});
