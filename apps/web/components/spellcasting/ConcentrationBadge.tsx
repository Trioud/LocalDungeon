'use client';

interface Props {
  spellName: string;
  onEndConcentration: () => void;
}

export default function ConcentrationBadge({ spellName, onEndConcentration }: Props) {
  function handleClick() {
    if (window.confirm(`End concentration on ${spellName}?`)) {
      onEndConcentration();
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 rounded px-2 py-0.5 transition-colors"
      title={`Concentrating on ${spellName} — click to end`}
    >
      <span aria-hidden>◎</span>
      <span>{spellName}</span>
    </button>
  );
}
