'use client';
import { useState } from 'react';
import type { CombatantState } from '@local-dungeon/shared';

interface CombatControlsProps {
  isActive: boolean;
  onStart: () => void;
  onEnd: () => void;
  onAddCombatant: (combatant: Omit<CombatantState, 'isActive' | 'hasAction' | 'hasBonusAction' | 'hasReaction' | 'conditions' | 'exhaustionLevel' | 'isBloodied' | 'isConcentrating' | 'deathSaveSuccesses' | 'deathSaveFailures'>) => void;
}

export default function CombatControls({ isActive, onStart, onEnd, onAddCombatant }: CombatControlsProps) {
  const [name, setName] = useState('');
  const [initiative, setInitiative] = useState('');
  const [initiativeRoll, setInitiativeRoll] = useState('');
  const [hp, setHp] = useState('');
  const [ac, setAc] = useState('');
  const [isPlayer, setIsPlayer] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const hpVal = parseInt(hp, 10) || 10;
    onAddCombatant({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim() || 'Unknown',
      initiative: parseInt(initiative, 10) || 0,
      initiativeRoll: parseInt(initiativeRoll, 10) || 0,
      hp: hpVal,
      maxHp: hpVal,
      tempHp: 0,
      ac: parseInt(ac, 10) || 10,
      isPlayer,
      isConcentrating: false,
    });
    setName('');
    setInitiative('');
    setInitiativeRoll('');
    setHp('');
    setAc('');
    setIsPlayer(false);
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={onStart}
          disabled={isActive}
          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ⚔️ Start Combat
        </button>
        <button
          onClick={onEnd}
          disabled={!isActive}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          🏳️ End Combat
        </button>
      </div>

      <form onSubmit={handleAdd} className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Add Combatant</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full text-sm border rounded px-2 py-1.5"
          required
          aria-label="Combatant name"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={initiative}
            onChange={(e) => setInitiative(e.target.value)}
            placeholder="Initiative"
            className="text-sm border rounded px-2 py-1.5"
            aria-label="Initiative"
          />
          <input
            type="number"
            value={initiativeRoll}
            onChange={(e) => setInitiativeRoll(e.target.value)}
            placeholder="Init Roll"
            className="text-sm border rounded px-2 py-1.5"
            aria-label="Initiative roll"
          />
          <input
            type="number"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            placeholder="HP"
            className="text-sm border rounded px-2 py-1.5"
            aria-label="HP"
          />
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(e.target.value)}
            placeholder="AC"
            className="text-sm border rounded px-2 py-1.5"
            aria-label="AC"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPlayer}
            onChange={(e) => setIsPlayer(e.target.checked)}
            aria-label="Is player character"
          />
          Player Character
        </label>
        <button
          type="submit"
          className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add
        </button>
      </form>
    </div>
  );
}
