import { describe, it, expect } from 'vitest';
import {
  sortInitiative, applyDamage, applyHealing, applyTempHp,
  addCondition, removeCondition, advanceTurn, resetActionsForTurn,
  useAction, applyExhaustion, recordDeathSave, startCombat, endCombat,
} from './index.js';
import type { CombatantState, CombatState } from './index.js';

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

function makeState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    sessionId: 's1',
    round: 1,
    turnIndex: 0,
    combatants: [
      makeCombatant({ id: 'c1', name: 'Hero', initiative: 20, isActive: true }),
      makeCombatant({ id: 'c2', name: 'Monster', initiative: 10, isActive: false }),
    ],
    isActive: true,
    log: [],
    ...overrides,
  };
}

describe('sortInitiative', () => {
  it('sorts combatants by initiative descending', () => {
    const a = makeCombatant({ id: 'a', initiative: 5 });
    const b = makeCombatant({ id: 'b', initiative: 20 });
    const c = makeCombatant({ id: 'c', initiative: 12 });
    const sorted = sortInitiative([a, b, c]);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('uses initiativeRoll as tiebreaker', () => {
    const a = makeCombatant({ id: 'a', initiative: 10, initiativeRoll: 3 });
    const b = makeCombatant({ id: 'b', initiative: 10, initiativeRoll: 8 });
    const sorted = sortInitiative([a, b]);
    expect(sorted[0].id).toBe('b');
  });
});

describe('applyDamage', () => {
  it('reduces hp by damage amount', () => {
    const c = makeCombatant({ hp: 20, maxHp: 30 });
    const { combatant } = applyDamage(c, 5);
    expect(combatant.hp).toBe(15);
  });

  it('absorbs damage through tempHp first', () => {
    const c = makeCombatant({ hp: 20, maxHp: 30, tempHp: 10 });
    const { combatant } = applyDamage(c, 8);
    expect(combatant.tempHp).toBe(2);
    expect(combatant.hp).toBe(20);
  });

  it('overflow damage hits real hp after tempHp depleted', () => {
    const c = makeCombatant({ hp: 20, maxHp: 30, tempHp: 5 });
    const { combatant } = applyDamage(c, 10);
    expect(combatant.tempHp).toBe(0);
    expect(combatant.hp).toBe(15);
  });

  it('hp does not go below 0', () => {
    const c = makeCombatant({ hp: 5, maxHp: 30 });
    const { combatant } = applyDamage(c, 100);
    expect(combatant.hp).toBe(0);
  });

  it('sets isBloodied when hp <= maxHp / 2', () => {
    const c = makeCombatant({ hp: 30, maxHp: 30 });
    const { combatant } = applyDamage(c, 16);
    expect(combatant.isBloodied).toBe(true);
  });

  it('adds unconscious condition and resets death saves when hp reaches 0', () => {
    const c = makeCombatant({ hp: 5, maxHp: 30 });
    const { combatant, messages } = applyDamage(c, 5);
    expect(combatant.hp).toBe(0);
    expect(combatant.conditions).toContain('unconscious');
    expect(combatant.deathSaveSuccesses).toBe(0);
    expect(combatant.deathSaveFailures).toBe(0);
    expect(messages).toContain('Hero has fallen unconscious!');
  });
});

describe('applyHealing', () => {
  it('increases hp up to maxHp', () => {
    const c = makeCombatant({ hp: 10, maxHp: 30 });
    const { combatant } = applyHealing(c, 10);
    expect(combatant.hp).toBe(20);
  });

  it('caps hp at maxHp', () => {
    const c = makeCombatant({ hp: 28, maxHp: 30 });
    const { combatant } = applyHealing(c, 10);
    expect(combatant.hp).toBe(30);
  });

  it('removes unconscious and resets death saves when healing from 0', () => {
    const c = makeCombatant({ hp: 0, maxHp: 30, conditions: ['unconscious'], deathSaveSuccesses: 2, deathSaveFailures: 1 });
    const { combatant, messages } = applyHealing(c, 5);
    expect(combatant.conditions).not.toContain('unconscious');
    expect(combatant.deathSaveSuccesses).toBe(0);
    expect(combatant.deathSaveFailures).toBe(0);
    expect(messages).toContain('Hero regains consciousness!');
  });
});

describe('applyTempHp', () => {
  it('sets tempHp if higher than current', () => {
    const c = makeCombatant({ tempHp: 5 });
    expect(applyTempHp(c, 10).tempHp).toBe(10);
  });

  it('does not stack (keeps higher value)', () => {
    const c = makeCombatant({ tempHp: 10 });
    expect(applyTempHp(c, 5).tempHp).toBe(10);
  });
});

describe('addCondition', () => {
  it('adds a condition', () => {
    const c = makeCombatant();
    expect(addCondition(c, 'poisoned').conditions).toContain('poisoned');
  });

  it('paralyzed adds incapacitated', () => {
    const c = makeCombatant();
    const updated = addCondition(c, 'paralyzed');
    expect(updated.conditions).toContain('paralyzed');
    expect(updated.conditions).toContain('incapacitated');
    expect(updated.hasAction).toBe(false);
  });

  it('stunned adds incapacitated', () => {
    const c = makeCombatant();
    const updated = addCondition(c, 'stunned');
    expect(updated.conditions).toContain('incapacitated');
    expect(updated.hasAction).toBe(false);
  });

  it('incapacitated sets hasAction and hasBonusAction to false', () => {
    const c = makeCombatant();
    const updated = addCondition(c, 'incapacitated');
    expect(updated.hasAction).toBe(false);
    expect(updated.hasBonusAction).toBe(false);
  });
});

describe('removeCondition', () => {
  it('removes a condition', () => {
    const c = makeCombatant({ conditions: ['poisoned', 'prone'] });
    expect(removeCondition(c, 'poisoned').conditions).not.toContain('poisoned');
    expect(removeCondition(c, 'poisoned').conditions).toContain('prone');
  });
});

describe('useAction', () => {
  it('consumes action', () => {
    const c = makeCombatant();
    expect(useAction(c, 'action').hasAction).toBe(false);
  });

  it('throws if action already used', () => {
    const c = makeCombatant({ hasAction: false });
    expect(() => useAction(c, 'action')).toThrow();
  });

  it('consumes bonus action', () => {
    const c = makeCombatant();
    expect(useAction(c, 'bonus_action').hasBonusAction).toBe(false);
  });

  it('consumes reaction', () => {
    const c = makeCombatant();
    expect(useAction(c, 'reaction').hasReaction).toBe(false);
  });
});

describe('resetActionsForTurn', () => {
  it('resets hasAction and hasBonusAction', () => {
    const c = makeCombatant({ hasAction: false, hasBonusAction: false });
    const updated = resetActionsForTurn(c);
    expect(updated.hasAction).toBe(true);
    expect(updated.hasBonusAction).toBe(true);
  });

  it('does NOT reset hasReaction', () => {
    const c = makeCombatant({ hasReaction: false });
    expect(resetActionsForTurn(c).hasReaction).toBe(false);
  });

  it('keeps action disabled if incapacitated', () => {
    const c = makeCombatant({ conditions: ['incapacitated'], hasAction: false });
    expect(resetActionsForTurn(c).hasAction).toBe(false);
  });
});

describe('advanceTurn', () => {
  it('moves to next combatant', () => {
    const state = makeState();
    const next = advanceTurn(state);
    expect(next.turnIndex).toBe(1);
    expect(next.combatants[1].isActive).toBe(true);
    expect(next.combatants[0].isActive).toBe(false);
  });

  it('wraps around and increments round', () => {
    const state = makeState({ turnIndex: 1 });
    const next = advanceTurn(state);
    expect(next.turnIndex).toBe(0);
    expect(next.round).toBe(2);
  });

  it('resets actions for new active combatant', () => {
    const state = makeState({
      combatants: [
        makeCombatant({ id: 'c1', isActive: true }),
        makeCombatant({ id: 'c2', hasAction: false, hasBonusAction: false }),
      ],
    });
    const next = advanceTurn(state);
    expect(next.combatants[1].hasAction).toBe(true);
    expect(next.combatants[1].hasBonusAction).toBe(true);
  });
});

describe('applyExhaustion', () => {
  it('increases exhaustion level', () => {
    const c = makeCombatant();
    const { combatant } = applyExhaustion(c, 2);
    expect(combatant.exhaustionLevel).toBe(2);
  });

  it('kills at level 6', () => {
    const c = makeCombatant({ hp: 20, maxHp: 20 });
    const { combatant, messages } = applyExhaustion(c, 6);
    expect(combatant.hp).toBe(0);
    expect(messages.some((m) => m.includes('died'))).toBe(true);
  });
});

describe('recordDeathSave', () => {
  it('records a success', () => {
    const c = makeCombatant({ hp: 0 });
    const { combatant } = recordDeathSave(c, true);
    expect(combatant.deathSaveSuccesses).toBe(1);
  });

  it('records a failure', () => {
    const c = makeCombatant({ hp: 0 });
    const { combatant } = recordDeathSave(c, false);
    expect(combatant.deathSaveFailures).toBe(1);
  });

  it('3 successes = stable message', () => {
    const c = makeCombatant({ hp: 0, deathSaveSuccesses: 2 });
    const { messages } = recordDeathSave(c, true);
    expect(messages).toContain('Hero is stable!');
  });

  it('3 failures = dead message', () => {
    const c = makeCombatant({ hp: 0, deathSaveFailures: 2 });
    const { messages } = recordDeathSave(c, false);
    expect(messages).toContain('Hero has died!');
  });
});

describe('startCombat', () => {
  it('sets isActive to true', () => {
    const state = makeState({ isActive: false, round: 0 });
    expect(startCombat(state).isActive).toBe(true);
  });

  it('sets round to 1', () => {
    const state = makeState({ isActive: false, round: 0 });
    expect(startCombat(state).round).toBe(1);
  });

  it('sorts combatants by initiative', () => {
    const state = makeState({
      isActive: false,
      combatants: [
        makeCombatant({ id: 'low', initiative: 5 }),
        makeCombatant({ id: 'high', initiative: 20 }),
      ],
    });
    const started = startCombat(state);
    expect(started.combatants[0].id).toBe('high');
  });

  it('first combatant is active', () => {
    const state = makeState({ isActive: false });
    const started = startCombat(state);
    expect(started.combatants[0].isActive).toBe(true);
    expect(started.combatants[1].isActive).toBe(false);
  });
});

describe('endCombat', () => {
  it('sets isActive to false', () => {
    const state = makeState();
    expect(endCombat(state).isActive).toBe(false);
  });

  it('all combatants become inactive', () => {
    const state = makeState();
    const ended = endCombat(state);
    expect(ended.combatants.every((c) => !c.isActive)).toBe(true);
  });

  it('resets action economies', () => {
    const state = makeState({
      combatants: [makeCombatant({ hasAction: false, hasBonusAction: false, hasReaction: false })],
    });
    const ended = endCombat(state);
    expect(ended.combatants[0].hasAction).toBe(true);
    expect(ended.combatants[0].hasBonusAction).toBe(true);
    expect(ended.combatants[0].hasReaction).toBe(true);
  });
});
