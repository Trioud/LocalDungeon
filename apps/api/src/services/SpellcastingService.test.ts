import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpellcastingService } from './SpellcastingService.js';
import type { CombatantState, CombatState, SpellcastingState } from '@local-dungeon/shared';

const mockRedis = {
  get: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
  setex: vi.fn<() => Promise<string>>().mockResolvedValue('OK'),
};

const mockGameLogService = {
  logEvent: vi.fn().mockResolvedValue({ id: 'log_1' }),
  listEvents: vi.fn().mockResolvedValue([]),
};

function makeService() {
  return new SpellcastingService({
    redis: mockRedis as any,
    gameLogService: mockGameLogService as any,
  });
}

function makeSpellcasting(overrides: Partial<SpellcastingState> = {}): SpellcastingState {
  return {
    slots: [
      { level: 1, total: 4, used: 0 },
      { level: 2, total: 3, used: 0 },
      { level: 3, total: 2, used: 0 },
    ],
    castBonusActionThisTurn: false,
    ...overrides,
  };
}

function makeCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'c1',
    name: 'Hero',
    initiative: 15,
    initiativeRoll: 10,
    hp: 30,
    maxHp: 30,
    tempHp: 0,
    ac: 15,
    conditions: [],
    exhaustionLevel: 0,
    isBloodied: false,
    isConcentrating: false,
    hasAction: true,
    hasBonusAction: true,
    hasReaction: true,
    isPlayer: true,
    isActive: false,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    spellcasting: makeSpellcasting(),
    ...overrides,
  };
}

function mockState(overrides: Partial<CombatState> = {}): string {
  const state: CombatState = {
    sessionId: 's1',
    round: 1,
    turnIndex: 0,
    combatants: [makeCombatant({ id: 'c1', isActive: true })],
    isActive: true,
    log: [],
    ...overrides,
  };
  return JSON.stringify(state);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.setex.mockResolvedValue('OK');
  mockGameLogService.logEvent.mockResolvedValue({ id: 'log_1' });
});

describe('SpellcastingService', () => {
  describe('castSpell', () => {
    it('happy path: deducts slot and updates state', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const result = await svc.castSpell('s1', 'c1', {
        spellName: 'Magic Missile',
        spellLevel: 1,
        castAtLevel: 1,
        isRitual: false,
        isBonusAction: false,
        requiresConcentration: false,
      });
      expect(result.spellcasting?.slots.find((s) => s.level === 1)?.used).toBe(1);
      expect(mockRedis.setex).toHaveBeenCalledOnce();
    });

    it('throws when combatant has no spellcasting state', async () => {
      mockRedis.get.mockResolvedValueOnce(
        mockState({ combatants: [makeCombatant({ id: 'c1', spellcasting: undefined })] }),
      );
      const svc = makeService();
      await expect(
        svc.castSpell('s1', 'c1', {
          spellName: 'Fireball',
          spellLevel: 3,
          castAtLevel: 3,
          isRitual: false,
          isBonusAction: false,
          requiresConcentration: false,
        }),
      ).rejects.toThrow('Combatant has no spellcasting state');
    });

    it('throws when canCastSpell returns not allowed', async () => {
      mockRedis.get.mockResolvedValueOnce(
        mockState({
          combatants: [
            makeCombatant({
              id: 'c1',
              spellcasting: makeSpellcasting({
                slots: [{ level: 1, total: 2, used: 2 }],
              }),
            }),
          ],
        }),
      );
      const svc = makeService();
      await expect(
        svc.castSpell('s1', 'c1', {
          spellName: 'Magic Missile',
          spellLevel: 1,
          castAtLevel: 1,
          isRitual: false,
          isBonusAction: false,
          requiresConcentration: false,
        }),
      ).rejects.toThrow();
    });

    it('skips slot deduction for rituals', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const result = await svc.castSpell('s1', 'c1', {
        spellName: 'Detect Magic',
        spellLevel: 1,
        castAtLevel: 1,
        isRitual: true,
        isBonusAction: false,
        requiresConcentration: false,
      });
      expect(result.spellcasting?.slots.find((s) => s.level === 1)?.used).toBe(0);
    });

    it('skips slot deduction for cantrips (spellLevel 0)', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const result = await svc.castSpell('s1', 'c1', {
        spellName: 'Fire Bolt',
        spellLevel: 0,
        castAtLevel: 0,
        isRitual: false,
        isBonusAction: false,
        requiresConcentration: false,
      });
      expect(result.spellcasting?.slots.every((s) => s.used === 0)).toBe(true);
    });

    it('updates concentration when requiresConcentration=true', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const result = await svc.castSpell('s1', 'c1', {
        spellName: 'Bless',
        spellLevel: 1,
        castAtLevel: 1,
        isRitual: false,
        isBonusAction: false,
        requiresConcentration: true,
      });
      expect(result.isConcentrating).toBe(true);
      expect(result.concentrationSpell).toBe('Bless');
      expect(result.spellcasting?.concentrationSpell).toBe('Bless');
    });
  });

  describe('endConcentration', () => {
    it('clears concentration on combatant', async () => {
      mockRedis.get.mockResolvedValueOnce(
        mockState({
          combatants: [
            makeCombatant({
              id: 'c1',
              isConcentrating: true,
              concentrationSpell: 'Bless',
              spellcasting: makeSpellcasting({ concentrationSpell: 'Bless' }),
            }),
          ],
        }),
      );
      const svc = makeService();
      const result = await svc.endConcentration('s1', 'c1');
      expect(result.isConcentrating).toBe(false);
      expect(result.concentrationSpell).toBeUndefined();
      expect(result.spellcasting?.concentrationSpell).toBeUndefined();
    });
  });

  describe('concentrationSave', () => {
    it('success when roll >= DC', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const result = await svc.concentrationSave('s1', 'c1', 15, 20);
      expect(result.success).toBe(true);
      expect(result.concentrationEnded).toBe(false);
    });

    it('failure when roll < DC ends concentration', async () => {
      mockRedis.get.mockResolvedValueOnce(
        mockState({
          combatants: [
            makeCombatant({
              id: 'c1',
              isConcentrating: true,
              concentrationSpell: 'Bless',
              spellcasting: makeSpellcasting({ concentrationSpell: 'Bless' }),
            }),
          ],
        }),
      );
      const svc = makeService();
      const result = await svc.concentrationSave('s1', 'c1', 5, 30);
      expect(result.success).toBe(false);
      expect(result.concentrationEnded).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledOnce();
    });
  });

  describe('recoverSlots', () => {
    it('long rest resets all spell slots', async () => {
      mockRedis.get.mockResolvedValueOnce(
        mockState({
          combatants: [
            makeCombatant({
              id: 'c1',
              spellcasting: makeSpellcasting({
                slots: [
                  { level: 1, total: 4, used: 4 },
                  { level: 2, total: 3, used: 3 },
                ],
              }),
            }),
          ],
        }),
      );
      const svc = makeService();
      const result = await svc.recoverSlots('s1', 'c1', 'long');
      expect(result.spellcasting?.slots.every((s) => s.used === 0)).toBe(true);
    });
  });
});
