import { Redis } from 'ioredis';
import type { GameLogService } from './GameLogService.js';
import type { CombatState, CombatantState, ConditionName } from '@local-dungeon/shared';
import {
  startCombat as startCombatFn,
  endCombat as endCombatFn,
  applyDamage as applyDamageFn,
  applyHealing as applyHealingFn,
  addCondition as addConditionFn,
  removeCondition as removeConditionFn,
  advanceTurn as advanceTurnFn,
  recordDeathSave as recordDeathSaveFn,
  applyDeathSaveRoll as applyDeathSaveRollFn,
  stabilizeCombatant as stabilizeCombatantFn,
} from '@local-dungeon/shared';

interface CombatServiceDeps {
  redis: Redis;
  gameLogService: GameLogService;
}

const COMBAT_TTL = 86400; // 24h

export class CombatService {
  private redis: Redis;
  private gameLogService: GameLogService;

  constructor({ redis, gameLogService }: CombatServiceDeps) {
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

  async getState(sessionId: string): Promise<CombatState | null> {
    return this.load(sessionId);
  }

  async initCombat(
    sessionId: string,
    combatants: Omit<CombatantState, 'isActive' | 'hasAction' | 'hasBonusAction' | 'hasReaction'>[],
  ): Promise<CombatState> {
    const fullCombatants: CombatantState[] = combatants.map((c) => ({
      ...c,
      isActive: false,
      hasAction: true,
      hasBonusAction: true,
      hasReaction: true,
    }));

    const state: CombatState = {
      sessionId,
      round: 0,
      turnIndex: 0,
      combatants: fullCombatants,
      isActive: false,
      log: [],
    };

    await this.save(state);

    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: { message: 'Combat initialized', combatantCount: fullCombatants.length },
    });

    return state;
  }

  async startCombat(sessionId: string): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const updated = startCombatFn(state);
    await this.save(updated);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: { message: 'Combat started', round: updated.round },
    });
    return updated;
  }

  async endCombat(sessionId: string): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const updated = endCombatFn(state);
    await this.save(updated);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: { message: 'Combat ended' },
    });
    return updated;
  }

  async applyDamage(
    sessionId: string,
    combatantId: string,
    damage: number,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);
    const { combatant: updated, messages } = applyDamageFn(state.combatants[idx], damage);
    const newState: CombatState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updated : c)),
      log: [...state.log, ...messages],
    };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'hp_change',
      actorId,
      payload: { combatantId, combatantName: updated.name, damage, newHp: updated.hp, messages },
    });
    return newState;
  }

  async applyHealing(
    sessionId: string,
    combatantId: string,
    amount: number,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);
    const { combatant: updated, messages } = applyHealingFn(state.combatants[idx], amount);
    const newState: CombatState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updated : c)),
      log: [...state.log, ...messages],
    };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'hp_change',
      actorId,
      payload: { combatantId, combatantName: updated.name, healing: amount, newHp: updated.hp, messages },
    });
    return newState;
  }

  async addCondition(
    sessionId: string,
    combatantId: string,
    condition: ConditionName,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);
    const updated = addConditionFn(state.combatants[idx], condition);
    const newState: CombatState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updated : c)),
    };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'condition_added',
      actorId,
      payload: { combatantId, combatantName: updated.name, condition },
    });
    return newState;
  }

  async removeCondition(
    sessionId: string,
    combatantId: string,
    condition: ConditionName,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);
    const updated = removeConditionFn(state.combatants[idx], condition);
    const newState: CombatState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updated : c)),
    };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'condition_removed',
      actorId,
      payload: { combatantId, combatantName: updated.name, condition },
    });
    return newState;
  }

  async advanceTurn(sessionId: string, actorId?: string): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const updated = advanceTurnFn(state);
    await this.save(updated);
    const active = updated.combatants[updated.turnIndex];
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      actorId,
      payload: { message: 'Turn advanced', round: updated.round, activeCombatant: active?.name },
    });
    return updated;
  }

  async recordDeathSave(
    sessionId: string,
    combatantId: string,
    success: boolean,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);
    const { combatant: updated, messages } = recordDeathSaveFn(state.combatants[idx], success);
    const newState: CombatState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updated : c)),
      log: [...state.log, ...messages],
    };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'death_save',
      actorId,
      payload: { combatantId, combatantName: updated.name, success, messages },
    });
    return newState;
  }

  async upsertCombatant(
    sessionId: string,
    combatant: Omit<CombatantState, 'isActive'>,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatant.id);
    let newCombatants: CombatantState[];
    if (idx === -1) {
      newCombatants = [...state.combatants, { ...combatant, isActive: false }];
    } else {
      newCombatants = state.combatants.map((c, i) =>
        i === idx ? { ...combatant, isActive: c.isActive } : c,
      );
    }
    const newState: CombatState = { ...state, combatants: newCombatants };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      actorId,
      payload: { message: 'Combatant upserted', combatantId: combatant.id, combatantName: combatant.name },
    });
    return newState;
  }

  async removeCombatant(
    sessionId: string,
    combatantId: string,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const combatant = state.combatants.find((c) => c.id === combatantId);
    const newState: CombatState = {
      ...state,
      combatants: state.combatants.filter((c) => c.id !== combatantId),
    };
    await this.save(newState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      actorId,
      payload: { message: 'Combatant removed', combatantId, combatantName: combatant?.name },
    });
    return newState;
  }

  async recordDeathSaveRoll(
    sessionId: string,
    combatantId: string,
    roll: number,
    actorId?: string,
  ): Promise<{ state: CombatState; outcome: 'none' | 'stable' | 'dead'; roll: number; successes: number; failures: number }> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const { state: newState, outcome, regainedHp } = applyDeathSaveRollFn(state, combatantId, roll);
    await this.save(newState);

    const updated = newState.combatants[idx];
    const logPayload: Record<string, unknown> = {
      combatantId,
      combatantName: updated.name,
      roll,
      outcome,
      regainedHp,
      successes: updated.deathSaveSuccesses,
      failures: updated.deathSaveFailures,
    };

    if (outcome === 'dead' || outcome === 'stable') {
      await this.gameLogService.logEvent({
        sessionId,
        type: 'death_save',
        actorId,
        payload: logPayload,
      });
    }

    return {
      state: newState,
      outcome,
      roll,
      successes: updated.deathSaveSuccesses,
      failures: updated.deathSaveFailures,
    };
  }

  async stabilize(
    sessionId: string,
    combatantId: string,
    actorId?: string,
  ): Promise<CombatState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);
    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const newState = stabilizeCombatantFn(state, combatantId);
    await this.save(newState);

    const updated = newState.combatants[idx];
    await this.gameLogService.logEvent({
      sessionId,
      type: 'death_save',
      actorId,
      payload: {
        combatantId,
        combatantName: updated.name,
        outcome: 'stable',
        stabilizedBy: actorId,
      },
    });

    return newState;
  }
}
