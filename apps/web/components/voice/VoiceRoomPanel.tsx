'use client';
import type { PeerState } from '@local-dungeon/shared';

interface VoiceRoomPanelProps {
  isSupported: boolean;
  isInVoice: boolean;
  isMuted: boolean;
  peers: Map<string, PeerState>;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onSetVolume: (socketId: string, vol: number) => void;
}

function SpeakingIndicator({ speaking }: { speaking: boolean }) {
  return (
    <span
      aria-label={speaking ? 'Speaking' : 'Silent'}
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${speaking ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}
    />
  );
}

export default function VoiceRoomPanel({
  isSupported,
  isInVoice,
  isMuted,
  peers,
  onJoin,
  onLeave,
  onToggleMute,
  onSetVolume,
}: VoiceRoomPanelProps) {
  if (!isSupported) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 text-center">
        Voice chat unavailable — using speech-to-text only
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={isInVoice ? onLeave : onJoin}
          className={`flex-1 text-xs py-1.5 px-3 rounded-lg font-medium transition-colors ${
            isInVoice
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          {isInVoice ? 'Leave Voice' : 'Join Voice'}
        </button>
        {isInVoice && (
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>
        )}
      </div>

      {isInVoice && peers.size === 0 && (
        <p className="text-xs text-gray-400 text-center">Waiting for others to join…</p>
      )}

      {isInVoice && peers.size > 0 && (
        <ul className="space-y-1.5">
          {Array.from(peers.values()).map((peer) => (
            <li key={peer.socketId} className="flex items-center gap-2 text-xs">
              <SpeakingIndicator speaking={peer.speaking} />
              <span className="flex-1 truncate font-medium text-gray-700">{peer.characterName}</span>
              {peer.muted && <span aria-label="Muted" title="Muted" className="text-gray-400">🔇</span>}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={peer.volume}
                aria-label={`Volume for ${peer.characterName}`}
                onChange={(e) => onSetVolume(peer.socketId, parseFloat(e.target.value))}
                className="w-16 h-1 accent-indigo-500 cursor-pointer"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
