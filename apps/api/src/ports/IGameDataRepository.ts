import type { DndClass, Subclass, Species, Background, Feat, Spell, Weapon, Armor, Condition, Language } from '@prisma/client';

export type { DndClass, Subclass, Species, Background, Feat, Spell, Weapon, Armor, Condition, Language };

export interface SpellFilters {
  level?: number;
  school?: string;
  className?: string;
  concentration?: boolean;
  ritual?: boolean;
}

export interface IGameDataRepository {
  getClasses(): Promise<(DndClass & { subclasses: Subclass[] })[]>;
  getClassByName(name: string): Promise<(DndClass & { subclasses: Subclass[] }) | null>;
  getSpecies(): Promise<Species[]>;
  getBackgrounds(): Promise<Background[]>;
  getFeats(category?: string): Promise<Feat[]>;
  getSpells(filters?: SpellFilters): Promise<Spell[]>;
  getSpellByName(name: string): Promise<Spell | null>;
  getWeapons(): Promise<Weapon[]>;
  getArmor(): Promise<Armor[]>;
  getConditions(): Promise<Condition[]>;
  getLanguages(): Promise<Language[]>;
}
