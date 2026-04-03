'use client';
import { useState, useCallback } from 'react';
import { useWizard } from '@/lib/hooks/useWizard';
import { useBackgrounds } from '@/lib/hooks/useGameData';
import type { AbilityScores } from '@/lib/stores/wizardStore';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITIES: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const DEFAULT_SCORES: AbilityScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function roll4d6DropLowest(): { result: number; dice: number[] } {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const sorted = [...dice].sort((a, b) => b - a);
  const result = sorted.slice(0, 3).reduce((a, b) => a + b, 0);
  return { result, dice };
}

export default function Step4AbilityScores() {
  const { data: wizardData, updateData, next, back, canAdvance, validationError } = useWizard();
  const { data: backgrounds } = useBackgrounds();
  const [activeTab, setActiveTab] = useState<'standard' | 'pointbuy' | 'roll'>(wizardData.abilityMethod ?? 'standard');
  const [assignments, setAssignments] = useState<Partial<Record<keyof AbilityScores, number>>>(
    () => {
      if (wizardData.abilityScores) {
        return { ...wizardData.abilityScores };
      }
      return {};
    }
  );
  const [rollResults, setRollResults] = useState<Record<keyof AbilityScores, { result: number; dice: number[] } | null>>(
    { str: null, dex: null, con: null, int: null, wis: null, cha: null }
  );

  // Background ability score options
  const selectedBg = backgrounds?.find((bg: { name: string }) => bg.name === wizardData.backgroundName);
  const bgOptions: string[] = selectedBg?.abilityScoreOptions?.[0]?.abilities ?? [];

  // PHB2024: background grants +2/+1 or +1/+1/+1 to 3 specific abilities
  const [bgBonusMode, setBgBonusMode] = useState<'twoplusone' | 'oneone'>('twoplusone');
  const [bgTwoPlusOne, setBgTwoPlusOne] = useState<{ two: string; one: string }>({ two: '', one: '' });
  const [bgThreeOnes, setBgThreeOnes] = useState<string[]>([]);

  const getBaseScores = (): AbilityScores => {
    const base = { ...DEFAULT_SCORES };
    ABILITIES.forEach((ab) => {
      const val = assignments[ab];
      if (val !== undefined) base[ab] = val;
    });
    return base;
  };

  const getBgBonus = (ability: keyof AbilityScores): number => {
    const label = ABILITY_LABELS[ability].toLowerCase();
    if (bgBonusMode === 'twoplusone') {
      if (bgTwoPlusOne.two && bgTwoPlusOne.two.toLowerCase() === label) return 2;
      if (bgTwoPlusOne.one && bgTwoPlusOne.one.toLowerCase() === label) return 1;
    } else {
      if (bgThreeOnes.some(a => a.toLowerCase() === label)) return 1;
    }
    return 0;
  };

  const getFinalScore = (ability: keyof AbilityScores): number => {
    return getBaseScores()[ability] + getBgBonus(ability);
  };

  const saveScores = useCallback(() => {
    const base = getBaseScores();
    const final: AbilityScores = { ...base };
    ABILITIES.forEach((ab) => {
      final[ab] = getFinalScore(ab);
    });
    updateData({ abilityScores: final, abilityMethod: activeTab });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, bgBonusMode, bgTwoPlusOne, bgThreeOnes, activeTab]);

  // Standard Array
  const usedValues = ABILITIES.map(ab => assignments[ab]).filter(Boolean) as number[];

  const renderStandardArray = () => (
    <div>
      <p className="text-gray-400 text-sm mb-4">Assign each value from the pool to an ability score. Each value can only be used once.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ABILITIES.map((ab) => {
          const currentVal = assignments[ab];
          return (
            <div key={ab} className="bg-gray-700 rounded p-3">
              <label className="block text-gray-400 text-xs mb-1">{ABILITY_LABELS[ab]}</label>
              <select
                className="w-full bg-gray-600 text-white rounded px-2 py-1 border border-gray-500"
                value={currentVal ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  setAssignments(prev => ({ ...prev, [ab]: val }));
                }}
              >
                <option value="">—</option>
                {STANDARD_ARRAY.map((v) => (
                  <option key={v} value={v} disabled={usedValues.includes(v) && currentVal !== v}>
                    {v}{usedValues.includes(v) && currentVal !== v ? ' (used)' : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );

  const getPointBuyTotal = (): number => {
    return ABILITIES.reduce((sum, ab) => sum + (POINT_BUY_COSTS[assignments[ab] ?? 8] ?? 0), 0);
  };

  const renderPointBuy = () => {
    const spent = getPointBuyTotal();
    const remaining = 27 - spent;
    return (
      <div>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-white font-semibold">Points Remaining:</span>
          <span className={`text-2xl font-bold ${remaining < 0 ? 'text-red-400' : remaining === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
            {remaining}
          </span>
          <span className="text-gray-400 text-sm">/ 27</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ABILITIES.map((ab) => {
            const val = assignments[ab] ?? 8;
            const canIncrease = val < 15 && remaining >= (POINT_BUY_COSTS[val + 1] ?? 999) - POINT_BUY_COSTS[val];
            const canDecrease = val > 8;
            return (
              <div key={ab} className="bg-gray-700 rounded p-3">
                <label className="block text-gray-400 text-xs mb-2">{ABILITY_LABELS[ab]}</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (canDecrease) setAssignments(prev => ({ ...prev, [ab]: val - 1 }));
                    }}
                    disabled={!canDecrease}
                    className="w-7 h-7 rounded bg-gray-600 text-white disabled:opacity-40 hover:bg-gray-500"
                  >−</button>
                  <span className="text-white font-bold text-lg w-8 text-center">{val}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (canIncrease) setAssignments(prev => ({ ...prev, [ab]: val + 1 }));
                    }}
                    disabled={!canIncrease}
                    className="w-7 h-7 rounded bg-gray-600 text-white disabled:opacity-40 hover:bg-gray-500"
                  >+</button>
                </div>
                <div className="text-xs text-gray-400 mt-1">Cost: {POINT_BUY_COSTS[val]}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const rollAll = () => {
    const newRolls: Record<keyof AbilityScores, { result: number; dice: number[] }> = {} as Record<keyof AbilityScores, { result: number; dice: number[] }>;
    const newAssignments: Partial<Record<keyof AbilityScores, number>> = {};
    ABILITIES.forEach((ab) => {
      const r = roll4d6DropLowest();
      newRolls[ab] = r;
      newAssignments[ab] = r.result;
    });
    setRollResults(newRolls);
    setAssignments(newAssignments);
  };

  const renderRoll = () => (
    <div>
      <button
        type="button"
        onClick={rollAll}
        className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold"
      >
        🎲 Roll All (4d6 drop lowest)
      </button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ABILITIES.map((ab) => {
          const val = assignments[ab] ?? 8;
          const roll = rollResults[ab];
          return (
            <div key={ab} className="bg-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-400 text-xs">{ABILITY_LABELS[ab]}</label>
                <button
                  type="button"
                  onClick={() => {
                    const r = roll4d6DropLowest();
                    setRollResults(prev => ({ ...prev, [ab]: r }));
                    setAssignments(prev => ({ ...prev, [ab]: r.result }));
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300"
                  title="Reroll"
                >🎲</button>
              </div>
              <div className="text-2xl font-bold text-white">{val}</div>
              {roll && (
                <div className="text-xs text-gray-400 mt-1">
                  [{roll.dice.join(', ')}]
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBgBonuses = () => {
    if (!selectedBg || bgOptions.length === 0) return null;

    return (
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-blue-700">
        <h3 className="font-semibold text-blue-300 mb-3">Background Ability Score Bonuses ({selectedBg.name})</h3>
        <p className="text-gray-400 text-xs mb-3">PHB 2024: Choose +2/+1 or +1/+1/+1 to the following abilities: {bgOptions.join(', ')}</p>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="bgMode" checked={bgBonusMode === 'twoplusone'} onChange={() => setBgBonusMode('twoplusone')} className="accent-yellow-400" />
            <span className="text-gray-300 text-sm">+2 / +1</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="bgMode" checked={bgBonusMode === 'oneone'} onChange={() => setBgBonusMode('oneone')} className="accent-yellow-400" />
            <span className="text-gray-300 text-sm">+1 / +1 / +1</span>
          </label>
        </div>
        {bgBonusMode === 'twoplusone' ? (
          <div className="flex gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">+2 to</label>
              <select className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600"
                value={bgTwoPlusOne.two}
                onChange={(e) => setBgTwoPlusOne(prev => ({ ...prev, two: e.target.value }))}>
                <option value="">Select</option>
                {bgOptions.filter(a => a !== bgTwoPlusOne.one).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">+1 to</label>
              <select className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600"
                value={bgTwoPlusOne.one}
                onChange={(e) => setBgTwoPlusOne(prev => ({ ...prev, one: e.target.value }))}>
                <option value="">Select</option>
                {bgOptions.filter(a => a !== bgTwoPlusOne.two).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {bgOptions.map(a => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bgThreeOnes.includes(a)}
                  onChange={(e) => {
                    if (e.target.checked && bgThreeOnes.length < 3) {
                      setBgThreeOnes(prev => [...prev, a]);
                    } else {
                      setBgThreeOnes(prev => prev.filter(x => x !== a));
                    }
                  }}
                  className="accent-yellow-400"
                />
                <span className="text-gray-300 text-sm">+1 {a}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Assign Ability Scores</h2>
      <p className="text-gray-400 mb-4">Choose a method to assign your base ability scores.</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {(['standard', 'pointbuy', 'roll'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200'}
            `}
            onClick={() => { setActiveTab(tab); updateData({ abilityMethod: tab }); }}
          >
            {tab === 'standard' ? 'Standard Array' : tab === 'pointbuy' ? 'Point Buy' : 'Roll'}
          </button>
        ))}
      </div>

      {activeTab === 'standard' && renderStandardArray()}
      {activeTab === 'pointbuy' && renderPointBuy()}
      {activeTab === 'roll' && renderRoll()}

      {renderBgBonuses()}

      {/* Final scores preview */}
      <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ABILITIES.map((ab) => {
          const final = getFinalScore(ab);
          const bonus = getBgBonus(ab);
          return (
            <div key={ab} className="bg-gray-800 rounded p-2 text-center">
              <div className="text-xs text-gray-400">{ABILITY_LABELS[ab]}</div>
              <div className="text-xl font-bold text-white">{final}</div>
              {bonus > 0 && <div className="text-xs text-green-400">+{bonus} bg</div>}
              <div className="text-xs text-yellow-400">{modifier(final)}</div>
            </div>
          );
        })}
      </div>

      {validationError && <p className="text-red-400 text-sm mt-3">{validationError}</p>}

      <div className="flex justify-between mt-6">
        <button onClick={back} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button
          onClick={() => { saveScores(); next(); }}
          disabled={!canAdvance && !(assignments.str !== undefined)}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          Next: Skills & Feats →
        </button>
      </div>
    </div>
  );
}
