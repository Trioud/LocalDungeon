'use client';
import { useState } from 'react';
import type { SpellcastingState, CastSpellParams, SpellLevel } from '@local-dungeon/shared';

interface Props {
  spellName: string;
  baseLevel: SpellLevel;
  spellcasting: SpellcastingState;
  onCast: (params: CastSpellParams) => void;
  onClose: () => void;
  requiresConcentration?: boolean;
  isRitualEligible?: boolean;
}

export default function CastSpellModal({
  spellName,
  baseLevel,
  spellcasting,
  onCast,
  onClose,
  requiresConcentration = false,
  isRitualEligible = false,
}: Props) {
  const [castAtLevel, setCastAtLevel] = useState<SpellLevel>(baseLevel);
  const [isRitual, setIsRitual] = useState(false);
  const [usePactMagic, setUsePactMagic] = useState(false);

  const availableSlots = spellcasting.slots.filter(
    (s) => s.level >= baseLevel && s.used < s.total,
  );
  const hasPactMagic =
    spellcasting.pactMagic !== undefined && spellcasting.pactMagic.used < spellcasting.pactMagic.total;

  const bonusActionBlocked =
    spellcasting.castBonusActionThisTurn && baseLevel > 0 && !isRitual;

  const willReplaceConcentration =
    requiresConcentration && !!spellcasting.concentrationSpell;

  function handleCast() {
    onCast({
      spellName,
      spellLevel: baseLevel,
      castAtLevel,
      isRitual,
      isBonusAction: false,
      requiresConcentration,
      usePactMagic,
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cast ${spellName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-80 space-y-4">
        <h2 className="text-lg font-semibold">{spellName}</h2>

        {baseLevel > 0 && !isRitual && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cast at level</label>
            <select
              value={castAtLevel}
              onChange={(e) => setCastAtLevel(Number(e.target.value) as SpellLevel)}
              className="w-full text-sm border rounded px-2 py-1"
            >
              {availableSlots.map((s) => (
                <option key={s.level} value={s.level}>
                  Level {s.level}
                  {s.level > baseLevel ? ` (upcast from ${baseLevel})` : ''}
                  {' '}— {s.total - s.used} remaining
                </option>
              ))}
              {hasPactMagic && spellcasting.pactMagic && (
                <option value={spellcasting.pactMagic.level}>
                  Pact Magic (Level {spellcasting.pactMagic.level}) — {spellcasting.pactMagic.total - spellcasting.pactMagic.used} remaining
                </option>
              )}
            </select>
          </div>
        )}

        {hasPactMagic && baseLevel > 0 && !isRitual && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={usePactMagic}
              onChange={(e) => setUsePactMagic(e.target.checked)}
            />
            Use Pact Magic slot
          </label>
        )}

        {isRitualEligible && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRitual}
              onChange={(e) => setIsRitual(e.target.checked)}
            />
            Cast as ritual (no slot used)
          </label>
        )}

        {willReplaceConcentration && (
          <p className="text-xs text-amber-600">
            ⚠ Will end concentration on {spellcasting.concentrationSpell}
          </p>
        )}

        {bonusActionBlocked && (
          <p className="text-xs text-red-600">
            ✗ Cannot cast a leveled spell — bonus action spell already cast this turn
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded border hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCast}
            disabled={bonusActionBlocked && !isRitual}
            className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Cast
          </button>
        </div>
      </div>
    </div>
  );
}
