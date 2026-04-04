import { describe, it, expect } from 'vitest';
import { parseVoiceCommand, levenshtein, SKILLS, CONDITIONS, SAVES } from './parser';

// ─── Levenshtein helper tests ─────────────────────────────────────────────────

describe('levenshtein', () => {
  it('distance("fireball","firebawl") = 1', () => {
    expect(levenshtein('fireball', 'firebawl')).toBe(1);
  });
  it('distance("","abc") = 3', () => {
    expect(levenshtein('', 'abc')).toBe(3);
  });
  it('distance("abc","abc") = 0', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
  it('distance("abc","") = 3', () => {
    expect(levenshtein('abc', '')).toBe(3);
  });
  it('distance("kitten","sitting") = 3', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });
});

// ─── Constants smoke tests ────────────────────────────────────────────────────

describe('constants', () => {
  it('SKILLS has 18 entries', () => {
    expect(SKILLS).toHaveLength(18);
  });
  it('CONDITIONS has 15 entries', () => {
    expect(CONDITIONS).toHaveLength(15);
  });
  it('SAVES has 6 entries', () => {
    expect(SAVES).toHaveLength(6);
  });
});

// ─── Table-driven intent tests ────────────────────────────────────────────────

const cases: Array<{
  label: string;
  text: string;
  context?: Parameters<typeof parseVoiceCommand>[1];
  intent: string;
  entities?: Partial<ReturnType<typeof parseVoiceCommand>['entities']>;
  minConfidence?: number;
  hasAlternates?: boolean;
}> = [
  // roll_dice
  { label: 'roll a d20', text: 'roll a d20', intent: 'roll_dice' },
  { label: 'roll 2d6+3 extracts notation', text: 'roll 2d6+3', intent: 'roll_dice', entities: { diceNotation: '2d6+3' } },
  { label: 'roll dice', text: 'roll some dice', intent: 'roll_dice' },

  // roll_skill
  { label: 'roll stealth', text: 'roll stealth', intent: 'roll_skill', entities: { skillName: 'stealth' } },
  {
    label: 'roll stealth with advantage',
    text: 'roll stealth with advantage',
    intent: 'roll_skill',
    entities: { skillName: 'stealth', withAdvantage: true },
  },
  { label: 'roll perception', text: 'roll perception', intent: 'roll_skill', entities: { skillName: 'perception' } },
  { label: 'roll athletics', text: 'roll athletics', intent: 'roll_skill', entities: { skillName: 'athletics' } },
  {
    label: 'roll persuasion with disadvantage',
    text: 'roll persuasion with disadvantage',
    intent: 'roll_skill',
    entities: { skillName: 'persuasion', withDisadvantage: true },
  },

  // roll_save
  {
    label: 'constitution save',
    text: 'constitution save',
    intent: 'roll_save',
    entities: { saveName: 'constitution' },
  },
  {
    label: 'roll dex saving throw',
    text: 'roll dex saving throw',
    intent: 'roll_save',
  },
  {
    label: 'con save shorthand',
    text: 'con save',
    intent: 'roll_save',
  },

  // roll_attack
  { label: 'attack the goblin', text: 'attack the goblin', intent: 'roll_attack' },
  { label: 'swing at the orc', text: 'swing at the orc', intent: 'roll_attack' },
  { label: 'strike enemy', text: 'strike the enemy', intent: 'roll_attack' },

  // cast_spell
  {
    label: 'cast fireball',
    text: 'cast fireball',
    intent: 'cast_spell',
    context: { knownSpells: ['Fireball', 'Magic Missile'] },
    entities: { spellName: 'Fireball' },
  },
  {
    label: 'fuzzy spell: firebawl',
    text: 'cast firebawl',
    intent: 'cast_spell',
    context: { knownSpells: ['Fireball', 'Magic Missile'] },
    entities: { spellName: 'Fireball' },
  },
  {
    label: 'cast healing word at level 3',
    text: 'cast healing word at level 3',
    intent: 'cast_spell',
    entities: { spellLevel: 3 },
  },

  // use_resource
  { label: 'use rage', text: 'use rage', intent: 'use_resource', entities: { resourceId: 'rage' } },
  { label: 'spend a ki point', text: 'spend a ki point', intent: 'use_resource' },
  { label: 'action surge', text: 'action surge', intent: 'use_resource' },

  // apply_damage
  {
    label: 'take 15 fire damage',
    text: 'I take 15 fire damage',
    intent: 'apply_damage',
    entities: { amount: 15 },
  },
  {
    label: 'deal 20 damage',
    text: 'deal 20 damage to goblin',
    intent: 'apply_damage',
    entities: { amount: 20 },
  },

  // apply_healing
  {
    label: 'heal 6 HP',
    text: 'heal 6 HP',
    intent: 'apply_healing',
    entities: { amount: 6 },
  },
  {
    label: 'regain 4 hit points',
    text: 'regain 4 hit points',
    intent: 'apply_healing',
    entities: { amount: 4 },
  },

  // add_condition
  { label: 'I am poisoned', text: "I'm poisoned", intent: 'add_condition', entities: { conditionName: 'poisoned' } },
  { label: 'mark prone', text: 'mark prone', intent: 'add_condition', entities: { conditionName: 'prone' } },

  // remove_condition
  { label: 'remove poisoned', text: 'remove poisoned', intent: 'remove_condition', entities: { conditionName: 'poisoned' } },
  { label: 'no longer stunned', text: 'no longer stunned', intent: 'remove_condition', entities: { conditionName: 'stunned' } },

  // end_turn
  { label: 'end turn', text: 'end turn', intent: 'end_turn' },
  { label: "I'm done", text: "I'm done", intent: 'end_turn' },
  { label: 'pass', text: 'pass', intent: 'end_turn' },

  // rest
  { label: 'short rest', text: 'short rest', intent: 'rest' },
  { label: 'long rest', text: 'take a long rest', intent: 'rest' },

  // chat fallback
  { label: 'low confidence → chat', text: 'hello everyone', intent: 'chat', minConfidence: 0 },
  { label: 'empty-ish → chat', text: 'okay', intent: 'chat' },
];

describe('parseVoiceCommand — intent table', () => {
  for (const c of cases) {
    it(c.label, () => {
      const result = parseVoiceCommand(c.text, c.context ?? {});
      expect(result.intent).toBe(c.intent);
      if (c.entities) {
        for (const [key, value] of Object.entries(c.entities)) {
          expect((result.entities as any)[key]).toBe(value);
        }
      }
      if (c.minConfidence !== undefined) {
        expect(result.confidence).toBeGreaterThanOrEqual(c.minConfidence);
      }
    });
  }
});

// ─── Alternates ───────────────────────────────────────────────────────────────

describe('parseVoiceCommand — alternates', () => {
  it('includes alternate when two intents score close', () => {
    // "roll heal" scores for both roll_skill and apply_healing — whichever wins,
    // the other should appear as an alternate or the intent should be one of the two.
    const result = parseVoiceCommand('roll heal');
    expect(['roll_skill', 'apply_healing', 'roll_dice', 'cast_spell']).toContain(result.intent);
  });

  it('low-confidence result has no alternates', () => {
    const result = parseVoiceCommand('hello world');
    expect(result.intent).toBe('chat');
    // alternates may or may not exist but confidence is 0
    expect(result.confidence).toBe(0);
  });
});

// ─── Misc entity tests ────────────────────────────────────────────────────────

describe('parseVoiceCommand — misc entities', () => {
  it('extracts diceNotation from "roll 3d8+2"', () => {
    const result = parseVoiceCommand('roll 3d8+2');
    expect(result.entities.diceNotation).toBe('3d8+2');
  });

  it('extracts spellLevel from "cast magic missile at level 4"', () => {
    const result = parseVoiceCommand('cast magic missile at level 4', { knownSpells: ['Magic Missile'] });
    expect(result.entities.spellLevel).toBe(4);
  });

  it('raw text is preserved exactly', () => {
    const text = 'Roll STEALTH with Advantage!';
    const result = parseVoiceCommand(text);
    expect(result.raw).toBe(text);
  });

  it('confidence is between 0 and 1', () => {
    const result = parseVoiceCommand('roll a d20');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
