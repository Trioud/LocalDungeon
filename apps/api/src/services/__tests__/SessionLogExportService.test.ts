import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionLogExportService } from '../SessionLogExportService.js';
import type { GameLogService } from '../GameLogService.js';
import type { GameLogEntry } from '@local-dungeon/shared';

function makeEntry(overrides: Partial<GameLogEntry> = {}): GameLogEntry {
  return {
    id: 'e-1',
    sessionId: 'session-1',
    type: 'chat',
    actorName: 'Aragorn',
    payload: { message: 'Hello!' },
    timestamp: new Date('2024-01-01T12:00:00Z').toISOString(),
    isPrivate: false,
    ...overrides,
  };
}

function makeGameLogService(entries: GameLogEntry[] = []): GameLogService {
  return {
    listEvents: vi.fn().mockResolvedValue(entries),
    logEvent: vi.fn(),
  } as unknown as GameLogService;
}

describe('SessionLogExportService', () => {
  let service: SessionLogExportService;
  let gameLogService: GameLogService;

  beforeEach(() => {
    gameLogService = makeGameLogService([makeEntry()]);
    service = new SessionLogExportService({ gameLogService });
  });

  it('calls gameLogService.listEvents with the correct sessionId', async () => {
    await service.buildExport('session-1', []);
    expect(gameLogService.listEvents).toHaveBeenCalledWith('session-1', { limit: 1000 });
  });

  it('buildExport returns a SessionSummary with correct sessionId', async () => {
    const summary = await service.buildExport('session-1', ['Aragorn']);
    expect(summary.sessionId).toBe('session-1');
    expect(summary.characterNames).toEqual(['Aragorn']);
  });

  it('maps chat entries to type "chat"', async () => {
    const summary = await service.buildExport('session-1', []);
    expect(summary.entries[0].type).toBe('chat');
  });

  it('maps dice_roll entries to type "dice"', async () => {
    gameLogService = makeGameLogService([
      makeEntry({ type: 'dice_roll', payload: { total: 20, message: 'Attack roll' } }),
    ]);
    service = new SessionLogExportService({ gameLogService });
    const summary = await service.buildExport('session-1', []);
    expect(summary.entries[0].type).toBe('dice');
  });

  it('maps death_save entries with deathSave metadata', async () => {
    gameLogService = makeGameLogService([
      makeEntry({ type: 'death_save', payload: { success: true, message: 'Death save!' } }),
    ]);
    service = new SessionLogExportService({ gameLogService });
    const summary = await service.buildExport('session-1', []);
    expect(summary.entries[0].metadata?.deathSave).toBe(true);
    expect(summary.entries[0].metadata?.success).toBe(true);
  });

  it('exportText returns a non-empty string', async () => {
    const text = await service.exportText('session-1', ['Aragorn']);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('session-1');
  });

  it('exportMarkdown returns markdown with ## heading', async () => {
    const md = await service.exportMarkdown('session-1', []);
    expect(md).toMatch(/^## Session Log/);
  });

  it('exportJson returns valid JSON with sessionId', async () => {
    const json = await service.exportJson('session-1', []);
    const parsed = JSON.parse(json) as { sessionId: string };
    expect(parsed.sessionId).toBe('session-1');
  });

  it('handles empty log gracefully', async () => {
    gameLogService = makeGameLogService([]);
    service = new SessionLogExportService({ gameLogService });
    const summary = await service.buildExport('session-1', []);
    expect(summary.entries).toHaveLength(0);
    expect(summary.totalRolls).toBe(0);
  });
});
