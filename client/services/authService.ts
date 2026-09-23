import api from './api';
import { User } from '../types';

// ============================================
// TYPES
// ============================================

interface LoginCredentials {
    identifier: string; // email ou username
    password: string;
}

interface LoginResponse {
    token: string;
    user: User;
    expiresAt: number; // timestamp en ms
}

interface Session {
    user: User;
    token: string;
    expiresAt: number;
}

// ============================================
// SERVICE D'AUTHENTIFICATION
// ============================================

export const authService = {
    /**
     * Connexion utilisateur
     */
    async login(credentials: LoginCredentials): Promise<User> {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        const { token, user, expiresAt } = response.data as any;

        if (!token || !user) {
            throw new Error("Réponse /auth/login invalide (token/user manquant).");
        }

        // fallback: si expiresAt n'est pas renvoyé par l'API
        const safeExpiresAt =
            typeof expiresAt === "number" ? expiresAt : Date.now() + 24 * 60 * 60 * 1000; // 24h par défaut

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('expiresAt', String(safeExpiresAt));

        return user;
    },


    /**
     * Déconnexion utilisateur
     */
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
        console.log('👋 Déconnexion effectuée');
    },

    /**
     * Récupérer la session courante
     */
    getSession(): Session | null {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const expiresAtStr = localStorage.getItem('expiresAt');

        if (!token || !userStr || !expiresAtStr) {
            return null;
        }

        const expiresAt = parseInt(expiresAtStr);

        // Vérifier si le token a expiré
        if (Date.now() >= expiresAt) {
            console.log('⏰ Session expirée');
            this.logout();
            return null;
        }

        try {
            const user = JSON.parse(userStr) as User;
            return { user, token, expiresAt };
        } catch {
            this.logout();
            return null;
        }
    },

    /**
     * Vérifier si l'utilisateur est authentifié
     */
    isAuthenticated(): boolean {
        return this.getSession() !== null;
    },

    /**
     * Récupérer l'utilisateur courant
     */
    getCurrentUser(): User | null {
        const session = this.getSession();
        return session ? session.user : null;
    },

    /**
     * Récupérer le token courant
     */
    getToken(): string | null {
        const session = this.getSession();
        return session ? session.token : null;
    },

    /**
     * Temps restant avant expiration (en ms)
     */
    getTimeRemaining(): number {
        const expiresAtStr = localStorage.getItem('expiresAt');
        if (!expiresAtStr) return 0;
        
        return Math.max(0, parseInt(expiresAtStr) - Date.now());
    },

    /**
     * Vérifier si le token expire bientôt (dans les X ms)
     */
    isExpiringSoon(thresholdMs: number = 10 * 60 * 1000): boolean {
        const remaining = this.getTimeRemaining();
        return remaining > 0 && remaining < thresholdMs;
    },

    /**
     * Rafraîchir le token manuellement
     */
    async refreshToken(): Promise<boolean> {
        try {
            const response = await api.post('/auth/refresh');
            const { token, expiresAt } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('expiresAt', expiresAt.toString());

            console.log('🔄 Token rafraîchi, nouvelle expiration:', new Date(expiresAt).toLocaleTimeString());
            return true;
        } catch {
            console.error('❌ Échec du rafraîchissement');
            return false;
        }
    },

    /**
     * Mettre à jour les infos utilisateur en local
     */
    updateLocalUser(user: User): void {
        localStorage.setItem('user', JSON.stringify(user));
    }
};

export default authService;
