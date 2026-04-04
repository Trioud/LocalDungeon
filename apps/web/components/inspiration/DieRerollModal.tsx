'use client';
import type { DiceResult } from '@local-dungeon/shared';

interface DieRerollModalProps {
  roll: DiceResult;
  onReroll: (dieIndex: number) => void;
  onClose: () => void;
}

export default function DieRerollModal({ roll, onReroll, onClose }: DieRerollModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
      aria-label="Choose die to reroll"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            ⭐ Choose a die to reroll
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Roll: <span className="font-mono">{roll.notation}</span> — Total: <strong>{roll.total}</strong>
        </p>

        <div className="flex flex-wrap gap-2">
          {roll.rolls.map((value, index) => (
            <button
              key={index}
              onClick={() => onReroll(index)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-500 transition-colors cursor-pointer"
              aria-label={`Reroll die ${index + 1}: ${value}`}
            >
              <span className="text-lg font-bold text-yellow-700">{value}</span>
              <span className="text-xs text-gray-400">d{index + 1}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400 italic">
          You must keep the new result.
        </p>
      </div>
    </div>
  );
}
