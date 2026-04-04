'use client';
import type { DiceResult as DiceResultType } from '@local-dungeon/shared';

interface DiceResultProps {
  result: DiceResultType;
  rolledBy?: string;
  characterName?: string;
  isPrivate?: boolean;
}

export default function DiceResult({ result, rolledBy, characterName, isPrivate }: DiceResultProps) {
  const isCrit = result.isCritical;
  const isFail = result.isCriticalFail;

  return (
    <div
      className={[
        'rounded-xl border p-3 transition-all',
        isCrit ? 'border-green-400 bg-green-50 shadow-green-200 shadow-md' : '',
        isFail ? 'border-red-400 bg-red-50 shadow-red-200 shadow-md' : '',
        !isCrit && !isFail ? 'border-gray-200 bg-white' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-mono">{result.notation}</span>
        <div className="flex items-center gap-1">
          {isPrivate && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Private</span>
          )}
          {isCrit && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">NAT 20!</span>}
          {isFail && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">NAT 1</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {result.rolls.map((roll, i) => {
            const isMax = roll === result.rolls.reduce((a, b) => Math.max(a, b));
            const isMin = roll === result.rolls.reduce((a, b) => Math.min(a, b));
            return (
              <span
                key={i}
                className={[
                  'text-sm font-mono px-1.5 py-0.5 rounded',
                  isMax && result.rolls.length > 1 ? 'bg-green-100 text-green-800 font-bold' : '',
                  isMin && result.rolls.length > 1 ? 'bg-red-100 text-red-800' : '',
                  result.rolls.length === 1 ? 'bg-gray-100 text-gray-700' : '',
                ].join(' ')}
              >
                {roll}
              </span>
            );
          })}
        </div>
        <span className="text-2xl font-bold text-gray-900 ml-auto">{result.total}</span>
      </div>

      {(rolledBy || characterName) && (
        <p className="text-xs text-gray-400 mt-1">
          {characterName ?? rolledBy}
          {result.modifier !== 0 && (
            <span className="ml-1">({result.modifier > 0 ? '+' : ''}{result.modifier})</span>
          )}
        </p>
      )}
    </div>
  );
}
