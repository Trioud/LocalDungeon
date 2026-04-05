export interface CharacterSummary {
  id: string;
  name: string;
  className: string;
  level: number;
  speciesName: string;
  portraitUrl: string | null;
  updatedAt: Date;
}

export interface CreateCharacterData {
  userId: string;
  name: string;
  alignment: string;
  backstory: string;
  appearance: Record<string, unknown>;
  personality: Record<string, unknown>;
  className: string;
  subclassName?: string;
  level: number;
  xp?: number;
  hitDie: number;
  currentHP: number;
  maxHP: number;
  speciesName: string;
  backgroundName: string;
  abilityScores: Record<string, number>;
  derivedStats: Record<string, unknown>;
  proficiencies: Record<string, unknown>;
  spells: Record<string, unknown>;
  features: unknown[];
  feats: string[];
  inventory: Record<string, unknown>;
  classLevels?: Record<string, number>;
  totalLevel?: number;
}

export type UpdateCharacterData = Partial<CreateCharacterData>;

export interface Character extends CreateCharacterData {
  id: string;
  tempHP: number;
  conditions: unknown[];
  exhaustionLevel: number;
  isBloodied: boolean;
  heroicInspiration: boolean;
  portraitUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICharacterRepository {
  create(data: CreateCharacterData): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findAllByUserId(userId: string): Promise<CharacterSummary[]>;
  update(id: string, patch: UpdateCharacterData): Promise<Character>;
  delete(id: string): Promise<void>;
  setInspiration(id: string, value: boolean): Promise<void>;
}
