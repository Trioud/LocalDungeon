export type GameLogEntryType =
  | 'dice_roll'
  | 'chat'
  | 'condition_added'
  | 'condition_removed'
  | 'hp_change'
  | 'concentration_check'
  | 'death_save'
  | 'session_join'
  | 'session_leave'
  | 'system';

export interface GameLogEntry {
  id: string;
  sessionId: string;
  type: GameLogEntryType;
  actorId?: string;
  actorName?: string;
  payload: Record<string, unknown>;
  timestamp: string; // ISO
  isPrivate: boolean;
}
