import { randomBytes } from 'node:crypto';
import type { ISessionRepository, SessionInfo, SessionSummary } from '../ports/ISessionRepository.js';
import type { IGameEventRepository } from '../ports/IGameEventRepository.js';
import type { RedisSessionStore } from '../repositories/RedisSessionStore.js';

interface SessionServiceDeps {
  sessionRepository: ISessionRepository;
  gameEventRepository: IGameEventRepository;
  redisSessionStore: RedisSessionStore;
}

export class SessionService {
  private sessionRepository: ISessionRepository;
  private gameEventRepository: IGameEventRepository;
  private redisSessionStore: RedisSessionStore;

  constructor({ sessionRepository, gameEventRepository, redisSessionStore }: SessionServiceDeps) {
    this.sessionRepository = sessionRepository;
    this.gameEventRepository = gameEventRepository;
    this.redisSessionStore = redisSessionStore;
  }

  private generateInviteCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  async create(userId: string, name: string, maxPlayers: number): Promise<SessionInfo> {
    const inviteCode = this.generateInviteCode();
    try {
      return await this.sessionRepository.create({ name, createdById: userId, maxPlayers, inviteCode });
    } catch (err: unknown) {
      // Retry once on unique constraint violation for invite code collision
      const msg = (err as Error).message ?? '';
      if (msg.includes('Unique constraint') || msg.includes('unique')) {
        const retryCode = this.generateInviteCode();
        return this.sessionRepository.create({ name, createdById: userId, maxPlayers, inviteCode: retryCode });
      }
      throw err;
    }
  }

  async join(userId: string, characterId: string, sessionIdOrCode: string): Promise<SessionInfo> {
    let session = await this.sessionRepository.findById(sessionIdOrCode);
    if (!session) {
      session = await this.sessionRepository.findByInviteCode(sessionIdOrCode);
    }
    if (!session) {
      throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    }
    if (session.status === 'ended') {
      throw Object.assign(new Error('Session has ended'), { statusCode: 400 });
    }

    await this.sessionRepository.addPlayer(session.id, userId, characterId);
    await this.redisSessionStore.setUserSession(userId, session.id);

    const updated = await this.sessionRepository.findById(session.id);
    return updated!;
  }

  async leave(userId: string, sessionId: string): Promise<void> {
    await this.sessionRepository.removePlayer(sessionId, userId);
    await this.redisSessionStore.removeUserSession(userId);
    await this.redisSessionStore.removePlayerFromRoom(sessionId, userId);
  }

  async getInfo(sessionId: string): Promise<SessionInfo> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    }
    return session;
  }

  async listByUser(userId: string): Promise<SessionSummary[]> {
    return this.sessionRepository.findByUserId(userId);
  }
}
