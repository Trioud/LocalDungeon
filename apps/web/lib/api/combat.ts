import apiClient from '@/lib/apiClient';
import type { CombatState } from '@local-dungeon/shared';

export async function getCombatState(sessionId: string): Promise<CombatState | { isActive: false }> {
  const { data } = await apiClient.get(`/sessions/${sessionId}/combat`);
  return data;
}
