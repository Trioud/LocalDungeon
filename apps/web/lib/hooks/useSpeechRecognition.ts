'use client';
import { useCallback, useRef, useState } from 'react';
import type { VoiceMode } from '@local-dungeon/shared';
import { useSocket } from './useSocket';

interface UseSpeechRecognitionProps {
  mode: VoiceMode;
  onTranscript: (text: string, isFinal: boolean) => void;
}

const DND_GRAMMAR_WORDS = [
  'attack', 'roll', 'perception', 'stealth', 'initiative', 'advantage', 'disadvantage',
  'saving throw', 'spell slot', 'concentration', 'hit points', 'armor class', 'proficiency',
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger',
  'rogue', 'sorcerer', 'warlock', 'wizard',
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
];

export function useSpeechRecognition({ mode, onTranscript }: UseSpeechRecognitionProps) {
  const { socket } = useSocket();
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isListening, setIsListening] = useState(false);

  const isWebSpeechSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

  const isSupported =
    isWebSpeechSupported ||
    !!(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia);

  const start = useCallback(async () => {
    if (isWebSpeechSupported) {
      const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = mode === 'continuous';
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const SGL = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
      if (SGL) {
        const grammar = `#JSGF V1.0; grammar dnd; public <dnd> = ${DND_GRAMMAR_WORDS.join(' | ')} ;`;
        const list = new SGL();
        list.addFromString(grammar, 1);
        recognition.grammars = list;
      }

      recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          onTranscript(result[0].transcript, result.isFinal);
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } else if (socket && navigator.mediaDevices?.getUserMedia) {
      socket.emit('voice:start', {});
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const arr = await e.data.arrayBuffer();
          socket.emit('voice:audio_chunk', { audio: Array.from(new Uint8Array(arr)), sampleRate: 16000 });
        }
      };
      mediaRecorder.start(250);
      setIsListening(true);
    }
  }, [isWebSpeechSupported, mode, onTranscript, socket]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      mediaRecorderRef.current = null;
      socket?.emit('voice:stop', {});
    }
    setIsListening(false);
  }, [socket]);

  return { start, stop, isListening, isSupported };
}
