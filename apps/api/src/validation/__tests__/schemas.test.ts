import { describe, it, expect } from 'vitest';
import {
  CreateCharacterSchema,
  CastSpellSchema,
  RollDiceSchema,
  SessionIdSchema,
} from '../schemas';

describe('CreateCharacterSchema', () => {
  it('accepts valid input', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Aragorn',
      class: 'Ranger',
      race: 'Human',
      level: 10,
    });
    expect(result.success).toBe(true);
  });

  it('defaults level to 1 when omitted', () => {
    const result = CreateCharacterSchema.safeParse({ name: 'A', class: 'Wizard', race: 'Elf' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.level).toBe(1);
  });

  it('rejects empty name', () => {
    const result = CreateCharacterSchema.safeParse({ name: '', class: 'Wizard', race: 'Elf', level: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 chars', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'A'.repeat(101),
      class: 'Wizard',
      race: 'Elf',
      level: 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts boundary level 1', () => {
    const result = CreateCharacterSchema.safeParse({ name: 'A', class: 'B', race: 'C', level: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts boundary level 20', () => {
    const result = CreateCharacterSchema.safeParse({ name: 'A', class: 'B', race: 'C', level: 20 });
    expect(result.success).toBe(true);
  });

  it('rejects level 0', () => {
    const result = CreateCharacterSchema.safeParse({ name: 'A', class: 'B', race: 'C', level: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects level 21', () => {
    const result = CreateCharacterSchema.safeParse({ name: 'A', class: 'B', race: 'C', level: 21 });
    expect(result.success).toBe(false);
  });
});

describe('CastSpellSchema', () => {
  const valid = {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    combatantId: 'c1',
    spellName: 'Fireball',
    slotLevel: 3,
  };

  it('accepts valid input', () => {
    expect(CastSpellSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid sessionId (not UUID)', () => {
    expect(CastSpellSchema.safeParse({ ...valid, sessionId: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects slotLevel 0', () => {
    expect(CastSpellSchema.safeParse({ ...valid, slotLevel: 0 }).success).toBe(false);
  });

  it('rejects slotLevel 10', () => {
    expect(CastSpellSchema.safeParse({ ...valid, slotLevel: 10 }).success).toBe(false);
  });

  it('rejects empty combatantId', () => {
    expect(CastSpellSchema.safeParse({ ...valid, combatantId: '' }).success).toBe(false);
  });
});

describe('RollDiceSchema', () => {
  const sessionId = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid 2d6 notation', () => {
    const result = RollDiceSchema.safeParse({ sessionId, notation: '2d6' });
    expect(result.success).toBe(true);
  });

  it('accepts notation with modifier', () => {
    const result = RollDiceSchema.safeParse({ sessionId, notation: '1d20+5' });
    expect(result.success).toBe(true);
  });

  it('accepts notation with negative modifier', () => {
    const result = RollDiceSchema.safeParse({ sessionId, notation: '1d8-2' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid notation', () => {
    const result = RollDiceSchema.safeParse({ sessionId, notation: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.notation).toBeDefined();
    }
  });

  it('accepts optional label', () => {
    const result = RollDiceSchema.safeParse({ sessionId, notation: '1d6', label: 'attack roll' });
    expect(result.success).toBe(true);
  });
});

describe('SessionIdSchema', () => {
  it('accepts valid UUID', () => {
    const result = SessionIdSchema.safeParse({ sessionId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID sessionId', () => {
    const result = SessionIdSchema.safeParse({ sessionId: 'bad-id' });
    expect(result.success).toBe(false);
  });
});
