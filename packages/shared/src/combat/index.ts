// Types
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'free_action';

export type ConditionName =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified'
  | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious';

export interface CombatantState {
  id: string;
  name: string;
  initiative: number;
  initiativeRoll: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  conditions: ConditionName[];
  exhaustionLevel: number;
  isBloodied: boolean;
  isConcentrating: boolean;
  concentrationSpell?: string;
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
  isPlayer: boolean;
  isActive: boolean;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
}

export interface CombatState {
  sessionId: string;
  round: number;
  turnIndex: number;
  combatants: CombatantState[];
  isActive: boolean;
  log: string[];
}

export function sortInitiative(combatants: CombatantState[]): CombatantState[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return b.initiativeRoll - a.initiativeRoll;
  });
}

export function applyDamage(
  combatant: CombatantState,
  damage: number,
): { combatant: CombatantState; messages: string[] } {
  const messages: string[] = [];
  let updated = { ...combatant };
  const wasAt0 = updated.hp === 0;

  let remaining = damage;

  // Temp HP absorbs first
  if (updated.tempHp > 0) {
    const absorbed = Math.min(updated.tempHp, remaining);
    updated.tempHp -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    updated.hp = Math.max(0, updated.hp - remaining);
  }

  updated.isBloodied = updated.hp <= updated.maxHp / 2;

  if (updated.hp === 0 && !wasAt0) {
    if (!updated.conditions.includes('unconscious')) {
      updated.conditions = [...updated.conditions, 'unconscious'];
    }
    updated.deathSaveSuccesses = 0;
    updated.deathSaveFailures = 0;
    messages.push(`${updated.name} has fallen unconscious!`);
  }

  if (updated.isBloodied && !combatant.isBloodied) {
    messages.push(`${updated.name} is bloodied!`);
  }

  return { combatant: updated, messages };
}

export function applyHealing(
  combatant: CombatantState,
  amount: number,
): { combatant: CombatantState; messages: string[] } {
  const messages: string[] = [];
  const wasAt0 = combatant.hp === 0;
  const updated = { ...combatant };

  updated.hp = Math.min(updated.maxHp, updated.hp + amount);
  updated.isBloodied = updated.hp <= updated.maxHp / 2;

  if (wasAt0 && updated.hp > 0) {
    updated.conditions = updated.conditions.filter((c) => c !== 'unconscious');
    updated.deathSaveSuccesses = 0;
    updated.deathSaveFailures = 0;
    messages.push(`${updated.name} regains consciousness!`);
  }

  return { combatant: updated, messages };
}

export function applyTempHp(combatant: CombatantState, amount: number): CombatantState {
  // Temp HP doesn't stack — only keep the higher value
  return { ...combatant, tempHp: Math.max(combatant.tempHp, amount) };
}

export function addCondition(combatant: CombatantState, condition: ConditionName): CombatantState {
  let updated = { ...combatant };
  const conditions = new Set(updated.conditions);
  conditions.add(condition);

  // Paralyzed implies incapacitated
  if (condition === 'paralyzed') conditions.add('incapacitated');
  // Stunned implies incapacitated
  if (condition === 'stunned') conditions.add('incapacitated');

  updated.conditions = [...conditions];

  // Incapacitated removes action and bonus action
  if (conditions.has('incapacitated')) {
    updated.hasAction = false;
    updated.hasBonusAction = false;
  }

  return updated;
}

export function removeCondition(combatant: CombatantState, condition: ConditionName): CombatantState {
  return {
    ...combatant,
    conditions: combatant.conditions.filter((c) => c !== condition),
  };
}

export function resetActionsForTurn(combatant: CombatantState): CombatantState {
  let updated = { ...combatant, hasAction: true, hasBonusAction: true };
  // Re-apply incapacitated if the condition is still present
  if (updated.conditions.includes('incapacitated')) {
    updated.hasAction = false;
    updated.hasBonusAction = false;
  }
  return updated;
}

export function useAction(combatant: CombatantState, type: ActionType): CombatantState {
  const updated = { ...combatant };
  if (type === 'action') {
    if (!updated.hasAction) throw new Error(`${updated.name} has already used their action`);
    updated.hasAction = false;
  } else if (type === 'bonus_action') {
    if (!updated.hasBonusAction) throw new Error(`${updated.name} has already used their bonus action`);
    updated.hasBonusAction = false;
  } else if (type === 'reaction') {
    if (!updated.hasReaction) throw new Error(`${updated.name} has already used their reaction`);
    updated.hasReaction = false;
  }
  return updated;
}

export function advanceTurn(state: CombatState): CombatState {
  const { combatants, turnIndex } = state;
  let updated = { ...state };

  // Deactivate current
  updated.combatants = combatants.map((c, i) =>
    i === turnIndex ? { ...c, isActive: false } : c,
  );

  const oldIndex = turnIndex;
  const newIndex = (oldIndex + 1) % combatants.length;

  // Increment round if we wrapped around
  if (newIndex <= oldIndex) {
    updated.round = updated.round + 1;
  }

  updated.turnIndex = newIndex;

  // Activate new combatant and reset their actions
  updated.combatants = updated.combatants.map((c, i) =>
    i === newIndex ? resetActionsForTurn({ ...c, isActive: true }) : c,
  );

  return updated;
}

export function applyExhaustion(
  combatant: CombatantState,
  delta: number,
): { combatant: CombatantState; messages: string[] } {
  const messages: string[] = [];
  const newLevel = Math.max(0, Math.min(6, combatant.exhaustionLevel + delta));
  let updated = { ...combatant, exhaustionLevel: newLevel };

  if (newLevel >= 6) {
    messages.push(`${updated.name} has died from exhaustion!`);
    const { combatant: dead } = applyDamage(updated, updated.hp + updated.tempHp);
    updated = dead;
  } else if (newLevel > combatant.exhaustionLevel) {
    messages.push(`${updated.name} gains exhaustion level ${newLevel} (−${newLevel * 2} to D20 Tests${newLevel >= 5 ? ', half speed' : ''})`);
  } else if (newLevel < combatant.exhaustionLevel) {
    messages.push(`${updated.name} reduces exhaustion to level ${newLevel}`);
  }

  return { combatant: updated, messages };
}

export function recordDeathSave(
  combatant: CombatantState,
  success: boolean,
): { combatant: CombatantState; messages: string[] } {
  const messages: string[] = [];
  let updated = { ...combatant };

  if (success) {
    updated.deathSaveSuccesses = updated.deathSaveSuccesses + 1;
    if (updated.deathSaveSuccesses >= 3) {
      // Stable — stays at 0 HP but no longer rolling
      messages.push(`${updated.name} is stable!`);
    }
  } else {
    updated.deathSaveFailures = updated.deathSaveFailures + 1;
    if (updated.deathSaveFailures >= 3) {
      // Dead — hp stays 0
      messages.push(`${updated.name} has died!`);
    }
  }

  return { combatant: updated, messages };
}

export function startCombat(state: CombatState): CombatState {
  const sorted = sortInitiative(state.combatants);
  const first = sorted[0];
  const combatants = sorted.map((c, i) => ({
    ...resetActionsForTurn(c),
    isActive: i === 0,
    hasReaction: true,
  }));

  if (first) {
    combatants[0] = resetActionsForTurn({ ...combatants[0], isActive: true });
  }

  return {
    ...state,
    isActive: true,
    round: 1,
    turnIndex: 0,
    combatants,
    log: [...state.log, 'Combat started!'],
  };
}

export function endCombat(state: CombatState): CombatState {
  return {
    ...state,
    isActive: false,
    combatants: state.combatants.map((c) => ({
      ...c,
      isActive: false,
      hasAction: true,
      hasBonusAction: true,
      hasReaction: true,
    })),
    log: [...state.log, 'Combat ended.'],
  };
}
