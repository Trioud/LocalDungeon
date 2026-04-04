'use client';
import { useEffect, useRef, useState } from 'react';
import type { GameLogEntryType } from '@local-dungeon/shared';
import { useGameLog } from '@/lib/hooks/useGameLog';
import GameLogEntryComponent from './GameLogEntry';

type FilterType = 'all' | 'dice' | 'chat' | 'system';

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Dice', value: 'dice' },
  { label: 'Chat', value: 'chat' },
  { label: 'System', value: 'system' },
];

function matchesFilter(type: GameLogEntryType, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'dice') return type === 'dice_roll';
  if (filter === 'chat') return type === 'chat';
  if (filter === 'system')
    return ['system', 'session_join', 'session_leave', 'hp_change', 'condition_added',
      'condition_removed', 'concentration_check', 'death_save'].includes(type);
  return true;
}

interface GameLogProps {
  sessionId: string;
  characterName?: string;
}

export default function GameLog({ sessionId, characterName }: GameLogProps) {
  const { entries, isLoading, sendChat, loadMore, hasMore } = useGameLog(sessionId);
  const [filter, setFilter] = useState<FilterType>('all');
  const [chatInput, setChatInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const filtered = entries.filter((e) => matchesFilter(e.type, filter));

  useEffect(() => {
    if (entries.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = entries.length;
  }, [entries.length]);

  function handleSend() {
    const msg = chatInput.trim();
    if (!msg) return;
    sendChat(msg, characterName);
    setChatInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend();
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow border border-gray-200 h-full min-h-0">
      {/* Header + filter */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-700">Game Log</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="text-xs border border-gray-200 rounded px-2 py-1"
          aria-label="Filter log"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0 p-2 gap-0.5">
        {hasMore && (
          <button
            onClick={loadMore}
            className="text-xs text-indigo-600 hover:underline self-center py-1"
          >
            Load older messages
          </button>
        )}

        {isLoading && (
          <div className="text-center text-gray-400 text-sm py-4">Loading log…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-4">No events yet.</div>
        )}

        {/* Reversed: newest at bottom */}
        {[...filtered].reverse().map((entry) => (
          <GameLogEntryComponent key={entry.id} entry={entry} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div className="flex gap-2 px-3 py-2 border-t border-gray-100">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          maxLength={500}
          className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          onClick={handleSend}
          disabled={!chatInput.trim()}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
