'use client';

const HIT_DIE_LABELS: Record<number, string> = {
  6: 'd6',
  8: 'd8',
  10: 'd10',
  12: 'd12',
};

interface Props {
  combatantId: string;
  hitDiceRemaining: number;
  maxHitDice: number;
  hitDie?: number;
  hpGainedLast?: number;
  onSpend: (combatantId: string, diceCount: number) => void;
}

export default function HitDicePanel({
  combatantId,
  hitDiceRemaining,
  maxHitDice,
  hitDie = 8,
  hpGainedLast,
  onSpend,
}: Props) {
  const dieLabel = HIT_DIE_LABELS[hitDie] ?? `d${hitDie}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Hit Dice ({dieLabel})</h3>
      <div className="flex flex-wrap gap-1 mb-3">
        {Array.from({ length: maxHitDice }, (_, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${
              i < hitDiceRemaining
                ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}
          >
            {dieLabel}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {hitDiceRemaining}/{maxHitDice} remaining
      </p>
      {hpGainedLast !== undefined && (
        <p className="text-xs text-green-600 font-medium mb-2">+{hpGainedLast} HP gained</p>
      )}
      <button
        onClick={() => onSpend(combatantId, 1)}
        disabled={hitDiceRemaining === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
      >
        Spend 1 HD
      </button>
    </div>
  );
}
