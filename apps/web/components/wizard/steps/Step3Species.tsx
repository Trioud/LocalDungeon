'use client';
import { useState } from 'react';
import { useSpecies } from '@/lib/hooks/useGameData';
import { useWizard } from '@/lib/hooks/useWizard';

interface SpeciesData {
  name: string;
  speed: number;
  size: string;
  traits: Array<{ name: string; description: string }>;
  suboptions?: { label: string; choices: string[] };
}

export default function Step3Species() {
  const { data: species, isLoading } = useSpecies();
  const { data: wizardData, updateData, next, back, canAdvance } = useWizard();
  const [suboptionSelections, setSuboptionSelections] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Choose Your Species</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  const speciesList: SpeciesData[] = species ?? [];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose Your Species</h2>
      <p className="text-gray-400 mb-2">
        Your species grants traits and features.
      </p>
      <div className="bg-blue-900/30 border border-blue-700 rounded p-3 mb-6 text-sm text-blue-300">
        ℹ️ <strong>2024 PHB:</strong> Ability score increases come from your Background (set in the Ability Scores step), not your species.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {speciesList.map((sp) => {
          const isSelected = wizardData.speciesName === sp.name;
          return (
            <div
              key={sp.name}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer border-2 transition-all
                ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-gray-700 hover:border-gray-500'}
              `}
              onClick={() => updateData({ speciesName: sp.name })}
            >
              <h3 className="font-bold text-white mb-2">{sp.name}</h3>
              <div className="flex gap-3 mb-2 text-xs">
                <span className="text-gray-400">Speed: <span className="text-white">{sp.speed} ft</span></span>
                <span className="text-gray-400">Size: <span className="text-white">{sp.size}</span></span>
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                {(sp.traits ?? []).slice(0, 3).map((t) => (
                  <li key={t.name} className="text-gray-300">• {t.name}</li>
                ))}
                {(sp.traits ?? []).length > 3 && (
                  <li className="text-gray-500">+{sp.traits.length - 3} more traits</li>
                )}
              </ul>

              {isSelected && sp.suboptions && (
                <div className="mt-3 pt-3 border-t border-gray-700" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs text-gray-400 mb-1">{sp.suboptions.label}</label>
                  <select
                    className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600"
                    value={suboptionSelections[sp.name] ?? ''}
                    onChange={(e) => setSuboptionSelections(prev => ({ ...prev, [sp.name]: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {sp.suboptions.choices.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button onClick={back} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button
          onClick={next}
          disabled={!canAdvance}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          Next: Ability Scores →
        </button>
      </div>
    </div>
  );
}
