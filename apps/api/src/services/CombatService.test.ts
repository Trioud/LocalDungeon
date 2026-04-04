import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatService } from './CombatService.js';
import type { CombatantState, CombatState } from '@local-dungeon/shared';

const mockRedis = {
  get: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
  setex: vi.fn<() => Promise<string>>().mockResolvedValue('OK'),
};

const mockGameLogService = {
  logEvent: vi.fn().mockResolvedValue({ id: 'log_1' }),
  listEvents: vi.fn().mockResolvedValue([]),
};

function makeService() {
  return new CombatService({
    redis: mockRedis as any,
    gameLogService: mockGameLogService as any,
  });
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
    ...overrides,
  };
}

function mockState(overrides: Partial<CombatState> = {}): string {
  const state: CombatState = {
    sessionId: 's1',
    round: 1,
    turnIndex: 0,
    combatants: [
      makeCombatant({ id: 'c1', name: 'Hero', initiative: 20, isActive: true }),
      makeCombatant({ id: 'c2', name: 'Monster', initiative: 10 }),
    ],
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

describe('CombatService', () => {
  describe('getState', () => {
    it('returns null when no data in redis', async () => {
      const svc = makeService();
      const result = await svc.getState('s1');
      expect(result).toBeNull();
    });

    it('returns parsed state when data exists', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const result = await svc.getState('s1');
      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('s1');
    });
  });

  describe('initCombat', () => {
    it('creates and saves initial state', async () => {
      const svc = makeService();
      const combatants = [
        { id: 'c1', name: 'Hero', initiative: 15, initiativeRoll: 10, hp: 30, maxHp: 30, tempHp: 0, ac: 15, conditions: [] as const, exhaustionLevel: 0, isBloodied: false, isConcentrating: false, isPlayer: true, deathSaveSuccesses: 0, deathSaveFailures: 0 },
      ] as Omit<CombatantState, 'isActive' | 'hasAction' | 'hasBonusAction' | 'hasReaction'>[];
      const state = await svc.initCombat('s1', combatants);
      expect(state.isActive).toBe(false);
      expect(state.round).toBe(0);
      expect(mockRedis.setex).toHaveBeenCalledOnce();
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'system' }),
      );
    });
  });

  describe('startCombat', () => {
    it('activates combat', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({ isActive: false, round: 0 }));
      const svc = makeService();
      const state = await svc.startCombat('s1');
      expect(state.isActive).toBe(true);
      expect(state.round).toBe(1);
    });

    it('throws if no state exists', async () => {
      const svc = makeService();
      await expect(svc.startCombat('nonexistent')).rejects.toThrow();
    });
  });

  describe('endCombat', () => {
    it('deactivates combat', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const state = await svc.endCombat('s1');
      expect(state.isActive).toBe(false);
    });
  });

  describe('applyDamage', () => {
    it('reduces combatant hp', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const state = await svc.applyDamage('s1', 'c1', 10, 'user1');
      expect(state.combatants[0].hp).toBe(20);
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'hp_change' }),
      );
    });

    it('throws if combatant not found', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      await expect(svc.applyDamage('s1', 'nonexistent', 10)).rejects.toThrow();
    });
  });

  describe('applyHealing', () => {
    it('increases combatant hp', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 10, maxHp: 30, isActive: true })],
      }));
      const svc = makeService();
      const state = await svc.applyHealing('s1', 'c1', 10, 'user1');
      expect(state.combatants[0].hp).toBe(20);
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'hp_change' }),
      );
    });
  });

  describe('addCondition', () => {
    it('adds condition to combatant', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const state = await svc.addCondition('s1', 'c1', 'poisoned', 'user1');
      expect(state.combatants[0].conditions).toContain('poisoned');
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'condition_added' }),
      );
    });
  });

  describe('removeCondition', () => {
    it('removes condition from combatant', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', conditions: ['poisoned'], isActive: true })],
      }));
      const svc = makeService();
      const state = await svc.removeCondition('s1', 'c1', 'poisoned', 'user1');
      expect(state.combatants[0].conditions).not.toContain('poisoned');
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'condition_removed' }),
      );
    });
  });

  describe('advanceTurn', () => {
    it('advances turn index', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const state = await svc.advanceTurn('s1', 'user1');
      expect(state.turnIndex).toBe(1);
    });
  });

  describe('recordDeathSave', () => {
    it('records a success', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, isActive: true })],
      }));
      const svc = makeService();
      const state = await svc.recordDeathSave('s1', 'c1', true, 'user1');
      expect(state.combatants[0].deathSaveSuccesses).toBe(1);
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'death_save' }),
      );
    });

    it('records a failure', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, isActive: true })],
      }));
      const svc = makeService();
      const state = await svc.recordDeathSave('s1', 'c1', false, 'user1');
      expect(state.combatants[0].deathSaveFailures).toBe(1);
    });
  });

  describe('upsertCombatant', () => {
    it('adds a new combatant', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({ combatants: [] }));
      const svc = makeService();
      const newC = makeCombatant({ id: 'c_new', name: 'Newcomer' });
      const { isActive: _, ...rest } = newC;
      const state = await svc.upsertCombatant('s1', rest, 'user1');
      expect(state.combatants.some((c) => c.id === 'c_new')).toBe(true);
    });

    it('updates existing combatant', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const existing = makeCombatant({ id: 'c1', name: 'Hero Updated', hp: 15 });
      const { isActive: _, ...rest } = existing;
      const state = await svc.upsertCombatant('s1', rest, 'user1');
      expect(state.combatants.find((c) => c.id === 'c1')?.name).toBe('Hero Updated');
    });
  });

  describe('removeCombatant', () => {
    it('removes a combatant by id', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      const state = await svc.removeCombatant('s1', 'c1', 'user1');
      expect(state.combatants.find((c) => c.id === 'c1')).toBeUndefined();
    });
  });

  describe('recordDeathSaveRoll', () => {
    it('nat 20 regains HP for combatant', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, conditions: ['unconscious'], isActive: true })],
      }));
      const svc = makeService();
      const result = await svc.recordDeathSaveRoll('s1', 'c1', 20, 'user1');
      expect(result.state.combatants[0].hp).toBe(1);
      expect(result.outcome).toBe('none');
    });

    it('nat 1 adds 2 failures', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, deathSaveFailures: 0, isActive: true })],
      }));
      const svc = makeService();
      const result = await svc.recordDeathSaveRoll('s1', 'c1', 1, 'user1');
      expect(result.failures).toBe(2);
    });

    it('3 failures outcome is dead and logs event', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, deathSaveFailures: 2, isActive: true })],
      }));
      const svc = makeService();
      const result = await svc.recordDeathSaveRoll('s1', 'c1', 5, 'user1');
      expect(result.outcome).toBe('dead');
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'death_save', payload: expect.objectContaining({ outcome: 'dead' }) }),
      );
    });

    it('3 successes outcome is stable and logs event', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, deathSaveSuccesses: 2, isActive: true })],
      }));
      const svc = makeService();
      const result = await svc.recordDeathSaveRoll('s1', 'c1', 15, 'user1');
      expect(result.outcome).toBe('stable');
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'death_save', payload: expect.objectContaining({ outcome: 'stable' }) }),
      );
    });

    it('throws if combatant not found', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      await expect(svc.recordDeathSaveRoll('s1', 'nonexistent', 10)).rejects.toThrow();
    });
  });

  describe('stabilize', () => {
    it('marks combatant as stable', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState({
        combatants: [makeCombatant({ id: 'c1', hp: 0, isActive: true })],
      }));
      const svc = makeService();
      const state = await svc.stabilize('s1', 'c1', 'user1');
      expect(state.combatants[0].isStable).toBe(true);
      expect(mockGameLogService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'death_save', payload: expect.objectContaining({ outcome: 'stable' }) }),
      );
    });

    it('throws if combatant not found', async () => {
      mockRedis.get.mockResolvedValueOnce(mockState());
      const svc = makeService();
      await expect(svc.stabilize('s1', 'nonexistent')).rejects.toThrow();
    });
  });
});
