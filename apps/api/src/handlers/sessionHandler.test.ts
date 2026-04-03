import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import { signAccessToken } from '../services/jwtUtils.js';
import type { SessionService } from '../services/SessionService.js';
import type { Env } from '../env.js';

const testEnv: Env = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-32chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-32chars',
  CORS_ORIGIN: 'http://localhost:3000',
};

const validToken = signAccessToken(
  { sub: 'user-1', username: 'alice' },
  testEnv.JWT_ACCESS_SECRET
);

const baseSession = {
  id: 'session-1',
  name: 'Test Session',
  inviteCode: 'ABC123',
  createdById: 'user-1',
  maxPlayers: 6,
  status: 'lobby',
  phase: 'exploration',
  players: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSessionService: Partial<SessionService> = {
  create: vi.fn().mockResolvedValue(baseSession),
  listByUser: vi.fn().mockResolvedValue([baseSession]),
  getInfo: vi.fn().mockResolvedValue(baseSession),
  join: vi.fn().mockResolvedValue(baseSession),
  leave: vi.fn().mockResolvedValue(undefined),
};

async function buildTestApp() {
  const app = await buildApp(testEnv);
  // Override sessionService in the DI scope by monkey-patching request scope creation
  app.addHook('onRequest', async (request) => {
    request.diScope.register({
      sessionService: {
        resolve: () => mockSessionService,
        lifetime: 'SCOPED' as const,
        dispose: undefined,
      } as any,
    });
  });
  return app;
}

describe('sessionHandler', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildTestApp();
  });

  it('POST /sessions → 201 with session data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/sessions',
      headers: { authorization: `Bearer ${validToken}` },
      payload: { name: 'My Session', maxPlayers: 4 },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toMatchObject({ id: 'session-1' });
    expect(mockSessionService.create).toHaveBeenCalledWith('user-1', 'My Session', 4);
  });

  it('GET /sessions → 200 with array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/sessions',
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([baseSession]);
  });

  it('GET /sessions/:id → 200 with session info', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/sessions/session-1',
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({ id: 'session-1' });
  });

  it('POST /sessions/:id/join → 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/sessions/session-1/join',
      headers: { authorization: `Bearer ${validToken}` },
      payload: { characterId: 'char-1' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockSessionService.join).toHaveBeenCalledWith('user-1', 'char-1', 'session-1');
  });

  it('DELETE /sessions/:id/leave → 204', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/sessions/session-1/leave',
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.statusCode).toBe(204);
    expect(mockSessionService.leave).toHaveBeenCalledWith('user-1', 'session-1');
  });

  it('POST /sessions returns 401 without JWT', async () => {
    const res = await app.inject({ method: 'POST', url: '/sessions', payload: { name: 'x' } });
    expect(res.statusCode).toBe(401);
  });

  it('GET /sessions returns 401 without JWT', async () => {
    const res = await app.inject({ method: 'GET', url: '/sessions' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /sessions/:id returns 401 without JWT', async () => {
    const res = await app.inject({ method: 'GET', url: '/sessions/session-1' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /sessions/:id/join returns 401 without JWT', async () => {
    const res = await app.inject({ method: 'POST', url: '/sessions/session-1/join', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /sessions/:id/leave returns 401 without JWT', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/sessions/session-1/leave' });
    expect(res.statusCode).toBe(401);
  });
});
