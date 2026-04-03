export function computeProficiencyBonus(level: number): number {
  if (level < 1 || level > 20) throw new Error(`Invalid level: ${level}`);
  return Math.ceil(level / 4) + 1;
}
