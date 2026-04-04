import type { GameLogEntry, GameLogEntryType } from '@local-dungeon/shared';
import { formatLogEntry } from '@local-dungeon/shared';

interface GameLogEntryProps {
  entry: GameLogEntry;
}

function getTypeStyles(type: GameLogEntryType, delta?: number): string {
  switch (type) {
    case 'dice_roll':
      return 'text-blue-700 bg-blue-50';
    case 'chat':
      return 'text-gray-800 bg-white';
    case 'session_join':
    case 'session_leave':
      return 'text-gray-400 italic bg-transparent';
    case 'death_save':
      return 'text-red-700 bg-red-50';
    case 'hp_change':
      return typeof delta === 'number' && delta >= 0
        ? 'text-green-700 bg-green-50'
        : 'text-red-700 bg-red-50';
    case 'system':
      return 'text-yellow-700 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function GameLogEntryComponent({ entry }: GameLogEntryProps) {
  const delta = typeof entry.payload.delta === 'number' ? entry.payload.delta : undefined;
  const typeStyles = getTypeStyles(entry.type, delta);
  const narrative = formatLogEntry(entry);

  return (
    <div
      className={`px-3 py-1.5 rounded text-sm flex items-start gap-2 ${typeStyles} ${
        entry.isPrivate ? 'opacity-70' : ''
      }`}
    >
      <span className="shrink-0 text-xs text-gray-400 mt-0.5 w-12 text-right">
        {formatRelativeTime(entry.timestamp)}
      </span>
      <span className="flex-1 min-w-0 break-words">
        {entry.isPrivate && (
          <span className="mr-1 text-gray-400" title="Private">
            🔒
          </span>
        )}
        {narrative}
      </span>
    </div>
  );
}
