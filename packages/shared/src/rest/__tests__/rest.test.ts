import { describe, it, expect, vi } from 'vitest';
import {
  computeHPRecovery,
  computeHitDiceAfterRest,
  applyLongRestFeatures,
  applyShortRestFeatures,
  allConfirmed,
} from '../rest';
import type { CombatantState } from '../../combat/index';
import type { RestProposal } from '../types';

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
    exhaustionLevel: 0,
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
    hitDiceRemaining: 2,
    maxHitDice: 5,
    conModifier: 2,
    ...overrides,
  };
}

function makeProposal(overrides: Partial<RestProposal> = {}): RestProposal {
  return {
    id: 'prop_1',
    sessionId: 's1',
    proposedBy: 'c1',
    restType: 'short',
    confirmedBy: [],
    requiredCount: 3,
    status: 'pending',
    ...overrides,
  };
}

describe('computeHPRecovery', () => {
  it('returns a non-negative number', () => {
    const result = computeHPRecovery(10, 30, 2, 8, 0);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 when already at maxHp', () => {
    const result = computeHPRecovery(30, 30, 3, 8, 2);
    expect(result).toBe(0);
  });

  it('caps gained HP so currentHp + gained does not exceed maxHp', () => {
    // currentHp = 28, maxHp = 30, max possible gain = 2
    const result = computeHPRecovery(28, 30, 5, 8, 5);
    expect(result).toBeLessThanOrEqual(2);
  });

  it('with conModifier of -3 and d4 can still gain at least 1 HP per die (min 1)', () => {
    // Each die rolls min 1 + (-3) = -2, but min 1, so at least diceCount HP
    vi.spyOn(Math, 'random').mockReturnValue(0); // rolls all 1s
    const result = computeHPRecovery(0, 30, 2, 4, -3);
    expect(result).toBeGreaterThanOrEqual(2);
    vi.restoreAllMocks();
  });

  it('adds conModifier to each die roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // rolls (0.5 * hitDie + 1)
    const result1 = computeHPRecovery(0, 100, 1, 8, 0);
    const result2 = computeHPRecovery(0, 100, 1, 8, 3);
    expect(result2 - result1).toBe(3);
    vi.restoreAllMocks();
  });

  it('rolls multiple dice and sums', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // each die rolls 1
    const result = computeHPRecovery(0, 30, 3, 8, 0);
    expect(result).toBe(3);
    vi.restoreAllMocks();
  });
});

describe('computeHitDiceAfterRest', () => {
  it('returns currentHD unchanged on short rest', () => {
    expect(computeHitDiceAfterRest(3, 5, 'short')).toBe(3);
  });

  it('restores half maxHD on long rest', () => {
    expect(computeHitDiceAfterRest(0, 10, 'long')).toBe(5);
  });

  it('caps at maxHD on long rest', () => {
    expect(computeHitDiceAfterRest(9, 10, 'long')).toBe(10);
  });

  it('restores at least 1 die on long rest with maxHD=1', () => {
    expect(computeHitDiceAfterRest(0, 1, 'long')).toBe(1);
  });

  it('floors the half value on long rest', () => {
    // maxHD=5, floor(5/2)=2
    expect(computeHitDiceAfterRest(0, 5, 'long')).toBe(2);
  });
});

describe('applyLongRestFeatures', () => {
  it('restores hp to maxHp', () => {
    const state = makeCombatant({ hp: 5, maxHp: 30 });
    const result = applyLongRestFeatures(state);
    expect(result.hp).toBe(30);
  });

  it('clears isBloodied flag', () => {
    const state = makeCombatant({ hp: 5, maxHp: 30, isBloodied: true });
    const result = applyLongRestFeatures(state);
    expect(result.isBloodied).toBe(false);
  });

  it('reduces exhaustion by 1', () => {
    const state = makeCombatant({ exhaustionLevel: 3 });
    const result = applyLongRestFeatures(state);
    expect(result.exhaustionLevel).toBe(2);
  });

  it('does not reduce exhaustion below 0', () => {
    const state = makeCombatant({ exhaustionLevel: 0 });
    const result = applyLongRestFeatures(state);
    expect(result.exhaustionLevel).toBe(0);
  });

  it('recovers all spell slots', () => {
    const state = makeCombatant({
      spellcasting: {
        slots: [{ level: 1, total: 3, used: 3 }],
        castBonusActionThisTurn: false,
      },
    });
    const result = applyLongRestFeatures(state);
    expect(result.spellcasting?.slots[0].used).toBe(0);
  });

  it('recovers pact magic on long rest', () => {
    const state = makeCombatant({
      spellcasting: {
        slots: [],
        pactMagic: { level: 3, total: 2, used: 2 },
        castBonusActionThisTurn: false,
      },
    });
    const result = applyLongRestFeatures(state);
    expect(result.spellcasting?.pactMagic?.used).toBe(0);
  });

  it('restores hit dice on long rest', () => {
    const state = makeCombatant({ hitDiceRemaining: 1, maxHitDice: 5 });
    const result = applyLongRestFeatures(state);
    // 1 + floor(5/2) = 1 + 2 = 3
    expect(result.hitDiceRemaining).toBe(3);
  });
});

describe('applyShortRestFeatures', () => {
  it('recovers pact magic on short rest', () => {
    const state = makeCombatant({
      spellcasting: {
        slots: [{ level: 1, total: 3, used: 3 }],
        pactMagic: { level: 2, total: 2, used: 2 },
        castBonusActionThisTurn: false,
      },
    });
    const result = applyShortRestFeatures(state);
    expect(result.spellcasting?.pactMagic?.used).toBe(0);
  });

  it('does not recover regular spell slots on short rest', () => {
    const state = makeCombatant({
      spellcasting: {
        slots: [{ level: 1, total: 3, used: 2 }],
        castBonusActionThisTurn: false,
      },
    });
    const result = applyShortRestFeatures(state);
    expect(result.spellcasting?.slots[0].used).toBe(2);
  });

  it('does not change HP on short rest', () => {
    const state = makeCombatant({ hp: 5, maxHp: 30 });
    const result = applyShortRestFeatures(state);
    expect(result.hp).toBe(5);
  });
});

describe('allConfirmed', () => {
  it('returns true when confirmedBy.length equals requiredCount', () => {
    const proposal = makeProposal({ confirmedBy: ['c1', 'c2', 'c3'], requiredCount: 3 });
    expect(allConfirmed(proposal)).toBe(true);
  });

  it('returns true when confirmedBy.length exceeds requiredCount', () => {
    const proposal = makeProposal({ confirmedBy: ['c1', 'c2', 'c3', 'c4'], requiredCount: 3 });
    expect(allConfirmed(proposal)).toBe(true);
  });

  it('returns false when not enough confirmed', () => {
    const proposal = makeProposal({ confirmedBy: ['c1'], requiredCount: 3 });
    expect(allConfirmed(proposal)).toBe(false);
  });

  it('returns false when confirmedBy is empty', () => {
    const proposal = makeProposal({ confirmedBy: [], requiredCount: 2 });
    expect(allConfirmed(proposal)).toBe(false);
  });
});
