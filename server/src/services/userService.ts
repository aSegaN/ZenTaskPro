import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { formatUser, formatUsers, userSelect } from '../utils/formatters';
import { AppError } from '../utils/errors';

// ============================================
// TYPES
// ============================================

interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    department?: string | null;
    phone?: string | null;
    avatar?: string | null;
}

// ============================================
// USER SERVICE
// ============================================

class UserService {
    /**
     * Récupérer tous les utilisateurs
     */
    async getAll() {
        const users = await prisma.user.findMany({
            select: userSelect,
            orderBy: { firstName: 'asc' }
        });

        console.log(`👥 GET /users - ${users.length} utilisateurs`);
        return formatUsers(users);
    }

    /**
     * Récupérer un utilisateur par ID
     */
    async getById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: userSelect
        });

        if (!user) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        return formatUser(user);
    }

    /**
     * Mettre à jour un utilisateur
     */
    async update(id: string, data: UpdateUserData, currentUserId: string, currentUserRole: string) {
        // Vérifier que l'utilisateur existe
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Vérifier les permissions
        // - Admin peut tout modifier
        // - Utilisateur peut modifier son propre profil (sauf le rôle)
        const canEdit = currentUserRole === 'ADMIN' || currentUserId === id;
        if (!canEdit) {
            throw new AppError('Vous n\'avez pas la permission de modifier cet utilisateur', 403, 'FORBIDDEN');
        }

        // Seul un admin peut changer le rôle
        if (data.role && currentUserRole !== 'ADMIN') {
            throw new AppError('Seul un administrateur peut modifier les rôles', 403, 'FORBIDDEN');
        }

        // Vérifier l'unicité de l'email si modifié
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: data.email }
            });
            if (emailExists) {
                throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS');
            }
        }

        // Vérifier l'unicité du username si modifié
        if (data.username && data.username !== existingUser.username) {
            const usernameExists = await prisma.user.findUnique({
                where: { username: data.username }
            });
            if (usernameExists) {
                throw new AppError('Ce nom d\'utilisateur est déjà utilisé', 409, 'USERNAME_EXISTS');
            }
        }

        // Préparer les données de mise à jour
        const updateData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email,
            role: data.role,
            department: data.department,
            phone: data.phone,
            avatar: data.avatar,
        };

        // Hasher le nouveau mot de passe si fourni
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // Supprimer les champs undefined
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: userSelect
        });

        console.log(`✏️ Utilisateur modifié: ${user.email}`);
        return formatUser(user);
    }

    /**
     * Supprimer un utilisateur
     */
    async delete(id: string, currentUserId: string, currentUserRole: string) {
        // Vérifier que l'utilisateur existe
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Seul un admin peut supprimer des utilisateurs
        if (currentUserRole !== 'ADMIN') {
            throw new AppError('Seul un administrateur peut supprimer des utilisateurs', 403, 'FORBIDDEN');
        }

        // Empêcher l'auto-suppression
        if (id === currentUserId) {
            throw new AppError('Vous ne pouvez pas supprimer votre propre compte', 400, 'CANNOT_DELETE_SELF');
        }

        await prisma.user.delete({
            where: { id }
        });

        console.log(`🗑️ Utilisateur supprimé: ${existingUser.email}`);
        return { success: true, message: 'Utilisateur supprimé' };
    }
}

export default new UserService();
