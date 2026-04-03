/** floor((score - 10) / 2) */
export function computeAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number; dex: number; con: number;
  int: number; wis: number; cha: number;
}

export function computeAllModifiers(scores: AbilityScores): Record<AbilityName, number> {
  return {
    str: computeAbilityModifier(scores.str),
    dex: computeAbilityModifier(scores.dex),
    con: computeAbilityModifier(scores.con),
    int: computeAbilityModifier(scores.int),
    wis: computeAbilityModifier(scores.wis),
    cha: computeAbilityModifier(scores.cha),
  };
}
