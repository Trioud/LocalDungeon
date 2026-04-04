'use client';
import type { ConditionName } from '@local-dungeon/shared';

const CONDITION_COLORS: Record<ConditionName, string> = {
  blinded: 'bg-gray-700 text-white',
  charmed: 'bg-pink-200 text-pink-800',
  deafened: 'bg-yellow-200 text-yellow-800',
  exhaustion: 'bg-orange-200 text-orange-800',
  frightened: 'bg-purple-200 text-purple-800',
  grappled: 'bg-blue-200 text-blue-800',
  incapacitated: 'bg-red-300 text-red-900',
  invisible: 'bg-indigo-200 text-indigo-800',
  paralyzed: 'bg-red-200 text-red-800',
  petrified: 'bg-stone-400 text-stone-900',
  poisoned: 'bg-green-200 text-green-800',
  prone: 'bg-amber-200 text-amber-800',
  restrained: 'bg-cyan-200 text-cyan-800',
  stunned: 'bg-violet-200 text-violet-800',
  unconscious: 'bg-gray-900 text-white',
};

interface ConditionBadgeProps {
  condition: ConditionName;
  onRemove?: () => void;
}

export default function ConditionBadge({ condition, onRemove }: ConditionBadgeProps) {
  const color = CONDITION_COLORS[condition] ?? 'bg-gray-200 text-gray-800';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>
      {condition}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-75" aria-label={`Remove ${condition}`}>
          ×
        </button>
      )}
    </span>
  );
}
