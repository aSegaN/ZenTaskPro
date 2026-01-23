
import { User, AuthSession } from '../types';
import { MOCK_USERS } from '../constants';

const SESSION_KEY = 'zentask_session';
const USERS_DB_KEY = 'zentask_users';
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 heures

const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_DB_KEY);
  if (!stored) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  return JSON.parse(stored);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const authService = {
  login: async (identifier: string, password: string): Promise<AuthSession | null> => {
    const users = getStoredUsers();
    // Support login via username OR email
    const user = users.find(u => 
      (u.username.toLowerCase() === identifier.toLowerCase() || 
       u.email.toLowerCase() === identifier.toLowerCase()) && 
      u.password === password
    );
    
    if (!user) return null;

    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
    const payload = btoa(JSON.stringify({ 
      sub: user.id, 
      role: user.role, 
      exp: expiresAt 
    }));
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.simulated_signature`;
    
    const session: AuthSession = { token, user, expiresAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: (): AuthSession | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    try {
      const session: AuthSession = JSON.parse(stored);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  },

  getUsers: (): User[] => {
    return getStoredUsers();
  },

  isAuthenticated: (): boolean => {
    return !!authService.getSession();
  }
};
