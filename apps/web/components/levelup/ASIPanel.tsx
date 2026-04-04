'use client';
import { useState } from 'react';
import type { AbilityScore, ASIChoice } from '@local-dungeon/shared';

const ABILITIES: { key: AbilityScore; label: string }[] = [
  { key: 'str', label: 'Strength' },
  { key: 'dex', label: 'Dexterity' },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom' },
  { key: 'cha', label: 'Charisma' },
];

interface ASIPanelProps {
  abilityScores: Record<string, number>;
  onChange: (choice: ASIChoice) => void;
}

export default function ASIPanel({ abilityScores, onChange }: ASIPanelProps) {
  const [mode, setMode] = useState<'plus2' | 'plus1plus1' | 'feat'>('plus2');
  const [ability1, setAbility1] = useState<AbilityScore>('str');
  const [ability2, setAbility2] = useState<AbilityScore>('dex');
  const [featName, setFeatName] = useState('');

  function handleChange(
    newMode = mode,
    newA1 = ability1,
    newA2 = ability2,
    newFeat = featName,
  ) {
    if (newMode === 'feat') {
      if (newFeat.trim()) onChange({ type: 'feat', featName: newFeat.trim() });
    } else if (newMode === 'plus2') {
      onChange({ type: 'asi', ability1: newA1 });
    } else {
      onChange({ type: 'asi', ability1: newA1, ability2: newA2 });
    }
  }

  const preview = (ability: AbilityScore, bonus: number) => {
    const current = abilityScores[ability] ?? 10;
    const next = Math.min(20, current + bonus);
    return `${current} → ${next}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['plus2', 'plus1plus1', 'feat'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              handleChange(m);
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              mode === m
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
            }`}
          >
            {m === 'plus2' ? '+2 to one' : m === 'plus1plus1' ? '+1 to two' : 'Take a Feat'}
          </button>
        ))}
      </div>

      {mode === 'feat' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Feat Name</label>
          <input
            type="text"
            value={featName}
            onChange={(e) => {
              setFeatName(e.target.value);
              handleChange(mode, ability1, ability2, e.target.value);
            }}
            placeholder="e.g. Alert, War Caster"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      )}

      {mode === 'plus2' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Ability (+2)</label>
          <select
            value={ability1}
            onChange={(e) => {
              setAbility1(e.target.value as AbilityScore);
              handleChange(mode, e.target.value as AbilityScore);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {ABILITIES.map(({ key, label }) => (
              <option key={key} value={key}>
                {label} — {preview(key, 2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'plus1plus1' && (
        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map((n) => {
            const current = n === 1 ? ability1 : ability2;
            const setCurrent = n === 1 ? setAbility1 : setAbility2;
            return (
              <div key={n} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ability {n} (+1)</label>
                <select
                  value={current}
                  onChange={(e) => {
                    const val = e.target.value as AbilityScore;
                    setCurrent(val);
                    const newA1 = n === 1 ? val : ability1;
                    const newA2 = n === 2 ? val : ability2;
                    handleChange(mode, newA1, newA2);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {ABILITIES.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label} — {preview(key, 1)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
