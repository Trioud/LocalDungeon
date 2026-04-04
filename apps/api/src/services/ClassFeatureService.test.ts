import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassFeatureService } from './ClassFeatureService.js';

const mockRedis = {
  get: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
  setex: vi.fn<() => Promise<string>>().mockResolvedValue('OK'),
};

function makeService() {
  return new ClassFeatureService({ redis: mockRedis as any });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.setex.mockResolvedValue('OK');
});

describe('ClassFeatureService', () => {
  describe('initResources', () => {
    it('builds and saves resources for a barbarian', async () => {
      const svc = makeService();
      const resources = await svc.initResources('s1', 'c1', { barbarian: 5 }, 3);
      expect(resources).toHaveLength(1);
      expect(resources[0].id).toBe('rage');
      expect(resources[0].max).toBe(3);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'features:s1:c1',
        86400,
        expect.stringContaining('rage'),
      );
    });

    it('builds resources for fighter (second_wind + action_surge + indomitable)', async () => {
      const svc = makeService();
      const resources = await svc.initResources('s1', 'c2', { fighter: 9 }, 4);
      const ids = resources.map((r) => r.id);
      expect(ids).toContain('second_wind');
      expect(ids).toContain('action_surge');
      expect(ids).toContain('indomitable');
    });
  });

  describe('getResources', () => {
    it('returns empty array when no data in Redis', async () => {
      const svc = makeService();
      const resources = await svc.getResources('s1', 'c1');
      expect(resources).toEqual([]);
    });

    it('returns parsed resources from Redis', async () => {
      const stored = [{ id: 'rage', name: 'Rage', className: 'barbarian', max: 3, current: 3, recharge: 'long' }];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(stored));
      const svc = makeService();
      const resources = await svc.getResources('s1', 'c1');
      expect(resources).toEqual(stored);
    });
  });

  describe('useResource', () => {
    it('deducts resource and saves to Redis', async () => {
      const stored = [{ id: 'rage', name: 'Rage', className: 'barbarian', max: 3, current: 3, recharge: 'long' }];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(stored));
      const svc = makeService();
      const updated = await svc.useResource('s1', 'c1', 'rage');
      expect(updated[0].current).toBe(2);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'features:s1:c1',
        86400,
        expect.any(String),
      );
    });

    it('throws if resource not found', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([]));
      const svc = makeService();
      await expect(svc.useResource('s1', 'c1', 'rage')).rejects.toThrow();
    });

    it('throws if insufficient current', async () => {
      const stored = [{ id: 'rage', name: 'Rage', className: 'barbarian', max: 3, current: 0, recharge: 'long' }];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(stored));
      const svc = makeService();
      await expect(svc.useResource('s1', 'c1', 'rage')).rejects.toThrow(/Insufficient/);
    });
  });

  describe('rechargeAll', () => {
    it('recharges short-rest resources on short rest', async () => {
      const stored = [
        { id: 'second_wind', name: 'Second Wind', className: 'fighter', max: 1, current: 0, recharge: 'short' },
        { id: 'rage', name: 'Rage', className: 'barbarian', max: 3, current: 1, recharge: 'long' },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(stored));
      const svc = makeService();
      const updated = await svc.rechargeAll('s1', 'c1', 'short');
      expect(updated.find((r) => r.id === 'second_wind')!.current).toBe(1);
      expect(updated.find((r) => r.id === 'rage')!.current).toBe(1); // not recharged
    });

    it('recharges all resources on long rest', async () => {
      const stored = [
        { id: 'second_wind', name: 'Second Wind', className: 'fighter', max: 1, current: 0, recharge: 'short' },
        { id: 'rage', name: 'Rage', className: 'barbarian', max: 3, current: 0, recharge: 'long' },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(stored));
      const svc = makeService();
      const updated = await svc.rechargeAll('s1', 'c1', 'long');
      expect(updated.find((r) => r.id === 'second_wind')!.current).toBe(1);
      expect(updated.find((r) => r.id === 'rage')!.current).toBe(3);
    });
  });
});
