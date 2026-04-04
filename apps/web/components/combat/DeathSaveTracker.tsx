'use client';
import type { CombatantState } from '@local-dungeon/shared';

interface DeathSaveTrackerProps {
  combatant: CombatantState;
}

export default function DeathSaveTracker({ combatant }: DeathSaveTrackerProps) {
  const { deathSaveSuccesses, deathSaveFailures, isStable } = combatant;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
      <div className="text-xs font-medium text-gray-700 mb-1">
        Death Saves {isStable && <span className="text-green-600 ml-1">(Stable)</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Successes:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-4 h-4 rounded-full border-2 ${
                i < deathSaveSuccesses
                  ? 'bg-green-500 border-green-600'
                  : 'bg-white border-gray-400'
              }`}
              aria-label={i < deathSaveSuccesses ? 'success' : 'empty'}
              role="img"
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Failures:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-4 h-4 text-center leading-4 ${
                i < deathSaveFailures ? 'text-red-600' : 'text-gray-300'
              }`}
              aria-label={i < deathSaveFailures ? 'failure' : 'empty'}
              role="img"
            >
              {i < deathSaveFailures ? '💀' : '☠'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
