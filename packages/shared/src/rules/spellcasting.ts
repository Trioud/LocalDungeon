export function computeSpellSaveDC(profBonus: number, spellcastingMod: number): number {
  return 8 + profBonus + spellcastingMod;
}

export function computeSpellAttackBonus(profBonus: number, spellcastingMod: number): number {
  return profBonus + spellcastingMod;
}
