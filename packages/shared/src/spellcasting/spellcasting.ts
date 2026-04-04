import type { SpellcastingState, CastSpellParams, SpellLevel } from './types';

export function deductSlot(
  state: SpellcastingState,
  castAtLevel: SpellLevel,
  usePactMagic?: boolean,
): SpellcastingState {
  if (usePactMagic) {
    if (!state.pactMagic) throw new Error('No pact magic available');
    if (state.pactMagic.used >= state.pactMagic.total) {
      throw new Error('No pact magic slots remaining');
    }
    return {
      ...state,
      pactMagic: { ...state.pactMagic, used: state.pactMagic.used + 1 },
    };
  }

  const slotIndex = state.slots.findIndex((s) => s.level === castAtLevel);
  if (slotIndex === -1) throw new Error(`No spell slot of level ${castAtLevel} found`);
  const slot = state.slots[slotIndex];
  if (slot.used >= slot.total) throw new Error(`No level ${castAtLevel} spell slots remaining`);

  const newSlots = state.slots.map((s, i) =>
    i === slotIndex ? { ...s, used: s.used + 1 } : s,
  );
  return { ...state, slots: newSlots };
}

export function canCastSpell(
  state: SpellcastingState,
  params: CastSpellParams,
): { allowed: boolean; reason?: string } {
  if (params.isRitual) return { allowed: true };

  if (params.spellLevel === 0) return { allowed: true };

  if (state.castBonusActionThisTurn && params.isBonusAction && params.spellLevel > 0) {
    return { allowed: false, reason: 'Cannot cast two leveled spells as bonus action' };
  }

  if (state.castBonusActionThisTurn && !params.isBonusAction && params.spellLevel > 0) {
    return {
      allowed: false,
      reason: 'Cannot cast a leveled spell as action when bonus action spell was already cast this turn',
    };
  }

  const hasSlot = params.usePactMagic
    ? state.pactMagic !== undefined && state.pactMagic.used < state.pactMagic.total
    : state.slots.some((s) => s.level === params.castAtLevel && s.used < s.total);

  if (!hasSlot) {
    return { allowed: false, reason: `No available spell slots at level ${params.castAtLevel}` };
  }

  if (params.requiresConcentration && state.concentrationSpell) {
    return {
      allowed: true,
      reason: `Will end concentration on ${state.concentrationSpell}`,
    };
  }

  return { allowed: true };
}

export function startConcentration(
  state: SpellcastingState,
  spellName: string,
): SpellcastingState {
  return { ...state, concentrationSpell: spellName };
}

export function endConcentration(state: SpellcastingState): SpellcastingState {
  return { ...state, concentrationSpell: undefined };
}

export function recoverSlots(
  state: SpellcastingState,
  restType: 'short' | 'long',
): SpellcastingState {
  if (restType === 'long') {
    return {
      ...state,
      slots: state.slots.map((s) => ({ ...s, used: 0 })),
      pactMagic: state.pactMagic ? { ...state.pactMagic, used: 0 } : undefined,
    };
  }
  return {
    ...state,
    pactMagic: state.pactMagic ? { ...state.pactMagic, used: 0 } : undefined,
  };
}

export function concentrationSaveDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2));
}
