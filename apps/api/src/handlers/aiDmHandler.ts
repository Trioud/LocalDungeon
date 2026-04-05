import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AIDMService } from '../services/AIDMService.js';
import type { SessionService } from '../services/SessionService.js';

const MessageSchema = z.object({
  message: z.string().max(500).default(''),
});

export async function aiDmRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/sessions/:id/ai-dm',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { message } = MessageSchema.parse(request.body);

      // Verify player is in the session
      const sessionSvc = request.diScope.resolve<SessionService>('sessionService');
      const session = await sessionSvc.getInfo(id);
      const isMember = session.players.some((p) => p.userId === request.user.sub);
      if (!isMember) return reply.code(403).send({ error: 'Forbidden' });

      const aiDmSvc = request.diScope.resolve<AIDMService>('aiDmService');
      const response = await aiDmSvc.chat(id, message);
      return reply.send({ response });
    }
  );

  app.get(
    '/sessions/:id/ai-dm/history',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const sessionSvc = request.diScope.resolve<SessionService>('sessionService');
      const session = await sessionSvc.getInfo(id);
      const isMember = session.players.some((p) => p.userId === request.user.sub);
      if (!isMember) return reply.code(403).send({ error: 'Forbidden' });

      const aiDmSvc = request.diScope.resolve<AIDMService>('aiDmService');
      const history = await aiDmSvc.getHistory(id);
      // Return only user/assistant messages (skip system)
      return reply.send({ history });
    }
  );

  app.delete(
    '/sessions/:id/ai-dm/history',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const sessionSvc = request.diScope.resolve<SessionService>('sessionService');
      const session = await sessionSvc.getInfo(id);
      if (session.createdById !== request.user.sub) return reply.code(403).send({ error: 'Forbidden' });
      const aiDmSvc = request.diScope.resolve<AIDMService>('aiDmService');
      await aiDmSvc.resetHistory(id);
      return reply.code(204).send();
    }
  );
}
