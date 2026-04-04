import type { CombatantState } from '../combat/index';
import { recoverSlots } from '../spellcasting/index';
import type { RestProposal, RestType } from './types';

export function computeHPRecovery(
  currentHp: number,
  maxHp: number,
  diceCount: number,
  hitDie: number,
  conModifier: number,
): number {
  let total = 0;
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * hitDie) + 1;
    total += Math.max(1, roll + conModifier);
  }
  return Math.min(total, maxHp - currentHp);
}

export function computeHitDiceAfterRest(
  currentHD: number,
  maxHD: number,
  restType: RestType,
): number {
  if (restType === 'short') return currentHD;
  return Math.min(currentHD + Math.max(1, Math.floor(maxHD / 2)), maxHD);
}

export function applyLongRestFeatures(state: CombatantState): CombatantState {
  let updated = { ...state };

  updated.hp = updated.maxHp;
  updated.isBloodied = false;
  updated.exhaustionLevel = Math.max(0, updated.exhaustionLevel - 1);
  updated.conditions = updated.conditions.filter((c) => c !== 'unconscious');
  updated.deathSaveSuccesses = 0;
  updated.deathSaveFailures = 0;

  if (updated.spellcasting) {
    updated.spellcasting = recoverSlots(updated.spellcasting, 'long');
  }

  if (updated.hitDiceRemaining !== undefined && updated.maxHitDice !== undefined) {
    updated.hitDiceRemaining = computeHitDiceAfterRest(
      updated.hitDiceRemaining,
      updated.maxHitDice,
      'long',
    );
  }

  return updated;
}

export function applyShortRestFeatures(state: CombatantState): CombatantState {
  let updated = { ...state };

  if (updated.spellcasting) {
    updated.spellcasting = recoverSlots(updated.spellcasting, 'short');
  }

  return updated;
}

export function allConfirmed(proposal: RestProposal): boolean {
  return proposal.confirmedBy.length >= proposal.requiredCount;
}
