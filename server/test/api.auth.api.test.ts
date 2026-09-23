import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// Comptes issus du seed (prisma/seed.ts)
const ADMIN = { identifier: 'admin@zentask.com', password: 'password123' };

describe('API /auth', () => {
  it('login réussit avec des identifiants valides', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user?.email).toBe('admin@zentask.com');
    expect(res.body.user?.password).toBeUndefined();
  });

  it('login échoue avec un mauvais mot de passe', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ identifier: 'admin@zentask.com', password: 'mauvais' });
    expect(res.status).toBe(401);
  });

  it('refuse l’accès aux routes protégées sans token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

describe('API CRUD projet + tâche', () => {
  let token = '';
  let userId = '';
  let projectId = '';
  let taskId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    token = res.body.token;
    userId = res.body.user.id;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('crée un projet', async () => {
    const res = await request(app).post('/api/projects').set(auth())
      .send({ name: 'Projet Test CI', color: '#6366f1', ownerId: userId });
    expect([200, 201]).toContain(res.status);
    projectId = res.body.id;
    expect(projectId).toBeTruthy();
  });

  it('crée une tâche dans le projet', async () => {
    const res = await request(app).post('/api/tasks').set(auth())
      .send({
        title: 'Tâche Test CI',
        description: 'créée par le test',
        priority: 'HIGH',
        status: 'TODO',
        projectId,
        assigneeId: userId,
        dueDate: new Date().toISOString(),
      });
    expect([200, 201]).toContain(res.status);
    taskId = res.body.id;
    expect(taskId).toBeTruthy();
  });

  it('récupère la tâche créée', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Tâche Test CI');
  });

  it('supprime la tâche et le projet', async () => {
    const t = await request(app).delete(`/api/tasks/${taskId}`).set(auth());
    expect([200, 204]).toContain(t.status);
    const p = await request(app).delete(`/api/projects/${projectId}`).set(auth());
    expect([200, 204]).toContain(p.status);
  });
});
