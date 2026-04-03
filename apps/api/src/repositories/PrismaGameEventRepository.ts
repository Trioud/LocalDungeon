import type { PrismaClient } from '@prisma/client';
import type {
  IGameEventRepository,
  GameEventRecord,
  CreateGameEventData,
} from '../ports/IGameEventRepository.js';

interface PrismaGameEventRepositoryDeps {
  prisma: PrismaClient;
}

export class PrismaGameEventRepository implements IGameEventRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: PrismaGameEventRepositoryDeps) {
    this.prisma = prisma;
  }

  async create(data: CreateGameEventData): Promise<GameEventRecord> {
    const row = await this.prisma.gameEvent.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        type: data.type,
        payload: data.payload as object,
      },
    });

    return {
      id: row.id,
      sessionId: row.sessionId,
      userId: row.userId,
      type: row.type,
      payload: row.payload,
      createdAt: row.createdAt,
    };
  }

  async findBySession(sessionId: string, limit = 50): Promise<GameEventRecord[]> {
    const rows = await this.prisma.gameEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      userId: row.userId,
      type: row.type,
      payload: row.payload,
      createdAt: row.createdAt,
    }));
  }
}
