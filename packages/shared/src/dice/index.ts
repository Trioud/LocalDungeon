export type DiceNotation = {
  count: number;
  sides: number;
  modifier: number;
};

export type DiceRollMode = 'normal' | 'advantage' | 'disadvantage';

export type DiceResult = {
  notation: string;
  rolls: number[];
  total: number;
  modifier: number;
  mode: DiceRollMode;
  isNatural20: boolean;
  isNatural1: boolean;
  isCritical: boolean;
  isCriticalFail: boolean;
};

export function parseNotation(input: string): DiceNotation {
  const trimmed = input.trim().toLowerCase();
  const match = trimmed.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error(`Invalid dice notation: "${input}"`);

  const count = match[1] === '' ? 1 : parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || sides < 1) throw new Error(`Invalid dice notation: "${input}"`);

  return { count, sides, modifier };
}

function rollSet(count: number, sides: number, rng: () => number): number[] {
  return Array.from({ length: count }, () => Math.floor(rng() * sides) + 1);
}

export function rollDice(notation: DiceNotation, mode: DiceRollMode, rng: () => number = Math.random): DiceResult {
  const { count, sides, modifier } = notation;

  let rolls: number[];

  if (mode === 'advantage' || mode === 'disadvantage') {
    const setA = rollSet(count, sides, rng);
    const setB = rollSet(count, sides, rng);
    const sumA = setA.reduce((a, b) => a + b, 0);
    const sumB = setB.reduce((a, b) => a + b, 0);
    if (mode === 'advantage') {
      rolls = sumA >= sumB ? setA : setB;
    } else {
      rolls = sumA <= sumB ? setA : setB;
    }
  } else {
    rolls = rollSet(count, sides, rng);
  }

  const rollSum = rolls.reduce((a, b) => a + b, 0);
  const total = rollSum + modifier;

  const isD20 = sides === 20;
  const highestRoll = Math.max(...rolls);
  const lowestRoll = Math.min(...rolls);
  const isNatural20 = isD20 && highestRoll === 20;
  const isNatural1 = isD20 && lowestRoll === 1;

  const notationStr = `${count === 1 ? '' : count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}`;

  return {
    notation: notationStr,
    rolls,
    total,
    modifier,
    mode,
    isNatural20,
    isNatural1,
    isCritical: isNatural20,
    isCriticalFail: isNatural1,
  };
}

/**
 * Re-rolls the die at the given index in an existing DiceResult.
 * The die sides are inferred from the notation string.
 * Returns a new DiceResult with the updated roll and recalculated total.
 */
export function rerollDie(result: DiceResult, dieIndex: number, rng: () => number = Math.random): DiceResult {
  const notation = parseNotation(result.notation);
  if (dieIndex < 0 || dieIndex >= result.rolls.length) {
    throw new Error(`Die index ${dieIndex} out of range for ${result.rolls.length} dice`);
  }
  const newRoll = Math.floor(rng() * notation.sides) + 1;
  const newRolls = result.rolls.map((r, i) => (i === dieIndex ? newRoll : r));
  const rollSum = newRolls.reduce((a, b) => a + b, 0);
  const total = rollSum + result.modifier;

  const isD20 = notation.sides === 20;
  const highest = Math.max(...newRolls);
  const lowest = Math.min(...newRolls);

  return {
    ...result,
    rolls: newRolls,
    total,
    isNatural20: isD20 && highest === 20,
    isNatural1: isD20 && lowest === 1,
    isCritical: isD20 && highest === 20,
    isCriticalFail: isD20 && lowest === 1,
  };
}
