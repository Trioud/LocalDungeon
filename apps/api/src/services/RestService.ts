import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';
import type { CombatState } from '@local-dungeon/shared';
import {
  allConfirmed,
  applyLongRestFeatures,
  applyShortRestFeatures,
  computeHPRecovery,
  computeHitDiceAfterRest,
} from '@local-dungeon/shared';
import type { RestProposal, RestType } from '@local-dungeon/shared';

interface RestServiceDeps {
  redis: Redis;
}

const PROPOSAL_TTL = 3600; // 1 hour
const COMBAT_TTL = 86400;

export class RestService {
  private redis: Redis;

  constructor({ redis }: RestServiceDeps) {
    this.redis = redis;
  }

  private proposalKey(sessionId: string): string {
    return `rest:proposal:${sessionId}`;
  }

  private combatKey(sessionId: string): string {
    return `combat:${sessionId}`;
  }

  private async loadProposal(sessionId: string): Promise<RestProposal | null> {
    const raw = await this.redis.get(this.proposalKey(sessionId));
    return raw ? (JSON.parse(raw) as RestProposal) : null;
  }

  private async saveProposal(proposal: RestProposal): Promise<void> {
    await this.redis.setex(
      this.proposalKey(proposal.sessionId),
      PROPOSAL_TTL,
      JSON.stringify(proposal),
    );
  }

  private async loadCombat(sessionId: string): Promise<CombatState | null> {
    const raw = await this.redis.get(this.combatKey(sessionId));
    return raw ? (JSON.parse(raw) as CombatState) : null;
  }

  private async saveCombat(state: CombatState): Promise<void> {
    await this.redis.setex(this.combatKey(state.sessionId), COMBAT_TTL, JSON.stringify(state));
  }

  async proposeRest(
    sessionId: string,
    proposedBy: string,
    restType: RestType,
    requiredCount: number,
  ): Promise<RestProposal> {
    const proposal: RestProposal = {
      id: randomUUID(),
      sessionId,
      proposedBy,
      restType,
      confirmedBy: [proposedBy],
      requiredCount,
      status: 'pending',
    };

    await this.saveProposal(proposal);
    return proposal;
  }

  async confirmRest(
    sessionId: string,
    characterId: string,
  ): Promise<{ proposal: RestProposal; executed: boolean }> {
    const proposal = await this.loadProposal(sessionId);
    if (!proposal) throw new Error(`No rest proposal found for session ${sessionId}`);
    if (proposal.status !== 'pending') throw new Error('Rest proposal is no longer pending');

    if (!proposal.confirmedBy.includes(characterId)) {
      proposal.confirmedBy = [...proposal.confirmedBy, characterId];
    }

    if (allConfirmed(proposal)) {
      proposal.status = 'confirmed';
      await this.saveProposal(proposal);
      await this.executeRest(sessionId, proposal.restType);
      return { proposal, executed: true };
    }

    await this.saveProposal(proposal);
    return { proposal, executed: false };
  }

  async cancelRest(sessionId: string): Promise<void> {
    const proposal = await this.loadProposal(sessionId);
    if (proposal) {
      proposal.status = 'cancelled';
      await this.saveProposal(proposal);
    }
    await this.redis.del(this.proposalKey(sessionId));
  }

  async executeRest(
    sessionId: string,
    restType: RestType,
  ): Promise<{ sessionId: string; restType: RestType; affectedCount: number }> {
    const combatState = await this.loadCombat(sessionId);
    if (!combatState) {
      return { sessionId, restType, affectedCount: 0 };
    }

    const applyFn = restType === 'long' ? applyLongRestFeatures : applyShortRestFeatures;
    const updatedCombatants = combatState.combatants.map(applyFn);

    const updated: CombatState = { ...combatState, combatants: updatedCombatants };
    await this.saveCombat(updated);

    return { sessionId, restType, affectedCount: updatedCombatants.length };
  }

  async spendHitDice(
    sessionId: string,
    combatantId: string,
    diceCount: number,
  ): Promise<{ hpGained: number; newHp: number; hdRemaining: number }> {
    const combatState = await this.loadCombat(sessionId);
    if (!combatState) throw new Error(`No combat state for session ${sessionId}`);

    const idx = combatState.combatants.findIndex((c) => c.id === combatantId);
    if (idx === -1) throw new Error(`Combatant ${combatantId} not found`);

    const combatant = combatState.combatants[idx];
    const hdRemaining = combatant.hitDiceRemaining ?? 0;

    if (diceCount > hdRemaining) {
      throw new Error(`Not enough hit dice remaining (${hdRemaining})`);
    }

    const hitDie = combatant.hitDie ?? 8;
    const conModifier = combatant.conModifier ?? 0;

    const hpGained = computeHPRecovery(
      combatant.hp,
      combatant.maxHp,
      diceCount,
      hitDie,
      conModifier,
    );

    const newHdRemaining = hdRemaining - diceCount;
    const updatedCombatant = {
      ...combatant,
      hp: combatant.hp + hpGained,
      hitDiceRemaining: newHdRemaining,
      isBloodied: combatant.hp + hpGained <= combatant.maxHp / 2,
    };

    const updatedState: CombatState = {
      ...combatState,
      combatants: combatState.combatants.map((c, i) => (i === idx ? updatedCombatant : c)),
    };
    await this.saveCombat(updatedState);

    return { hpGained, newHp: updatedCombatant.hp, hdRemaining: newHdRemaining };
  }

  async getProposal(sessionId: string): Promise<RestProposal | null> {
    return this.loadProposal(sessionId);
  }
}
