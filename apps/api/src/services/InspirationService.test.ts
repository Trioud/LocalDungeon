import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InspirationService } from './InspirationService.js';
import type { ICharacterRepository, Character } from '../ports/ICharacterRepository.js';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char_1',
    userId: 'user_1',
    name: 'Aldric',
    alignment: 'True Neutral',
    backstory: '',
    appearance: {},
    personality: {},
    className: 'Fighter',
    level: 1,
    hitDie: 10,
    currentHP: 10,
    maxHP: 10,
    tempHP: 0,
    speciesName: 'Human',
    backgroundName: 'Soldier',
    abilityScores: {},
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

function makeRepo(overrides: Partial<ICharacterRepository> = {}): ICharacterRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAllByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setInspiration: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('InspirationService', () => {
  let repo: ICharacterRepository;
  let svc: InspirationService;

  beforeEach(() => {
    repo = makeRepo();
    svc = new InspirationService({ characterRepository: repo });
  });

  describe('getInspiration', () => {
    it('returns false when character has no inspiration', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCharacter({ heroicInspiration: false }));
      const result = await svc.getInspiration('char_1');
      expect(result).toBe(false);
    });

    it('returns true when character has inspiration', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCharacter({ heroicInspiration: true }));
      const result = await svc.getInspiration('char_1');
      expect(result).toBe(true);
    });

    it('throws 404 when character not found', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(svc.getInspiration('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('grantInspiration', () => {
    it('sets inspiration to true', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCharacter());
      await svc.grantInspiration('char_1');
      expect(repo.setInspiration).toHaveBeenCalledWith('char_1', true);
    });

    it('throws 404 when character not found', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(svc.grantInspiration('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('useInspiration', () => {
    it('sets inspiration to false when character has it', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCharacter({ heroicInspiration: true }));
      await svc.useInspiration('char_1');
      expect(repo.setInspiration).toHaveBeenCalledWith('char_1', false);
    });

    it('throws 400 when character does not have inspiration', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCharacter({ heroicInspiration: false }));
      await expect(svc.useInspiration('char_1')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('giftInspiration', () => {
    it('transfers inspiration from giver to recipient', async () => {
      vi.mocked(repo.findById)
        .mockResolvedValueOnce(makeCharacter({ id: 'char_1', heroicInspiration: true }))
        .mockResolvedValueOnce(makeCharacter({ id: 'char_2', heroicInspiration: false }));
      await svc.giftInspiration('char_1', 'char_2');
      expect(repo.setInspiration).toHaveBeenCalledWith('char_1', false);
      expect(repo.setInspiration).toHaveBeenCalledWith('char_2', true);
    });

    it('throws 400 when giver has no inspiration', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCharacter({ heroicInspiration: false }));
      await expect(svc.giftInspiration('char_1', 'char_2')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when recipient already has inspiration', async () => {
      vi.mocked(repo.findById)
        .mockResolvedValueOnce(makeCharacter({ heroicInspiration: true }))
        .mockResolvedValueOnce(makeCharacter({ heroicInspiration: true }));
      await expect(svc.giftInspiration('char_1', 'char_2')).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
