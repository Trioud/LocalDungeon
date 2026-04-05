import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReadyActionService } from './ReadyActionService.js';
import type { Redis } from 'ioredis';

function makeRedis(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}): Redis {
  return {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    lpush: vi.fn().mockResolvedValue(1),
    ltrim: vi.fn().mockResolvedValue('OK'),
    lrange: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as Redis;
}

describe('ReadyActionService', () => {
  let redis: Redis;
  let svc: ReadyActionService;

  beforeEach(() => {
    redis = makeRedis();
    svc = new ReadyActionService({ redis });
  });

  describe('setReadyAction', () => {
    it('creates and stores a ready action', async () => {
      const action = await svc.setReadyAction('sess1', 'c1', 'enemy moves', 'attack', 3);
      expect(action.combatantId).toBe('c1');
      expect(action.trigger).toBe('enemy moves');
      expect(action.used).toBe(false);
      expect(redis.setex).toHaveBeenCalled();
    });
  });

  describe('getReadyAction', () => {
    it('returns null when no action stored', async () => {
      const result = await svc.getReadyAction('sess1', 'c1');
      expect(result).toBeNull();
    });

    it('returns parsed action when stored', async () => {
      const stored = { combatantId: 'c1', trigger: 't', actionDescription: 'a', expiresOnTurn: 2, used: false };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(stored));
      const result = await svc.getReadyAction('sess1', 'c1');
      expect(result).toEqual(stored);
    });
  });

  describe('fireReadyAction', () => {
    it('throws 404 when no ready action exists', async () => {
      await expect(svc.fireReadyAction('sess1', 'c1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('marks action as used and stores it', async () => {
      const stored = { combatantId: 'c1', trigger: 't', actionDescription: 'a', expiresOnTurn: 2, used: false };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(stored));
      const result = await svc.fireReadyAction('sess1', 'c1');
      expect(result.used).toBe(true);
      expect(redis.setex).toHaveBeenCalled();
    });
  });

  describe('clearReadyAction', () => {
    it('deletes the ready action key', async () => {
      await svc.clearReadyAction('sess1', 'c1');
      expect(redis.del).toHaveBeenCalledWith('ready:sess1:c1');
    });
  });

  describe('recordOpportunityAttack', () => {
    it('records and returns an opportunity attack', async () => {
      const attack = await svc.recordOpportunityAttack('sess1', 'a1', 't1');
      expect(attack.attackerId).toBe('a1');
      expect(attack.targetId).toBe('t1');
      expect(attack.sessionId).toBe('sess1');
      expect(redis.lpush).toHaveBeenCalled();
      expect(redis.ltrim).toHaveBeenCalled();
    });
  });

  describe('getRecentOpportunityAttacks', () => {
    it('returns empty array when none stored', async () => {
      const result = await svc.getRecentOpportunityAttacks('sess1');
      expect(result).toEqual([]);
    });

    it('returns parsed attacks', async () => {
      const attack = { attackerId: 'a1', targetId: 't1', sessionId: 'sess1', timestamp: 1000 };
      vi.mocked(redis.lrange).mockResolvedValue([JSON.stringify(attack)]);
      const result = await svc.getRecentOpportunityAttacks('sess1');
      expect(result).toHaveLength(1);
      expect(result[0].attackerId).toBe('a1');
    });
  });
});
