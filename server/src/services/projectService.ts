import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';

// ============================================
// TYPES
// ============================================

interface CreateProjectData {
    name: string;
    color?: string;
    ownerId?: string;
}

interface UpdateProjectData {
    name?: string;
    color?: string;
}

// ============================================
// HELPERS
// ============================================

const projectInclude = {
    owner: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
        }
    },
    _count: {
        select: { tasks: true }
    }
};

const formatProject = (project: any) => ({
    ...project,
    owner: project.owner ? {
        ...project.owner,
        name: `${project.owner.firstName} ${project.owner.lastName}`
    } : null,
    taskCount: project._count?.tasks ?? 0
});

// ============================================
// PROJECT SERVICE
// ============================================

class ProjectService {
    /**
     * Récupérer tous les projets
     */
    async getAll() {
        const projects = await prisma.project.findMany({
            include: projectInclude,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📁 GET /projects - ${projects.length} projets`);
        return projects.map(formatProject);
    }

    /**
     * Récupérer un projet par ID
     */
    async getById(id: string) {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                },
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true
                            }
                        },
                        subtasks: true,
                        _count: {
                            select: { comments: true, attachments: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) {
            throw new AppError('Projet non trouvé', 404, 'PROJECT_NOT_FOUND');
        }

        return {
            ...project,
            owner: project.owner ? {
                ...project.owner,
                name: `${project.owner.firstName} ${project.owner.lastName}`
            } : null,
            tasks: project.tasks.map((task: any) => ({
                ...task,
                assignee: task.assignee ? {
                    ...task.assignee,
                    name: `${task.assignee.firstName} ${task.assignee.lastName}`
                } : null
            }))
        };
    }

    /**
     * Créer un projet
     */
    async create(data: CreateProjectData, currentUserId: string) {
        const { name, color, ownerId } = data;

        const project = await prisma.project.create({
            data: {
                name,
                color: color || '#6366f1',
                ownerId: ownerId || currentUserId
            },
            include: projectInclude
        });

        console.log(`✅ Projet créé: ${project.name}`);
        return formatProject(project);
    }

    /**
     * Mettre à jour un projet
     */
    async update(id: string, data: UpdateProjectData, currentUserId: string, currentUserRole: string) {
        // Vérifier que le projet existe
        const existingProject = await prisma.project.findUnique({
            where: { id }
        });

        if (!existingProject) {
            throw new AppError('Projet non trouvé', 404, 'PROJECT_NOT_FOUND');
        }

        // Vérifier les permissions
        const canEdit = 
            currentUserRole === 'ADMIN' ||
            currentUserRole === 'MANAGER' ||
            existingProject.ownerId === currentUserId;

        if (!canEdit) {
            throw new AppError('Vous n\'avez pas la permission de modifier ce projet', 403, 'FORBIDDEN');
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                color: data.color,
            },
            include: projectInclude
        });

        console.log(`✏️ Projet modifié: ${project.name}`);
        return formatProject(project);
    }

    /**
     * Supprimer un projet
     */
    async delete(id: string, currentUserId: string, currentUserRole: string) {
        // Vérifier que le projet existe
        const existingProject = await prisma.project.findUnique({
            where: { id },
            include: {
                _count: { select: { tasks: true } }
            }
        });

        if (!existingProject) {
            throw new AppError('Projet non trouvé', 404, 'PROJECT_NOT_FOUND');
        }

        // Vérifier les permissions
        const canDelete = 
            currentUserRole === 'ADMIN' ||
            currentUserRole === 'MANAGER' ||
            existingProject.ownerId === currentUserId;

        if (!canDelete) {
            throw new AppError('Vous n\'avez pas la permission de supprimer ce projet', 403, 'FORBIDDEN');
        }

        // Supprimer le projet (cascade delete pour les tâches)
        await prisma.project.delete({
            where: { id }
        });

        console.log(`🗑️ Projet supprimé: ${existingProject.name} (${existingProject._count.tasks} tâches)`);
        return { success: true, message: 'Projet supprimé' };
    }
}

export default new ProjectService();
