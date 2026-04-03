import { describe, it, expect } from 'vitest';
import { computeAbilityModifier } from './abilityScores.js';
import { computeProficiencyBonus } from './proficiency.js';
import { computeMaxHP, computeAC } from './combat.js';
import { computeSpellSaveDC } from './spellcasting.js';
import { computeSkillModifier, computePassivePerception } from './skills.js';

describe('computeAbilityModifier', () => {
  it.each([
    [10, 0], [11, 0], [8, -1], [20, 5], [1, -5], [30, 10],
  ])('score %i → %i', (score, expected) => {
    expect(computeAbilityModifier(score)).toBe(expected);
  });
});

describe('computeProficiencyBonus', () => {
  it.each([
    [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [17, 6], [20, 6],
  ])('level %i → %i', (level, expected) => {
    expect(computeProficiencyBonus(level)).toBe(expected);
  });

  it('throws for level 0', () => {
    expect(() => computeProficiencyBonus(0)).toThrow('Invalid level: 0');
  });

  it('throws for level 21', () => {
    expect(() => computeProficiencyBonus(21)).toThrow('Invalid level: 21');
  });
});

describe('computeMaxHP', () => {
  it('Fighter d10 level 1 CON 10 → 10', () => {
    expect(computeMaxHP(10, 10, 1)).toBe(10);
  });
  it('Fighter d10 level 1 CON 14 → 12', () => {
    expect(computeMaxHP(10, 14, 1)).toBe(12);
  });
  it('Fighter d10 level 5 CON 10 → 34', () => {
    expect(computeMaxHP(10, 10, 5)).toBe(34);
  });
  it('Wizard d6 level 1 CON 8 → 5', () => {
    expect(computeMaxHP(6, 8, 1)).toBe(5);
  });
});

describe('computeAC', () => {
  it('Leather armor (11 AC, add DEX) DEX 14 → 13', () => {
    expect(computeAC(14, { type: 'armor', baseAC: 11, addDex: true }, false)).toBe(13);
  });
  it('Chain mail (16 AC, no DEX) DEX 18 → 16', () => {
    expect(computeAC(18, { type: 'armor', baseAC: 16, addDex: false }, false)).toBe(16);
  });
  it('Breastplate (14 AC, add DEX, max +2) DEX 18 → 16', () => {
    expect(computeAC(18, { type: 'armor', baseAC: 14, addDex: true, maxDex: 2 }, false)).toBe(16);
  });
  it('Unarmored Barbarian DEX 14 CON 16 → 15', () => {
    expect(computeAC(14, { type: 'unarmoredBarb', conScore: 16 }, false, { con: 16 })).toBe(15);
  });
  it('Unarmored Monk DEX 16 WIS 14 → 15', () => {
    expect(computeAC(16, { type: 'unarmoredMonk', wisScore: 14 }, false, { wis: 14 })).toBe(15);
  });
  it('Mage Armor DEX 16 → 16', () => {
    expect(computeAC(16, { type: 'mageArmor' }, false)).toBe(16);
  });
  it('Leather + shield DEX 14 → 15', () => {
    expect(computeAC(14, { type: 'armor', baseAC: 11, addDex: true }, true)).toBe(15);
  });
});

describe('computeSpellSaveDC', () => {
  it('profBonus 2, spellMod 3 → 13', () => {
    expect(computeSpellSaveDC(2, 3)).toBe(13);
  });
  it('profBonus 6, spellMod 5 → 19', () => {
    expect(computeSpellSaveDC(6, 5)).toBe(19);
  });
});

describe('computeSkillModifier', () => {
  it('not proficient, mod 2 → 2', () => {
    expect(computeSkillModifier({ abilityModifier: 2, proficient: false, expertise: false, level: 1 })).toBe(2);
  });
  it('proficient level 1, mod 2 → 4', () => {
    expect(computeSkillModifier({ abilityModifier: 2, proficient: true, expertise: false, level: 1 })).toBe(4);
  });
  it('expertise level 1, mod 2 → 6', () => {
    expect(computeSkillModifier({ abilityModifier: 2, proficient: true, expertise: true, level: 1 })).toBe(6);
  });
});

describe('computePassivePerception', () => {
  it('WIS 10, not proficient, level 1 → 10', () => {
    expect(computePassivePerception(0, false, false, 1)).toBe(10);
  });
  it('WIS 14 (mod 2), proficient level 1 → 14', () => {
    expect(computePassivePerception(2, true, false, 1)).toBe(14);
  });
});
