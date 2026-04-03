import apiClient from '@/lib/apiClient';

export interface CreateCharacterPayload {
  name: string;
  className: string;
  speciesName: string;
  backgroundName: string;
  alignment: string;
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number; };
  backstory: string;
  appearance: Record<string, string>;
  personality: Record<string, string>;
  feats: string[];
  spells: { cantrips: string[]; known: string[] };
}

export async function createCharacter(payload: CreateCharacterPayload) {
  const { data } = await apiClient.post<{ id: string; name: string }>('/characters', payload);
  return data;
}

export async function listCharacters() {
  const { data } = await apiClient.get<Array<{ id: string; name: string; className: string; level: number }>>('/characters');
  return data;
}
