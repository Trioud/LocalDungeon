import { describe, it, expect } from 'vitest';
import {
  getMasteryProperty,
  maxMasteriesForClass,
  checkMasteryEligibility,
  computeMasteryEffect,
} from './weaponmastery';

describe('getMasteryProperty', () => {
  it('returns cleave for greataxe', () => {
    expect(getMasteryProperty('greataxe')).toBe('cleave');
  });

  it('returns cleave for Halberd (case-insensitive)', () => {
    expect(getMasteryProperty('Halberd')).toBe('cleave');
  });

  it('returns graze for greatsword', () => {
    expect(getMasteryProperty('greatsword')).toBe('graze');
  });

  it('returns graze for Longsword (case-insensitive)', () => {
    expect(getMasteryProperty('Longsword')).toBe('graze');
  });

  it('returns nick for dagger', () => {
    expect(getMasteryProperty('dagger')).toBe('nick');
  });

  it('returns push for warhammer', () => {
    expect(getMasteryProperty('warhammer')).toBe('push');
  });

  it('returns sap for mace', () => {
    expect(getMasteryProperty('mace')).toBe('sap');
  });

  it('returns slow for whip', () => {
    expect(getMasteryProperty('whip')).toBe('slow');
  });

  it('returns topple for morningstar', () => {
    expect(getMasteryProperty('morningstar')).toBe('topple');
  });

  it('returns vex for rapier', () => {
    expect(getMasteryProperty('rapier')).toBe('vex');
  });

  it('returns undefined for unknown weapon', () => {
    expect(getMasteryProperty('rubber chicken')).toBeUndefined();
  });
});

describe('maxMasteriesForClass', () => {
  it('returns 3 for fighter', () => {
    expect(maxMasteriesForClass('fighter')).toBe(3);
  });

  it('returns 3 for Fighter (case-insensitive)', () => {
    expect(maxMasteriesForClass('Fighter')).toBe(3);
  });

  it('returns 2 for rogue', () => {
    expect(maxMasteriesForClass('rogue')).toBe(2);
  });

  it('returns 2 for bard', () => {
    expect(maxMasteriesForClass('bard')).toBe(2);
  });

  it('returns 2 for paladin', () => {
    expect(maxMasteriesForClass('paladin')).toBe(2);
  });
});

describe('checkMasteryEligibility', () => {
  it('returns ineligible for non-mastery class', () => {
    const result = checkMasteryEligibility('wizard', 5, 'rapier', []);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('does not have Weapon Mastery');
  });

  it('returns ineligible for bard below level 3', () => {
    const result = checkMasteryEligibility('bard', 2, 'rapier', [{ weaponName: 'rapier', property: 'vex' }]);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('level 3');
  });

  it('returns ineligible when weapon not assigned', () => {
    const result = checkMasteryEligibility('fighter', 1, 'rapier', []);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('not in assigned masteries');
  });

  it('returns eligible for fighter with assigned weapon', () => {
    const result = checkMasteryEligibility('fighter', 1, 'rapier', [{ weaponName: 'rapier', property: 'vex' }]);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns eligible for bard at level 3', () => {
    const result = checkMasteryEligibility('bard', 3, 'dagger', [{ weaponName: 'dagger', property: 'nick' }]);
    expect(result.eligible).toBe(true);
  });
});

describe('computeMasteryEffect', () => {
  const baseParams = {
    attackerId: 'att1',
    targetId: 'tgt1',
    weaponName: 'greataxe',
    property: 'cleave' as const,
    attackHit: true,
    abilityModifier: 3,
    proficiencyBonus: 2,
  };

  it('cleave: hit → requiresAttack true', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'cleave', attackHit: true });
    expect(effect.requiresAttack).toBe(true);
  });

  it('cleave: miss → description only', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'cleave', attackHit: false });
    expect(effect.requiresAttack).toBeUndefined();
    expect(effect.description).toContain('requires a hit');
  });

  it('graze: miss → damageDealt = abilityModifier', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'graze', attackHit: false });
    expect(effect.damageDealt).toBe(3);
  });

  it('graze: miss with negative modifier → damageDealt = 1 (minimum)', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'graze', attackHit: false, abilityModifier: -1 });
    expect(effect.damageDealt).toBe(1);
  });

  it('graze: hit → no damage (only triggers on miss)', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'graze', attackHit: true });
    expect(effect.damageDealt).toBeUndefined();
    expect(effect.description).toContain('only triggers on a miss');
  });

  it('nick: hit → requiresAttack true', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'nick', attackHit: true });
    expect(effect.requiresAttack).toBe(true);
  });

  it('push: hit with failed save → pushDistance 10', () => {
    // dc = 8 + 2 + 3 = 13, roll 5 < 13 → fails
    const effect = computeMasteryEffect({ ...baseParams, property: 'push', attackHit: true }, 5);
    expect(effect.pushDistance).toBe(10);
  });

  it('push: hit with passed save → pushDistance 0', () => {
    // dc = 13, roll 15 >= 13 → passes
    const effect = computeMasteryEffect({ ...baseParams, property: 'push', attackHit: true }, 15);
    expect(effect.pushDistance).toBe(0);
  });

  it('push: hit without save → requiresSave defined', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'push', attackHit: true });
    expect(effect.requiresSave).toBeDefined();
    expect(effect.requiresSave?.saveType).toBe('strength');
    expect(effect.requiresSave?.dc).toBe(13);
  });

  it('sap: hit → conditionApplied sapped', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'sap', attackHit: true });
    expect(effect.conditionApplied).toBe('sapped');
  });

  it('slow: hit → speedReduction 10', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'slow', attackHit: true });
    expect(effect.speedReduction).toBe(10);
  });

  it('topple: hit with failed save → conditionApplied prone', () => {
    // dc = 13, roll 5 < 13 → fails
    const effect = computeMasteryEffect({ ...baseParams, property: 'topple', attackHit: true }, 5);
    expect(effect.conditionApplied).toBe('prone');
  });

  it('topple: hit with passed save → no prone', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'topple', attackHit: true }, 15);
    expect(effect.conditionApplied).toBeUndefined();
  });

  it('topple: hit without save → requiresSave defined with constitution', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'topple', attackHit: true });
    expect(effect.requiresSave?.saveType).toBe('constitution');
  });

  it('vex: hit → givesSelfAdvantage true', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'vex', attackHit: true });
    expect(effect.givesSelfAdvantage).toBe(true);
  });

  it('vex: miss → no advantage', () => {
    const effect = computeMasteryEffect({ ...baseParams, property: 'vex', attackHit: false });
    expect(effect.givesSelfAdvantage).toBeUndefined();
  });
});
