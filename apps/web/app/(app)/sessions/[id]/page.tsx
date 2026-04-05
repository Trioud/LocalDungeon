'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRef } from 'react';
import { useSessionInfo, useLeaveSession, useStartSession } from '@/lib/hooks/useSession';
import { useSessionSocket } from '@/lib/hooks/useSessionSocket';
import { useDiceRoller } from '@/lib/hooks/useDiceRoller';
import { useCombat } from '@/lib/hooks/useCombat';
import { useVoice } from '@/lib/hooks/useVoice';
import { useAuthStore } from '@/lib/stores/authStore';
import PlayerList from '@/components/session/PlayerList';
import AIDMPanel from '@/components/session/AIDMPanel';
import DiceRoller from '@/components/dice/DiceRoller';
import GameLog from '@/components/gamelog/GameLog';
import CombatTracker from '@/components/combat/CombatTracker';
import VoiceButton from '@/components/voice/VoiceButton';
import TranscriptPanel from '@/components/voice/TranscriptPanel';
import VoiceRoomPanel from '@/components/voice/VoiceRoomPanel';
import AudioPlayer from '@/components/voice/AudioPlayer';

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

function StartCombatButton({ sessionId }: { sessionId: string }) {
  const { startCombat, combatState } = useCombat(sessionId);
  if (combatState?.isActive) return <span className="text-xs text-red-600 font-medium">⚔️ Combat is active</span>;
  return (
    <button
      onClick={startCombat}
      className="text-xs bg-red-500 hover:bg-red-400 text-white font-medium px-3 py-1 rounded transition-colors"
    >
      Enter Combat ⚔️
    </button>
  );
}

function PhaseContent({ phase, sessionId, onScrollToDice }: { phase: string; sessionId: string; onScrollToDice: () => void }) {
  const [tab, setTab] = useState<'guide' | 'ai-dm'>('ai-dm');

  if (phase === 'combat') {
    return <CombatTracker sessionId={sessionId} />;
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
    <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-gray-200 shadow bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setTab('ai-dm')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'ai-dm' ? 'border-b-2 border-amber-500 text-amber-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🤖 AI Dungeon Master
        </button>
        <button
          onClick={() => setTab('guide')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'guide' ? 'border-b-2 border-indigo-500 text-indigo-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🧭 Quick Guide
        </button>
      </div>

      {/* Tab content */}
      {tab === 'ai-dm' ? (
        <div className="h-[480px]">
          <AIDMPanel sessionId={sessionId} />
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">🧭 Exploration — What can you do?</h2>
            <p className="text-sm text-gray-500">Use the tools below to play. Here's a quick guide:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-semibold text-yellow-800 mb-1">🎲 Roll Dice</p>
              <p className="text-xs text-yellow-700 mb-2">Click any die button in the <strong>Dice Roller</strong> panel below to roll. Results are broadcast to all players in the session log.</p>
              <button
                onClick={onScrollToDice}
                className="text-xs bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-medium px-3 py-1 rounded transition-colors"
              >
                Jump to Dice Roller ↓
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-800 mb-1">⚔️ Start Combat</p>
              <p className="text-xs text-red-700 mb-2">Encountered enemies? Switch to Combat Tracker to manage initiative, HP, and turns.</p>
              <StartCombatButton sessionId={sessionId} />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-800 mb-1">💬 Chat & Narrate</p>
              <p className="text-xs text-blue-700">Type in the <strong>Game Log</strong> below to send messages. Use the 🎤 Voice button to dictate.</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-800 mb-1">👥 Players</p>
              <p className="text-xs text-green-700">See who's connected in the sidebar. Share the <strong>invite code</strong> at the top to let others join.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const diceRef = useRef<HTMLDivElement>(null);
  const { data: session, isLoading } = useSessionInfo(id);
  const { connectedUserIds } = useSessionSocket(id);
  const { rolls, roll } = useDiceRoller(id);
  const leaveSession = useLeaveSession();
  const startSession = useStartSession();
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const voice = useVoice({
    sessionId: id,
    speakerCharacterId: '',
    speakerName: user?.username ?? '',
  });

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
              <h2 className="text-xl font-semibold text-gray-700">
                {session.players.length === 0
                  ? 'Join with a character to start'
                  : session.players.length === 1
                  ? 'Ready to adventure!'
                  : 'Waiting for players...'}
              </h2>
              <p className="text-sm text-gray-500">
                {session.players.length > 0
                  ? `${session.players.length} / ${session.maxPlayers} player${session.players.length > 1 ? 's' : ''} joined`
                  : 'Share the invite code to bring your party together.'}
              </p>
              {session.createdById === user?.id && (
                <button
                  onClick={() => startSession.mutate(id)}
                  disabled={session.players.length === 0 || startSession.isPending}
                  className="py-2 px-8 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {startSession.isPending ? 'Starting...' : '▶ Start Session'}
                </button>
              )}
            </div>
          ) : (
            <PhaseContent phase={session.phase} sessionId={id} onScrollToDice={() => diceRef.current?.scrollIntoView({ behavior: 'smooth' })} />
          )}

          {/* Dice Roller */}
          <div ref={diceRef}>
            <DiceRoller onRoll={roll} recentRolls={rolls} />
          </div>

          {/* Game Log */}
          <div className="h-80">
            <GameLog
              sessionId={id}
              characterName={session.players.find((p) => p.userId === user?.id)?.characterName}
            />
          </div>
        </div>

        {/* Player sidebar */}
        <aside className="w-full lg:w-72 bg-white rounded-xl shadow border border-gray-200 p-4">
          <PlayerList
            players={session.players}
            currentUserId={user?.id ?? ''}
            maxPlayers={session.maxPlayers}
            connectedUserIds={connectedUserIds}
          />
          <div className="mt-4 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Voice</h4>
              <VoiceButton
                isListening={voice.isListening}
                isSupported={voice.isSupported}
                mode={voice.mode}
                onStart={voice.startListening}
                onStop={voice.stopListening}
                onModeToggle={() => voice.setMode(voice.mode === 'push_to_talk' ? 'continuous' : 'push_to_talk')}
              />
            </div>
            <VoiceRoomPanel
              isSupported={voice.webrtc.isSupported}
              isInVoice={voice.webrtc.isInVoice}
              isMuted={voice.webrtc.isMuted}
              peers={voice.webrtc.peers}
              onJoin={voice.webrtc.joinVoice}
              onLeave={voice.webrtc.leaveVoice}
              onToggleMute={voice.webrtc.toggleMute}
              onSetVolume={voice.webrtc.setPeerVolume}
            />
            <TranscriptPanel transcripts={voice.transcripts} />
            {voice.webrtc.isInVoice && (
              <AudioPlayer peers={voice.webrtc.peers} audioStreams={voice.webrtc.audioStreams} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
