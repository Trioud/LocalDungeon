import { describe, it, expect } from 'vitest';
import {
  computeResourceMax,
  buildResourcesForCharacter,
  useResource,
  rechargeResources,
} from './features';
import type { ClassResource } from './types';

// ─── computeResourceMax ───────────────────────────────────────────────────────

describe('computeResourceMax', () => {
  it('rage level 1 → 2', () => {
    expect(computeResourceMax('rage', 'barbarian', 1, 2)).toBe(2);
  });

  it('rage level 3 → 3', () => {
    expect(computeResourceMax('rage', 'barbarian', 3, 2)).toBe(3);
  });

  it('rage level 6 → 4', () => {
    expect(computeResourceMax('rage', 'barbarian', 6, 2)).toBe(4);
  });

  it('rage level 20 → 999 (unlimited)', () => {
    expect(computeResourceMax('rage', 'barbarian', 20, 2)).toBe(999);
  });

  it('bardic_inspiration uses profBonus', () => {
    expect(computeResourceMax('bardic_inspiration', 'bard', 5, 3)).toBe(3);
    expect(computeResourceMax('bardic_inspiration', 'bard', 9, 4)).toBe(4);
  });

  it('channel_divinity_cleric: level 1-5 → 1', () => {
    expect(computeResourceMax('channel_divinity_cleric', 'cleric', 5, 3)).toBe(1);
  });

  it('channel_divinity_cleric: level 6-7 → 2', () => {
    expect(computeResourceMax('channel_divinity_cleric', 'cleric', 6, 3)).toBe(2);
    expect(computeResourceMax('channel_divinity_cleric', 'cleric', 7, 3)).toBe(2);
  });

  it('channel_divinity_cleric: level 8+ → 3', () => {
    expect(computeResourceMax('channel_divinity_cleric', 'cleric', 8, 3)).toBe(3);
    expect(computeResourceMax('channel_divinity_cleric', 'cleric', 15, 5)).toBe(3);
  });

  it('wild_shape uses profBonus', () => {
    expect(computeResourceMax('wild_shape', 'druid', 4, 2)).toBe(2);
  });

  it('second_wind: level < 10 → 1, level 10+ → 2', () => {
    expect(computeResourceMax('second_wind', 'fighter', 9, 4)).toBe(1);
    expect(computeResourceMax('second_wind', 'fighter', 10, 4)).toBe(2);
  });

  it('action_surge: level < 17 → 1, level 17+ → 2', () => {
    expect(computeResourceMax('action_surge', 'fighter', 16, 5)).toBe(1);
    expect(computeResourceMax('action_surge', 'fighter', 17, 6)).toBe(2);
  });

  it('indomitable: levels 1-12 → 1, 13-16 → 2, 17+ → 3', () => {
    expect(computeResourceMax('indomitable', 'fighter', 12, 4)).toBe(1);
    expect(computeResourceMax('indomitable', 'fighter', 13, 5)).toBe(2);
    expect(computeResourceMax('indomitable', 'fighter', 17, 6)).toBe(3);
  });

  it('ki = classLevel', () => {
    expect(computeResourceMax('ki', 'monk', 5, 3)).toBe(5);
    expect(computeResourceMax('ki', 'monk', 11, 4)).toBe(11);
  });

  it('lay_on_hands = classLevel * 5', () => {
    expect(computeResourceMax('lay_on_hands', 'paladin', 4, 2)).toBe(20);
    expect(computeResourceMax('lay_on_hands', 'paladin', 10, 4)).toBe(50);
  });

  it('channel_divinity_paladin → always 2', () => {
    expect(computeResourceMax('channel_divinity_paladin', 'paladin', 3, 2)).toBe(2);
  });

  it('sorcery_points = classLevel', () => {
    expect(computeResourceMax('sorcery_points', 'sorcerer', 7, 3)).toBe(7);
  });

  it('arcane_recovery → always 1', () => {
    expect(computeResourceMax('arcane_recovery', 'wizard', 10, 4)).toBe(1);
  });

  it('unknown resource → 0', () => {
    expect(computeResourceMax('unknown_resource', 'fighter', 5, 3)).toBe(0);
  });
});

// ─── buildResourcesForCharacter ───────────────────────────────────────────────

describe('buildResourcesForCharacter', () => {
  it('returns barbarian rage', () => {
    const resources = buildResourcesForCharacter({ barbarian: 5 }, 3);
    const rage = resources.find((r) => r.id === 'rage');
    expect(rage).toBeDefined();
    expect(rage!.max).toBe(3);
    expect(rage!.current).toBe(3);
    expect(rage!.recharge).toBe('long');
  });

  it('bard < 5 has long recharge for bardic_inspiration', () => {
    const resources = buildResourcesForCharacter({ bard: 3 }, 2);
    const res = resources.find((r) => r.id === 'bardic_inspiration');
    expect(res!.recharge).toBe('long');
  });

  it('bard >= 5 has short recharge for bardic_inspiration (Font of Inspiration)', () => {
    const resources = buildResourcesForCharacter({ bard: 5 }, 3);
    const res = resources.find((r) => r.id === 'bardic_inspiration');
    expect(res!.recharge).toBe('short');
  });

  it('fighter returns second_wind, action_surge, and indomitable', () => {
    const resources = buildResourcesForCharacter({ fighter: 10 }, 4);
    const ids = resources.map((r) => r.id);
    expect(ids).toContain('second_wind');
    expect(ids).toContain('action_surge');
    expect(ids).toContain('indomitable');
  });

  it('paladin returns lay_on_hands and channel_divinity_paladin', () => {
    const resources = buildResourcesForCharacter({ paladin: 5 }, 3);
    const ids = resources.map((r) => r.id);
    expect(ids).toContain('lay_on_hands');
    expect(ids).toContain('channel_divinity_paladin');
    const loh = resources.find((r) => r.id === 'lay_on_hands');
    expect(loh!.unit).toBe('HP');
    expect(loh!.max).toBe(25);
  });

  it('ranger returns no tracked resources', () => {
    const resources = buildResourcesForCharacter({ ranger: 5 }, 3);
    expect(resources).toHaveLength(0);
  });

  it('multiclass fighter/wizard returns resources for both', () => {
    const resources = buildResourcesForCharacter({ fighter: 5, wizard: 3 }, 3);
    const ids = resources.map((r) => r.id);
    expect(ids).toContain('second_wind');
    expect(ids).toContain('arcane_recovery');
  });

  it('all resources start fully charged (current === max)', () => {
    const resources = buildResourcesForCharacter({ monk: 7 }, 3);
    resources.forEach((r) => expect(r.current).toBe(r.max));
  });

  it('skips classes with level 0', () => {
    const resources = buildResourcesForCharacter({ barbarian: 0, fighter: 5 }, 3);
    expect(resources.find((r) => r.id === 'rage')).toBeUndefined();
    expect(resources.find((r) => r.id === 'second_wind')).toBeDefined();
  });
});

// ─── useResource ─────────────────────────────────────────────────────────────

describe('useResource', () => {
  function makeResources(): ClassResource[] {
    return [
      { id: 'rage', name: 'Rage', className: 'barbarian', max: 4, current: 4, recharge: 'long' },
      { id: 'ki', name: 'Ki Points', className: 'monk', max: 5, current: 5, recharge: 'short' },
    ];
  }

  it('deducts 1 by default', () => {
    const updated = useResource(makeResources(), 'rage');
    expect(updated.find((r) => r.id === 'rage')!.current).toBe(3);
  });

  it('deducts specified amount', () => {
    const updated = useResource(makeResources(), 'ki', 3);
    expect(updated.find((r) => r.id === 'ki')!.current).toBe(2);
  });

  it('throws if resource not found', () => {
    expect(() => useResource(makeResources(), 'nonexistent')).toThrow();
  });

  it('throws if insufficient current', () => {
    const depleted = makeResources().map((r) =>
      r.id === 'rage' ? { ...r, current: 0 } : r,
    );
    expect(() => useResource(depleted, 'rage')).toThrow(/Insufficient/);
  });

  it('does not mutate original array', () => {
    const original = makeResources();
    useResource(original, 'rage');
    expect(original[0].current).toBe(4);
  });
});

// ─── rechargeResources ────────────────────────────────────────────────────────

describe('rechargeResources', () => {
  function makeResources(): ClassResource[] {
    return [
      { id: 'second_wind', name: 'Second Wind', className: 'fighter', max: 1, current: 0, recharge: 'short' },
      { id: 'rage', name: 'Rage', className: 'barbarian', max: 3, current: 1, recharge: 'long' },
      { id: 'arcane_recovery', name: 'Arcane Recovery', className: 'wizard', max: 1, current: 0, recharge: 'long' },
    ];
  }

  it('short rest only recharges short-rest resources', () => {
    const updated = rechargeResources(makeResources(), 'short');
    expect(updated.find((r) => r.id === 'second_wind')!.current).toBe(1);
    expect(updated.find((r) => r.id === 'rage')!.current).toBe(1); // not recharged
    expect(updated.find((r) => r.id === 'arcane_recovery')!.current).toBe(0); // not recharged
  });

  it('long rest recharges both short and long rest resources', () => {
    const updated = rechargeResources(makeResources(), 'long');
    expect(updated.find((r) => r.id === 'second_wind')!.current).toBe(1);
    expect(updated.find((r) => r.id === 'rage')!.current).toBe(3);
    expect(updated.find((r) => r.id === 'arcane_recovery')!.current).toBe(1);
  });

  it('does not mutate original array', () => {
    const original = makeResources();
    rechargeResources(original, 'long');
    expect(original[0].current).toBe(0);
  });

  it('dawn resources are not recharged by long rest', () => {
    const resources: ClassResource[] = [
      { id: 'some_dawn_resource', name: 'Dawn Resource', className: 'test', max: 1, current: 0, recharge: 'dawn' },
    ];
    const updated = rechargeResources(resources, 'long');
    expect(updated[0].current).toBe(0);
  });
});
