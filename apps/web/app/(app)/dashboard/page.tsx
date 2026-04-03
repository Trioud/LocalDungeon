'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { listCharacters } from '@/lib/api/characters';

interface Character {
  id: string;
  name: string;
  className: string;
  level: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: characters, isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: listCharacters,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">
            Welcome, {user?.username ?? 'Adventurer'}!
          </h1>
          <p className="text-gray-400 mt-1">Your adventures await.</p>
        </div>
        <Link
          href="/characters/new"
          className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors flex items-center gap-2"
        >
          ⚔️ Create New Character
        </Link>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Your Characters</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : characters && characters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char: Character) => (
            <Link
              key={char.id}
              href={`/characters/${char.id}`}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-400/50 transition-colors group"
            >
              <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors">{char.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{char.className} • Level {char.level}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-4xl mb-4">🧙</div>
          <p className="text-gray-400 mb-4">No characters yet. Start your adventure!</p>
          <Link
            href="/characters/new"
            className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors"
          >
            Create Your First Character
          </Link>
        </div>
      )}
    </div>
  );
}
