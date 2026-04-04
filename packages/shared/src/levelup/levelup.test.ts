import { describe, it, expect } from 'vitest';
import {
  XP_THRESHOLDS,
  xpToLevel,
  levelToXP,
  proficiencyBonusForLevel,
  checkMulticlassPrereqs,
  isASILevel,
  isSubclassLevel,
  computeNewSpellSlots,
  hpGainAverage,
  previewLevelUp,
} from './levelup';

const baseScores = { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 };

describe('XP_THRESHOLDS', () => {
  it('has 20 entries', () => {
    expect(XP_THRESHOLDS).toHaveLength(20);
  });
  it('level 1 requires 0 XP', () => {
    expect(XP_THRESHOLDS[0]).toBe(0);
  });
  it('level 20 requires 355000 XP', () => {
    expect(XP_THRESHOLDS[19]).toBe(355000);
  });
});

describe('xpToLevel', () => {
  it.each([
    [0, 1],
    [299, 1],
    [300, 2],
    [899, 2],
    [900, 3],
    [2699, 3],
    [2700, 4],
    [6499, 4],
    [6500, 5],
    [64000, 10],
    [354999, 19],
    [355000, 20],
    [999999, 20],
  ])('xp %i → level %i', (xp, expected) => {
    expect(xpToLevel(xp)).toBe(expected);
  });
});

describe('levelToXP', () => {
  it('level 1 → 0', () => expect(levelToXP(1)).toBe(0));
  it('level 2 → 300', () => expect(levelToXP(2)).toBe(300));
  it('level 5 → 6500', () => expect(levelToXP(5)).toBe(6500));
  it('level 20 → 355000', () => expect(levelToXP(20)).toBe(355000));
  it('throws for level 0', () => expect(() => levelToXP(0)).toThrow('Invalid level: 0'));
  it('throws for level 21', () => expect(() => levelToXP(21)).toThrow('Invalid level: 21'));
});

describe('proficiencyBonusForLevel', () => {
  it.each([
    [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [12, 4],
    [13, 5], [16, 5], [17, 6], [20, 6],
  ])('level %i → +%i', (level, expected) => {
    expect(proficiencyBonusForLevel(level)).toBe(expected);
  });
  it('throws for invalid level', () => {
    expect(() => proficiencyBonusForLevel(0)).toThrow();
  });
});

describe('checkMulticlassPrereqs', () => {
  it('Barbarian requires STR 13', () => {
    expect(checkMulticlassPrereqs({ ...baseScores, str: 12 }, 'Barbarian').allowed).toBe(false);
    expect(checkMulticlassPrereqs({ ...baseScores, str: 13 }, 'Barbarian').allowed).toBe(true);
  });
  it('Monk requires DEX 13 and WIS 13', () => {
    expect(checkMulticlassPrereqs({ ...baseScores, dex: 12, wis: 14 }, 'Monk').allowed).toBe(false);
    expect(checkMulticlassPrereqs({ ...baseScores, dex: 14, wis: 12 }, 'Monk').allowed).toBe(false);
    expect(checkMulticlassPrereqs({ ...baseScores, dex: 14, wis: 14 }, 'Monk').allowed).toBe(true);
  });
  it('Fighter requires STR 13 or DEX 13', () => {
    expect(checkMulticlassPrereqs({ ...baseScores, str: 12, dex: 12 }, 'Fighter').allowed).toBe(false);
    expect(checkMulticlassPrereqs({ ...baseScores, str: 13, dex: 10 }, 'Fighter').allowed).toBe(true);
    expect(checkMulticlassPrereqs({ ...baseScores, str: 10, dex: 13 }, 'Fighter').allowed).toBe(true);
  });
  it('Wizard requires INT 13', () => {
    expect(checkMulticlassPrereqs({ ...baseScores, int: 12 }, 'Wizard').allowed).toBe(false);
    expect(checkMulticlassPrereqs({ ...baseScores, int: 13 }, 'Wizard').allowed).toBe(true);
  });
  it('returns reason on failure', () => {
    const result = checkMulticlassPrereqs({ ...baseScores, cha: 12 }, 'Bard');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });
  it('unknown class is allowed', () => {
    expect(checkMulticlassPrereqs(baseScores, 'Artificer').allowed).toBe(true);
  });
});

describe('isASILevel', () => {
  it('Fighter gets ASI at 4, 6, 8, 12, 14, 16, 19', () => {
    for (const lvl of [4, 6, 8, 12, 14, 16, 19]) {
      expect(isASILevel('Fighter', lvl)).toBe(true);
    }
  });
  it('Fighter does not get ASI at level 3', () => {
    expect(isASILevel('Fighter', 3)).toBe(false);
  });
  it('Rogue gets ASI at 4, 8, 10, 12, 16, 19', () => {
    for (const lvl of [4, 8, 10, 12, 16, 19]) {
      expect(isASILevel('Rogue', lvl)).toBe(true);
    }
  });
  it('Wizard gets ASI at 4, 8, 12, 16, 19', () => {
    for (const lvl of [4, 8, 12, 16, 19]) {
      expect(isASILevel('Wizard', lvl)).toBe(true);
    }
    expect(isASILevel('Wizard', 6)).toBe(false);
  });
});

describe('isSubclassLevel', () => {
  it('Cleric chooses subclass at level 1', () => expect(isSubclassLevel('Cleric', 1)).toBe(true));
  it('Sorcerer chooses subclass at level 1', () => expect(isSubclassLevel('Sorcerer', 1)).toBe(true));
  it('Warlock chooses subclass at level 1', () => expect(isSubclassLevel('Warlock', 1)).toBe(true));
  it('Fighter chooses subclass at level 3', () => expect(isSubclassLevel('Fighter', 3)).toBe(true));
  it('Fighter does not choose subclass at level 1', () => expect(isSubclassLevel('Fighter', 1)).toBe(false));
  it('Wizard chooses subclass at level 3', () => expect(isSubclassLevel('Wizard', 3)).toBe(true));
});

describe('computeNewSpellSlots', () => {
  it('single Wizard level 5 → 4/3/2 slots', () => {
    const slots = computeNewSpellSlots({ Wizard: 5 });
    expect(slots.find((s) => s.level === 1)?.total).toBe(4);
    expect(slots.find((s) => s.level === 2)?.total).toBe(3);
    expect(slots.find((s) => s.level === 3)?.total).toBe(2);
  });
  it('non-caster class returns empty array', () => {
    expect(computeNewSpellSlots({ Barbarian: 5 })).toEqual([]);
  });
  it('Paladin (half-caster) level 4 effective = 2 → 3 first-level slots', () => {
    const slots = computeNewSpellSlots({ Paladin: 4 });
    expect(slots.find((s) => s.level === 1)?.total).toBe(3);
  });
  it('all slots start with used 0', () => {
    const slots = computeNewSpellSlots({ Cleric: 3 });
    slots.forEach((s) => expect(s.used).toBe(0));
  });
});

describe('hpGainAverage', () => {
  it('d10 with CON mod 0 → 6', () => expect(hpGainAverage(10, 0)).toBe(6));
  it('d8 with CON mod 2 → 7', () => expect(hpGainAverage(8, 2)).toBe(7));
  it('d6 with CON mod -1 → 3', () => expect(hpGainAverage(6, -1)).toBe(3));
  it('d12 with CON mod 3 → 10', () => expect(hpGainAverage(12, 3)).toBe(10));
});

describe('previewLevelUp', () => {
  const baseCharacter = {
    className: 'Fighter',
    level: 3,
    hitDie: 10,
    abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  };

  it('returns new level 4', () => {
    const preview = previewLevelUp(baseCharacter, 'Fighter');
    expect(preview.newLevel).toBe(4);
  });

  it('gains ASI at Fighter level 4', () => {
    const preview = previewLevelUp(baseCharacter, 'Fighter');
    expect(preview.gainsASI).toBe(true);
  });

  it('gains ASI at Fighter level 6', () => {
    const preview = previewLevelUp({ ...baseCharacter, level: 5 }, 'Fighter');
    expect(preview.gainsASI).toBe(true);
  });

  it('returns correct proficiency bonus', () => {
    const preview = previewLevelUp(baseCharacter, 'Fighter');
    expect(preview.newProficiencyBonus).toBe(2);
  });

  it('proficiency bonus increases at level 5', () => {
    const preview = previewLevelUp({ ...baseCharacter, level: 4 }, 'Fighter');
    expect(preview.newProficiencyBonus).toBe(3);
  });

  it('hp average uses CON modifier', () => {
    const preview = previewLevelUp(baseCharacter, 'Fighter');
    // d10 + CON mod 2 = ceil(10/2)+1+2 = 8
    expect(preview.hpOptions.average).toBe(8);
  });

  it('Cleric level 1 gains subclass (no existing subclass)', () => {
    const cleric = { ...baseCharacter, className: 'Cleric', level: 0, hitDie: 8 };
    const preview = previewLevelUp(cleric, 'Cleric');
    expect(preview.gainsSubclass).toBe(true);
  });

  it('does not gain subclass if already has one', () => {
    const preview = previewLevelUp({ ...baseCharacter, subclassName: 'Champion' }, 'Fighter');
    expect(preview.gainsSubclass).toBe(false);
  });
});
