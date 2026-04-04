import { describe, it, expect, beforeEach } from 'vitest';
import { DiceService } from './DiceService.js';

const fixedRng = () => 0.5; // d20 → 11, d6 → 4

describe('DiceService', () => {
  let svc: DiceService;

  beforeEach(() => {
    svc = new DiceService({ rng: fixedRng });
  });

  describe('roll', () => {
    it('rolls by notation object', () => {
      const result = svc.roll({ count: 1, sides: 20, modifier: 5 }, 'normal');
      expect(result.total).toBe(11 + 5);
      expect(result.mode).toBe('normal');
    });
  });

  describe('rollByString', () => {
    it('rolls by notation string', () => {
      const result = svc.rollByString('2d6+3', 'normal');
      expect(result.rolls).toHaveLength(2);
      expect(result.total).toBe(4 + 4 + 3);
    });

    it('throws on invalid notation', () => {
      expect(() => svc.rollByString('invalid', 'normal')).toThrow();
    });

    it('supports advantage mode', () => {
      const result = svc.rollByString('d20', 'advantage');
      expect(result.mode).toBe('advantage');
    });
  });

  describe('rollDeathSave', () => {
    it('returns isSuccess true when total >= 10', () => {
      // fixedRng → 11 on d20
      const result = svc.rollDeathSave();
      expect(result.isSuccess).toBe(true);
      expect(result.total).toBe(11);
    });

    it('returns isSuccess false when total < 10', () => {
      const lowRng = () => 0; // d20 → 1
      const lowSvc = new DiceService({ rng: lowRng });
      const result = lowSvc.rollDeathSave();
      expect(result.isSuccess).toBe(false);
      expect(result.total).toBe(1);
    });
  });

  describe('rollConcentration', () => {
    it('computes DC as max(10, floor(damage/2))', () => {
      const result = svc.rollConcentration(30);
      expect(result.dc).toBe(15); // floor(30/2) = 15
    });

    it('DC is at least 10 for low damage', () => {
      const result = svc.rollConcentration(4);
      expect(result.dc).toBe(10); // max(10, floor(4/2)) = max(10, 2) = 10
    });
  });

  describe('rollHitDie', () => {
    it('rolls 1dN + conMod', () => {
      const result = svc.rollHitDie(8, 2);
      // fixedRng → floor(0.5 * 8) + 1 = 5
      expect(result.rolls).toHaveLength(1);
      expect(result.total).toBe(5 + 2);
      expect(result.modifier).toBe(2);
    });
  });
});
