import {
  rollDice,
  parseNotation,
  type DiceNotation,
  type DiceRollMode,
  type DiceResult,
} from '@local-dungeon/shared';

interface DiceServiceDeps {
  rng?: () => number;
}

export class DiceService {
  private rng: () => number;

  constructor({ rng = Math.random }: DiceServiceDeps = {}) {
    this.rng = rng;
  }

  roll(notation: DiceNotation, mode: DiceRollMode): DiceResult {
    return rollDice(notation, mode, this.rng);
  }

  rollByString(notationStr: string, mode: DiceRollMode): DiceResult {
    const notation = parseNotation(notationStr);
    return rollDice(notation, mode, this.rng);
  }

  rollDeathSave(): DiceResult & { isSuccess: boolean } {
    const result = rollDice({ count: 1, sides: 20, modifier: 0 }, 'normal', this.rng);
    return { ...result, isSuccess: result.total >= 10 };
  }

  rollConcentration(damage: number): DiceResult & { dc: number } {
    const dc = Math.max(10, Math.floor(damage / 2));
    const result = rollDice({ count: 1, sides: 20, modifier: 0 }, 'normal', this.rng);
    return { ...result, dc };
  }

  rollHitDie(sides: number, conMod: number): DiceResult {
    return rollDice({ count: 1, sides, modifier: conMod }, 'normal', this.rng);
  }
}
