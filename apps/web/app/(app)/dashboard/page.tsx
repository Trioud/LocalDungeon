'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCharacterList, useDeleteCharacter } from '@/lib/hooks/useCharacter';
import type { Character } from '@/lib/api/characters';
import CharacterAvatar from '@/components/portrait/CharacterAvatar';
function HPBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const color = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>HP</span>
        <span>{current}/{max}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-2">Delete {name}?</h3>
        <p className="text-gray-400 text-sm mb-6">This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: characters, isLoading } = useCharacterList();
  const { mutate: deleteChar } = useDeleteCharacter();
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void router;

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={() => {
            deleteChar(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Welcome, {user?.username ?? 'Adventurer'}!</h1>
          <p className="text-gray-400 mt-1">Your adventures await.</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Your Characters</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters && characters.length > 0 ? (
            characters.map((char: Character) => (
              <div key={char.id} className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-yellow-400/40 transition-colors flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <CharacterAvatar portraitUrl={char.portraitUrl} name={char.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/characters/${char.id}`} className="font-bold text-white hover:text-yellow-400 transition-colors block truncate">
                      {char.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded">{char.className} {char.level}</span>
                      {char.speciesName && <span className="text-xs text-gray-400">{char.speciesName}</span>}
                    </div>
                  </div>
                </div>
                <HPBar current={char.currentHP ?? char.maxHP ?? 0} max={char.maxHP ?? 0} />
                <div className="flex gap-2 mt-1">
                  <button
                    title="Coming in a future update"
                    disabled
                    className="flex-1 text-xs py-1.5 bg-gray-700 text-gray-500 rounded cursor-not-allowed border border-gray-600"
                  >
                    🎲 Bring to Session
                  </button>
                  <button
                    onClick={() => setDeleteTarget(char)}
                    className="text-xs py-1.5 px-3 bg-gray-700 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded border border-gray-600 transition-colors"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-4xl mb-4">🧙</div>
              <p className="text-gray-400 mb-4">No characters yet — create your first hero!</p>
              <Link href="/characters/new" className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors">
                Create Your First Character
              </Link>
            </div>
          )}
          <Link
            href="/characters/new"
            className="bg-gray-800 rounded-lg p-5 border border-dashed border-gray-600 hover:border-yellow-400/60 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-yellow-400 min-h-[120px]"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">Create New Character</span>
          </Link>
        </div>
      )}
    </div>
  );
}
