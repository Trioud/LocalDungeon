'use client';
import { useState } from 'react';
import { useClasses } from '@/lib/hooks/useGameData';
import { useWizard } from '@/lib/hooks/useWizard';

interface ClassData {
  name: string;
  hitDie: number;
  description: string;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: number;
  skillOptions: string[];
  features: Array<{ level: number; name: string; description: string }>;
  spellcasting: { ability: string } | null;
}

export default function Step1Class() {
  const { data: classes, isLoading } = useClasses();
  const { data: wizardData, updateData, next, canAdvance, validationError } = useWizard();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Choose Your Class</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  const classList: ClassData[] = classes ?? [];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose Your Class</h2>
      <p className="text-gray-400 mb-6">Your class is the primary definition of what your character does.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {classList.map((cls) => {
          const isSelected = wizardData.className === cls.name;
          const isExpanded = expandedClass === cls.name;

          return (
            <div
              key={cls.name}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer border-2 transition-all
                ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-gray-700 hover:border-gray-500'}
              `}
              onClick={() => updateData({ className: cls.name })}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white">{cls.name}</h3>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">d{cls.hitDie}</span>
              </div>
              <p className="text-xs text-yellow-400 mb-1">{cls.primaryAbility}</p>
              <p className="text-sm text-gray-400 line-clamp-2">{cls.description}</p>

              <button
                type="button"
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedClass(isExpanded ? null : cls.name);
                }}
              >
                {isExpanded ? 'Hide Details' : 'Class Details'}
              </button>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs space-y-2">
                  <div>
                    <span className="text-gray-400">Saving Throws: </span>
                    <span className="text-white">{cls.savingThrows.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Skills (choose {cls.skillChoices}): </span>
                    <span className="text-white">{cls.skillOptions.join(', ')}</span>
                  </div>
                  {cls.spellcasting && (
                    <div>
                      <span className="text-purple-400">✨ Spellcasting ({cls.spellcasting.ability.toUpperCase()})</span>
                    </div>
                  )}
                  {cls.features.filter((f) => f.level === 1).length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Level 1 Features:</p>
                      <ul className="space-y-1">
                        {cls.features.filter((f) => f.level === 1).map((f) => (
                          <li key={f.name} className="text-white">• {f.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {validationError && <p className="text-red-400 text-sm mb-4">{validationError}</p>}

      <div className="flex justify-end">
        <button
          onClick={next}
          disabled={!canAdvance}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          Next: Background →
        </button>
      </div>
    </div>
  );
}
