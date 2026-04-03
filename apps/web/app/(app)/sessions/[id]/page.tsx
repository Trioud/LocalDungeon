'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSessionInfo, useLeaveSession } from '../../../../lib/hooks/useSession.js';
import { useSessionSocket } from '../../../../lib/hooks/useSessionSocket.js';
import { useAuthStore } from '../../../../lib/stores/authStore.js';
import PlayerList from '../../../../components/session/PlayerList.js';

function PhaseBadge({ phase }: { phase: string }) {
  if (phase === 'combat') return <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">⚔️ Combat</span>;
  if (phase === 'social') return <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">💬 Social</span>;
  return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">🧭 Exploration</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'lobby') return <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Lobby</span>;
  if (status === 'active') return <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">Active</span>;
  return <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">Ended</span>;
}

function PhaseContent({ phase }: { phase: string }) {
  if (phase === 'combat') {
    return (
      <div className="flex-1 flex items-center justify-center bg-red-50 rounded-xl border-2 border-dashed border-red-200 p-12 text-center">
        <div>
          <p className="text-4xl mb-3">⚔️</p>
          <h2 className="text-xl font-bold text-red-800">Combat Phase</h2>
          <p className="text-red-600 mt-2">Combat system coming in Phase 11</p>
        </div>
      </div>
    );
  }
  if (phase === 'social') {
    return (
      <div className="flex-1 flex items-center justify-center bg-blue-50 rounded-xl border-2 border-dashed border-blue-200 p-12 text-center">
        <div>
          <p className="text-4xl mb-3">💬</p>
          <h2 className="text-xl font-bold text-blue-800">Social Phase</h2>
          <p className="text-blue-600 mt-2">Social interaction system coming soon</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex items-center justify-center bg-green-50 rounded-xl border-2 border-dashed border-green-200 p-12 text-center">
      <div>
        <p className="text-4xl mb-3">🧭</p>
        <h2 className="text-xl font-bold text-green-800">Exploration Phase</h2>
        <p className="text-green-600 mt-2">Explore the world and discover new adventures</p>
      </div>
    </div>
  );
}

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session, isLoading } = useSessionInfo(id);
  const { connectedUserIds } = useSessionSocket(id);
  const leaveSession = useLeaveSession();
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/2" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 text-center text-gray-500">
        Session not found.
      </div>
    );
  }

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/sessions/${session.id}?invite=${session.inviteCode}`
    : `/sessions/${session.id}?invite=${session.inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    await leaveSession.mutateAsync(id);
    router.push('/sessions');
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold flex-1 min-w-0 truncate">{session.name}</h1>
        <PhaseBadge phase={session.phase} />
        <StatusBadge status={session.status} />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Invite:</span>
          <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{session.inviteCode}</code>
          <button
            onClick={handleCopy}
            className="text-xs py-1 px-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <button
          onClick={handleLeave}
          disabled={leaveSession.isPending}
          className="py-1.5 px-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
        >
          Leave Session
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Game content */}
        <div className="flex-1 flex flex-col gap-4">
          {session.status === 'lobby' ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center space-y-4">
              <p className="text-4xl">⏳</p>
              <h2 className="text-xl font-semibold text-gray-700">Waiting for players...</h2>
              <p className="text-sm text-gray-500">Share the invite code to bring your party together.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <button
                  disabled
                  title="Coming in Phase 11"
                  className="py-2 px-6 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  Start Combat (Phase 11)
                </button>
                <button className="py-2 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Ready
                </button>
              </div>
            </div>
          ) : (
            <PhaseContent phase={session.phase} />
          )}
        </div>

        {/* Player sidebar */}
        <aside className="w-full lg:w-72 bg-white rounded-xl shadow border border-gray-200 p-4">
          <PlayerList
            players={session.players}
            currentUserId={user?.id ?? ''}
            maxPlayers={session.maxPlayers}
            connectedUserIds={connectedUserIds}
          />
        </aside>
      </div>
    </div>
  );
}
