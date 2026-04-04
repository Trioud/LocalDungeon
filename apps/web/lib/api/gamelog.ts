import apiClient from '@/lib/apiClient';
import type { GameLogEntry } from '@local-dungeon/shared';

export interface GameLogResponse {
  events: GameLogEntry[];
  nextCursor?: string;
}

export async function getSessionLog(
  sessionId: string,
  opts?: { limit?: number; before?: string },
): Promise<GameLogResponse> {
  const params = new URLSearchParams();
  if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts?.before) params.set('before', opts.before);

  const query = params.toString();
  const { data } = await apiClient.get<GameLogResponse>(
    `/sessions/${sessionId}/log${query ? `?${query}` : ''}`,
  );
  return data;
}
