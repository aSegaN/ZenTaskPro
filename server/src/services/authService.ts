import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { formatUser } from '../utils/formatters';
import { AppError } from '../utils/errors';
import { generateToken, getSessionExpiry } from '../middlewares/authMiddleware';

// ============================================
// TYPES
// ============================================

interface RegisterData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    role?: string;
    department?: string | null;
    phone?: string | null;
    avatar?: string | null;
}

// ============================================
// AUTH SERVICE
// ============================================

class AuthService {
    /**
     * Connexion par email ou username
     */
    async login(identifier: string, password: string) {
        // Rechercher par email ou username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            throw new AppError('Identifiants incorrects', 401, 'INVALID_CREDENTIALS');
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new AppError('Identifiants incorrects', 401, 'INVALID_CREDENTIALS');
        }

        // Générer le token
        const token = generateToken(user.id, user.role);

        console.log(`🔐 Login: ${user.email}`);
        return {
            user: formatUser(user),
            token,
            expiresAt: getSessionExpiry(),
        };
    }

    /**
     * Inscription d'un nouvel utilisateur
     */
    async register(data: RegisterData) {
        const { firstName, lastName, username, email, password, role, department, phone, avatar } = data;

        // Vérifier si l'email existe déjà
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });
        if (existingEmail) {
            throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS');
        }

        // Vérifier si le username existe déjà
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUsername) {
            throw new AppError('Ce nom d\'utilisateur est déjà utilisé', 409, 'USERNAME_EXISTS');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
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
                avatar,
            }
        });

        // Générer le token
        const token = generateToken(user.id, user.role);

        console.log(`📝 Inscription: ${user.email} (${user.role})`);
        return {
            user: formatUser(user),
            token,
            expiresAt: getSessionExpiry(),
        };
    }

    /**
     * Récupérer l'utilisateur courant
     */
    async getCurrentUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        return formatUser(user);
    }

    /**
     * Rafraîchir le token JWT
     */
    async refreshToken(userId: string, _role: string) {
        // Vérifier que l'utilisateur existe toujours
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Générer un nouveau token
        const token = generateToken(userId, user.role);

        return { token, expiresAt: getSessionExpiry() };
    }
}

export default new AuthService();
