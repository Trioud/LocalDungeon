'use client';
import { useState } from 'react';
import { useWizard } from '@/lib/hooks/useWizard';
import type { AbilityScores } from '@/lib/stores/wizardStore';

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const ABILITIES: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function Step7Finalize() {
  const { data: wizardData, updateData, next, back, validationError } = useWizard();
  const [showReview, setShowReview] = useState(false);
  const scores = wizardData.abilityScores;
  const conMod = scores ? Math.floor((scores.con - 10) / 2) : 0;
  const hp = 8 + conMod; // simplified: average hit die + con
  const profBonus = 2;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Finalize Your Character</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Character Name *</label>
            <input
              type="text"
              value={wizardData.name ?? ''}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="Enter your character's name"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-yellow-400 outline-none"
            />
            {validationError && <p className="text-red-400 text-xs mt-1">{validationError}</p>}
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Alignment</label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGNMENTS.map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => updateData({ alignment: al })}
                  className={`px-2 py-2 text-xs rounded border transition-colors
                    ${wizardData.alignment === al
                      ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}
                  `}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-gray-300 font-medium mb-2">Appearance (optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['age', 'height', 'weight', 'eyes', 'hair', 'skin'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-gray-400 text-xs mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    value={wizardData.appearance?.[field] ?? ''}
                    onChange={(e) => updateData({
                      appearance: { ...wizardData.appearance, [field]: e.target.value } as typeof wizardData.appearance
                    })}
                    className="w-full bg-gray-700 text-white rounded px-3 py-1.5 border border-gray-600 text-sm focus:border-yellow-400 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <h3 className="text-gray-300 font-medium mb-2">Personality (optional)</h3>
            {(['traits', 'ideals', 'bonds', 'flaws'] as const).map((field) => (
              <div key={field} className="mb-3">
                <label className="block text-gray-400 text-xs mb-1 capitalize">{field}</label>
                <textarea
                  value={wizardData.personality?.[field] ?? ''}
                  onChange={(e) => updateData({
                    personality: { ...wizardData.personality, [field]: e.target.value } as typeof wizardData.personality
                  })}
                  rows={2}
                  className="w-full bg-gray-700 text-white rounded px-3 py-1.5 border border-gray-600 text-sm focus:border-yellow-400 outline-none resize-none"
                />
              </div>
            ))}
          </div>

          {/* Backstory */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Backstory (optional)</label>
            <textarea
              value={wizardData.backstory ?? ''}
              onChange={(e) => updateData({ backstory: e.target.value })}
              rows={4}
              placeholder="Your character's history and motivations..."
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-yellow-400 outline-none resize-none"
            />
          </div>
        </div>

        {/* Review Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg border border-gray-700 sticky top-4">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setShowReview(!showReview)}
            >
              <span className="font-semibold text-white">Character Summary</span>
              <span className="text-gray-400">{showReview ? '▲' : '▼'}</span>
            </button>
            {showReview && (
              <div className="px-4 pb-4 space-y-3 text-sm border-t border-gray-700">
                <div className="pt-3">
                  <div className="text-gray-400 text-xs mb-1">Core</div>
                  <div><span className="text-gray-500">Class:</span> <span className="text-white">{wizardData.className ?? '—'}</span></div>
                  <div><span className="text-gray-500">Background:</span> <span className="text-white">{wizardData.backgroundName ?? '—'}</span></div>
                  <div><span className="text-gray-500">Species:</span> <span className="text-white">{wizardData.speciesName ?? '—'}</span></div>
                </div>
                {scores && (
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Ability Scores</div>
                    <div className="grid grid-cols-3 gap-1">
                      {ABILITIES.map(ab => (
                        <div key={ab} className="text-center bg-gray-700 rounded p-1">
                          <div className="text-gray-400 text-xs">{ABILITY_LABELS[ab]}</div>
                          <div className="text-white font-bold">{scores[ab]}</div>
                          <div className="text-yellow-400 text-xs">{modifier(scores[ab])}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-400 text-xs mb-1">Combat</div>
                  <div><span className="text-gray-500">HP:</span> <span className="text-white">{hp}</span></div>
                  <div><span className="text-gray-500">Initiative:</span> <span className="text-white">{modifier(scores?.dex ?? 10)}</span></div>
                  <div><span className="text-gray-500">Prof. Bonus:</span> <span className="text-white">+{profBonus}</span></div>
                </div>
                {(wizardData.skillProficiencies?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Skills</div>
                    <div className="text-white text-xs">{wizardData.skillProficiencies?.join(', ')}</div>
                  </div>
                )}
                {(wizardData.cantrips?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Cantrips</div>
                    <div className="text-white text-xs">{wizardData.cantrips?.join(', ')}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={back} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button
          onClick={next}
          disabled={!wizardData.name || wizardData.name.length < 2}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          Review & Create →
        </button>
      </div>
    </div>
  );
}
