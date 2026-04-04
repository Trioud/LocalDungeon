import { describe, it, expect } from 'vitest';
import { formatLogEntry } from './narrative';
import type { GameLogEntry } from './types';

function makeEntry(overrides: Partial<GameLogEntry>): GameLogEntry {
  return {
    id: 'test-id',
    sessionId: 'session-1',
    type: 'system',
    actorName: 'Gandalf',
    payload: {},
    timestamp: '2024-01-01T00:00:00.000Z',
    isPrivate: false,
    ...overrides,
  };
}

describe('formatLogEntry', () => {
  it('dice_roll — public roll', () => {
    const entry = makeEntry({
      type: 'dice_roll',
      payload: { notation: '2d6', rolls: [3, 4], total: 7 },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf rolled 2d6: 3, 4 = 7');
  });

  it('dice_roll — private roll', () => {
    const entry = makeEntry({
      type: 'dice_roll',
      isPrivate: true,
      payload: { notation: '1d20', rolls: [15], total: 15 },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf made a private roll');
  });

  it('chat', () => {
    const entry = makeEntry({
      type: 'chat',
      payload: { message: 'You shall not pass!' },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf: You shall not pass!');
  });

  it('condition_added', () => {
    const entry = makeEntry({
      type: 'condition_added',
      payload: { condition: 'Poisoned' },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf gained Poisoned');
  });

  it('condition_removed', () => {
    const entry = makeEntry({
      type: 'condition_removed',
      payload: { condition: 'Blinded' },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf lost Blinded');
  });

  it('hp_change', () => {
    const entry = makeEntry({
      type: 'hp_change',
      payload: { delta: -5, current: 25, max: 30 },
    });
    expect(formatLogEntry(entry)).toBe("Gandalf's HP changed by -5 (now 25/30)");
  });

  it('concentration_check — passed', () => {
    const entry = makeEntry({
      type: 'concentration_check',
      payload: { passed: true, dc: 12, roll: 14 },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf passed concentration check (DC 12, rolled 14)');
  });

  it('concentration_check — failed', () => {
    const entry = makeEntry({
      type: 'concentration_check',
      payload: { passed: false, dc: 15, roll: 8 },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf failed concentration check (DC 15, rolled 8)');
  });

  it('death_save — success', () => {
    const entry = makeEntry({
      type: 'death_save',
      payload: { success: true, roll: 12 },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf succeeded death saving throw (rolled 12)');
  });

  it('death_save — failure', () => {
    const entry = makeEntry({
      type: 'death_save',
      payload: { success: false, roll: 4 },
    });
    expect(formatLogEntry(entry)).toBe('Gandalf failed death saving throw (rolled 4)');
  });

  it('session_join', () => {
    const entry = makeEntry({ type: 'session_join' });
    expect(formatLogEntry(entry)).toBe('Gandalf joined the session');
  });

  it('session_leave', () => {
    const entry = makeEntry({ type: 'session_leave' });
    expect(formatLogEntry(entry)).toBe('Gandalf left the session');
  });

  it('system', () => {
    const entry = makeEntry({
      type: 'system',
      payload: { message: 'Session started.' },
    });
    expect(formatLogEntry(entry)).toBe('Session started.');
  });

  it('uses "Unknown" when actorName is missing', () => {
    const entry = makeEntry({ type: 'session_join', actorName: undefined });
    expect(formatLogEntry(entry)).toBe('Unknown joined the session');
  });
});
