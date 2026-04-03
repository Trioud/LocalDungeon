import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const registerBody = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});

const loginBody = z.object({
  email: z.string(),
  password: z.string(),
});

const refreshBody = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/auth/register',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = registerBody.parse(request.body);
      const authService = request.diScope.resolve<import('../services/AuthService.js').AuthService>('authService');
      const user = await authService.register(body.username, body.email, body.password);
      return reply.code(201).send(user);
    }
  );

  app.post(
    '/auth/login',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = loginBody.parse(request.body);
      const authService = request.diScope.resolve<import('../services/AuthService.js').AuthService>('authService');
      const tokens = await authService.login(body.email, body.password);
      return reply.send(tokens);
    }
  );

  app.post(
    '/auth/refresh',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = refreshBody.parse(request.body);
      const authService = request.diScope.resolve<import('../services/AuthService.js').AuthService>('authService');
      const result = await authService.refresh(body.refreshToken);
      return reply.send(result);
    }
  );

  app.delete(
    '/auth/logout',
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authService = request.diScope.resolve<import('../services/AuthService.js').AuthService>('authService');
      await authService.logout(request.user.sub);
      return reply.code(204).send();
    }
  );
}
