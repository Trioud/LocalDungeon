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

export interface Character {
  id: string;
  userId: string;
  name: string;
  alignment: string;
  backstory: string;
  appearance: { age: string; height: string; weight: string; eyes: string; hair: string; skin: string };
  personality: { traits: string; ideals: string; bonds: string; flaws: string };
  className: string;
  subclassName: string | null;
  level: number;
  hitDie: number;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  speciesName: string;
  backgroundName: string;
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  derivedStats: {
    ac: number;
    initiative: number;
    speed: number;
    proficiencyBonus: number;
    passivePerception: number;
    carryingCapacity: number;
    spellDC: number | null;
    spellAttackBonus: number | null;
    skills: Record<string, { modifier: number; proficient: boolean; expertise: boolean }>;
  };
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; languages: string[]; savingThrows: string[]; skills: string[] };
  spells: { cantrips: string[]; known: string[]; prepared: string[]; slots: number[] };
  features: Array<{ name: string; source: string; description: string }>;
  feats: string[];
  inventory: {
    items: Array<{ name: string; quantity: number; weight: number; cost?: string; equipped?: boolean }>;
    gold: number;
    currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  };
  conditions: string[];
  exhaustionLevel: number;
  isBloodied: boolean;
  heroicInspiration?: boolean;
  portraitUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createCharacter(payload: CreateCharacterPayload) {
  const { data } = await apiClient.post<{ id: string; name: string }>('/characters', payload);
  return data;
}

export async function listCharacters(): Promise<Character[]> {
  const { data } = await apiClient.get<Character[]>('/characters');
  return data;
}

export async function getCharacter(id: string): Promise<Character> {
  const { data } = await apiClient.get<Character>(`/characters/${id}`);
  return data;
}

export async function patchCharacter(id: string, patch: Partial<Character>): Promise<Character> {
  const { data } = await apiClient.patch<Character>(`/characters/${id}`, patch);
  return data;
}

export async function deleteCharacter(id: string): Promise<void> {
  await apiClient.delete(`/characters/${id}`);
}
