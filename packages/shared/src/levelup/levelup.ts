import type { SpellSlotState } from '../spellcasting';
import { XP_THRESHOLDS, type LevelUpPreview, type LevelUpCharacter } from './types';
import { computeAbilityModifier } from '../rules/abilityScores';
import type { AbilityScores } from '../rules/abilityScores';

export { XP_THRESHOLDS } from './types';

// Multiclass combined spell slot table (PHB 2024)
// Rows indexed by combined caster level (1-20), columns = spell levels 1-9
const MULTICLASS_SLOT_TABLE: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

const FULL_CASTERS = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard']);
const HALF_CASTERS = new Set(['paladin', 'ranger']);
const THIRD_CASTERS = new Set(['fighter', 'rogue']); // EK / AT only; treated as third-caster level contribution

export function xpToLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function levelToXP(level: number): number {
  if (level < 1 || level > 20) throw new Error(`Invalid level: ${level}`);
  return XP_THRESHOLDS[level - 1];
}

export function proficiencyBonusForLevel(totalLevel: number): number {
  if (totalLevel < 1 || totalLevel > 20) throw new Error(`Invalid level: ${totalLevel}`);
  return Math.ceil(totalLevel / 4) + 1;
}

export interface MulticlassPrereqResult {
  allowed: boolean;
  reason?: string;
}

export function checkMulticlassPrereqs(
  abilityScores: AbilityScores,
  targetClass: string,
): MulticlassPrereqResult {
  const cls = targetClass.toLowerCase();

  const check = (ability: keyof AbilityScores, min: number): boolean =>
    abilityScores[ability] >= min;

  switch (cls) {
    case 'barbarian':
      if (!check('str', 13)) return { allowed: false, reason: 'Requires STR 13' };
      break;
    case 'bard':
      if (!check('cha', 13)) return { allowed: false, reason: 'Requires CHA 13' };
      break;
    case 'cleric':
      if (!check('wis', 13)) return { allowed: false, reason: 'Requires WIS 13' };
      break;
    case 'druid':
      if (!check('wis', 13)) return { allowed: false, reason: 'Requires WIS 13' };
      break;
    case 'fighter':
      if (!check('str', 13) && !check('dex', 13))
        return { allowed: false, reason: 'Requires STR 13 or DEX 13' };
      break;
    case 'monk':
      if (!check('dex', 13)) return { allowed: false, reason: 'Requires DEX 13 and WIS 13' };
      if (!check('wis', 13)) return { allowed: false, reason: 'Requires DEX 13 and WIS 13' };
      break;
    case 'paladin':
      if (!check('str', 13)) return { allowed: false, reason: 'Requires STR 13 and CHA 13' };
      if (!check('cha', 13)) return { allowed: false, reason: 'Requires STR 13 and CHA 13' };
      break;
    case 'ranger':
      if (!check('dex', 13)) return { allowed: false, reason: 'Requires DEX 13 and WIS 13' };
      if (!check('wis', 13)) return { allowed: false, reason: 'Requires DEX 13 and WIS 13' };
      break;
    case 'rogue':
      if (!check('dex', 13)) return { allowed: false, reason: 'Requires DEX 13' };
      break;
    case 'sorcerer':
      if (!check('cha', 13)) return { allowed: false, reason: 'Requires CHA 13' };
      break;
    case 'warlock':
      if (!check('cha', 13)) return { allowed: false, reason: 'Requires CHA 13' };
      break;
    case 'wizard':
      if (!check('int', 13)) return { allowed: false, reason: 'Requires INT 13' };
      break;
    default:
      // Unknown class — allow by default
      break;
  }

  return { allowed: true };
}

export function isASILevel(className: string, classLevel: number): boolean {
  const base = [4, 8, 12, 16, 19];
  const cls = className.toLowerCase();
  if (cls === 'fighter') return [...base, 6, 14].includes(classLevel);
  if (cls === 'rogue') return [...base, 10].includes(classLevel);
  return base.includes(classLevel);
}

export function isSubclassLevel(className: string, classLevel: number): boolean {
  const cls = className.toLowerCase();
  if (cls === 'cleric' || cls === 'sorcerer' || cls === 'warlock') return classLevel === 1;
  return classLevel === 3;
}

export function computeNewSpellSlots(classLevels: Record<string, number>): SpellSlotState[] {
  let effectiveLevel = 0;

  for (const [className, level] of Object.entries(classLevels)) {
    const cls = className.toLowerCase();
    if (FULL_CASTERS.has(cls)) {
      effectiveLevel += level;
    } else if (HALF_CASTERS.has(cls)) {
      effectiveLevel += Math.floor(level / 2);
    } else if (THIRD_CASTERS.has(cls)) {
      effectiveLevel += Math.floor(level / 3);
    }
    // Warlock uses Pact Magic (separate) — not included here
  }

  if (effectiveLevel <= 0) return [];

  const capped = Math.min(effectiveLevel, 20);
  const row = MULTICLASS_SLOT_TABLE[capped - 1];

  const slots: SpellSlotState[] = [];
  for (let i = 0; i < row.length; i++) {
    if (row[i] > 0) {
      slots.push({ level: (i + 1) as SpellSlotState['level'], total: row[i], used: 0 });
    }
  }
  return slots;
}

export function hpGainAverage(hitDie: number, conModifier: number): number {
  return Math.ceil(hitDie / 2) + 1 + conModifier;
}

export function previewLevelUp(character: LevelUpCharacter, classToLevel: string): LevelUpPreview {
  const cls = classToLevel.toLowerCase();
  const isMainClass = cls === character.className.toLowerCase();
  const currentClassLevel = isMainClass ? character.level : 0;
  const newClassLevel = currentClassLevel + 1;
  const newTotalLevel = character.level + (isMainClass ? 1 : 0);

  const conMod = computeAbilityModifier(character.abilityScores['con'] ?? 10);
  const hpAverage = hpGainAverage(character.hitDie, conMod);
  const hpMax = character.hitDie + conMod;

  const gainsASI = isASILevel(classToLevel, newClassLevel);
  const gainsSubclass = isSubclassLevel(classToLevel, newClassLevel) && !character.subclassName;

  const classLevels: Record<string, number> = { [classToLevel]: newClassLevel };
  const newSpellSlots = computeNewSpellSlots(classLevels);

  return {
    newLevel: newTotalLevel,
    hpOptions: { roll: hpMax, average: hpAverage },
    gainsASI,
    gainsSubclass,
    newProficiencyBonus: proficiencyBonusForLevel(newTotalLevel),
    newSpellSlots: newSpellSlots.length > 0 ? newSpellSlots : undefined,
    features: [],
  };
}
