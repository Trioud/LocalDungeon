import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSessionSummary,
  exportAsJson,
  exportAsMarkdown,
  exportAsText,
  formatEntryAsText,
} from './sessionlog';
import type { SessionLogEntry, SessionSummary } from './types';

function makeEntry(overrides: Partial<SessionLogEntry> = {}): SessionLogEntry {
  return {
    timestamp: Date.UTC(2024, 0, 1, 12, 0, 0),
    type: 'chat',
    actor: 'Aragorn',
    message: 'Hello, world!',
    ...overrides,
  };
}

function makeSummary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    sessionId: 'session-1',
    exportedAt: Date.UTC(2024, 0, 1, 15, 0, 0),
    characterNames: ['Aragorn', 'Legolas'],
    totalRolls: 5,
    criticalHits: 1,
    criticalMisses: 1,
    spellsCast: 2,
    deathSaves: { successes: 3, failures: 1 },
    longestCombat: 4,
    entries: [
      makeEntry({ type: 'dice', message: 'Rolled d20', metadata: { roll: 20 } }),
      makeEntry({ type: 'chat', message: 'Let us go!' }),
    ],
    ...overrides,
  };
}

describe('buildSessionSummary', () => {
  it('returns correct sessionId and characterNames', () => {
    const summary = buildSessionSummary('s-1', [], ['Hero']);
    expect(summary.sessionId).toBe('s-1');
    expect(summary.characterNames).toEqual(['Hero']);
  });

  it('sets exportedAt to a recent timestamp', () => {
    const before = Date.now();
    const summary = buildSessionSummary('s-1', [], []);
    const after = Date.now();
    expect(summary.exportedAt).toBeGreaterThanOrEqual(before);
    expect(summary.exportedAt).toBeLessThanOrEqual(after);
  });

  it('returns zero stats for empty entries', () => {
    const summary = buildSessionSummary('s-1', [], []);
    expect(summary.totalRolls).toBe(0);
    expect(summary.criticalHits).toBe(0);
    expect(summary.criticalMisses).toBe(0);
    expect(summary.spellsCast).toBe(0);
    expect(summary.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(summary.longestCombat).toBe(0);
  });

  it('counts totalRolls from dice entries', () => {
    const entries = [
      makeEntry({ type: 'dice' }),
      makeEntry({ type: 'dice' }),
      makeEntry({ type: 'chat' }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.totalRolls).toBe(2);
  });

  it('counts criticalHits from dice entries with roll === 20', () => {
    const entries = [
      makeEntry({ type: 'dice', metadata: { roll: 20 } }),
      makeEntry({ type: 'dice', metadata: { roll: 15 } }),
      makeEntry({ type: 'dice', metadata: { roll: 20 } }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.criticalHits).toBe(2);
  });

  it('counts criticalMisses from dice entries with roll === 1', () => {
    const entries = [
      makeEntry({ type: 'dice', metadata: { roll: 1 } }),
      makeEntry({ type: 'dice', metadata: { roll: 10 } }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.criticalMisses).toBe(1);
  });

  it('counts spellsCast from spell entries', () => {
    const entries = [
      makeEntry({ type: 'spell' }),
      makeEntry({ type: 'spell' }),
      makeEntry({ type: 'dice' }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.spellsCast).toBe(2);
  });

  it('counts deathSave successes', () => {
    const entries = [
      makeEntry({ type: 'combat', metadata: { deathSave: true, success: true } }),
      makeEntry({ type: 'combat', metadata: { deathSave: true, success: true } }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.deathSaves.successes).toBe(2);
  });

  it('counts deathSave failures', () => {
    const entries = [
      makeEntry({ type: 'combat', metadata: { deathSave: true, failure: true } }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.deathSaves.failures).toBe(1);
  });

  it('does not count non-deathSave combat entries toward death saves', () => {
    const entries = [
      makeEntry({ type: 'combat', metadata: { deathSave: false } }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.deathSaves.successes).toBe(0);
    expect(summary.deathSaves.failures).toBe(0);
  });

  it('computes longestCombat from consecutive combat entries', () => {
    const entries = [
      makeEntry({ type: 'combat' }),
      makeEntry({ type: 'combat' }),
      makeEntry({ type: 'combat' }),
      makeEntry({ type: 'chat' }),
      makeEntry({ type: 'combat' }),
      makeEntry({ type: 'combat' }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.longestCombat).toBe(3);
  });

  it('handles single-entry combat sequences', () => {
    const entries = [
      makeEntry({ type: 'chat' }),
      makeEntry({ type: 'combat' }),
      makeEntry({ type: 'chat' }),
    ];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.longestCombat).toBe(1);
  });

  it('includes all entries in summary', () => {
    const entries = [makeEntry(), makeEntry({ type: 'dice' })];
    const summary = buildSessionSummary('s-1', entries, []);
    expect(summary.entries).toHaveLength(2);
  });
});

describe('formatEntryAsText', () => {
  it('formats a chat entry with actor', () => {
    const entry = makeEntry({
      timestamp: Date.UTC(2024, 0, 1, 9, 5, 3),
      actor: 'Legolas',
      message: 'I will take the fellowship!',
    });
    expect(formatEntryAsText(entry)).toBe('[09:05:03] Legolas: I will take the fellowship!');
  });

  it('uses "System" when actor is undefined', () => {
    const entry = makeEntry({ actor: undefined, message: 'Session started' });
    expect(formatEntryAsText(entry)).toContain('System: Session started');
  });

  it('pads hours, minutes, seconds with leading zeros', () => {
    const entry = makeEntry({ timestamp: Date.UTC(2024, 0, 1, 1, 2, 3), actor: 'X', message: 'y' });
    expect(formatEntryAsText(entry)).toMatch(/\[01:02:03\]/);
  });
});

describe('exportAsText', () => {
  let summary: SessionSummary;

  beforeEach(() => {
    summary = makeSummary();
  });

  it('contains sessionId', () => {
    expect(exportAsText(summary)).toContain('session-1');
  });

  it('contains character names', () => {
    const text = exportAsText(summary);
    expect(text).toContain('Aragorn');
    expect(text).toContain('Legolas');
  });

  it('contains stat labels', () => {
    const text = exportAsText(summary);
    expect(text).toContain('Total Rolls');
    expect(text).toContain('Critical Hits');
    expect(text).toContain('Spells Cast');
    expect(text).toContain('Death Saves');
    expect(text).toContain('Longest Combat');
  });

  it('contains entry messages', () => {
    const text = exportAsText(summary);
    expect(text).toContain('Rolled d20');
    expect(text).toContain('Let us go!');
  });
});

describe('exportAsMarkdown', () => {
  let summary: SessionSummary;

  beforeEach(() => {
    summary = makeSummary();
  });

  it('starts with a ## heading', () => {
    expect(exportAsMarkdown(summary)).toMatch(/^## Session Log/);
  });

  it('contains a stats table with pipe separators', () => {
    const md = exportAsMarkdown(summary);
    expect(md).toContain('| Total Rolls |');
    expect(md).toContain('| Critical Hits |');
  });

  it('lists entries as bullet points', () => {
    const md = exportAsMarkdown(summary);
    expect(md).toContain('- [');
  });

  it('contains character names', () => {
    const md = exportAsMarkdown(summary);
    expect(md).toContain('Aragorn');
  });
});

describe('exportAsJson', () => {
  it('returns valid JSON', () => {
    const summary = makeSummary();
    expect(() => JSON.parse(exportAsJson(summary))).not.toThrow();
  });

  it('round-trips the summary data', () => {
    const summary = makeSummary();
    const parsed = JSON.parse(exportAsJson(summary)) as SessionSummary;
    expect(parsed.sessionId).toBe(summary.sessionId);
    expect(parsed.totalRolls).toBe(summary.totalRolls);
    expect(parsed.entries).toHaveLength(summary.entries.length);
  });

  it('uses 2-space indentation', () => {
    const summary = makeSummary({ entries: [] });
    const json = exportAsJson(summary);
    expect(json).toContain('  "sessionId"');
  });
});
