import { computeProficiencyBonus } from './proficiency';

export interface SkillModifierInput {
  abilityModifier: number;
  proficient: boolean;
  expertise: boolean;
  level: number;
}

export function computeSkillModifier(input: SkillModifierInput): number {
  const profBonus = computeProficiencyBonus(input.level);
  if (input.expertise) return input.abilityModifier + profBonus * 2;
  if (input.proficient) return input.abilityModifier + profBonus;
  return input.abilityModifier;
}

export function computePassivePerception(
  wisModifier: number,
  perceptionProficient: boolean,
  perceptionExpertise: boolean,
  level: number
): number {
  return 10 + computeSkillModifier({
    abilityModifier: wisModifier,
    proficient: perceptionProficient,
    expertise: perceptionExpertise,
    level,
  });
}

export function computeCarryingCapacity(strScore: number): number {
  return strScore * 15;
}
