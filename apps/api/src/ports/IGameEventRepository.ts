export interface GameEventRecord {
  id: string;
  sessionId: string;
  userId: string;
  type: string;
  payload: unknown;
  createdAt: Date;
}

export interface CreateGameEventData {
  sessionId: string;
  userId: string;
  type: string;
  payload: unknown;
}

export interface IGameEventRepository {
  create(data: CreateGameEventData): Promise<GameEventRecord>;
  findBySession(sessionId: string, limit?: number): Promise<GameEventRecord[]>;
  listBySession(
    sessionId: string,
    opts?: { limit?: number; before?: string },
  ): Promise<GameEventRecord[]>;
}
