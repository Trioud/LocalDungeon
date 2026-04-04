'use client';
import { useState } from 'react';
import type { DiceRollMode } from '@local-dungeon/shared';
import DiceButton from './DiceButton';
import DiceResultCard from './DiceResult';
import type { DiceRollEntry } from '@/lib/hooks/useDiceRoller';

const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100];
const MODES: { label: string; value: DiceRollMode }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Advantage', value: 'advantage' },
  { label: 'Disadvantage', value: 'disadvantage' },
];

interface DiceRollerProps {
  onRoll: (notationStr: string, mode: DiceRollMode, isPrivate: boolean) => void;
  recentRolls: DiceRollEntry[];
}

export default function DiceRoller({ onRoll, recentRolls }: DiceRollerProps) {
  const [mode, setMode] = useState<DiceRollMode>('normal');
  const [customNotation, setCustomNotation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  function handleQuickRoll(notation: string, rollMode: DiceRollMode) {
    onRoll(notation, rollMode, isPrivate);
  }

  function handleCustomRoll() {
    if (!customNotation.trim()) return;
    onRoll(customNotation.trim(), mode, isPrivate);
    setCustomNotation('');
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col gap-4">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Dice Roller</h2>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={[
              'flex-1 text-xs py-1 rounded-md font-medium transition-all',
              mode === m.value ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-800',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Quick roll buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {DICE_SIDES.map((sides) => (
          <DiceButton key={sides} sides={sides} mode={mode} onClick={handleQuickRoll} />
        ))}
      </div>

      {/* Custom notation */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customNotation}
          onChange={(e) => setCustomNotation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomRoll()}
          placeholder="e.g. 2d6+3"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleCustomRoll}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Roll
        </button>
      </div>

      {/* Private toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="rounded"
        />
        Private roll
      </label>

      {/* Recent rolls */}
      {recentRolls.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Rolls</h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {recentRolls.map((entry, i) => (
              <DiceResultCard
                key={i}
                result={entry.result}
                rolledBy={entry.rolledBy}
                characterName={entry.characterName}
                isPrivate={entry.isPrivate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
