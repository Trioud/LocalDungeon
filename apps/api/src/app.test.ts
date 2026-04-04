import { describe, it, expect } from 'vitest';
import { buildApp } from './app.js';
import type { Env } from './env.js';

const testEnv: Env = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-32chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-32chars',
  CORS_ORIGIN: 'http://localhost:3000',
  STORAGE_PROVIDER: 'memory',
};

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp(testEnv);
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});
