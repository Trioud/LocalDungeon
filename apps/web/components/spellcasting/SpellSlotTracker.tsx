'use client';
import type { SpellcastingState } from '@local-dungeon/shared';

interface Props {
  spellcasting: SpellcastingState;
}

export default function SpellSlotTracker({ spellcasting }: Props) {
  const { slots, pactMagic } = spellcasting;
  const visibleSlots = slots.filter((s) => s.total > 0);

  function renderPips(total: number, used: number) {
    return Array.from({ length: total }, (_, i) => (
      <span key={i} className={i < used ? 'text-gray-300' : 'text-indigo-600'}>
        {i < used ? '○' : '●'}
      </span>
    ));
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Spell Slots</p>
      {visibleSlots.map((slot) => (
        <div key={slot.level} className="flex items-center gap-1 text-sm">
          <span className="w-14 text-xs text-gray-500">Level {slot.level}:</span>
          <span className="flex gap-0.5">{renderPips(slot.total, slot.used)}</span>
        </div>
      ))}
      {pactMagic && pactMagic.total > 0 && (
        <div className="flex items-center gap-1 text-sm mt-1">
          <span className="w-14 text-xs text-purple-600 font-medium">Pact:</span>
          <span className="flex gap-0.5">
            {Array.from({ length: pactMagic.total }, (_, i) => (
              <span key={i} className={i < pactMagic.used ? 'text-gray-300' : 'text-purple-600'}>
                {i < pactMagic.used ? '○' : '●'}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
