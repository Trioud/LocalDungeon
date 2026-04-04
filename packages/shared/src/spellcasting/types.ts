export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface SpellSlotState {
  level: SpellLevel;
  total: number;
  used: number;
}

export interface PactMagicState {
  level: SpellLevel;
  total: number;
  used: number;
}

export interface SpellcastingState {
  slots: SpellSlotState[];
  pactMagic?: PactMagicState;
  concentrationSpell?: string;
  castBonusActionThisTurn: boolean;
}

export interface CastSpellParams {
  spellName: string;
  spellLevel: SpellLevel;
  castAtLevel: SpellLevel;
  isRitual: boolean;
  isBonusAction: boolean;
  requiresConcentration: boolean;
  usePactMagic?: boolean;
}
