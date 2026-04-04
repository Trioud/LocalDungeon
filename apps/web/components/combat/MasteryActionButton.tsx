'use client';
import { useState } from 'react';
import type { MasteryEffect } from '@local-dungeon/shared';

interface MasteryActionButtonProps {
  effect: MasteryEffect | null;
  onApply: (saveRoll?: number) => void;
}

export default function MasteryActionButton({ effect, onApply }: MasteryActionButtonProps) {
  const [saveRoll, setSaveRoll] = useState('');

  if (!effect) return null;

  const needsSave = effect.requiresSave && effect.pushDistance === undefined && effect.conditionApplied === undefined;

  if (effect.requiresAttack) {
    return (
      <button
        onClick={() => onApply()}
        className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        aria-label={`Resolve ${effect.property} attack`}
      >
        ⚔️ Resolve {effect.property.charAt(0).toUpperCase() + effect.property.slice(1)} Attack
      </button>
    );
  }

  if (needsSave && effect.requiresSave) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">
          Target rolls {effect.requiresSave.saveType.toUpperCase()} save DC {effect.requiresSave.dc}:
        </span>
        <input
          type="number"
          min={1}
          max={30}
          value={saveRoll}
          onChange={(e) => setSaveRoll(e.target.value)}
          placeholder="Roll"
          className="w-16 text-xs border rounded px-2 py-1"
          aria-label="Save roll"
        />
        <button
          onClick={() => {
            const roll = parseInt(saveRoll, 10);
            if (!isNaN(roll)) {
              onApply(roll);
              setSaveRoll('');
            }
          }}
          className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          aria-label="Apply mastery save"
        >
          Apply
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onApply()}
      className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
      aria-label={`Apply ${effect.property} mastery`}
    >
      ✨ Apply {effect.property.charAt(0).toUpperCase() + effect.property.slice(1)}
    </button>
  );
}
