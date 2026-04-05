import apiClient from '@/lib/apiClient';

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

export interface SessionInfo {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  maxPlayers: number;
  status: string;
  phase: string;
  players: SessionPlayerInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: string;
  name: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
}

export interface CreateSessionPayload {
  name: string;
  maxPlayers: number;
}

export async function createSession(payload: CreateSessionPayload): Promise<SessionInfo> {
  const { data } = await apiClient.post<SessionInfo>('/sessions', payload);
  return data;
}

export async function listSessions(): Promise<SessionSummary[]> {
  const { data } = await apiClient.get<SessionSummary[]>('/sessions');
  return data;
}

export async function getSession(id: string): Promise<SessionInfo> {
  const { data } = await apiClient.get<SessionInfo>(`/sessions/${id}`);
  return data;
}

export async function joinSession(id: string, characterId: string): Promise<SessionInfo> {
  const { data } = await apiClient.post<SessionInfo>(`/sessions/${id}/join`, { characterId });
  return data;
}

export async function leaveSession(id: string): Promise<void> {
  await apiClient.delete(`/sessions/${id}/leave`);
}


export async function startSession(id: string): Promise<SessionInfo> {
  const { data } = await apiClient.post<SessionInfo>(`/sessions/${id}/start`);
  return data;
}
