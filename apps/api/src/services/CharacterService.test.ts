import { describe, it, expect, vi } from 'vitest';
import { CharacterService } from './CharacterService.js';
import type { ICharacterRepository, Character, CharacterSummary } from '../ports/ICharacterRepository.js';
import type { IGameDataRepository } from '../ports/IGameDataRepository.js';

const mockClass = {
  id: 'class-1',
  name: 'Fighter',
  hitDie: 10,
  description: 'A martial warrior',
  primaryAbility: 'str',
  savingThrows: ['str', 'con'],
  armorProfs: ['all', 'shields'],
  weaponProfs: ['simple', 'martial'],
  toolProfs: [],
  skillChoices: 2,
  skillOptions: ['acrobatics', 'athletics'],
  features: [],
  spellcasting: null,
  subclassLevel: 3,
  subclassLabel: 'Martial Archetype',
  subclasses: [],
  createdAt: new Date(),
};

const mockSpecies = {
  id: 'species-1',
  name: 'Human',
  description: 'Versatile',
  size: 'Medium',
  speed: 30,
  traits: [],
  createdAt: new Date(),
};

const mockBackground = {
  id: 'bg-1',
  name: 'Soldier',
  description: 'A military background',
  abilityScores: { str: 2 },
  skillProficiencies: ['athletics', 'intimidation'],
  toolProficiencies: ['dice'],
  languages: 0,
  equipment: [],
  originFeat: 'Savage Attacker',
  feature: {},
  createdAt: new Date(),
};

const mockCharacter: Character = {
  id: 'char-1',
  userId: 'user-1',
  name: 'Thorin',
  alignment: 'Lawful Good',
  backstory: '',
  appearance: {},
  personality: {},
  className: 'Fighter',
  subclassName: undefined,
  level: 1,
  hitDie: 10,
  currentHP: 12,
  maxHP: 12,
  tempHP: 0,
  speciesName: 'Human',
  backgroundName: 'Soldier',
  abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  derivedStats: { ac: 12, initiative: 2, proficiencyBonus: 2, maxHP: 12 },
  proficiencies: {},
  spells: {},
  features: [],
  feats: [],
  inventory: {},
  conditions: [],
  exhaustionLevel: 0,
  isBloodied: false,
  portraitUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeCharacterRepo(overrides: Partial<ICharacterRepository> = {}): ICharacterRepository {
  return {
    create: vi.fn().mockResolvedValue(mockCharacter),
    findById: vi.fn().mockResolvedValue(mockCharacter),
    findAllByUserId: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(mockCharacter),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeGameDataRepo(overrides: Partial<IGameDataRepository> = {}): IGameDataRepository {
  return {
    getClasses: vi.fn().mockResolvedValue([mockClass]),
    getClassByName: vi.fn().mockResolvedValue(mockClass),
    getSpecies: vi.fn().mockResolvedValue([mockSpecies]),
    getBackgrounds: vi.fn().mockResolvedValue([mockBackground]),
    getFeats: vi.fn().mockResolvedValue([]),
    getSpells: vi.fn().mockResolvedValue([]),
    getSpellByName: vi.fn().mockResolvedValue(null),
    getWeapons: vi.fn().mockResolvedValue([]),
    getArmor: vi.fn().mockResolvedValue([]),
    getConditions: vi.fn().mockResolvedValue([]),
    getLanguages: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const baseInput = {
  name: 'Thorin',
  className: 'Fighter',
  speciesName: 'Human',
  backgroundName: 'Soldier',
  alignment: 'Lawful Good',
  abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  backstory: '',
  appearance: {},
  personality: {},
  feats: [],
  spells: {},
};

describe('CharacterService', () => {
  describe('create', () => {
    it('computes maxHP correctly for Fighter level 1 CON 14', async () => {
      let capturedData: any;
      const charRepo = makeCharacterRepo({
        create: vi.fn().mockImplementation(async (data) => {
          capturedData = data;
          return { ...mockCharacter, ...data, id: 'char-1', createdAt: new Date(), updatedAt: new Date() };
        }),
      });
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      await svc.create('user-1', { ...baseInput, abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 } });

      // CON 14 → mod +2, hitDie 10 → maxHP = 10 + 2 = 12
      expect(capturedData.maxHP).toBe(12);
    });

    it('computes proficiencyBonus = 2 at level 1', async () => {
      let capturedData: any;
      const charRepo = makeCharacterRepo({
        create: vi.fn().mockImplementation(async (data) => {
          capturedData = data;
          return { ...mockCharacter, ...data, id: 'char-1', createdAt: new Date(), updatedAt: new Date() };
        }),
      });
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      await svc.create('user-1', baseInput);

      expect((capturedData.derivedStats as any).proficiencyBonus).toBe(2);
    });

    it('throws 404 when class not found', async () => {
      const charRepo = makeCharacterRepo();
      const gameDataRepo = makeGameDataRepo({ getClassByName: vi.fn().mockResolvedValue(null) });
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      await expect(svc.create('user-1', { ...baseInput, className: 'UnknownClass' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('findById', () => {
    it('throws 403 when userId does not match character.userId', async () => {
      const charRepo = makeCharacterRepo({
        findById: vi.fn().mockResolvedValue({ ...mockCharacter, userId: 'other-user' }),
      });
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      await expect(svc.findById('char-1', 'user-1')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('returns character when userId matches', async () => {
      const charRepo = makeCharacterRepo();
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      const result = await svc.findById('char-1', 'user-1');
      expect(result).toEqual(mockCharacter);
    });
  });

  describe('delete', () => {
    it('calls repository.delete after ownership check passes', async () => {
      const deleteFn = vi.fn().mockResolvedValue(undefined);
      const charRepo = makeCharacterRepo({ delete: deleteFn });
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      await svc.delete('char-1', 'user-1');
      expect(deleteFn).toHaveBeenCalledWith('char-1');
    });

    it('throws 403 when userId does not match', async () => {
      const charRepo = makeCharacterRepo({
        findById: vi.fn().mockResolvedValue({ ...mockCharacter, userId: 'other-user' }),
      });
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      await expect(svc.delete('char-1', 'user-1')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('update', () => {
    it('recomputes derivedStats when abilityScores change', async () => {
      let capturedPatch: any;
      const charRepo = makeCharacterRepo({
        update: vi.fn().mockImplementation(async (id, patch) => {
          capturedPatch = patch;
          return { ...mockCharacter, ...patch };
        }),
      });
      const gameDataRepo = makeGameDataRepo();
      const svc = new CharacterService({ characterRepository: charRepo, gameDataRepository: gameDataRepo });

      const newScores = { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 };
      await svc.update('char-1', 'user-1', { abilityScores: newScores });

      expect(capturedPatch.derivedStats).toBeDefined();
      expect((capturedPatch.derivedStats as any).proficiencyBonus).toBe(2);
    });
  });
});
