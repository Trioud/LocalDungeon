import { describe, it, expect } from 'vitest';
import {
  createReadyAction,
  fireReadyAction,
  isReadyActionExpired,
  canTakeOpportunityAttack,
  buildOpportunityAttack,
} from './readyaction';
import type { ReadyAction } from './types';
import type { CombatantState } from '../combat/index';

function makeCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'c1',
    name: 'Fighter',
    initiative: 15,
    initiativeRoll: 15,
    hp: 20,
    maxHp: 20,
    tempHp: 0,
    ac: 16,
    conditions: [],
    exhaustionLevel: 0,
    isBloodied: false,
    isConcentrating: false,
    hasAction: true,
    hasBonusAction: true,
    hasReaction: true,
    isPlayer: true,
    isActive: true,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    ...overrides,
  };
}

describe('createReadyAction', () => {
  it('creates with correct combatantId', () => {
    const a = createReadyAction('c1', 'enemy moves', 'attack', 3);
    expect(a.combatantId).toBe('c1');
  });

  it('creates with correct trigger', () => {
    const a = createReadyAction('c1', 'enemy moves', 'attack', 3);
    expect(a.trigger).toBe('enemy moves');
  });

  it('creates with correct actionDescription', () => {
    const a = createReadyAction('c1', 'enemy moves', 'attack', 3);
    expect(a.actionDescription).toBe('attack');
  });

  it('creates with correct expiresOnTurn', () => {
    const a = createReadyAction('c1', 'enemy moves', 'attack', 3);
    expect(a.expiresOnTurn).toBe(3);
  });

  it('creates with used=false', () => {
    const a = createReadyAction('c1', 'enemy moves', 'attack', 3);
    expect(a.used).toBe(false);
  });
});

describe('fireReadyAction', () => {
  it('returns a copy with used=true', () => {
    const a = createReadyAction('c1', 'trigger', 'desc', 2);
    const fired = fireReadyAction(a);
    expect(fired.used).toBe(true);
  });

  it('does not mutate the original', () => {
    const a = createReadyAction('c1', 'trigger', 'desc', 2);
    fireReadyAction(a);
    expect(a.used).toBe(false);
  });

  it('throws if action already used', () => {
    const a: ReadyAction = { combatantId: 'c1', trigger: 't', actionDescription: 'a', expiresOnTurn: 2, used: true };
    expect(() => fireReadyAction(a)).toThrow('Ready action already used');
  });

  it('preserves other fields', () => {
    const a = createReadyAction('c1', 'trigger', 'desc', 5);
    const fired = fireReadyAction(a);
    expect(fired.combatantId).toBe('c1');
    expect(fired.trigger).toBe('trigger');
    expect(fired.actionDescription).toBe('desc');
    expect(fired.expiresOnTurn).toBe(5);
  });
});

describe('isReadyActionExpired', () => {
  it('returns true when currentTurn > expiresOnTurn', () => {
    const a = createReadyAction('c1', 't', 'd', 3);
    expect(isReadyActionExpired(a, 4)).toBe(true);
  });

  it('returns false when currentTurn === expiresOnTurn', () => {
    const a = createReadyAction('c1', 't', 'd', 3);
    expect(isReadyActionExpired(a, 3)).toBe(false);
  });

  it('returns false when currentTurn < expiresOnTurn', () => {
    const a = createReadyAction('c1', 't', 'd', 5);
    expect(isReadyActionExpired(a, 3)).toBe(false);
  });
});

describe('canTakeOpportunityAttack', () => {
  it('returns true when healthy with no conditions', () => {
    const attacker = makeCombatant();
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(true);
  });

  it('returns false when hasAction is false', () => {
    const attacker = makeCombatant({ hasAction: false });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });

  it('returns false when hp<=0 and isStable=false', () => {
    const attacker = makeCombatant({ hp: 0, isStable: false });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });

  it('returns true when hp<=0 but isStable=true', () => {
    const attacker = makeCombatant({ hp: 0, isStable: true });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(true);
  });

  it('returns false when incapacitated', () => {
    const attacker = makeCombatant({ conditions: ['incapacitated'] });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });

  it('returns false when paralyzed', () => {
    const attacker = makeCombatant({ conditions: ['paralyzed'] });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });

  it('returns false when restrained', () => {
    const attacker = makeCombatant({ conditions: ['restrained'] });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });

  it('returns false when stunned', () => {
    const attacker = makeCombatant({ conditions: ['stunned'] });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });

  it('returns false when unconscious', () => {
    const attacker = makeCombatant({ conditions: ['unconscious'] });
    const target = makeCombatant({ id: 'c2' });
    expect(canTakeOpportunityAttack(attacker, target)).toBe(false);
  });
});

describe('buildOpportunityAttack', () => {
  it('returns correct attackerId', () => {
    const opp = buildOpportunityAttack('a1', 't1', 'sess1');
    expect(opp.attackerId).toBe('a1');
  });

  it('returns correct targetId', () => {
    const opp = buildOpportunityAttack('a1', 't1', 'sess1');
    expect(opp.targetId).toBe('t1');
  });

  it('returns correct sessionId', () => {
    const opp = buildOpportunityAttack('a1', 't1', 'sess1');
    expect(opp.sessionId).toBe('sess1');
  });

  it('timestamp is a number', () => {
    const opp = buildOpportunityAttack('a1', 't1', 'sess1');
    expect(typeof opp.timestamp).toBe('number');
  });

  it('timestamp is recent', () => {
    const before = Date.now();
    const opp = buildOpportunityAttack('a1', 't1', 'sess1');
    const after = Date.now();
    expect(opp.timestamp).toBeGreaterThanOrEqual(before);
    expect(opp.timestamp).toBeLessThanOrEqual(after);
  });
});
