import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { CharacterService } from '../services/CharacterService.js';
import type { LevelUpService } from '../services/LevelUpService.js';
import type { PortraitService } from '../services/PortraitService.js';
import type { InspirationService } from '../services/InspirationService.js';

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

const AwardXPSchema = z.object({
  xp: z.number().int().min(1),
});

const ASIChoiceSchema = z.union([
  z.object({
    type: z.literal('asi'),
    ability1: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
    ability2: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']).optional(),
  }),
  z.object({
    type: z.literal('feat'),
    featName: z.string(),
  }),
]);

const LevelUpChoiceSchema = z.object({
  classToLevel: z.string(),
  hpRoll: z.number().int().min(1).optional(),
  asiChoice: ASIChoiceSchema.optional(),
  subclassChoice: z.string().optional(),
  newSpellsLearned: z.array(z.string()).optional(),
});

const LevelUpBodySchema = z.object({
  choice: LevelUpChoiceSchema,
});

const GiftInspirationSchema = z.object({
  toCharacterId: z.string(),
});

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

  app.post(
    '/characters/:id/award-xp',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { xp } = AwardXPSchema.parse(request.body);
      const svc = request.diScope.resolve<LevelUpService>('levelUpService');
      const result = await svc.awardXP(id, xp);
      return reply.send(result);
    }
  );

  app.get(
    '/characters/:id/level-up-preview',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { class: classToLevel } = request.query as { class?: string };
      if (!classToLevel) {
        return reply.code(400).send({ error: 'Query param "class" is required' });
      }
      const svc = request.diScope.resolve<LevelUpService>('levelUpService');
      const preview = await svc.previewLevelUp(id, classToLevel);
      return reply.send(preview);
    }
  );

  app.post(
    '/characters/:id/level-up',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { choice } = LevelUpBodySchema.parse(request.body);
      const svc = request.diScope.resolve<LevelUpService>('levelUpService');
      const character = await svc.confirmLevelUp(id, choice);
      return reply.send(character);
    }
  );

  app.get(
    '/characters/:id/class-levels',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<LevelUpService>('levelUpService');
      const result = await svc.fetchClassLevels(id);
      return reply.send(result);
    }
  );

  app.post(
    '/characters/:id/portrait',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }
      const buffer = await data.toBuffer();
      const mimeType = data.mimetype;
      const svc = request.diScope.resolve<PortraitService>('portraitService');
      const portraitUrl = await svc.uploadPortrait(id, buffer, mimeType, request.user.sub);
      return reply.send({ portraitUrl });
    }
  );

  app.get(
    '/characters/:id/portrait-upload-url',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { mimeType } = request.query as { mimeType?: string };
      if (!mimeType) {
        return reply.code(400).send({ error: 'Query param "mimeType" is required' });
      }
      const svc = request.diScope.resolve<PortraitService>('portraitService');
      const result = await svc.getPresignedUrl(id, mimeType, request.user.sub);
      return reply.send(result);
    }
  );

  app.delete(
    '/characters/:id/portrait',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<PortraitService>('portraitService');
      await svc.deletePortrait(id, request.user.sub);
      return reply.code(204).send();
    }
  );

  app.post(
    '/characters/:id/inspiration/grant',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<InspirationService>('inspirationService');
      await svc.grantInspiration(id);
      return reply.code(204).send();
    }
  );

  app.post(
    '/characters/:id/inspiration/use',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const svc = request.diScope.resolve<InspirationService>('inspirationService');
      await svc.useInspiration(id);
      return reply.code(204).send();
    }
  );

  app.post(
    '/characters/:id/inspiration/gift',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { toCharacterId } = GiftInspirationSchema.parse(request.body);
      const svc = request.diScope.resolve<InspirationService>('inspirationService');
      await svc.giftInspiration(id, toCharacterId);
      return reply.code(204).send();
    }
  );
}
