'use client';
import { useEffect, useRef } from 'react';
import type { VoiceTranscriptEvent } from '@local-dungeon/shared';

interface TranscriptPanelProps {
  transcripts: VoiceTranscriptEvent[];
}

export default function TranscriptPanel({ transcripts }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts.length]);

  if (transcripts.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic text-center py-2">No voice transcripts yet.</div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto text-xs">
      {transcripts.map((t, i) => (
        <div key={i} className={`flex gap-1 ${!t.isFinal ? 'text-gray-400 italic' : 'text-gray-700'}`}>
          <span className="font-medium shrink-0">{t.speakerName}:</span>
          <span>{t.text}</span>
          {!t.isFinal && <span className="text-gray-400">…</span>}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
