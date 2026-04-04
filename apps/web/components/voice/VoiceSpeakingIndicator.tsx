'use client';

interface VoiceSpeakingIndicatorProps {
  isSpeaking: boolean;
}

export default function VoiceSpeakingIndicator({ isSpeaking }: VoiceSpeakingIndicatorProps) {
  if (!isSpeaking) return null;

  return (
    <span className="inline-flex items-end gap-0.5 h-4 ml-1" aria-label="Speaking">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.5 bg-green-500 rounded-full animate-bounce"
          style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </span>
  );
}
