import { describe, it, expect } from 'vitest';
import { formatUser } from '../src/utils/formatters';

describe('formatUser', () => {
  it('retire le mot de passe et compose le nom', () => {
    const u = { id: '1', firstName: 'Abdoulaye', lastName: 'Ndiaye', username: 'asega',
      email: 'a@b.c', password: 'hash-secret', role: 'ADMIN' };
    const out: any = formatUser(u);
    expect(out.password).toBeUndefined();
    expect(out.id).toBe('1');
    expect(out.email).toBe('a@b.c');
  });
});
