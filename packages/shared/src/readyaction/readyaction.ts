import type { CombatantState } from '../combat/index';
import type { ReadyAction, OpportunityAttack } from './types';

export function createReadyAction(
  combatantId: string,
  trigger: string,
  actionDescription: string,
  expiresOnTurn: number,
): ReadyAction {
  return { combatantId, trigger, actionDescription, expiresOnTurn, used: false };
}

export function fireReadyAction(action: ReadyAction): ReadyAction {
  if (action.used) throw new Error('Ready action already used');
  return { ...action, used: true };
}

export function isReadyActionExpired(action: ReadyAction, currentTurn: number): boolean {
  return currentTurn > action.expiresOnTurn;
}

export function canTakeOpportunityAttack(attacker: CombatantState, _target: CombatantState): boolean {
  if (!attacker.hasAction) return false;
  if (attacker.hp <= 0 && !attacker.isStable) return false;
  const blocking: CombatantState['conditions'][number][] = [
    'incapacitated', 'paralyzed', 'restrained', 'stunned', 'unconscious',
  ];
  for (const cond of blocking) {
    if (attacker.conditions.includes(cond)) return false;
  }
  return true;
}

export function buildOpportunityAttack(
  attackerId: string,
  targetId: string,
  sessionId: string,
): OpportunityAttack {
  return { attackerId, targetId, sessionId, timestamp: Date.now() };
}
