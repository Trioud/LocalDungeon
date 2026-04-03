'use client';
import { useState } from 'react';
import { useBackgrounds } from '@/lib/hooks/useGameData';
import { useWizard } from '@/lib/hooks/useWizard';

interface BackgroundData {
  name: string;
  skillProficiencies: string[];
  abilityScoreOptions: Array<{ abilities: string[]; bonuses: number[] }>;
  feat: string;
  equipment?: string;
}

export default function Step2Background() {
  const { data: backgrounds, isLoading } = useBackgrounds();
  const { data: wizardData, updateData, next, back, canAdvance } = useWizard();
  const [equipmentChoice, setEquipmentChoice] = useState<'package' | 'gold'>('package');

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Choose Your Background</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  const bgList: BackgroundData[] = backgrounds ?? [];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose Your Background</h2>
      <p className="text-gray-400 mb-6">Your background also grants ability score bonuses (+2/+1 or +1/+1/+1) chosen in the Ability Scores step.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {bgList.map((bg) => {
          const isSelected = wizardData.backgroundName === bg.name;
          return (
            <div
              key={bg.name}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer border-2 transition-all
                ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-gray-700 hover:border-gray-500'}
              `}
              onClick={() => updateData({ backgroundName: bg.name })}
            >
              <h3 className="font-bold text-white mb-2">{bg.name}</h3>
              {bg.skillProficiencies?.length > 0 && (
                <p className="text-xs text-green-400 mb-1">Skills: {bg.skillProficiencies.join(', ')}</p>
              )}
              {bg.feat && (
                <p className="text-xs text-purple-400 mb-1">Feat: {bg.feat}</p>
              )}
              {bg.abilityScoreOptions?.length > 0 && (
                <p className="text-xs text-blue-400">
                  ASI options available
                </p>
              )}
            </div>
          );
        })}
      </div>

      {wizardData.backgroundName && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-white mb-3">Starting Equipment</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="equipment"
                checked={equipmentChoice === 'package'}
                onChange={() => setEquipmentChoice('package')}
                className="accent-yellow-400"
              />
              <span className="text-gray-300 text-sm">Starting Equipment Package</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="equipment"
                checked={equipmentChoice === 'gold'}
                onChange={() => setEquipmentChoice('gold')}
                className="accent-yellow-400"
              />
              <span className="text-gray-300 text-sm">50 GP to spend</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={back} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button
          onClick={next}
          disabled={!canAdvance}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          Next: Species →
        </button>
      </div>
    </div>
  );
}
