import type { Redis } from 'ioredis';
import type { ISessionStateStore } from '../ports/ISessionStateStore.js';

interface Deps {
  redis: Redis;
}

export class RedisSessionStateStore implements ISessionStateStore {
  private redis: Redis;

  constructor({ redis }: Deps) {
    this.redis = redis;
  }

  async setRefreshToken(userId: string, token: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`refresh_token:${userId}`, token, 'EX', ttlSeconds);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.redis.get(`refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.redis.del(`refresh_token:${userId}`);
  }
}
