'use client';
import { useCallback } from 'react';
import type { VoiceMode } from '@local-dungeon/shared';

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  mode: VoiceMode;
  onStart: () => void;
  onStop: () => void;
  onModeToggle: () => void;
}

export default function VoiceButton({ isListening, isSupported, mode, onStart, onStop, onModeToggle }: VoiceButtonProps) {
  const handleMouseDown = useCallback(() => {
    if (mode === 'push_to_talk') onStart();
  }, [mode, onStart]);

  const handleMouseUp = useCallback(() => {
    if (mode === 'push_to_talk') onStop();
  }, [mode, onStop]);

  const handleClick = useCallback(() => {
    if (mode === 'continuous') {
      if (isListening) onStop(); else onStart();
    }
  }, [mode, isListening, onStart, onStop]);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={mode === 'push_to_talk' ? (e) => { e.preventDefault(); onStart(); } : undefined}
        onTouchEnd={mode === 'push_to_talk' ? (e) => { e.preventDefault(); onStop(); } : undefined}
        onClick={handleClick}
        className={`p-2 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isListening ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        )}
      </button>
      <button
        onClick={onModeToggle}
        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        aria-label={`Switch to ${mode === 'push_to_talk' ? 'continuous' : 'push-to-talk'} mode`}
      >
        {mode === 'push_to_talk' ? 'PTT' : 'Cont.'}
      </button>
    </div>
  );
}
