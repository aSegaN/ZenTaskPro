import api from './api';
import { User, AuthSession } from '../types';

const SESSION_KEY = 'zentask_session';

export const authService = {
  login: async (identifier: string, password: string): Promise<AuthSession | null> => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const session: AuthSession = response.data;

      // On garde le stockage du token dans localStorage pour la persistance session
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    // Optionnel: Appel API pour invalider le token si géré côté serveur
  },

  getSession: (): AuthSession | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  }
};