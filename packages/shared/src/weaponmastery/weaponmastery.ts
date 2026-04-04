import type { MasteryProperty, WeaponMasteryEntry, MasteryCheckResult, ApplyMasteryParams, MasteryEffect } from './types';

export const WEAPON_MASTERY_TABLE: Record<string, MasteryProperty> = {
  // Cleave
  'greataxe': 'cleave',
  'halberd': 'cleave',
  'glaive': 'cleave',
  'handaxe': 'cleave',
  'battleaxe': 'cleave',
  // Graze
  'greatsword': 'graze',
  'longsword': 'graze',
  'flail': 'graze',
  // Nick
  'dagger': 'nick',
  'shortsword': 'nick',
  'scimitar': 'nick',
  'sickle': 'nick',
  // Push
  'warhammer': 'push',
  'maul': 'push',
  'pike': 'push',
  'staff': 'push',
  // Sap
  'mace': 'sap',
  'club': 'sap',
  'quarterstaff': 'sap',
  // Slow
  'whip': 'slow',
  'javelin': 'slow',
  'spear': 'slow',
  'light crossbow': 'slow',
  // Topple
  'morningstar': 'topple',
  'lance': 'topple',
  'heavy crossbow': 'topple',
  'greatclub': 'topple',
  // Vex
  'rapier': 'vex',
  'hand crossbow': 'vex',
  'longbow': 'vex',
  'shortbow': 'vex',
  'light repeating crossbow': 'vex',
};

const MASTERY_ELIGIBLE_CLASSES: Record<string, number> = {
  fighter: 1,
  barbarian: 1,
  paladin: 1,
  ranger: 1,
  rogue: 1,
  monk: 1,
  bard: 3,
};

export function getMasteryProperty(weaponName: string): MasteryProperty | undefined {
  return WEAPON_MASTERY_TABLE[weaponName.toLowerCase()];
}

export function maxMasteriesForClass(className: string): number {
  return className.toLowerCase() === 'fighter' ? 3 : 2;
}

export function checkMasteryEligibility(
  className: string,
  classLevel: number,
  weaponName: string,
  assignedMasteries: WeaponMasteryEntry[],
): MasteryCheckResult {
  const minLevel = MASTERY_ELIGIBLE_CLASSES[className.toLowerCase()];
  if (minLevel === undefined) {
    return { eligible: false, reason: `${className} does not have Weapon Mastery` };
  }
  if (classLevel < minLevel) {
    return { eligible: false, reason: `${className} gains Weapon Mastery at level ${minLevel}` };
  }
  const assigned = assignedMasteries.find(
    (e) => e.weaponName.toLowerCase() === weaponName.toLowerCase(),
  );
  if (!assigned) {
    return { eligible: false, reason: `${weaponName} is not in assigned masteries` };
  }
  return { eligible: true };
}

export function computeMasteryEffect(
  params: ApplyMasteryParams,
  targetSaveRoll?: number,
): MasteryEffect {
  const { property, targetId, attackHit, abilityModifier, proficiencyBonus } = params;
  const dc = 8 + proficiencyBonus + abilityModifier;

  switch (property) {
    case 'cleave':
      if (!attackHit) return { property, targetId, description: 'Cleave requires a hit' };
      return {
        property,
        targetId,
        description: 'You may Cleave a nearby creature',
        requiresAttack: true,
      };

    case 'graze':
      if (attackHit) return { property, targetId, description: 'Graze only triggers on a miss' };
      return {
        property,
        targetId,
        description: `Graze deals ${Math.max(1, abilityModifier)} damage despite missing`,
        damageDealt: Math.max(1, abilityModifier),
      };

    case 'nick':
      if (!attackHit) return { property, targetId, description: 'Nick requires a hit' };
      return {
        property,
        targetId,
        description: 'Make a free Nick attack with your off-hand Light weapon',
        requiresAttack: true,
      };

    case 'push': {
      if (!attackHit) return { property, targetId, description: 'Push requires a hit' };
      const pushed = targetSaveRoll !== undefined ? targetSaveRoll < dc : undefined;
      return {
        property,
        targetId,
        description:
          pushed === true
            ? `${targetId} is pushed 10 feet away`
            : pushed === false
              ? `${targetId} resists being pushed`
              : 'Target must make a STR save or be pushed 10 feet',
        pushDistance: pushed === true ? 10 : pushed === false ? 0 : undefined,
        requiresSave: { saveType: 'strength', dc },
      };
    }

    case 'sap':
      if (!attackHit) return { property, targetId, description: 'Sap requires a hit' };
      return {
        property,
        targetId,
        description: `${targetId} has Disadvantage on their next attack roll`,
        conditionApplied: 'sapped',
      };

    case 'slow':
      if (!attackHit) return { property, targetId, description: 'Slow requires a hit' };
      return {
        property,
        targetId,
        description: `${targetId}'s speed is reduced by 10 feet until the start of your next turn`,
        speedReduction: 10,
      };

    case 'topple': {
      if (!attackHit) return { property, targetId, description: 'Topple requires a hit' };
      const toppled = targetSaveRoll !== undefined ? targetSaveRoll < dc : undefined;
      return {
        property,
        targetId,
        description:
          toppled === true
            ? `${targetId} falls Prone`
            : toppled === false
              ? `${targetId} resists being toppled`
              : 'Target must make a CON save or fall Prone',
        conditionApplied: toppled === true ? 'prone' : undefined,
        requiresSave: { saveType: 'constitution', dc },
      };
    }

    case 'vex':
      if (!attackHit) return { property, targetId, description: 'Vex requires a hit' };
      return {
        property,
        targetId,
        description: 'Your next attack roll against this target has Advantage',
        givesSelfAdvantage: true,
      };
  }
}
