import type { SessionSummary, SessionLogEntry } from '@local-dungeon/shared';
import {
  buildSessionSummary,
  exportAsText,
  exportAsMarkdown,
  exportAsJson,
} from '@local-dungeon/shared';
import type { GameLogService } from './GameLogService.js';
import type { GameLogEntryType } from '@local-dungeon/shared';

type SessionLogType = SessionLogEntry['type'];

const TYPE_MAP: Partial<Record<GameLogEntryType, SessionLogType>> = {
  dice_roll: 'dice',
  chat: 'chat',
  condition_added: 'combat',
  condition_removed: 'combat',
  hp_change: 'combat',
  concentration_check: 'combat',
  death_save: 'combat',
  session_join: 'system',
  session_leave: 'system',
  system: 'system',
};

interface SessionLogExportServiceDeps {
  gameLogService: GameLogService;
}

export class SessionLogExportService {
  private gameLogService: GameLogService;

  constructor({ gameLogService }: SessionLogExportServiceDeps) {
    this.gameLogService = gameLogService;
  }

  private async getEntries(sessionId: string): Promise<SessionLogEntry[]> {
    const events = await this.gameLogService.listEvents(sessionId, { limit: 1000 });
    return events.map((e) => {
      const type: SessionLogType = TYPE_MAP[e.type as GameLogEntryType] ?? 'system';
      const metadata: Record<string, unknown> = { ...e.payload };

      if (e.type === 'dice_roll') {
        const roll = e.payload.total ?? e.payload.result;
        if (typeof roll === 'number') metadata.roll = roll;
      }

      if (e.type === 'death_save') {
        metadata.deathSave = true;
        if (e.payload.success === true) metadata.success = true;
        if (e.payload.failure === true) metadata.failure = true;
      }

      return {
        timestamp: new Date(e.timestamp).getTime(),
        type,
        actor: e.actorName,
        message: typeof e.payload.message === 'string' ? e.payload.message : `${e.type} event`,
        metadata,
      } satisfies SessionLogEntry;
    });
  }

  async buildExport(sessionId: string, characterNames: string[]): Promise<SessionSummary> {
    const entries = await this.getEntries(sessionId);
    return buildSessionSummary(sessionId, entries, characterNames);
  }

  async exportText(sessionId: string, characterNames: string[]): Promise<string> {
    const summary = await this.buildExport(sessionId, characterNames);
    return exportAsText(summary);
  }

  async exportMarkdown(sessionId: string, characterNames: string[]): Promise<string> {
    const summary = await this.buildExport(sessionId, characterNames);
    return exportAsMarkdown(summary);
  }

  async exportJson(sessionId: string, characterNames: string[]): Promise<string> {
    const summary = await this.buildExport(sessionId, characterNames);
    return exportAsJson(summary);
  }
}
