import { Redis } from 'ioredis';
import type { GameLogService } from './GameLogService.js';
import type { CombatState, WeaponMasteryEntry, MasteryEffect, MasteryProperty } from '@local-dungeon/shared';
import {
  computeMasteryEffect,
  maxMasteriesForClass,
  applyDamage as applyDamageFn,
  addCondition as addConditionFn,
} from '@local-dungeon/shared';

interface WeaponMasteryServiceDeps {
  redis: Redis;
  gameLogService: GameLogService;
}

const COMBAT_TTL = 86400;

export class WeaponMasteryService {
  private redis: Redis;
  private gameLogService: GameLogService;

  constructor({ redis, gameLogService }: WeaponMasteryServiceDeps) {
    this.redis = redis;
    this.gameLogService = gameLogService;
  }

  private key(sessionId: string): string {
    return `combat:${sessionId}`;
  }

  private async load(sessionId: string): Promise<CombatState | null> {
    const raw = await this.redis.get(this.key(sessionId));
    return raw ? (JSON.parse(raw) as CombatState) : null;
  }

  private async save(state: CombatState): Promise<void> {
    await this.redis.setex(this.key(state.sessionId), COMBAT_TTL, JSON.stringify(state));
  }

  async assignMastery(
    sessionId: string,
    combatantId: string,
    weaponName: string,
    property: MasteryProperty,
    className: string,
    classLevel: number,
  ): Promise<WeaponMasteryEntry[]> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const combatant = state.combatants[idx];
    const current = combatant.assignedMasteries ?? [];
    const max = maxMasteriesForClass(className);

    const eligibleClasses: Record<string, number> = {
      fighter: 1, barbarian: 1, paladin: 1, ranger: 1, rogue: 1, monk: 1, bard: 3,
    };
    const lowerClass = className.toLowerCase();
    const minLevel = eligibleClasses[lowerClass];
    if (minLevel === undefined) throw new Error(`${className} does not have Weapon Mastery`);
    if (classLevel < minLevel) throw new Error(`${className} gains Weapon Mastery at level ${minLevel}`);

    const alreadyAssigned = current.find((e) => e.weaponName.toLowerCase() === weaponName.toLowerCase());
    if (!alreadyAssigned && current.length >= max) {
      throw new Error(`Cannot assign more than ${max} masteries for ${className}`);
    }

    const updated = alreadyAssigned
      ? current.map((e) =>
          e.weaponName.toLowerCase() === weaponName.toLowerCase() ? { weaponName, property } : e,
        )
      : [...current, { weaponName, property }];

    const newState: CombatState = {
      ...state,
      combatants: state.combatants.map((c, i) =>
        i === idx ? { ...c, assignedMasteries: updated } : c,
      ),
    };
    await this.save(newState);

    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: { message: `${combatant.name} assigned ${property} mastery to ${weaponName}` },
    });

    return updated;
  }

  async applyMastery(
    sessionId: string,
    attackerId: string,
    targetId: string,
    weaponName: string,
    hit: boolean,
    abilityMod: number,
    profBonus: number,
    targetSaveRoll?: number,
  ): Promise<MasteryEffect> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);

    const attacker = state.combatants.find((c) => c.id === attackerId);
    if (!attacker) throw new Error(`Attacker ${attackerId} not found`);
    const targetCombatant = state.combatants.find((c) => c.id === targetId);
    if (!targetCombatant) throw new Error(`Target ${targetId} not found`);

    const entry = (attacker.assignedMasteries ?? []).find(
      (e) => e.weaponName.toLowerCase() === weaponName.toLowerCase(),
    );
    if (!entry) throw new Error(`No mastery assigned for ${weaponName}`);

    const effect = computeMasteryEffect(
      {
        attackerId,
        targetId,
        weaponName,
        property: entry.property,
        attackHit: hit,
        abilityModifier: abilityMod,
        proficiencyBonus: profBonus,
      },
      targetSaveRoll,
    );

    let newState = { ...state };

    if (effect.damageDealt !== undefined && effect.damageDealt > 0) {
      const tIdx = newState.combatants.findIndex((c) => c.id === targetId);
      const { combatant: updated, messages } = applyDamageFn(newState.combatants[tIdx], effect.damageDealt);
      newState = {
        ...newState,
        combatants: newState.combatants.map((c, i) => (i === tIdx ? updated : c)),
        log: [...newState.log, ...messages],
      };
    }

    if (effect.conditionApplied === 'sapped') {
      const tIdx = newState.combatants.findIndex((c) => c.id === targetId);
      newState = {
        ...newState,
        combatants: newState.combatants.map((c, i) =>
          i === tIdx ? { ...c, sapped: true } : c,
        ),
      };
    }

    if (effect.conditionApplied === 'prone') {
      const tIdx = newState.combatants.findIndex((c) => c.id === targetId);
      const updated = addConditionFn(newState.combatants[tIdx], 'prone');
      newState = {
        ...newState,
        combatants: newState.combatants.map((c, i) => (i === tIdx ? updated : c)),
      };
    }

    if (effect.givesSelfAdvantage) {
      const aIdx = newState.combatants.findIndex((c) => c.id === attackerId);
      newState = {
        ...newState,
        combatants: newState.combatants.map((c, i) =>
          i === aIdx ? { ...c, vexTarget: targetId } : c,
        ),
      };
    }

    await this.save(newState);

    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: {
        message: effect.description,
        property: effect.property,
        attackerId,
        targetId,
      },
    });

    return effect;
  }
}
