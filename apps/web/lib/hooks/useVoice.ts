'use client';
import { useCallback, useEffect, useState } from 'react';
import type { VoiceTranscriptEvent, VoiceMode } from '@local-dungeon/shared';
import { useSocket } from './useSocket';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useWebRTC } from './useWebRTC';

interface UseVoiceProps {
  sessionId: string;
  speakerCharacterId: string;
  speakerName: string;
}

export function useVoice({ sessionId, speakerCharacterId, speakerName }: UseVoiceProps) {
  const { socket } = useSocket();
  const [mode, setMode] = useState<VoiceMode>('push_to_talk');
  const [transcripts, setTranscripts] = useState<VoiceTranscriptEvent[]>([]);
  const [speakingPlayers, setSpeakingPlayers] = useState<Set<string>>(new Set());

  const webrtc = useWebRTC({ characterName: speakerName });

  const handleTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      const event: VoiceTranscriptEvent = {
        sessionId,
        speakerCharacterId,
        speakerName,
        text,
        isFinal,
        timestamp: Date.now(),
      };
      setTranscripts((prev) => [...prev.slice(-99), event]);
      if (isFinal && text.trim() && socket) {
        socket.emit('game:chat', { message: `[Voice] ${text}`, sessionId });
      }
    },
    [sessionId, speakerCharacterId, speakerName, socket],
  );

  const { start: startRecognition, stop: stopRecognition, isListening, isSupported: sttSupported } = useSpeechRecognition({
    mode,
    onTranscript: handleTranscript,
  });

  useEffect(() => {
    if (!socket) return;

    const onTranscript = (data: { text: string; isFinal: boolean; confidence: number }) => {
      const event: VoiceTranscriptEvent = {
        sessionId,
        speakerCharacterId,
        speakerName,
        text: data.text,
        isFinal: data.isFinal,
        timestamp: Date.now(),
      };
      setTranscripts((prev) => [...prev.slice(-99), event]);
    };

    const onSpeaking = (data: { speakerSocketId: string; text: string }) => {
      setSpeakingPlayers((prev) => {
        const next = new Set(prev);
        next.add(data.speakerSocketId);
        return next;
      });
      setTimeout(() => {
        setSpeakingPlayers((prev) => {
          const next = new Set(prev);
          next.delete(data.speakerSocketId);
          return next;
        });
      }, 2000);
    };

    socket.on('voice:transcript', onTranscript);
    socket.on('voice:speaking', onSpeaking);

    return () => {
      socket.off('voice:transcript', onTranscript);
      socket.off('voice:speaking', onSpeaking);
    };
  }, [socket, sessionId, speakerCharacterId, speakerName]);

  const startListening = useCallback(() => startRecognition(), [startRecognition]);
  const stopListening = useCallback(() => stopRecognition(), [stopRecognition]);

  // Use WebRTC when available and hasn't failed; always run STT in parallel for commands/transcript
  const useWebRTCAudio = webrtc.isSupported && !webrtc.webrtcFailed;

  return {
    transcripts,
    speakingPlayers,
    isListening,
    isSupported: sttSupported,
    mode,
    setMode,
    startListening,
    stopListening,
    // WebRTC
    webrtc,
    useWebRTCAudio,
  };
}

