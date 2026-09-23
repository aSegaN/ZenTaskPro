import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock du client API avant import du service
vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

import api from '../services/api';
import { authService } from '../services/authService';

const mockedPost = (api as any).post as ReturnType<typeof vi.fn>;

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedPost.mockReset();
  });

  it('login stocke le token et la session, renvoie le user', async () => {
    const user = { id: 'u1', firstName: 'Abdoulaye', role: 'ADMIN' };
    mockedPost.mockResolvedValue({ data: { token: 'tok123', user, expiresAt: Date.now() + 100000 } });

    const result = await authService.login({ identifier: 'asega', password: 'x' });

    expect(result).toEqual(user);
    expect(localStorage.getItem('token')).toBe('tok123');
    expect(authService.getSession()?.user.id).toBe('u1');
  });

  it('login échoue si la réponse ne contient pas de token', async () => {
    mockedPost.mockResolvedValue({ data: { user: { id: 'u1' } } });
    await expect(authService.login({ identifier: 'a', password: 'b' })).rejects.toThrow();
  });

  it('getSession renvoie null quand la session a expiré', async () => {
    const user = { id: 'u1' };
    mockedPost.mockResolvedValue({ data: { token: 't', user, expiresAt: Date.now() - 1 } });
    await authService.login({ identifier: 'a', password: 'b' });
    expect(authService.getSession()).toBeNull();
  });

  it('logout vide la session', async () => {
    const user = { id: 'u1' };
    mockedPost.mockResolvedValue({ data: { token: 't', user, expiresAt: Date.now() + 100000 } });
    await authService.login({ identifier: 'a', password: 'b' });
    authService.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(authService.getSession()).toBeNull();
  });
});
