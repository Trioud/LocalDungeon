'use client';

interface PlayerInspirationStatus {
  id: string;
  name: string;
  hasInspiration: boolean;
  portraitUrl?: string | null;
}

interface InspirationPanelProps {
  players: PlayerInspirationStatus[];
}

export default function InspirationPanel({ players }: InspirationPanelProps) {
  if (players.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Heroic Inspiration
      </h3>
      <ul className="space-y-1">
        {players.map((player) => (
          <li key={player.id} className="flex items-center gap-2">
            <span
              className={`text-sm ${player.hasInspiration ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-gray-300'}`}
              aria-label={player.hasInspiration ? 'Has Heroic Inspiration' : 'No Heroic Inspiration'}
            >
              ⭐
            </span>
            <span className={`text-sm ${player.hasInspiration ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {player.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
