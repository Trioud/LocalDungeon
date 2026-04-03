'use client';
import type { SessionPlayerInfo } from '../../lib/api/sessions.js';

interface PlayerListProps {
  players: SessionPlayerInfo[];
  currentUserId: string;
  maxPlayers: number;
  connectedUserIds: string[];
}

export default function PlayerList({ players, currentUserId, maxPlayers, connectedUserIds }: PlayerListProps) {
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">
        Players ({players.length}/{maxPlayers})
      </h3>
      {players.map((player) => {
        const isCurrentUser = player.userId === currentUserId;
        const isConnected = connectedUserIds.includes(player.userId) || player.isConnected;
        return (
          <div
            key={player.id}
            className={`relative rounded-lg border p-3 flex items-center gap-3 ${
              isCurrentUser ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
            } ${!isConnected ? 'opacity-50' : ''}`}
          >
            <div className="relative flex-shrink-0">
              {player.portraitUrl ? (
                <img
                  src={player.portraitUrl}
                  alt={player.characterName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                  {player.characterName.charAt(0)}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
                title={isConnected ? 'Connected' : 'Disconnected'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{player.username}</p>
              <p className="text-xs text-gray-500 truncate">{player.characterName}</p>
              <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 mt-0.5">
                {player.characterClass} Lv.{player.characterLevel}
              </span>
            </div>
            <div className="flex-shrink-0">
              {player.isReady ? (
                <span title="Ready" className="text-green-500 text-lg">✅</span>
              ) : (
                <span title="Not Ready" className="text-gray-400 text-lg">⬜</span>
              )}
            </div>
          </div>
        );
      })}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="rounded-lg border border-dashed border-gray-300 p-3 flex items-center gap-3 text-gray-400"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-xl">+</span>
          </div>
          <span className="text-sm">Empty Slot</span>
        </div>
      ))}
    </div>
  );
}
