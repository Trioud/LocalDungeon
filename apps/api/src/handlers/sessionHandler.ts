import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { SessionService } from '../services/SessionService.js';

const CreateSessionSchema = z.object({
  name: z.string().min(2).max(80),
  maxPlayers: z.number().int().min(2).max(8).default(6),
});

const JoinSessionSchema = z.object({
  characterId: z.string(),
});

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/sessions',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name, maxPlayers } = CreateSessionSchema.parse(request.body);
      const svc = request.diScope.resolve<SessionService>('sessionService');
      const session = await svc.create(request.user.sub, name, maxPlayers);
      return reply.code(201).send(session);
    }
  );

  app.get(
    '/sessions',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const svc = request.diScope.resolve<SessionService>('sessionService');
      const sessions = await svc.listByUser(request.user.sub);
      return reply.send(sessions);
    }
  );

  app.get(
    '/sessions/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<SessionService>('sessionService');
      const session = await svc.getInfo(id);
      return reply.send(session);
    }
  );

  app.post(
    '/sessions/:id/join',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { characterId } = JoinSessionSchema.parse(request.body);
      const svc = request.diScope.resolve<SessionService>('sessionService');
      const session = await svc.join(request.user.sub, characterId, id);
      return reply.send(session);
    }
  );

  app.delete(
    '/sessions/:id/leave',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<SessionService>('sessionService');
      await svc.leave(request.user.sub, id);
      return reply.code(204).send();
    }
  );
}
