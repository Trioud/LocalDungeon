export interface SessionInfo {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  maxPlayers: number;
  status: string;
  phase: string;
  players: SessionPlayerInfo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionPlayerInfo {
  id: string;
  userId: string;
  username: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  characterLevel: number;
  portraitUrl: string | null;
  isReady: boolean;
  isConnected: boolean;
}

export interface SessionSummary {
  id: string;
  name: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: Date;
}

export interface CreateSessionData {
  name: string;
  createdById: string;
  maxPlayers: number;
  inviteCode: string;
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<SessionInfo>;
  findById(id: string): Promise<SessionInfo | null>;
  findByInviteCode(code: string): Promise<SessionInfo | null>;
  findByUserId(userId: string): Promise<SessionSummary[]>;
  addPlayer(sessionId: string, userId: string, characterId: string): Promise<SessionPlayerInfo>;
  removePlayer(sessionId: string, userId: string): Promise<void>;
  updatePlayerStatus(
    sessionId: string,
    userId: string,
    patch: { isReady?: boolean; isConnected?: boolean }
  ): Promise<void>;
  updateSession(sessionId: string, patch: { status?: string; phase?: string }): Promise<void>;
}
