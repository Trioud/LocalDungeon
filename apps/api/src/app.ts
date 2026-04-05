import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import type { AwilixContainer } from 'awilix';
import type { Env } from './env.js';
import { buildContainer } from './container.js';
import authenticatePlugin from './plugins/authenticate.js';
import { authRoutes } from './handlers/authHandler.js';
import { gameDataRoutes } from './handlers/gameDataHandler.js';
import { characterRoutes } from './handlers/characterHandler.js';
import { sessionRoutes } from './handlers/sessionHandler.js';
import { sessionLogRoutes } from './handlers/sessionLogHandler.js';

declare module 'fastify' {
  interface FastifyRequest {
    diScope: AwilixContainer;
  }
}

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  const container = buildContainer(env);

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(multipart, { limits: { fileSize: 6 * 1024 * 1024 } });

  await app.register(authenticatePlugin, { jwtSecret: env.JWT_ACCESS_SECRET });

  app.addHook('onRequest', async (request) => {
    request.diScope = container.createScope();
  });

  app.addHook('onResponse', async (request) => {
    await request.diScope.dispose();
  });

  await app.register(authRoutes);
  await app.register(gameDataRoutes);
  await app.register(characterRoutes);
  await app.register(sessionRoutes);
  await app.register(sessionLogRoutes);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = (error as any).statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : (error as Error).message,
    });
  });

  return app;
}
