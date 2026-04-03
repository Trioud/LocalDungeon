import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from './SessionService.js';
import type { ISessionRepository, SessionInfo, SessionSummary } from '../ports/ISessionRepository.js';
import type { IGameEventRepository } from '../ports/IGameEventRepository.js';
import type { RedisSessionStore } from '../repositories/RedisSessionStore.js';

const baseSession: SessionInfo = {
  id: 'session-1',
  name: 'Test Session',
  inviteCode: 'ABC123',
  createdById: 'user-1',
  maxPlayers: 6,
  status: 'lobby',
  phase: 'exploration',
  players: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeSessionRepo(overrides: Partial<ISessionRepository> = {}): ISessionRepository {
  return {
    create: vi.fn().mockResolvedValue(baseSession),
    findById: vi.fn().mockResolvedValue(baseSession),
    findByInviteCode: vi.fn().mockResolvedValue(null),
    findByUserId: vi.fn().mockResolvedValue([]),
    addPlayer: vi.fn().mockResolvedValue({}),
    removePlayer: vi.fn().mockResolvedValue(undefined),
    updatePlayerStatus: vi.fn().mockResolvedValue(undefined),
    updateSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeGameEventRepo(overrides: Partial<IGameEventRepository> = {}): IGameEventRepository {
  return {
    create: vi.fn().mockResolvedValue({}),
    findBySession: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeRedisStore(overrides: Partial<RedisSessionStore> = {}): RedisSessionStore {
  return {
    setSessionState: vi.fn().mockResolvedValue(undefined),
    getSessionState: vi.fn().mockResolvedValue(null),
    setUserSession: vi.fn().mockResolvedValue(undefined),
    getUserSession: vi.fn().mockResolvedValue(null),
    removeUserSession: vi.fn().mockResolvedValue(undefined),
    addPlayerToRoom: vi.fn().mockResolvedValue(undefined),
    removePlayerFromRoom: vi.fn().mockResolvedValue(undefined),
    getRoomPlayers: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as RedisSessionStore;
}

function makeSvc(
  repoOverrides: Partial<ISessionRepository> = {},
  storeOverrides: Partial<RedisSessionStore> = {}
): SessionService {
  return new SessionService({
    sessionRepository: makeSessionRepo(repoOverrides),
    gameEventRepository: makeGameEventRepo(),
    redisSessionStore: makeRedisStore(storeOverrides),
  });
}

describe('SessionService', () => {
  describe('create', () => {
    it('generates a 6-char invite code and calls repo.create, returns SessionInfo', async () => {
      const sessionRepo = makeSessionRepo();
      const svc = new SessionService({
        sessionRepository: sessionRepo,
        gameEventRepository: makeGameEventRepo(),
        redisSessionStore: makeRedisStore(),
      });

      const result = await svc.create('user-1', 'My Session', 4);

      expect(sessionRepo.create).toHaveBeenCalledOnce();
      const callArgs = (sessionRepo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.name).toBe('My Session');
      expect(callArgs.createdById).toBe('user-1');
      expect(callArgs.maxPlayers).toBe(4);
      expect(callArgs.inviteCode).toMatch(/^[A-F0-9]{6}$/);
      expect(result).toEqual(baseSession);
    });
  });

  describe('join', () => {
    it('joins by sessionId when findById returns a session', async () => {
      const sessionRepo = makeSessionRepo({ findById: vi.fn().mockResolvedValue(baseSession) });
      const redisStore = makeRedisStore();
      const svc = new SessionService({
        sessionRepository: sessionRepo,
        gameEventRepository: makeGameEventRepo(),
        redisSessionStore: redisStore,
      });

      await svc.join('user-2', 'char-1', 'session-1');

      expect(sessionRepo.findById).toHaveBeenCalledWith('session-1');
      expect(sessionRepo.addPlayer).toHaveBeenCalledWith('session-1', 'user-2', 'char-1');
      expect(redisStore.setUserSession).toHaveBeenCalledWith('user-2', 'session-1');
    });

    it('joins via invite code when findById returns null', async () => {
      const sessionRepo = makeSessionRepo({
        findById: vi.fn().mockResolvedValue(null),
        findByInviteCode: vi.fn().mockResolvedValue(baseSession),
      });
      const redisStore = makeRedisStore();
      const svc = new SessionService({
        sessionRepository: sessionRepo,
        gameEventRepository: makeGameEventRepo(),
        redisSessionStore: redisStore,
      });

      await svc.join('user-2', 'char-1', 'ABC123');

      expect(sessionRepo.findByInviteCode).toHaveBeenCalledWith('ABC123');
      expect(sessionRepo.addPlayer).toHaveBeenCalledWith('session-1', 'user-2', 'char-1');
    });

    it('throws 404 when session not found by id or code', async () => {
      const svc = makeSvc({
        findById: vi.fn().mockResolvedValue(null),
        findByInviteCode: vi.fn().mockResolvedValue(null),
      });

      await expect(svc.join('user-2', 'char-1', 'NOPE')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when session status is ended', async () => {
      const endedSession = { ...baseSession, status: 'ended' };
      const svc = makeSvc({ findById: vi.fn().mockResolvedValue(endedSession) });

      await expect(svc.join('user-2', 'char-1', 'session-1')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Session has ended',
      });
    });
  });

  describe('leave', () => {
    it('calls removePlayer, removeUserSession, and removePlayerFromRoom', async () => {
      const sessionRepo = makeSessionRepo();
      const redisStore = makeRedisStore();
      const svc = new SessionService({
        sessionRepository: sessionRepo,
        gameEventRepository: makeGameEventRepo(),
        redisSessionStore: redisStore,
      });

      await svc.leave('user-1', 'session-1');

      expect(sessionRepo.removePlayer).toHaveBeenCalledWith('session-1', 'user-1');
      expect(redisStore.removeUserSession).toHaveBeenCalledWith('user-1');
      expect(redisStore.removePlayerFromRoom).toHaveBeenCalledWith('session-1', 'user-1');
    });
  });

  describe('getInfo', () => {
    it('throws 404 when session not found', async () => {
      const svc = makeSvc({ findById: vi.fn().mockResolvedValue(null) });

      await expect(svc.getInfo('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns session info when found', async () => {
      const svc = makeSvc({ findById: vi.fn().mockResolvedValue(baseSession) });
      const result = await svc.getInfo('session-1');
      expect(result).toEqual(baseSession);
    });
  });

  describe('listByUser', () => {
    it('returns summary array', async () => {
      const summaries: SessionSummary[] = [
        { id: 's1', name: 'A', status: 'lobby', playerCount: 1, maxPlayers: 6, createdAt: new Date() },
      ];
      const svc = makeSvc({ findByUserId: vi.fn().mockResolvedValue(summaries) });
      const result = await svc.listByUser('user-1');
      expect(result).toEqual(summaries);
    });
  });
});
