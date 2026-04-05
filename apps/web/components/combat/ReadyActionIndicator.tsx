'use client';

interface ReadyActionIndicatorProps {
  active: boolean;
}

export default function ReadyActionIndicator({ active }: ReadyActionIndicatorProps) {
  if (!active) return null;
  return (
    <span
      title="Ready Action set"
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs font-bold"
    >
      ⚡
    </span>
  );
}
