import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameLogService } from './GameLogService.js';
import type { IGameEventRepository, GameEventRecord } from '../ports/IGameEventRepository.js';

function makeRecord(overrides: Partial<GameEventRecord> = {}): GameEventRecord {
  return {
    id: 'event-1',
    sessionId: 'session-1',
    userId: 'user-1',
    type: 'chat',
    payload: { message: 'Hello!', _actorName: 'Aragorn', _isPrivate: false },
    createdAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IGameEventRepository> = {}): IGameEventRepository {
  return {
    create: vi.fn().mockResolvedValue(makeRecord()),
    findBySession: vi.fn().mockResolvedValue([makeRecord()]),
    listBySession: vi.fn().mockResolvedValue([makeRecord()]),
    ...overrides,
  };
}

describe('GameLogService', () => {
  let repo: IGameEventRepository;
  let service: GameLogService;

  beforeEach(() => {
    repo = makeRepo();
    service = new GameLogService({ gameEventRepository: repo });
  });

  describe('logEvent', () => {
    it('calls repo.create with correct data', async () => {
      await service.logEvent({
        sessionId: 'session-1',
        type: 'chat',
        actorId: 'user-1',
        actorName: 'Aragorn',
        payload: { message: 'Hello!' },
        isPrivate: false,
      });

      expect(repo.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        userId: 'user-1',
        type: 'chat',
        payload: {
          message: 'Hello!',
          _actorName: 'Aragorn',
          _isPrivate: false,
        },
      });
    });

    it('returns a mapped GameLogEntry', async () => {
      const entry = await service.logEvent({
        sessionId: 'session-1',
        type: 'chat',
        actorId: 'user-1',
        actorName: 'Aragorn',
        payload: { message: 'Hello!' },
      });

      expect(entry.id).toBe('event-1');
      expect(entry.sessionId).toBe('session-1');
      expect(entry.type).toBe('chat');
      expect(entry.actorId).toBe('user-1');
      expect(entry.actorName).toBe('Aragorn');
      expect(entry.payload).toEqual({ message: 'Hello!' });
      expect(entry.isPrivate).toBe(false);
      expect(entry.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });

    it('defaults isPrivate to false', async () => {
      const entry = await service.logEvent({
        sessionId: 'session-1',
        type: 'dice_roll',
        payload: {},
      });
      expect(entry.isPrivate).toBe(false);
    });

    it('uses empty string for userId when actorId is omitted', async () => {
      await service.logEvent({
        sessionId: 'session-1',
        type: 'system',
        payload: { message: 'Test' },
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '' }),
      );
    });

    it('stores isPrivate=true correctly', async () => {
      const privateRecord = makeRecord({
        payload: { notation: '1d20', _actorName: 'Legolas', _isPrivate: true },
      });
      (repo.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(privateRecord);

      const entry = await service.logEvent({
        sessionId: 'session-1',
        type: 'dice_roll',
        actorName: 'Legolas',
        payload: { notation: '1d20' },
        isPrivate: true,
      });

      expect(entry.isPrivate).toBe(true);
    });
  });

  describe('listEvents', () => {
    it('calls repo.listBySession and returns mapped entries', async () => {
      const entries = await service.listEvents('session-1');

      expect(repo.listBySession).toHaveBeenCalledWith('session-1', undefined);
      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe('chat');
    });

    it('forwards opts to repo.listBySession', async () => {
      await service.listEvents('session-1', { limit: 10, before: 'cursor-abc' });
      expect(repo.listBySession).toHaveBeenCalledWith('session-1', {
        limit: 10,
        before: 'cursor-abc',
      });
    });

    it('strips internal metadata from payload', async () => {
      const records = [
        makeRecord({
          payload: { message: 'Hi', _actorName: 'Frodo', _isPrivate: false },
        }),
      ];
      (repo.listBySession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(records);

      const entries = await service.listEvents('session-1');
      expect(entries[0].payload).toEqual({ message: 'Hi' });
      expect((entries[0].payload as any)._actorName).toBeUndefined();
      expect((entries[0].payload as any)._isPrivate).toBeUndefined();
    });
  });
});
