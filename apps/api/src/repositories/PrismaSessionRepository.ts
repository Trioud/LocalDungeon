import type { PrismaClient } from '@prisma/client';
import type {
  ISessionRepository,
  SessionInfo,
  SessionPlayerInfo,
  SessionSummary,
  CreateSessionData,
} from '../ports/ISessionRepository.js';

interface PrismaSessionRepositoryDeps {
  prisma: PrismaClient;
}

const playerInclude = {
  players: {
    include: {
      user: { select: { id: true, username: true } },
      character: {
        select: {
          id: true,
          name: true,
          className: true,
          level: true,
          portraitUrl: true,
        },
      },
    },
  },
} as const;

function mapPlayer(p: {
  id: string;
  userId: string;
  characterId: string;
  isReady: boolean;
  isConnected: boolean;
  user: { id: string; username: string };
  character: { id: string; name: string; className: string; level: number; portraitUrl: string | null };
}): SessionPlayerInfo {
  return {
    id: p.id,
    userId: p.userId,
    username: p.user.username,
    characterId: p.characterId,
    characterName: p.character.name,
    characterClass: p.character.className,
    characterLevel: p.character.level,
    portraitUrl: p.character.portraitUrl,
    isReady: p.isReady,
    isConnected: p.isConnected,
  };
}

function mapSession(row: {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  maxPlayers: number;
  status: string;
  phase: string;
  createdAt: Date;
  updatedAt: Date;
  players: Parameters<typeof mapPlayer>[0][];
}): SessionInfo {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.inviteCode,
    createdById: row.createdById,
    maxPlayers: row.maxPlayers,
    status: row.status,
    phase: row.phase,
    players: row.players.map(mapPlayer),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaSessionRepository implements ISessionRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: PrismaSessionRepositoryDeps) {
    this.prisma = prisma;
  }

  async create(data: CreateSessionData): Promise<SessionInfo> {
    const row = await this.prisma.session.create({
      data: {
        name: data.name,
        createdById: data.createdById,
        maxPlayers: data.maxPlayers,
        inviteCode: data.inviteCode,
      },
      include: playerInclude,
    });
    return mapSession(row);
  }

  async findById(id: string): Promise<SessionInfo | null> {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: playerInclude,
    });
    return row ? mapSession(row) : null;
  }

  async findByInviteCode(code: string): Promise<SessionInfo | null> {
    const row = await this.prisma.session.findUnique({
      where: { inviteCode: code },
      include: playerInclude,
    });
    return row ? mapSession(row) : null;
  }

  async findByUserId(userId: string): Promise<SessionSummary[]> {
    const rows = await this.prisma.session.findMany({
      where: {
        OR: [
          { createdById: userId },
          { players: { some: { userId } } },
        ],
      },
      include: { players: { select: { id: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      playerCount: row.players.length,
      maxPlayers: row.maxPlayers,
      createdAt: row.createdAt,
    }));
  }

  async addPlayer(sessionId: string, userId: string, characterId: string): Promise<SessionPlayerInfo> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { players: { select: { id: true } } },
    });

    if (!session) {
      throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    }

    if (session.players.length >= session.maxPlayers) {
      throw Object.assign(new Error('Session is full'), { statusCode: 400 });
    }

    const player = await this.prisma.sessionPlayer.create({
      data: { sessionId, userId, characterId },
      include: {
        user: { select: { id: true, username: true } },
        character: {
          select: { id: true, name: true, className: true, level: true, portraitUrl: true },
        },
      },
    });

    return mapPlayer(player);
  }

  async removePlayer(sessionId: string, userId: string): Promise<void> {
    await this.prisma.sessionPlayer.deleteMany({
      where: { sessionId, userId },
    });
  }

  async updatePlayerStatus(
    sessionId: string,
    userId: string,
    patch: { isReady?: boolean; isConnected?: boolean }
  ): Promise<void> {
    await this.prisma.sessionPlayer.updateMany({
      where: { sessionId, userId },
      data: patch,
    });
  }

  async updateSession(sessionId: string, patch: { status?: string; phase?: string }): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: patch,
    });
  }
}
