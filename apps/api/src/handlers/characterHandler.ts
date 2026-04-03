import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { CharacterService } from '../services/CharacterService.js';

const CreateCharacterSchema = z.object({
  name: z.string().min(2).max(50),
  className: z.string(),
  speciesName: z.string(),
  backgroundName: z.string(),
  alignment: z.string().default('True Neutral'),
  abilityScores: z.object({
    str: z.number().int().min(1).max(20),
    dex: z.number().int().min(1).max(20),
    con: z.number().int().min(1).max(20),
    int: z.number().int().min(1).max(20),
    wis: z.number().int().min(1).max(20),
    cha: z.number().int().min(1).max(20),
  }),
  backstory: z.string().default(''),
  appearance: z.record(z.unknown()).default({}),
  personality: z.record(z.unknown()).default({}),
  feats: z.array(z.string()).default([]),
  spells: z.record(z.unknown()).default({}),
});

const UpdateCharacterSchema = CreateCharacterSchema.partial();

export async function characterRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/characters',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = CreateCharacterSchema.parse(request.body);
      const svc = request.diScope.resolve<CharacterService>('characterService');
      const character = await svc.create(request.user.sub, body);
      return reply.code(201).send(character);
    }
  );

  app.get(
    '/characters',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const svc = request.diScope.resolve<CharacterService>('characterService');
      const characters = await svc.findAllByUser(request.user.sub);
      return reply.send(characters);
    }
  );

  app.get(
    '/characters/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<CharacterService>('characterService');
      const character = await svc.findById(id, request.user.sub);
      return reply.send(character);
    }
  );

  app.patch(
    '/characters/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = UpdateCharacterSchema.parse(request.body);
      const svc = request.diScope.resolve<CharacterService>('characterService');
      const character = await svc.update(id, request.user.sub, body);
      return reply.send(character);
    }
  );

  app.delete(
    '/characters/:id',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<CharacterService>('characterService');
      await svc.delete(id, request.user.sub);
      return reply.code(204).send();
    }
  );
}
