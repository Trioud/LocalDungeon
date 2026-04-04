import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LevelUpService } from './LevelUpService.js';
import type { ICharacterRepository, Character } from '../ports/ICharacterRepository.js';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    userId: 'user-1',
    name: 'Thorin',
    alignment: 'Lawful Good',
    backstory: '',
    appearance: {},
    personality: {},
    className: 'Fighter',
    subclassName: undefined,
    level: 3,
    xp: 900,
    hitDie: 10,
    currentHP: 30,
    maxHP: 30,
    tempHP: 0,
    speciesName: 'Human',
    backgroundName: 'Soldier',
    abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    derivedStats: {},
    proficiencies: {},
    spells: {},
    features: [],
    feats: [],
    inventory: {},
    conditions: [],
    exhaustionLevel: 0,
    isBloodied: false,
    heroicInspiration: false,
    portraitUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRepo(character: Character): ICharacterRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(character),
    findAllByUserId: vi.fn(),
    update: vi.fn().mockImplementation(async (_id, patch) => ({ ...character, ...patch })),
    delete: vi.fn(),
    setInspiration: vi.fn().mockResolvedValue(undefined),
  };
}

describe('LevelUpService', () => {
  describe('awardXP', () => {
    it('adds XP and returns new total without leveling up', async () => {
      const character = makeCharacter({ xp: 900, level: 3 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const result = await svc.awardXP('char-1', 100);
      expect(result.newXP).toBe(1000);
      expect(result.leveledUp).toBe(false);
      expect(result.newLevel).toBe(3);
    });

    it('detects level up when XP threshold crossed', async () => {
      const character = makeCharacter({ xp: 2600, level: 3 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const result = await svc.awardXP('char-1', 200);
      expect(result.newXP).toBe(2800);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(4);
    });

    it('throws 404 when character not found', async () => {
      const repo = makeRepo(makeCharacter());
      (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const svc = new LevelUpService({ characterRepository: repo });
      await expect(svc.awardXP('bad-id', 100)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('previewLevelUp', () => {
    it('returns correct preview for Fighter leveling to 4', async () => {
      const character = makeCharacter({ level: 3 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const preview = await svc.previewLevelUp('char-1', 'Fighter');
      expect(preview.newLevel).toBe(4);
      expect(preview.gainsASI).toBe(true);
      expect(preview.newProficiencyBonus).toBe(2);
    });

    it('throws 404 when character not found', async () => {
      const repo = makeRepo(makeCharacter());
      (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const svc = new LevelUpService({ characterRepository: repo });
      await expect(svc.previewLevelUp('bad-id', 'Fighter')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('confirmLevelUp', () => {
    it('increments level and adds HP', async () => {
      const character = makeCharacter({ level: 3, maxHP: 30, currentHP: 28 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const updated = await svc.confirmLevelUp('char-1', { classToLevel: 'Fighter' });
      expect(updated.level).toBe(4);
      expect(updated.maxHP).toBeGreaterThan(30);
      expect(updated.currentHP).toBeGreaterThan(28);
    });

    it('applies ASI to ability score', async () => {
      const character = makeCharacter({ level: 3, abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 } });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const updated = await svc.confirmLevelUp('char-1', {
        classToLevel: 'Fighter',
        asiChoice: { type: 'asi', ability1: 'str' },
      });
      expect((updated.abilityScores as Record<string, number>)['str']).toBe(18);
    });

    it('applies +1/+1 ASI to two abilities', async () => {
      const character = makeCharacter({ level: 3 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const updated = await svc.confirmLevelUp('char-1', {
        classToLevel: 'Fighter',
        asiChoice: { type: 'asi', ability1: 'str', ability2: 'con' },
      });
      const scores = updated.abilityScores as Record<string, number>;
      expect(scores['str']).toBe(17);
      expect(scores['con']).toBe(15);
    });

    it('sets subclass when subclassChoice provided', async () => {
      const character = makeCharacter({ level: 2 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      const updated = await svc.confirmLevelUp('char-1', {
        classToLevel: 'Fighter',
        subclassChoice: 'Champion',
      });
      expect(updated.subclassName).toBe('Champion');
    });

    it('throws 404 when character not found', async () => {
      const repo = makeRepo(makeCharacter());
      (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const svc = new LevelUpService({ characterRepository: repo });
      await expect(svc.confirmLevelUp('bad-id', { classToLevel: 'Fighter' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getClassLevels', () => {
    it('returns class name to level mapping', () => {
      const character = makeCharacter({ className: 'Wizard', level: 5 });
      const repo = makeRepo(character);
      const svc = new LevelUpService({ characterRepository: repo });
      expect(svc.getClassLevels(character)).toEqual({ Wizard: 5 });
    });
  });
});
