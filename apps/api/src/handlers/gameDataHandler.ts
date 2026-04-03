import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { GameDataService } from '../services/GameDataService.js';

const spellQuerySchema = z.object({
  level: z.coerce.number().int().min(0).max(9).optional(),
  school: z.string().optional(),
  class: z.string().optional(),
  concentration: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .optional(),
  ritual: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .optional(),
});

const featQuerySchema = z.object({
  category: z.string().optional(),
});

export async function gameDataRoutes(app: FastifyInstance): Promise<void> {
  app.get('/game-data/classes', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getClasses());
  });

  app.get(
    '/game-data/classes/:name',
    async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
      const svc = request.diScope.resolve<GameDataService>('gameDataService');
      const result = await svc.getClassByName(request.params.name);
      if (!result) return reply.code(404).send({ error: 'Class not found' });
      return reply.send(result);
    }
  );

  app.get('/game-data/species', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getSpecies());
  });

  app.get('/game-data/backgrounds', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getBackgrounds());
  });

  app.get('/game-data/feats', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    const { category } = featQuerySchema.parse(request.query);
    return reply.send(await svc.getFeats(category));
  });

  app.get('/game-data/spells', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    const query = spellQuerySchema.parse(request.query);
    return reply.send(
      await svc.getSpells({
        level: query.level,
        school: query.school,
        className: query.class,
        concentration: query.concentration,
        ritual: query.ritual,
      })
    );
  });

  app.get(
    '/game-data/spells/:name',
    async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
      const svc = request.diScope.resolve<GameDataService>('gameDataService');
      const result = await svc.getSpellByName(request.params.name);
      if (!result) return reply.code(404).send({ error: 'Spell not found' });
      return reply.send(result);
    }
  );

  app.get('/game-data/weapons', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getWeapons());
  });

  app.get('/game-data/armor', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getArmor());
  });

  app.get('/game-data/conditions', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getConditions());
  });

  app.get('/game-data/languages', async (request: FastifyRequest, reply: FastifyReply) => {
    const svc = request.diScope.resolve<GameDataService>('gameDataService');
    return reply.send(await svc.getLanguages());
  });
}
