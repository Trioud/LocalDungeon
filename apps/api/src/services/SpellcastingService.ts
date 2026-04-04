import { Redis } from 'ioredis';
import type { GameLogService } from './GameLogService.js';
import type { CombatantState, CombatState, SpellcastingState, CastSpellParams } from '@local-dungeon/shared';
import {
  canCastSpell,
  deductSlot,
  startConcentration,
  endConcentration as endConcentrationFn,
  recoverSlots as recoverSlotsFn,
  concentrationSaveDC,
} from '@local-dungeon/shared';

interface SpellcastingServiceDeps {
  redis: Redis;
  gameLogService: GameLogService;
}

const COMBAT_TTL = 86400;

export class SpellcastingService {
  private redis: Redis;
  private gameLogService: GameLogService;

  constructor({ redis, gameLogService }: SpellcastingServiceDeps) {
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

  async castSpell(
    sessionId: string,
    combatantId: string,
    params: CastSpellParams,
  ): Promise<CombatantState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);

    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const combatant = state.combatants[idx];
    if (!combatant.spellcasting) throw new Error('Combatant has no spellcasting state');

    const check = canCastSpell(combatant.spellcasting, params);
    if (!check.allowed) throw new Error(check.reason ?? 'Cannot cast spell');

    let spellcasting: SpellcastingState = combatant.spellcasting;

    if (!params.isRitual && params.spellLevel !== 0) {
      spellcasting = deductSlot(spellcasting, params.castAtLevel, params.usePactMagic);
    }

    if (params.isBonusAction && params.spellLevel > 0) {
      spellcasting = { ...spellcasting, castBonusActionThisTurn: true };
    }

    if (params.requiresConcentration) {
      spellcasting = startConcentration(spellcasting, params.spellName);
    }

    const updatedCombatant: CombatantState = {
      ...combatant,
      spellcasting,
      isConcentrating: params.requiresConcentration ? true : combatant.isConcentrating,
      concentrationSpell: params.requiresConcentration ? params.spellName : combatant.concentrationSpell,
    };

    const updatedState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updatedCombatant : c)),
    };

    await this.save(updatedState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: {
        message: `${combatant.name} cast ${params.spellName} at level ${params.castAtLevel}`,
        spellName: params.spellName,
        castAtLevel: params.castAtLevel,
      },
    });

    return updatedCombatant;
  }

  async endConcentration(sessionId: string, combatantId: string): Promise<CombatantState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);

    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const combatant = state.combatants[idx];
    if (!combatant.spellcasting) throw new Error('Combatant has no spellcasting state');

    const spellcasting = endConcentrationFn(combatant.spellcasting);
    const updatedCombatant: CombatantState = {
      ...combatant,
      spellcasting,
      isConcentrating: false,
      concentrationSpell: undefined,
    };

    const updatedState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updatedCombatant : c)),
    };

    await this.save(updatedState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: { message: `${combatant.name} ended concentration` },
    });

    return updatedCombatant;
  }

  async recoverSlots(
    sessionId: string,
    combatantId: string,
    restType: 'short' | 'long',
  ): Promise<CombatantState> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);

    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const combatant = state.combatants[idx];
    if (!combatant.spellcasting) throw new Error('Combatant has no spellcasting state');

    const spellcasting = recoverSlotsFn(combatant.spellcasting, restType);
    const updatedCombatant: CombatantState = { ...combatant, spellcasting };

    const updatedState = {
      ...state,
      combatants: state.combatants.map((c, i) => (i === idx ? updatedCombatant : c)),
    };

    await this.save(updatedState);
    await this.gameLogService.logEvent({
      sessionId,
      type: 'system',
      payload: { message: `${combatant.name} recovered spell slots (${restType} rest)` },
    });

    return updatedCombatant;
  }

  async concentrationSave(
    sessionId: string,
    combatantId: string,
    roll: number,
    damage: number,
  ): Promise<{ success: boolean; concentrationEnded: boolean }> {
    const state = await this.load(sessionId);
    if (!state) throw new Error(`No combat state for session ${sessionId}`);

    const idx = state.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const combatant = state.combatants[idx];
    if (!combatant.spellcasting) throw new Error('Combatant has no spellcasting state');

    const dc = concentrationSaveDC(damage);
    const success = roll >= dc;

    if (!success) {
      const spellcasting = endConcentrationFn(combatant.spellcasting);
      const updatedCombatant: CombatantState = {
        ...combatant,
        spellcasting,
        isConcentrating: false,
        concentrationSpell: undefined,
      };

      const updatedState = {
        ...state,
        combatants: state.combatants.map((c, i) => (i === idx ? updatedCombatant : c)),
      };

      await this.save(updatedState);
      await this.gameLogService.logEvent({
        sessionId,
        type: 'system',
        payload: {
          message: `${combatant.name} failed concentration save (DC ${dc}, rolled ${roll})`,
        },
      });
    }

    return { success, concentrationEnded: !success };
  }
}
