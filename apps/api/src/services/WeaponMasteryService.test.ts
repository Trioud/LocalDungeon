import { describe, it, expect, vi } from 'vitest';
import { WeaponMasteryService } from './WeaponMasteryService.js';

function makeService() {
  const mockState = {
    sessionId: 'sess1',
    round: 1,
    turnIndex: 0,
    isActive: true,
    log: [],
    combatants: [
      {
        id: 'att1',
        name: 'Fighter',
        hp: 30, maxHp: 30, tempHp: 0, ac: 16,
        initiative: 10, initiativeRoll: 10,
        conditions: [], exhaustionLevel: 0,
        isBloodied: false, isConcentrating: false,
        hasAction: true, hasBonusAction: true, hasReaction: true,
        isPlayer: true, isActive: true,
        deathSaveSuccesses: 0, deathSaveFailures: 0,
        assignedMasteries: [{ weaponName: 'Rapier', property: 'vex' }],
      },
      {
        id: 'tgt1',
        name: 'Goblin',
        hp: 10, maxHp: 10, tempHp: 0, ac: 12,
        initiative: 5, initiativeRoll: 5,
        conditions: [], exhaustionLevel: 0,
        isBloodied: false, isConcentrating: false,
        hasAction: true, hasBonusAction: true, hasReaction: true,
        isPlayer: false, isActive: false,
        deathSaveSuccesses: 0, deathSaveFailures: 0,
      },
    ],
  };

  const redis = {
    get: vi.fn().mockResolvedValue(JSON.stringify(mockState)),
    setex: vi.fn().mockResolvedValue('OK'),
  };

  const gameLogService = {
    logEvent: vi.fn().mockResolvedValue({}),
  };

  const service = new WeaponMasteryService({ redis, gameLogService } as any);
  return { service, redis, gameLogService, mockState };
}

describe('WeaponMasteryService', () => {
  it('assignMastery adds a mastery entry', async () => {
    const { service, redis } = makeService();
    const emptyState = {
      sessionId: 'sess1', round: 1, turnIndex: 0, isActive: true, log: [],
      combatants: [{
        id: 'att1', name: 'Fighter', hp: 30, maxHp: 30, tempHp: 0, ac: 16,
        initiative: 10, initiativeRoll: 10, conditions: [], exhaustionLevel: 0,
        isBloodied: false, isConcentrating: false,
        hasAction: true, hasBonusAction: true, hasReaction: true,
        isPlayer: true, isActive: true, deathSaveSuccesses: 0, deathSaveFailures: 0,
        assignedMasteries: [],
      }],
    };
    redis.get.mockResolvedValueOnce(JSON.stringify(emptyState));

    const result = await service.assignMastery('sess1', 'att1', 'Rapier', 'vex', 'fighter', 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ weaponName: 'Rapier', property: 'vex' });
  });

  it('assignMastery throws for non-mastery class', async () => {
    const { service } = makeService();
    await expect(
      service.assignMastery('sess1', 'att1', 'Rapier', 'vex', 'wizard', 5),
    ).rejects.toThrow('does not have Weapon Mastery');
  });

  it('assignMastery throws when exceeding max slots', async () => {
    const fullState = {
      sessionId: 'sess1', round: 1, turnIndex: 0, isActive: true, log: [],
      combatants: [{
        id: 'att1', name: 'Rogue', hp: 20, maxHp: 20, tempHp: 0, ac: 14,
        initiative: 8, initiativeRoll: 8, conditions: [], exhaustionLevel: 0,
        isBloodied: false, isConcentrating: false,
        hasAction: true, hasBonusAction: true, hasReaction: true,
        isPlayer: true, isActive: true, deathSaveSuccesses: 0, deathSaveFailures: 0,
        assignedMasteries: [
          { weaponName: 'Rapier', property: 'vex' },
          { weaponName: 'Dagger', property: 'nick' },
        ],
      }],
    };
    const { service, redis } = makeService();
    redis.get.mockResolvedValueOnce(JSON.stringify(fullState));
    await expect(
      service.assignMastery('sess1', 'att1', 'Shortsword', 'nick', 'rogue', 1),
    ).rejects.toThrow('Cannot assign more than 2 masteries');
  });

  it('applyMastery vex sets vexTarget on attacker', async () => {
    const { service, redis } = makeService();
    let savedState: any;
    redis.setex.mockImplementation((_k: string, _ttl: number, val: string) => {
      savedState = JSON.parse(val);
      return Promise.resolve('OK');
    });

    const effect = await service.applyMastery('sess1', 'att1', 'tgt1', 'Rapier', true, 3, 2);
    expect(effect.givesSelfAdvantage).toBe(true);
    expect(savedState.combatants[0].vexTarget).toBe('tgt1');
  });

  it('applyMastery graze deals damage on miss', async () => {
    const { service, redis } = makeService();
    const grazeState = {
      sessionId: 'sess1', round: 1, turnIndex: 0, isActive: true, log: [],
      combatants: [
        {
          id: 'att1', name: 'Fighter', hp: 30, maxHp: 30, tempHp: 0, ac: 16,
          initiative: 10, initiativeRoll: 10, conditions: [], exhaustionLevel: 0,
          isBloodied: false, isConcentrating: false,
          hasAction: true, hasBonusAction: true, hasReaction: true,
          isPlayer: true, isActive: true, deathSaveSuccesses: 0, deathSaveFailures: 0,
          assignedMasteries: [{ weaponName: 'Greatsword', property: 'graze' }],
        },
        {
          id: 'tgt1', name: 'Goblin', hp: 10, maxHp: 10, tempHp: 0, ac: 12,
          initiative: 5, initiativeRoll: 5, conditions: [], exhaustionLevel: 0,
          isBloodied: false, isConcentrating: false,
          hasAction: true, hasBonusAction: true, hasReaction: true,
          isPlayer: false, isActive: false, deathSaveSuccesses: 0, deathSaveFailures: 0,
        },
      ],
    };
    redis.get.mockResolvedValueOnce(JSON.stringify(grazeState));
    let savedState: any;
    redis.setex.mockImplementation((_k: string, _ttl: number, val: string) => {
      savedState = JSON.parse(val);
      return Promise.resolve('OK');
    });

    const effect = await service.applyMastery('sess1', 'att1', 'tgt1', 'Greatsword', false, 3, 2);
    expect(effect.damageDealt).toBe(3);
    expect(savedState.combatants[1].hp).toBe(7);
  });

  it('applyMastery sap sets sapped on target', async () => {
    const sapState = {
      sessionId: 'sess1', round: 1, turnIndex: 0, isActive: true, log: [],
      combatants: [
        {
          id: 'att1', name: 'Fighter', hp: 30, maxHp: 30, tempHp: 0, ac: 16,
          initiative: 10, initiativeRoll: 10, conditions: [], exhaustionLevel: 0,
          isBloodied: false, isConcentrating: false,
          hasAction: true, hasBonusAction: true, hasReaction: true,
          isPlayer: true, isActive: true, deathSaveSuccesses: 0, deathSaveFailures: 0,
          assignedMasteries: [{ weaponName: 'Mace', property: 'sap' }],
        },
        {
          id: 'tgt1', name: 'Goblin', hp: 10, maxHp: 10, tempHp: 0, ac: 12,
          initiative: 5, initiativeRoll: 5, conditions: [], exhaustionLevel: 0,
          isBloodied: false, isConcentrating: false,
          hasAction: true, hasBonusAction: true, hasReaction: true,
          isPlayer: false, isActive: false, deathSaveSuccesses: 0, deathSaveFailures: 0,
        },
      ],
    };
    const { service, redis } = makeService();
    redis.get.mockResolvedValueOnce(JSON.stringify(sapState));
    let savedState: any;
    redis.setex.mockImplementation((_k: string, _ttl: number, val: string) => {
      savedState = JSON.parse(val);
      return Promise.resolve('OK');
    });

    await service.applyMastery('sess1', 'att1', 'tgt1', 'Mace', true, 2, 2);
    expect(savedState.combatants[1].sapped).toBe(true);
  });

  it('applyMastery topple adds prone condition on failed save', async () => {
    const toppleState = {
      sessionId: 'sess1', round: 1, turnIndex: 0, isActive: true, log: [],
      combatants: [
        {
          id: 'att1', name: 'Fighter', hp: 30, maxHp: 30, tempHp: 0, ac: 16,
          initiative: 10, initiativeRoll: 10, conditions: [], exhaustionLevel: 0,
          isBloodied: false, isConcentrating: false,
          hasAction: true, hasBonusAction: true, hasReaction: true,
          isPlayer: true, isActive: true, deathSaveSuccesses: 0, deathSaveFailures: 0,
          assignedMasteries: [{ weaponName: 'Morningstar', property: 'topple' }],
        },
        {
          id: 'tgt1', name: 'Goblin', hp: 10, maxHp: 10, tempHp: 0, ac: 12,
          initiative: 5, initiativeRoll: 5, conditions: [], exhaustionLevel: 0,
          isBloodied: false, isConcentrating: false,
          hasAction: true, hasBonusAction: true, hasReaction: true,
          isPlayer: false, isActive: false, deathSaveSuccesses: 0, deathSaveFailures: 0,
        },
      ],
    };
    const { service, redis } = makeService();
    redis.get.mockResolvedValueOnce(JSON.stringify(toppleState));
    let savedState: any;
    redis.setex.mockImplementation((_k: string, _ttl: number, val: string) => {
      savedState = JSON.parse(val);
      return Promise.resolve('OK');
    });

    // dc = 8 + 2 + 3 = 13, roll 5 = fail
    const effect = await service.applyMastery('sess1', 'att1', 'tgt1', 'Morningstar', true, 3, 2, 5);
    expect(effect.conditionApplied).toBe('prone');
    expect(savedState.combatants[1].conditions).toContain('prone');
  });

  it('applyMastery throws when no mastery assigned', async () => {
    const { service } = makeService();
    await expect(
      service.applyMastery('sess1', 'att1', 'tgt1', 'Longsword', true, 3, 2),
    ).rejects.toThrow('No mastery assigned');
  });

  it('applyMastery throws when no combat state', async () => {
    const { service, redis } = makeService();
    redis.get.mockResolvedValueOnce(null);
    await expect(
      service.applyMastery('noSession', 'att1', 'tgt1', 'Rapier', true, 3, 2),
    ).rejects.toThrow('No combat state');
  });
});
