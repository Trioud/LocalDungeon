import { describe, it, expect } from 'vitest';
import { parseNotation, rollDice } from './index';

const fixedRng = () => 0.5; // produces Math.floor(0.5 * sides) + 1

describe('parseNotation', () => {
  it('parses "d20"', () => {
    expect(parseNotation('d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  it('parses "2d6+3"', () => {
    expect(parseNotation('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
  });

  it('parses "1d4-1"', () => {
    expect(parseNotation('1d4-1')).toEqual({ count: 1, sides: 4, modifier: -1 });
  });

  it('parses "3d8"', () => {
    expect(parseNotation('3d8')).toEqual({ count: 3, sides: 8, modifier: 0 });
  });

  it('parses "d20+5"', () => {
    expect(parseNotation('d20+5')).toEqual({ count: 1, sides: 20, modifier: 5 });
  });

  it('throws on invalid input', () => {
    expect(() => parseNotation('abc')).toThrow();
    expect(() => parseNotation('d')).toThrow();
    expect(() => parseNotation('')).toThrow();
  });
});

describe('rollDice', () => {
  // fixedRng = 0.5 → Math.floor(0.5 * sides) + 1
  // d6: floor(3) + 1 = 4, d20: floor(10) + 1 = 11

  it('normal roll applies modifier', () => {
    const result = rollDice({ count: 2, sides: 6, modifier: 3 }, 'normal', fixedRng);
    expect(result.rolls).toHaveLength(2);
    expect(result.rolls[0]).toBe(4);
    expect(result.rolls[1]).toBe(4);
    expect(result.total).toBe(4 + 4 + 3); // 11
    expect(result.modifier).toBe(3);
    expect(result.mode).toBe('normal');
  });

  it('advantage keeps higher of two sets', () => {
    let callCount = 0;
    // first set: 0.9 → high, second set: 0.1 → low
    const rng = () => {
      callCount++;
      return callCount <= 1 ? 0.9 : 0.1;
    };
    const result = rollDice({ count: 1, sides: 6, modifier: 0 }, 'advantage', rng);
    expect(result.total).toBe(6); // 0.9 * 6 = 5.4 → floor = 5 + 1 = 6
    expect(result.mode).toBe('advantage');
  });

  it('disadvantage keeps lower of two sets', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      return callCount <= 1 ? 0.9 : 0.1;
    };
    const result = rollDice({ count: 1, sides: 6, modifier: 0 }, 'disadvantage', rng);
    expect(result.total).toBe(1); // 0.1 * 6 = 0.6 → floor = 0 + 1 = 1
    expect(result.mode).toBe('disadvantage');
  });

  it('detects natural 20 on d20', () => {
    const rng = () => 0.999; // floor(0.999 * 20) + 1 = floor(19.98) + 1 = 19 + 1 = 20
    const result = rollDice({ count: 1, sides: 20, modifier: 0 }, 'normal', rng);
    expect(result.rolls[0]).toBe(20);
    expect(result.isNatural20).toBe(true);
    expect(result.isCritical).toBe(true);
    expect(result.isNatural1).toBe(false);
  });

  it('detects natural 1 on d20', () => {
    const rng = () => 0; // floor(0 * 20) + 1 = 1
    const result = rollDice({ count: 1, sides: 20, modifier: 0 }, 'normal', rng);
    expect(result.rolls[0]).toBe(1);
    expect(result.isNatural1).toBe(true);
    expect(result.isCriticalFail).toBe(true);
    expect(result.isNatural20).toBe(false);
  });

  it('does not set isNatural20 for non-d20', () => {
    const rng = () => 0.999;
    const result = rollDice({ count: 1, sides: 6, modifier: 0 }, 'normal', rng);
    expect(result.isNatural20).toBe(false);
    expect(result.isCritical).toBe(false);
  });

  it('formats notation string correctly', () => {
    const result = rollDice({ count: 2, sides: 6, modifier: 3 }, 'normal', fixedRng);
    expect(result.notation).toBe('2d6+3');
  });

  it('formats single die notation without count prefix', () => {
    const result = rollDice({ count: 1, sides: 20, modifier: 0 }, 'normal', fixedRng);
    expect(result.notation).toBe('d20');
  });

  it('formats negative modifier', () => {
    const result = rollDice({ count: 1, sides: 4, modifier: -1 }, 'normal', fixedRng);
    expect(result.notation).toBe('d4-1');
  });
});
