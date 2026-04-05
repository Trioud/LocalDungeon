import { z } from 'zod';

export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  class: z.string().min(1).max(50),
  race: z.string().min(1).max(50),
  level: z.number().int().min(1).max(20).default(1),
});

export const CastSpellSchema = z.object({
  sessionId: z.string().uuid(),
  combatantId: z.string().min(1),
  spellName: z.string().min(1).max(100),
  slotLevel: z.number().int().min(1).max(9),
});

export const RollDiceSchema = z.object({
  sessionId: z.string().uuid(),
  notation: z.string().regex(/^\d+d\d+([+-]\d+)?$/, 'Invalid dice notation'),
  label: z.string().max(80).optional(),
});

export const SessionIdSchema = z.object({
  sessionId: z.string().uuid(),
});
