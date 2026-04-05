'use client';
import { useState } from 'react';
import type { SessionLogEntry } from '@local-dungeon/shared';

const TYPE_COLORS: Record<SessionLogEntry['type'], string> = {
  dice: 'text-blue-600',
  chat: 'text-gray-600',
  combat: 'text-red-600',
  spell: 'text-purple-600',
  rest: 'text-green-600',
  levelup: 'text-yellow-600',
  system: 'text-white',
};

const TYPE_BG: Record<SessionLogEntry['type'], string> = {
  dice: 'bg-blue-50',
  chat: 'bg-gray-50',
  combat: 'bg-red-50',
  spell: 'bg-purple-50',
  rest: 'bg-green-50',
  levelup: 'bg-yellow-50',
  system: 'bg-gray-800',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

interface LogViewerProps {
  entries: SessionLogEntry[];
}

export default function LogViewer({ entries }: LogViewerProps) {
  const [filter, setFilter] = useState('');

  const filtered = filter.trim()
    ? entries.filter(
        (e) =>
          e.message.toLowerCase().includes(filter.toLowerCase()) ||
          (e.actor ?? '').toLowerCase().includes(filter.toLowerCase()),
      )
    : entries;

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <input
          type="text"
          placeholder="Filter entries…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <ul className="overflow-y-auto flex-1 divide-y divide-gray-100">
        {filtered.map((entry, idx) => (
          <li
            key={idx}
            className={`px-4 py-2 text-sm ${TYPE_BG[entry.type]}`}
          >
            <span className="text-gray-400 text-xs mr-2">[{formatTime(entry.timestamp)}]</span>
            {entry.actor && (
              <span className={`font-semibold mr-1 ${TYPE_COLORS[entry.type]}`}>{entry.actor}:</span>
            )}
            <span className={TYPE_COLORS[entry.type]}>{entry.message}</span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400 text-sm">No entries found.</li>
        )}
      </ul>
    </div>
  );
}
