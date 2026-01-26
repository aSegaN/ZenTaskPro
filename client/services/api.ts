import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================
// CONFIGURATION
// ============================================

// Utiliser une constante simple pour éviter les problèmes de typage
const API_BASE_URL = 'http://localhost:4000/api';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Créer l'instance Axios
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 secondes
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// INTERCEPTEUR DE REQUÊTE
// Ajoute automatiquement le token JWT à chaque requête
// ============================================

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log en développement
        if (IS_DEV) {
            console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('❌ Erreur requête:', error);
        return Promise.reject(error);
    }
);

// ============================================
// INTERCEPTEUR DE RÉPONSE
// Gère les erreurs 401 (token expiré/invalide)
// ============================================

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    // Succès: retourner la réponse telle quelle
    (response) => {
        return response;
    },

    // Erreur: gérer les cas spéciaux
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Si pas de réponse (erreur réseau)
        if (!error.response) {
            console.error('❌ Erreur réseau - serveur inaccessible');
            return Promise.reject(error);
        }

        const { status, data } = error.response as { status: number; data: any };

        // ============================================
        // GESTION DES ERREURS 401 (Non autorisé)
        // ============================================
        if (status === 401) {
            const errorCode = data?.code;

            // Si c'est une erreur de login (identifiants invalides), ne pas essayer de refresh
            if (originalRequest.url?.includes('/auth/login')) {
                return Promise.reject(error);
            }

            // Si le token a expiré et qu'on n'a pas encore essayé de refresh
            if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {

                if (isRefreshing) {
                    // Une requête de refresh est déjà en cours, mettre en file d'attente
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            }
                            return api(originalRequest);
                        })
                        .catch((err) => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    console.log('🔄 Tentative de rafraîchissement du token...');

                    // Appeler l'endpoint de refresh
                    const response = await api.post('/auth/refresh');
                    const { token: newToken, expiresAt } = response.data;

                    // Sauvegarder le nouveau token
                    localStorage.setItem('token', newToken);
                    localStorage.setItem('expiresAt', expiresAt.toString());

                    console.log('✅ Token rafraîchi avec succès');

                    // Mettre à jour le header de la requête originale
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }

                    // Traiter les requêtes en attente
                    processQueue(null, newToken);

                    // Réessayer la requête originale
                    return api(originalRequest);

                } catch (refreshError) {
                    console.error('❌ Échec du rafraîchissement du token');

                    // Traiter les requêtes en attente avec l'erreur
                    processQueue(refreshError as AxiosError, null);

                    // Nettoyer le localStorage
                    localStorage.removeItem('token');
                    localStorage.removeItem('expiresAt');
                    localStorage.removeItem('user');

                    // Émettre un événement pour notifier l'application
                    window.dispatchEvent(new CustomEvent('auth:expired'));

                    return Promise.reject(refreshError);

                } finally {
                    isRefreshing = false;
                }
            }

            // Pour les autres erreurs 401 (token invalide, absent, etc.)
            if (errorCode !== 'INVALID_CREDENTIALS') {
                console.log('🔒 Session invalide, déconnexion...');

                localStorage.removeItem('token');
                localStorage.removeItem('expiresAt');
                localStorage.removeItem('user');

                // Émettre un événement pour notifier l'application
                window.dispatchEvent(new CustomEvent('auth:expired'));
            }
        }

        // ============================================
        // GESTION DES ERREURS 403 (Accès interdit)
        // ============================================
        if (status === 403) {
            console.warn('🚫 Accès interdit:', data?.message || 'Permissions insuffisantes');
        }

        // ============================================
        // GESTION DES ERREURS 500 (Erreur serveur)
        // ============================================
        if (status >= 500) {
            console.error('💥 Erreur serveur:', data?.message || 'Erreur interne');
        }

        return Promise.reject(error);
    }
);

// ============================================
// EXPORT
// ============================================

export default api;

// ============================================
// HELPERS OPTIONNELS
// ============================================

/**
 * Vérifie si l'utilisateur est actuellement authentifié
 */
export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');

    if (!token || !expiresAt) return false;

    return Date.now() < parseInt(expiresAt);
};

/**
 * Récupère le temps restant avant expiration du token (en ms)
 */
export const getTokenTimeRemaining = (): number => {
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) return 0;

    return Math.max(0, parseInt(expiresAt) - Date.now());
};

/**
 * Formate le temps restant en string lisible
 */
export const getTokenTimeRemainingFormatted = (): string => {
    const ms = getTokenTimeRemaining();
    if (ms <= 0) return 'Expiré';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
};