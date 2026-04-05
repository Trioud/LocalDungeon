'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSessionList, useJoinSession } from '@/lib/hooks/useSession';
import { useCharacterList } from '@/lib/hooks/useCharacter';
import type { SessionSummary } from '@/lib/api/sessions';

function StatusBadge({ status }: { status: string }) {
  if (status === 'lobby') return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">🟢 Lobby</span>;
  if (status === 'active') return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">🔵 Active</span>;
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">⚫ Ended</span>;
}

function SessionCard({ session, onJoin }: { session: SessionSummary; onJoin: (session: SessionSummary) => void }) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/sessions/${session.id}`} className="font-semibold text-lg hover:text-indigo-600 transition-colors">
          {session.name}
        </Link>
        <StatusBadge status={session.status} />
      </div>
      <p className="text-sm text-gray-500">
        Players: {session.playerCount} / {session.maxPlayers}
      </p>
      <p className="text-xs text-gray-400">
        Created {new Date(session.createdAt).toLocaleDateString()}
      </p>
      {session.status === 'lobby' && (
        <button
          onClick={() => onJoin(session)}
          className="mt-auto w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Join
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-5 animate-pulse space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-9 bg-gray-200 rounded" />
    </div>
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessionList();
  const { data: characters } = useCharacterList();
  const joinSession = useJoinSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [joiningSession, setJoiningSession] = useState<SessionSummary | null>(null);
  // Pre-select character coming from "Bring to Session" on dashboard
  const [preselectedCharId] = useState<string | null>(searchParams.get('characterId'));

  function handleJoin(session: SessionSummary) {
    setJoiningSession(session);
  }

  // If a characterId was passed and there's exactly one open session, auto-open the modal
  useEffect(() => {
    if (preselectedCharId && sessions && sessions.length === 1 && sessions[0].status === 'lobby') {
      setJoiningSession(sessions[0]);
    }
  }, [preselectedCharId, sessions]);

  async function handleSelectCharacter(characterId: string) {
    if (!joiningSession) return;
    await joinSession.mutateAsync({ id: joiningSession.id, characterId });
    setJoiningSession(null);
    router.push(`/sessions/${joiningSession.id}`);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Game Sessions</h1>
        <Link
          href="/sessions/new"
          className="py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Create New Session
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No sessions yet. Create the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onJoin={handleJoin} />
          ))}
        </div>
      )}

      {/* Character select modal */}
      {joiningSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Select a Character</h2>
            <p className="text-sm text-gray-500 mb-4">
              Joining: <strong>{joiningSession.name}</strong>
            </p>
            {!characters || characters.length === 0 ? (
              <p className="text-gray-500 text-sm">No characters found. Create a character first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => handleSelectCharacter(character.id)}
                    disabled={joinSession.isPending}
                    className={`w-full text-left p-3 rounded-lg border transition-colors
                      ${character.id === preselectedCharId
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                        : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'}
                    `}
                  >
                    <p className="font-medium">{character.name}</p>
                    <p className="text-xs text-gray-500">{character.className} · Level {character.level}</p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setJoiningSession(null)}
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
