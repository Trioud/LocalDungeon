'use client';
import { useEffect, useRef } from 'react';
import type { VoiceTranscriptEvent, CommandIntent } from '@local-dungeon/shared';
import { parseVoiceCommand } from '@local-dungeon/shared';

const INTENT_ICONS: Partial<Record<CommandIntent, string>> = {
  roll_dice: '🎲',
  roll_skill: '🎲',
  roll_save: '🛡️',
  roll_attack: '⚔️',
  cast_spell: '✨',
  use_resource: '⚡',
  apply_damage: '💥',
  apply_healing: '💚',
  add_condition: '🔴',
  remove_condition: '🟢',
  end_turn: '⏭️',
  rest: '🏕️',
};

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
      {transcripts.map((t, i) => {
        let intentBadge: string | null = null;
        if (t.isFinal) {
          const parsed = parseVoiceCommand(t.text);
          if (parsed.confidence >= 0.3 && parsed.intent !== 'chat') {
            intentBadge = INTENT_ICONS[parsed.intent] ?? null;
          }
        }
        return (
          <div key={i} className={`flex gap-1 ${!t.isFinal ? 'text-gray-400 italic' : 'text-gray-700'}`}>
            <span className="font-medium shrink-0">{t.speakerName}:</span>
            <span>{t.text}</span>
            {!t.isFinal && <span className="text-gray-400">…</span>}
            {intentBadge && (
              <span aria-label={`intent: ${intentBadge}`} title={`Command detected`}>
                {intentBadge}
              </span>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

