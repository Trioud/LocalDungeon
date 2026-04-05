export interface SessionSummary {
  sessionId: string;
  exportedAt: number;
  characterNames: string[];
  totalRolls: number;
  criticalHits: number;
  criticalMisses: number;
  spellsCast: number;
  deathSaves: { successes: number; failures: number };
  longestCombat: number;
  entries: SessionLogEntry[];
}

export interface SessionLogEntry {
  timestamp: number;
  type: 'dice' | 'chat' | 'combat' | 'spell' | 'rest' | 'levelup' | 'system';
  actor?: string;
  message: string;
  metadata?: Record<string, unknown>;
}
