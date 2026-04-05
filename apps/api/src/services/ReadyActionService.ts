import { Redis } from 'ioredis';
import {
  createReadyAction,
  fireReadyAction as fireReadyActionLogic,
  buildOpportunityAttack,
} from '@local-dungeon/shared';
import type { ReadyAction, OpportunityAttack } from '@local-dungeon/shared';

const READY_ACTION_TTL = 4 * 60 * 60;
const OPP_ATTACK_MAX = 50;

interface ReadyActionServiceDeps {
  redis: Redis;
}

export class ReadyActionService {
  private redis: Redis;

  constructor({ redis }: ReadyActionServiceDeps) {
    this.redis = redis;
  }

  private readyKey(sessionId: string, combatantId: string): string {
    return `ready:${sessionId}:${combatantId}`;
  }

  private oppKey(sessionId: string): string {
    return `opp_attack:${sessionId}`;
  }

  async setReadyAction(
    sessionId: string,
    combatantId: string,
    trigger: string,
    actionDescription: string,
    expiresOnTurn: number,
  ): Promise<ReadyAction> {
    const action = createReadyAction(combatantId, trigger, actionDescription, expiresOnTurn);
    await this.redis.setex(this.readyKey(sessionId, combatantId), READY_ACTION_TTL, JSON.stringify(action));
    return action;
  }

  async getReadyAction(sessionId: string, combatantId: string): Promise<ReadyAction | null> {
    const raw = await this.redis.get(this.readyKey(sessionId, combatantId));
    return raw ? (JSON.parse(raw) as ReadyAction) : null;
  }

  async fireReadyAction(sessionId: string, combatantId: string): Promise<ReadyAction> {
    const existing = await this.getReadyAction(sessionId, combatantId);
    if (!existing) throw Object.assign(new Error('No ready action found'), { statusCode: 404 });
    const fired = fireReadyActionLogic(existing);
    await this.redis.setex(this.readyKey(sessionId, combatantId), READY_ACTION_TTL, JSON.stringify(fired));
    return fired;
  }

  async clearReadyAction(sessionId: string, combatantId: string): Promise<void> {
    await this.redis.del(this.readyKey(sessionId, combatantId));
  }

  async recordOpportunityAttack(sessionId: string, attackerId: string, targetId: string): Promise<OpportunityAttack> {
    const attack = buildOpportunityAttack(attackerId, targetId, sessionId);
    const key = this.oppKey(sessionId);
    await this.redis.lpush(key, JSON.stringify(attack));
    await this.redis.ltrim(key, 0, OPP_ATTACK_MAX - 1);
    return attack;
  }

  async getRecentOpportunityAttacks(sessionId: string, count = 10): Promise<OpportunityAttack[]> {
    const raw = await this.redis.lrange(this.oppKey(sessionId), 0, count - 1);
    return raw.map((r) => JSON.parse(r) as OpportunityAttack);
  }
}
