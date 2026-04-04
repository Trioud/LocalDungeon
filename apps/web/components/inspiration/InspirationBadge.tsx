'use client';
import { useState } from 'react';
import type { DiceResult } from '@local-dungeon/shared';
import DieRerollModal from './DieRerollModal';

interface InspirationBadgeProps {
  hasInspiration: boolean;
  characterName: string;
  isOwn: boolean;
  lastRoll?: DiceResult;
  sessionPlayers?: Array<{ id: string; name: string; hasInspiration: boolean }>;
  onUse?: (dieIndex: number) => void;
  onGift?: (toCharacterId: string) => void;
}

export default function InspirationBadge({
  hasInspiration,
  characterName,
  isOwn,
  lastRoll,
  sessionPlayers = [],
  onUse,
  onGift,
}: InspirationBadgeProps) {
  const [showRerollModal, setShowRerollModal] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);

  const eligibleRecipients = sessionPlayers.filter((p) => !p.hasInspiration);

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`text-base transition-all ${hasInspiration ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]' : 'text-gray-300'}`}
        title={hasInspiration ? `${characterName} has Heroic Inspiration` : 'No Heroic Inspiration'}
        aria-label={hasInspiration ? 'Has Heroic Inspiration' : 'No Heroic Inspiration'}
      >
        ⭐
      </span>

      {isOwn && hasInspiration && (
        <>
          <button
            onClick={() => setShowRerollModal(true)}
            className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
            aria-label="Use Heroic Inspiration to reroll"
          >
            Use
          </button>
          <button
            onClick={() => setShowGiftPicker((v) => !v)}
            className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            aria-label="Gift Heroic Inspiration"
          >
            Gift
          </button>

          {showGiftPicker && eligibleRecipients.length > 0 && (
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-lg p-2 min-w-[140px]">
              <p className="text-xs text-gray-500 mb-1">Gift to:</p>
              {eligibleRecipients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onGift?.(p.id);
                    setShowGiftPicker(false);
                  }}
                  className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-100 rounded"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showRerollModal && lastRoll && (
        <DieRerollModal
          roll={lastRoll}
          onReroll={(dieIndex) => {
            onUse?.(dieIndex);
            setShowRerollModal(false);
          }}
          onClose={() => setShowRerollModal(false)}
        />
      )}
    </span>
  );
}
