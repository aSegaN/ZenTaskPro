import { describe, it, expect, vi } from 'vitest';
import { generateToken, authenticateAllowExpired } from '../src/middlewares/authMiddleware';

function mock(token?: string) {
  const req: any = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  const res: any = { statusCode: 0, body: null,
    status(c: number){ this.statusCode = c; return this; },
    json(b: any){ this.body = b; return this; } };
  const next = vi.fn();
  return { req, res, next };
}

describe('authenticateAllowExpired (fenêtre de grâce)', () => {
  it('accepte un jeton fraîchement expiré', () => {
    const token = generateToken('u1', 'ADMIN', -60); // expiré il y a 60 s
    const { req, res, next } = mock(token);
    authenticateAllowExpired(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe('u1');
  });

  it('rejette un jeton expiré au-delà de la grâce', () => {
    process.env.REFRESH_GRACE_SECONDS = '10';
    const token = generateToken('u1', 'ADMIN', -3600); // expiré il y a 1 h
    const { req, res, next } = mock(token);
    authenticateAllowExpired(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
    delete process.env.REFRESH_GRACE_SECONDS;
  });

  it('rejette une absence de jeton', () => {
    const { req, res, next } = mock();
    authenticateAllowExpired(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('MISSING_TOKEN');
  });
});
