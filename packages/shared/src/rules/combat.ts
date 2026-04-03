import { computeAbilityModifier } from './abilityScores.js';

export function computeMaxHP(hitDie: number, conScore: number, level: number): number {
  const conMod = computeAbilityModifier(conScore);
  const firstLevel = hitDie + conMod;
  const perLevel = Math.floor(hitDie / 2) + 1 + conMod;
  return firstLevel + perLevel * (level - 1);
}

export type ACMode =
  | { type: 'armor'; baseAC: number; addDex: boolean; maxDex?: number }
  | { type: 'unarmoredBarb'; conScore: number }
  | { type: 'unarmoredMonk'; wisScore: number }
  | { type: 'unarmoredDefault' }
  | { type: 'mageArmor' };

export function computeAC(
  dexScore: number,
  mode: ACMode,
  hasShield: boolean,
  additionalScores?: { con?: number; wis?: number }
): number {
  const dexMod = computeAbilityModifier(dexScore);
  let base: number;

  switch (mode.type) {
    case 'armor': {
      let dex = mode.addDex ? dexMod : 0;
      if (mode.addDex && mode.maxDex !== undefined) dex = Math.min(dex, mode.maxDex);
      base = mode.baseAC + dex;
      break;
    }
    case 'unarmoredBarb': {
      const conMod = computeAbilityModifier(additionalScores?.con ?? 10);
      base = 10 + dexMod + conMod;
      break;
    }
    case 'unarmoredMonk': {
      const wisMod = computeAbilityModifier(additionalScores?.wis ?? 10);
      base = 10 + dexMod + wisMod;
      break;
    }
    case 'mageArmor':
      base = 13 + dexMod;
      break;
    case 'unarmoredDefault':
    default:
      base = 10 + dexMod;
  }

  return base + (hasShield ? 2 : 0);
}

export function computeInitiative(dexScore: number): number {
  return computeAbilityModifier(dexScore);
}
