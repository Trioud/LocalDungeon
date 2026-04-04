import {
  rollDice,
  parseNotation,
  rerollDie,
  type DiceNotation,
  type DiceRollMode,
  type DiceResult,
} from '@local-dungeon/shared';
import type { InspirationService } from './InspirationService.js';

interface DiceServiceDeps {
  rng?: () => number;
  inspirationService?: InspirationService;
}

export class DiceService {
  private rng: () => number;
  private inspirationService?: InspirationService;

  constructor({ rng = Math.random, inspirationService }: DiceServiceDeps = {}) {
    this.rng = rng;
    this.inspirationService = inspirationService;
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

  async rerollWithInspiration(
    characterId: string,
    originalResult: DiceResult,
    dieIndex: number,
  ): Promise<DiceResult> {
    if (!this.inspirationService) {
      throw new Error('InspirationService not available');
    }
    await this.inspirationService.useInspiration(characterId);
    return rerollDie(originalResult, dieIndex, this.rng);
  }
}
