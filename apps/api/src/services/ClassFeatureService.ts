import { Redis } from 'ioredis';
import type { ClassResource } from '@local-dungeon/shared';
import {
  buildResourcesForCharacter,
  useResource as useResourceFn,
  rechargeResources,
} from '@local-dungeon/shared';

interface ClassFeatureServiceDeps {
  redis: Redis;
}

const FEATURE_TTL = 86400; // 24h

export class ClassFeatureService {
  private redis: Redis;

  constructor({ redis }: ClassFeatureServiceDeps) {
    this.redis = redis;
  }

  private key(sessionId: string, combatantId: string): string {
    return `features:${sessionId}:${combatantId}`;
  }

  private async load(sessionId: string, combatantId: string): Promise<ClassResource[]> {
    const raw = await this.redis.get(this.key(sessionId, combatantId));
    return raw ? (JSON.parse(raw) as ClassResource[]) : [];
  }

  private async save(sessionId: string, combatantId: string, resources: ClassResource[]): Promise<void> {
    await this.redis.setex(this.key(sessionId, combatantId), FEATURE_TTL, JSON.stringify(resources));
  }

  async getResources(sessionId: string, combatantId: string): Promise<ClassResource[]> {
    return this.load(sessionId, combatantId);
  }

  async useResource(
    sessionId: string,
    combatantId: string,
    resourceId: string,
    amount = 1,
  ): Promise<ClassResource[]> {
    const resources = await this.load(sessionId, combatantId);
    const updated = useResourceFn(resources, resourceId, amount);
    await this.save(sessionId, combatantId, updated);
    return updated;
  }

  async rechargeAll(
    sessionId: string,
    combatantId: string,
    rechargeType: 'short' | 'long',
  ): Promise<ClassResource[]> {
    const resources = await this.load(sessionId, combatantId);
    const updated = rechargeResources(resources, rechargeType);
    await this.save(sessionId, combatantId, updated);
    return updated;
  }

  async initResources(
    sessionId: string,
    combatantId: string,
    classLevels: Record<string, number>,
    profBonus: number,
  ): Promise<ClassResource[]> {
    const resources = buildResourcesForCharacter(classLevels, profBonus);
    await this.save(sessionId, combatantId, resources);
    return resources;
  }
}
