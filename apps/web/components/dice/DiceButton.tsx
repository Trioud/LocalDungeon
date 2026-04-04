'use client';
import type { DiceRollMode } from '@local-dungeon/shared';

interface DiceButtonProps {
  sides: number;
  modifier?: number;
  mode?: DiceRollMode;
  onClick: (notation: string, mode: DiceRollMode) => void;
}

const diceIcons: Record<number, string> = {
  4: '▲',
  6: '⬡',
  8: '◆',
  10: '⬟',
  12: '⬠',
  20: '⬡',
  100: '●',
};

export default function DiceButton({ sides, modifier = 0, mode = 'normal', onClick }: DiceButtonProps) {
  const label = `d${sides}`;
  const icon = diceIcons[sides] ?? '●';
  const notation = `d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}`;

  return (
    <button
      onClick={() => onClick(notation, mode)}
      className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 active:scale-95 transition-all cursor-pointer select-none shadow-sm"
      title={notation}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-xs font-bold text-indigo-700 mt-0.5">{label}</span>
    </button>
  );
}
