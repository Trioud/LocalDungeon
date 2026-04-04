import type {
  IGameEventRepository,
  GameEventRecord,
} from '../ports/IGameEventRepository.js';
import type { GameLogEntry, GameLogEntryType } from '@local-dungeon/shared';

interface GameLogServiceDeps {
  gameEventRepository: IGameEventRepository;
}

interface LogEventParams {
  sessionId: string;
  type: GameLogEntryType;
  actorId?: string;
  actorName?: string;
  payload: Record<string, unknown>;
  isPrivate?: boolean;
}

function recordToEntry(record: GameEventRecord): GameLogEntry {
  const raw = record.payload as Record<string, unknown>;
  const { _actorName, _isPrivate, ...rest } = raw;
  return {
    id: record.id,
    sessionId: record.sessionId,
    type: record.type as GameLogEntryType,
    actorId: record.userId || undefined,
    actorName: typeof _actorName === 'string' ? _actorName : undefined,
    payload: rest,
    timestamp: record.createdAt.toISOString(),
    isPrivate: typeof _isPrivate === 'boolean' ? _isPrivate : false,
  };
}

export class GameLogService {
  private gameEventRepository: IGameEventRepository;

  constructor({ gameEventRepository }: GameLogServiceDeps) {
    this.gameEventRepository = gameEventRepository;
  }

  async logEvent(params: LogEventParams): Promise<GameLogEntry> {
    const dbPayload = {
      ...params.payload,
      _actorName: params.actorName,
      _isPrivate: params.isPrivate ?? false,
    };

    const record = await this.gameEventRepository.create({
      sessionId: params.sessionId,
      userId: params.actorId ?? '',
      type: params.type,
      payload: dbPayload,
    });

    return recordToEntry(record);
  }

  async listEvents(
    sessionId: string,
    opts?: { limit?: number; before?: string },
  ): Promise<GameLogEntry[]> {
    const records = await this.gameEventRepository.listBySession(sessionId, opts);
    return records.map(recordToEntry);
  }
}
