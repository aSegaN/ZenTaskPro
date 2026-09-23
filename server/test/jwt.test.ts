import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../src/middlewares/authMiddleware';

describe('JWT', () => {
  it('génère puis vérifie un token (roundtrip)', () => {
    const token = generateToken('user-1', 'ADMIN');
    const payload = verifyToken(token);
    expect(payload.userId).toBe('user-1');
    expect(payload.role).toBe('ADMIN');
  });

  it('rejette un token invalide', () => {
    expect(() => verifyToken('pas-un-vrai-token')).toThrow();
  });

  it('rejette un token expiré', () => {
    const token = generateToken('user-1', 'ADMIN', -1); // déjà expiré
    expect(() => verifyToken(token)).toThrow();
  });
});
