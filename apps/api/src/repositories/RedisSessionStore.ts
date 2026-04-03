import { Redis } from 'ioredis';

interface RedisSessionStoreDeps {
  redis: Redis;
}

export class RedisSessionStore {
  private redis: Redis;

  constructor({ redis }: RedisSessionStoreDeps) {
    this.redis = redis;
  }

  private sessionKey(sessionId: string) {
    return `session:${sessionId}:state`;
  }

  private playersKey(sessionId: string) {
    return `session:${sessionId}:players`;
  }

  private userSessionKey(userId: string) {
    return `user:${userId}:session`;
  }

  async setSessionState(sessionId: string, state: Record<string, unknown>): Promise<void> {
    await this.redis.setex(this.sessionKey(sessionId), 86400, JSON.stringify(state));
  }

  async getSessionState(sessionId: string): Promise<Record<string, unknown> | null> {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async setUserSession(userId: string, sessionId: string): Promise<void> {
    await this.redis.setex(this.userSessionKey(userId), 3600, sessionId);
  }

  async getUserSession(userId: string): Promise<string | null> {
    return this.redis.get(this.userSessionKey(userId));
  }

  async removeUserSession(userId: string): Promise<void> {
    await this.redis.del(this.userSessionKey(userId));
  }

  async addPlayerToRoom(sessionId: string, userId: string): Promise<void> {
    await this.redis.sadd(this.playersKey(sessionId), userId);
    await this.redis.expire(this.playersKey(sessionId), 86400);
  }

  async removePlayerFromRoom(sessionId: string, userId: string): Promise<void> {
    await this.redis.srem(this.playersKey(sessionId), userId);
  }

  async getRoomPlayers(sessionId: string): Promise<string[]> {
    return this.redis.smembers(this.playersKey(sessionId));
  }
}
