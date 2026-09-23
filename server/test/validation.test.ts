import { describe, it, expect } from 'vitest';
import { loginSchema, createProjectSchema } from '../src/schemas/validation';

describe('validation zod', () => {
  it('loginSchema accepte identifiant + mot de passe', () => {
    expect(loginSchema.safeParse({ identifier: 'asega', password: 'x' }).success).toBe(true);
  });
  it('loginSchema rejette les champs vides', () => {
    expect(loginSchema.safeParse({ identifier: '', password: '' }).success).toBe(false);
  });
  it('createProjectSchema rejette un nom trop court', () => {
    expect(createProjectSchema.safeParse({ name: 'A' }).success).toBe(false);
  });
  it('createProjectSchema applique la couleur par défaut', () => {
    const r = createProjectSchema.parse({ name: 'Projet X' });
    expect(r.color).toBeTruthy();
  });
});
