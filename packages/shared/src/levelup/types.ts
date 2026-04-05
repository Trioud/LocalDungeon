import type { SpellSlotState } from '../spellcasting';

export type AbilityScore = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

// index = level - 1, value = XP required to reach that level
export const XP_THRESHOLDS: number[] = [
  0,       // level 1
  300,     // level 2
  900,     // level 3
  2700,    // level 4
  6500,    // level 5
  14000,   // level 6
  23000,   // level 7
  34000,   // level 8
  48000,   // level 9
  64000,   // level 10
  85000,   // level 11
  100000,  // level 12
  120000,  // level 13
  140000,  // level 14
  165000,  // level 15
  195000,  // level 16
  225000,  // level 17
  265000,  // level 18
  300000,  // level 19
  355000,  // level 20
];

export type ASIChoice =
  | { type: 'asi'; ability1: AbilityScore; ability2?: AbilityScore }
  | { type: 'feat'; featName: string };

export interface LevelUpChoice {
  classToLevel: string;
  hpRoll?: number;
  asiChoice?: ASIChoice;
  subclassChoice?: string;
  newSpellsLearned?: string[];
}

export interface LevelUpPreview {
  newLevel: number;
  hpOptions: { roll: number; average: number };
  gainsASI: boolean;
  gainsSubclass: boolean;
  newProficiencyBonus: number;
  newSpellSlots?: SpellSlotState[];
  features: string[];
  isNewClass?: boolean;
  multiclassGrants?: MulticlassGrant;
}

export interface LevelUpCharacter {
  className: string;
  level: number;
  hitDie: number;
  abilityScores: Record<string, number>;
  xp?: number;
  subclassName?: string;
}

export interface MulticlassGrant {
  proficiencies: string[];
  savingThrows?: string[];
}

export type ClassSpellcastingType = 'full' | 'half' | 'third' | 'none' | 'pact';

export const CASTER_TYPE: Record<string, ClassSpellcastingType> = {
  Bard: 'full',
  Cleric: 'full',
  Druid: 'full',
  Sorcerer: 'full',
  Wizard: 'full',
  Paladin: 'half',
  Ranger: 'half',
  'Eldritch Knight': 'third',
  'Arcane Trickster': 'third',
  Warlock: 'pact',
  Barbarian: 'none',
  Fighter: 'none',
  Monk: 'none',
  Rogue: 'none',
};
