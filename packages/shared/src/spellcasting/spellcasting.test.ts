import { describe, it, expect } from 'vitest';
import type { SpellcastingState } from './types';
import {
  deductSlot,
  canCastSpell,
  startConcentration,
  endConcentration,
  recoverSlots,
  concentrationSaveDC,
} from './spellcasting';

function makeState(overrides: Partial<SpellcastingState> = {}): SpellcastingState {
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

describe('deductSlot', () => {
  it('deducts a regular slot at the correct level', () => {
    const state = makeState();
    const result = deductSlot(state, 1);
    expect(result.slots.find((s) => s.level === 1)?.used).toBe(1);
  });

  it('deducts pact magic slot when usePactMagic=true', () => {
    const state = makeState({ pactMagic: { level: 2, total: 2, used: 0 } });
    const result = deductSlot(state, 2, true);
    expect(result.pactMagic?.used).toBe(1);
  });

  it('throws when no regular slots remain', () => {
    const state = makeState({
      slots: [{ level: 1, total: 2, used: 2 }],
    });
    expect(() => deductSlot(state, 1)).toThrow('No level 1 spell slots remaining');
  });

  it('throws when no pact magic slots remain', () => {
    const state = makeState({ pactMagic: { level: 2, total: 2, used: 2 } });
    expect(() => deductSlot(state, 2, true)).toThrow('No pact magic slots remaining');
  });

  it('throws when pactMagic is undefined and usePactMagic=true', () => {
    const state = makeState();
    expect(() => deductSlot(state, 2, true)).toThrow('No pact magic available');
  });

  it('deducts upcast slot (level 3 when casting level 1 spell)', () => {
    const state = makeState();
    const result = deductSlot(state, 3);
    expect(result.slots.find((s) => s.level === 3)?.used).toBe(1);
    expect(result.slots.find((s) => s.level === 1)?.used).toBe(0);
  });

  it('throws when slot level not found', () => {
    const state = makeState({ slots: [{ level: 1, total: 2, used: 0 }] });
    expect(() => deductSlot(state, 5)).toThrow('No spell slot of level 5 found');
  });
});

describe('canCastSpell', () => {
  it('ritual is always allowed even with no slots', () => {
    const state = makeState({ slots: [] });
    const result = canCastSpell(state, {
      spellName: 'Detect Magic',
      spellLevel: 1,
      castAtLevel: 1,
      isRitual: true,
      isBonusAction: false,
      requiresConcentration: false,
    });
    expect(result.allowed).toBe(true);
  });

  it('cantrip (spellLevel 0) is always allowed', () => {
    const state = makeState({ slots: [] });
    const result = canCastSpell(state, {
      spellName: 'Fire Bolt',
      spellLevel: 0,
      castAtLevel: 0,
      isRitual: false,
      isBonusAction: false,
      requiresConcentration: false,
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks leveled bonus action if already cast bonus action spell', () => {
    const state = makeState({ castBonusActionThisTurn: true });
    const result = canCastSpell(state, {
      spellName: 'Shining Smite',
      spellLevel: 2,
      castAtLevel: 2,
      isRitual: false,
      isBonusAction: true,
      requiresConcentration: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('bonus action');
  });

  it('blocks leveled action spell if bonus action spell was already cast', () => {
    const state = makeState({ castBonusActionThisTurn: true });
    const result = canCastSpell(state, {
      spellName: 'Fireball',
      spellLevel: 3,
      castAtLevel: 3,
      isRitual: false,
      isBonusAction: false,
      requiresConcentration: false,
    });
    expect(result.allowed).toBe(false);
  });

  it('allows cantrip as action when bonus action spell was already cast', () => {
    const state = makeState({ castBonusActionThisTurn: true });
    const result = canCastSpell(state, {
      spellName: 'Fire Bolt',
      spellLevel: 0,
      castAtLevel: 0,
      isRitual: false,
      isBonusAction: false,
      requiresConcentration: false,
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks when no slots available', () => {
    const state = makeState({
      slots: [{ level: 1, total: 2, used: 2 }],
    });
    const result = canCastSpell(state, {
      spellName: 'Magic Missile',
      spellLevel: 1,
      castAtLevel: 1,
      isRitual: false,
      isBonusAction: false,
      requiresConcentration: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No available spell slots');
  });

  it('allows but warns when replacing concentration', () => {
    const state = makeState({ concentrationSpell: 'Bless' });
    const result = canCastSpell(state, {
      spellName: 'Hold Person',
      spellLevel: 2,
      castAtLevel: 2,
      isRitual: false,
      isBonusAction: false,
      requiresConcentration: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('Bless');
  });
});

describe('startConcentration', () => {
  it('sets concentrationSpell', () => {
    const state = makeState();
    const result = startConcentration(state, 'Bless');
    expect(result.concentrationSpell).toBe('Bless');
  });
});

describe('endConcentration', () => {
  it('clears concentrationSpell', () => {
    const state = makeState({ concentrationSpell: 'Bless' });
    const result = endConcentration(state);
    expect(result.concentrationSpell).toBeUndefined();
  });
});

describe('recoverSlots', () => {
  it('long rest resets all slots', () => {
    const state = makeState({
      slots: [
        { level: 1, total: 4, used: 4 },
        { level: 2, total: 3, used: 2 },
      ],
      pactMagic: { level: 2, total: 2, used: 2 },
    });
    const result = recoverSlots(state, 'long');
    expect(result.slots.every((s) => s.used === 0)).toBe(true);
    expect(result.pactMagic?.used).toBe(0);
  });

  it('short rest only resets pact magic', () => {
    const state = makeState({
      slots: [{ level: 1, total: 4, used: 3 }],
      pactMagic: { level: 2, total: 2, used: 2 },
    });
    const result = recoverSlots(state, 'short');
    expect(result.slots.find((s) => s.level === 1)?.used).toBe(3);
    expect(result.pactMagic?.used).toBe(0);
  });
});

describe('concentrationSaveDC', () => {
  it('damage=1 → DC 10', () => expect(concentrationSaveDC(1)).toBe(10));
  it('damage=20 → DC 10', () => expect(concentrationSaveDC(20)).toBe(10));
  it('damage=21 → DC 10 (floor(21/2)=10)', () => expect(concentrationSaveDC(21)).toBe(10));
  it('damage=22 → DC 11', () => expect(concentrationSaveDC(22)).toBe(11));
  it('damage=0 → DC 10', () => expect(concentrationSaveDC(0)).toBe(10));
});
