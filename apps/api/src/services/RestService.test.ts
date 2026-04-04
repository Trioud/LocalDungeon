import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestService } from './RestService.js';
import type { CombatState, CombatantState } from '@local-dungeon/shared';

const mockRedis = {
  get: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
  setex: vi.fn<() => Promise<string>>().mockResolvedValue('OK'),
  del: vi.fn<() => Promise<number>>().mockResolvedValue(1),
};

function makeService() {
  return new RestService({ redis: mockRedis as any });
}

function makeCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'c1',
    name: 'Hero',
    initiative: 15,
    initiativeRoll: 10,
    hp: 15,
    maxHp: 30,
    tempHp: 0,
    ac: 15,
    conditions: [],
    exhaustionLevel: 2,
    isBloodied: true,
    isConcentrating: false,
    hasAction: true,
    hasBonusAction: true,
    hasReaction: true,
    isPlayer: true,
    isActive: false,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    hitDie: 8,
    hitDiceRemaining: 3,
    maxHitDice: 5,
    conModifier: 2,
    ...overrides,
  };
}

function mockCombatState(): string {
  const state: CombatState = {
    sessionId: 's1',
    round: 0,
    turnIndex: 0,
    combatants: [makeCombatant({ id: 'c1' }), makeCombatant({ id: 'c2', name: 'Mage' })],
    isActive: false,
    log: [],
  };
  return JSON.stringify(state);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.setex.mockResolvedValue('OK');
  mockRedis.del.mockResolvedValue(1);
});

describe('RestService', () => {
  describe('proposeRest', () => {
    it('creates a proposal with status pending', async () => {
      const svc = makeService();
      const proposal = await svc.proposeRest('s1', 'c1', 'short', 3);
      expect(proposal.status).toBe('pending');
      expect(proposal.restType).toBe('short');
      expect(proposal.sessionId).toBe('s1');
      expect(proposal.proposedBy).toBe('c1');
    });

    it('includes proposer in confirmedBy', async () => {
      const svc = makeService();
      const proposal = await svc.proposeRest('s1', 'c1', 'long', 2);
      expect(proposal.confirmedBy).toContain('c1');
    });

    it('saves proposal to redis', async () => {
      const svc = makeService();
      await svc.proposeRest('s1', 'c1', 'short', 3);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'rest:proposal:s1',
        3600,
        expect.any(String),
      );
    });
  });

  describe('confirmRest', () => {
    it('throws when no proposal exists', async () => {
      const svc = makeService();
      await expect(svc.confirmRest('s1', 'c2')).rejects.toThrow('No rest proposal found');
    });

    it('adds characterId to confirmedBy', async () => {
      const proposal = {
        id: 'p1',
        sessionId: 's1',
        proposedBy: 'c1',
        restType: 'short',
        confirmedBy: ['c1'],
        requiredCount: 3,
        status: 'pending',
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(proposal));
      const svc = makeService();
      const result = await svc.confirmRest('s1', 'c2');
      expect(result.proposal.confirmedBy).toContain('c2');
      expect(result.executed).toBe(false);
    });

    it('executes rest and returns executed=true when all confirmed', async () => {
      const proposal = {
        id: 'p1',
        sessionId: 's1',
        proposedBy: 'c1',
        restType: 'short',
        confirmedBy: ['c1'],
        requiredCount: 2,
        status: 'pending',
      };
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(proposal))
        .mockResolvedValueOnce(mockCombatState());
      const svc = makeService();
      const result = await svc.confirmRest('s1', 'c2');
      expect(result.executed).toBe(true);
      expect(result.proposal.status).toBe('confirmed');
    });

    it('does not add duplicate confirmations', async () => {
      const proposal = {
        id: 'p1',
        sessionId: 's1',
        proposedBy: 'c1',
        restType: 'short',
        confirmedBy: ['c1', 'c2'],
        requiredCount: 3,
        status: 'pending',
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(proposal));
      const svc = makeService();
      const result = await svc.confirmRest('s1', 'c2');
      expect(result.proposal.confirmedBy.filter((id) => id === 'c2').length).toBe(1);
    });
  });

  describe('cancelRest', () => {
    it('deletes the proposal from redis', async () => {
      const proposal = {
        id: 'p1',
        sessionId: 's1',
        proposedBy: 'c1',
        restType: 'short',
        confirmedBy: ['c1'],
        requiredCount: 2,
        status: 'pending',
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(proposal));
      const svc = makeService();
      await svc.cancelRest('s1');
      expect(mockRedis.del).toHaveBeenCalledWith('rest:proposal:s1');
    });
  });

  describe('executeRest', () => {
    it('applies long rest features to all combatants', async () => {
      mockRedis.get.mockResolvedValueOnce(mockCombatState());
      const svc = makeService();
      const result = await svc.executeRest('s1', 'long');
      expect(result.affectedCount).toBe(2);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'combat:s1',
        86400,
        expect.stringContaining('"hp":30'),
      );
    });

    it('returns affectedCount 0 when no combat state', async () => {
      const svc = makeService();
      const result = await svc.executeRest('s1', 'short');
      expect(result.affectedCount).toBe(0);
    });
  });

  describe('spendHitDice', () => {
    it('throws when not enough hit dice', async () => {
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          sessionId: 's1',
          round: 0,
          turnIndex: 0,
          combatants: [makeCombatant({ id: 'c1', hitDiceRemaining: 1 })],
          isActive: false,
          log: [],
        }),
      );
      const svc = makeService();
      await expect(svc.spendHitDice('s1', 'c1', 5)).rejects.toThrow('Not enough hit dice');
    });

    it('returns hpGained, newHp and hdRemaining', async () => {
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          sessionId: 's1',
          round: 0,
          turnIndex: 0,
          combatants: [makeCombatant({ id: 'c1', hp: 10, maxHp: 30, hitDiceRemaining: 3 })],
          isActive: false,
          log: [],
        }),
      );
      const svc = makeService();
      const result = await svc.spendHitDice('s1', 'c1', 2);
      expect(result.hdRemaining).toBe(1);
      expect(result.newHp).toBeGreaterThanOrEqual(10);
      expect(result.newHp).toBeLessThanOrEqual(30);
      expect(result.hpGained).toBeGreaterThanOrEqual(0);
    });
  });
});
