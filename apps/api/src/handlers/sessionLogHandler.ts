import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SessionLogExportService } from '../services/SessionLogExportService.js';

export async function sessionLogRoutes(app: FastifyInstance): Promise<void> {
  const exportRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

  app.get(
    '/sessions/:sessionId/export/text',
    { preHandler: [app.authenticate], ...exportRateLimit },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.params as { sessionId: string };
      const { characters } = request.query as { characters?: string };
      const characterNames = characters ? characters.split(',').map((s) => s.trim()) : [];
      const svc = request.diScope.resolve<SessionLogExportService>('sessionLogExportService');
      const text = await svc.exportText(sessionId, characterNames);
      return reply
        .header('Content-Type', 'text/plain; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="session-log.txt"')
        .send(text);
    },
  );

  app.get(
    '/sessions/:sessionId/export/markdown',
    { preHandler: [app.authenticate], ...exportRateLimit },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.params as { sessionId: string };
      const { characters } = request.query as { characters?: string };
      const characterNames = characters ? characters.split(',').map((s) => s.trim()) : [];
      const svc = request.diScope.resolve<SessionLogExportService>('sessionLogExportService');
      const md = await svc.exportMarkdown(sessionId, characterNames);
      return reply
        .header('Content-Type', 'text/markdown; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="session-log.md"')
        .send(md);
    },
  );

  app.get(
    '/sessions/:sessionId/export/json',
    { preHandler: [app.authenticate], ...exportRateLimit },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.params as { sessionId: string };
      const { characters } = request.query as { characters?: string };
      const characterNames = characters ? characters.split(',').map((s) => s.trim()) : [];
      const svc = request.diScope.resolve<SessionLogExportService>('sessionLogExportService');
      const json = await svc.exportJson(sessionId, characterNames);
      return reply
        .header('Content-Type', 'application/json')
        .send(JSON.parse(json));
    },
  );
}
