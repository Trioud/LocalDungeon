import type { CommandIntent, CommandEntities, ParsedCommand, ParseContext } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SKILLS = [
  'acrobatics', 'animal handling', 'arcana', 'athletics', 'deception',
  'history', 'insight', 'intimidation', 'investigation', 'medicine',
  'nature', 'perception', 'performance', 'persuasion', 'religion',
  'sleight of hand', 'stealth', 'survival',
];

export const CONDITIONS = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious',
];

export const SAVES = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
];

const INTENT_PATTERNS: Record<CommandIntent, string[]> = {
  roll_dice: ['roll', 'dice', 'd20', 'd6', 'd8', 'd10', 'd12', 'd4', 'die'],
  roll_skill: [
    'roll', 'stealth', 'perception', 'athletics', 'persuasion', 'deception',
    'insight', 'investigation', 'arcana', 'history', 'nature', 'religion',
    'acrobatics', 'animal handling', 'medicine', 'sleight of hand', 'survival',
    'intimidation', 'performance',
  ],
  roll_save: [
    'save', 'saving throw', 'strength', 'dexterity', 'constitution',
    'intelligence', 'wisdom', 'charisma', 'con save', 'dex save', 'str save',
    'wis save', 'int save', 'cha save',
  ],
  roll_attack: ['attack', 'swing', 'strike', 'hit', 'stab', 'shoot', 'slash'],
  cast_spell: ['cast', 'spell', 'fireball', 'healing', 'mage', 'lightning', 'thunder', 'magic'],
  use_resource: [
    'use', 'spend', 'activate', 'rage', 'ki', 'bardic', 'inspiration',
    'action surge', 'second wind', 'wild shape', 'channel divinity', 'sorcery', 'invocation',
  ],
  apply_damage: ['damage', 'take', 'hurt', 'hit for', 'deals', 'fire', 'cold', 'lightning', 'necrotic', 'radiant'],
  apply_healing: ['heal', 'heals', 'healing', 'restore', 'regain', 'recover', 'hit points'],
  add_condition: [
    'poisoned', 'prone', 'stunned', 'paralyzed', 'blinded', 'deafened',
    'charmed', 'frightened', 'grappled', 'incapacitated', 'invisible', 'petrified',
    'restrained', 'exhaustion', 'mark', 'apply', 'add condition', 'become',
  ],
  remove_condition: ['remove', 'clear', 'no longer', 'cured', 'end condition', 'dispel'],
  end_turn: ['end turn', 'done', 'finish', 'next', 'pass', 'my turn is over', 'end my turn'],
  rest: ['rest', 'short rest', 'long rest', 'take a rest', 'camp', 'sleep'],
  chat: [],
};

// ─── Levenshtein distance ─────────────────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesPattern(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

function scoreIntent(normalised: string, intent: CommandIntent): number {
  const patterns = INTENT_PATTERNS[intent];
  if (patterns.length === 0) return 0;

  let matched = 0;
  for (const pattern of patterns) {
    if (matchesPattern(normalised, pattern)) matched++;
  }
  // Normalise against a capped denominator so even 1-2 keyword matches can exceed 0.3
  const denominator = Math.min(patterns.length, 3);
  return Math.min(matched / denominator, 1);
}

function fuzzyMatch(query: string, candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;
  let best: string | undefined;
  let bestDist = Infinity;
  const q = query.toLowerCase();
  for (const c of candidates) {
    const cl = c.toLowerCase();
    // Exact substring match — high priority
    if (cl.includes(q) || q.includes(cl)) return c;
    const dist = levenshtein(q, cl);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  // Only accept fuzzy match if distance is small relative to word length
  const threshold = Math.max(2, Math.floor(query.length * 0.4));
  return bestDist <= threshold ? best : undefined;
}

// ─── Entity extraction ────────────────────────────────────────────────────────

function extractEntities(raw: string, normalised: string, context: ParseContext): CommandEntities {
  const entities: CommandEntities = {};

  // Dice notation
  const diceMatch = raw.match(/(\d+d\d+(?:[+-]\d+)?)/i);
  if (diceMatch) entities.diceNotation = diceMatch[1];

  // Spell level
  const levelMatch = normalised.match(/(?:at level|at slot level|using a level)\s+(\d)/i);
  if (levelMatch) entities.spellLevel = parseInt(levelMatch[1], 10);

  // Amount (damage/healing) — handles "15 fire damage", "6 HP", "4 hit points"
  const amountMatch = normalised.match(/(\d+)\s+(?:\w+\s+)?(?:damage|hp|hit points|healing)/i);
  if (amountMatch) entities.amount = parseInt(amountMatch[1], 10);

  // Advantage / disadvantage
  const advMatch = normalised.match(/\b(?:with\s+)?(advantage|disadvantage)\b/i);
  if (advMatch) {
    if (advMatch[1].toLowerCase() === 'advantage') entities.withAdvantage = true;
    else entities.withDisadvantage = true;
  }

  // Condition name (longest match first to avoid partial hits)
  const sortedConditions = [...CONDITIONS].sort((a, b) => b.length - a.length);
  for (const cond of sortedConditions) {
    if (normalised.includes(cond)) {
      entities.conditionName = cond;
      break;
    }
  }

  // Skill name (longest match first)
  const sortedSkills = [...SKILLS].sort((a, b) => b.length - a.length);
  for (const skill of sortedSkills) {
    if (normalised.includes(skill)) {
      entities.skillName = skill;
      break;
    }
  }

  // Save name
  for (const save of SAVES) {
    if (normalised.includes(save)) {
      entities.saveName = save;
      break;
    }
  }

  // Spell name (fuzzy against knownSpells)
  if (context.knownSpells && context.knownSpells.length > 0) {
    // Try to extract candidate after "cast"
    const castMatch = normalised.match(/cast\s+(.+?)(?:\s+at\s+level|\s+at\s+slot|$)/i);
    const candidate = castMatch ? castMatch[1].trim() : normalised;
    const match = fuzzyMatch(candidate, context.knownSpells);
    if (match) entities.spellName = match;
  }

  // Resource name
  const allResources = [
    ...(context.knownResources ?? []),
    'rage', 'ki', 'bardic inspiration', 'action surge', 'second wind',
    'wild shape', 'channel divinity', 'sorcery point', 'invocation',
  ];
  for (const res of allResources) {
    if (normalised.includes(res.toLowerCase())) {
      entities.resourceId = res;
      break;
    }
  }

  // Target name (fuzzy against sessionPlayerNames)
  if (context.sessionPlayerNames && context.sessionPlayerNames.length > 0) {
    // Look for words after "the", "at", "to", etc.
    const targetMatch = normalised.match(/(?:the|at|to|against)\s+(\w+)/i);
    if (targetMatch) {
      const matched = fuzzyMatch(targetMatch[1], context.sessionPlayerNames);
      if (matched) entities.targetName = matched;
    }
  }

  return entities;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseVoiceCommand(text: string, context: ParseContext = {}): ParsedCommand {
  const normalised = normalise(text);

  const intents = Object.keys(INTENT_PATTERNS) as CommandIntent[];
  const scored: Array<{ intent: CommandIntent; score: number }> = intents
    .filter((i) => i !== 'chat')
    .map((intent) => ({ intent, score: scoreIntent(normalised, intent) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const runner = scored[1];

  const MIN_CONFIDENCE = 0.3;

  let intent: CommandIntent = 'chat';
  let confidence = 0;

  if (top && top.score >= MIN_CONFIDENCE) {
    intent = top.intent;
    confidence = Math.min(top.score, 1);
  }

  // Disambiguate roll_dice vs roll_save: saving-throw phrases are more specific
  if (intent === 'roll_dice') {
    const SAVE_PHRASES = ['saving throw', ' save', 'con save', 'dex save', 'str save', 'wis save', 'int save', 'cha save'];
    if (SAVE_PHRASES.some((kw) => normalised.includes(kw))) {
      intent = 'roll_save';
    }
  }

  // Disambiguate add_condition vs remove_condition:
  // if the winner is add_condition but a removal keyword is present → override
  if (intent === 'add_condition') {
    const REMOVE_KEYWORDS = ['remove', 'clear', 'no longer', 'cured', 'dispel'];
    if (REMOVE_KEYWORDS.some((kw) => normalised.includes(kw))) {
      intent = 'remove_condition';
    }
  }

  const entities = extractEntities(text, normalised, context);

  const result: ParsedCommand = { intent, confidence, raw: text, entities };

  // Add alternates when top two scores are within 0.15 of each other
  if (
    top && runner &&
    top.score >= MIN_CONFIDENCE &&
    runner.score >= MIN_CONFIDENCE &&
    top.score - runner.score <= 0.15
  ) {
    const altEntities = extractEntities(text, normalised, context);
    result.alternates = [
      {
        intent: runner.intent,
        confidence: Math.min(runner.score, 1),
        raw: text,
        entities: altEntities,
      },
    ];
  }

  return result;
}
