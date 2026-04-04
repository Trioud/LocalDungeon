import type { GameLogEntry } from './types.js';

export function formatLogEntry(entry: GameLogEntry): string {
  const actor = entry.actorName ?? 'Unknown';
  const p = entry.payload;

  switch (entry.type) {
    case 'dice_roll':
      if (entry.isPrivate) return `${actor} made a private roll`;
      return `${actor} rolled ${p.notation ?? p.notationStr}: ${Array.isArray(p.rolls) ? (p.rolls as number[]).join(', ') : p.rolls} = ${p.total}`;

    case 'chat':
      return `${actor}: ${p.message}`;

    case 'condition_added':
      return `${actor} gained ${p.condition}`;

    case 'condition_removed':
      return `${actor} lost ${p.condition}`;

    case 'hp_change':
      return `${actor}'s HP changed by ${p.delta} (now ${p.current}/${p.max})`;

    case 'concentration_check': {
      const result = p.passed ? 'passed' : 'failed';
      return `${actor} ${result} concentration check (DC ${p.dc}, rolled ${p.roll})`;
    }

    case 'death_save': {
      const result = p.success ? 'succeeded' : 'failed';
      return `${actor} ${result} death saving throw (rolled ${p.roll})`;
    }

    case 'session_join':
      return `${actor} joined the session`;

    case 'session_leave':
      return `${actor} left the session`;

    case 'system':
      return String(p.message ?? '');

    default:
      return 'Unknown event';
  }
}
