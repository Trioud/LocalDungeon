import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import authenticatePlugin from './authenticate.js';
import { signAccessToken } from '../services/jwtUtils.js';

const JWT_SECRET = 'test-access-secret-that-is-long-enough-32chars';

async function buildTestApp() {
  const app = Fastify({ logger: false });
  await app.register(authenticatePlugin, { jwtSecret: JWT_SECRET });

  app.get('/protected', { preHandler: [app.authenticate] }, async (request) => {
    return { user: request.user };
  });

  return app;
}

describe('authenticate plugin', () => {
  it('sets request.user on valid token', async () => {
    const app = await buildTestApp();
    const token = signAccessToken({ sub: 'user-1', username: 'alice' }, JWT_SECRET);

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: { sub: 'user-1', username: 'alice' } });
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/protected' });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 401 for expired token', async () => {
    const app = await buildTestApp();
    const jwt = await import('jsonwebtoken');
    const expiredToken = jwt.default.sign({ sub: 'user-1', username: 'alice' }, JWT_SECRET, { expiresIn: 0 });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 401 for tampered token', async () => {
    const app = await buildTestApp();
    const token = signAccessToken({ sub: 'user-1', username: 'alice' }, JWT_SECRET);
    const tampered = token.slice(0, -5) + 'XXXXX';

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${tampered}` },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
