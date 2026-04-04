'use client';
import type { CombatantState, ConditionName } from '@local-dungeon/shared';
import CombatantCard from './CombatantCard';

interface InitiativeListProps {
  combatants: CombatantState[];
  round: number;
  isActive: boolean;
  onNextTurn: () => void;
  onDamage: (id: string, amount: number) => void;
  onHeal: (id: string, amount: number) => void;
  onAddCondition: (id: string, condition: ConditionName) => void;
  onRemoveCondition: (id: string, condition: ConditionName) => void;
}

export default function InitiativeList({
  combatants,
  round,
  isActive,
  onNextTurn,
  onDamage,
  onHeal,
  onAddCondition,
  onRemoveCondition,
}: InitiativeListProps) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">
          ⚔️ Initiative — Round {round}
        </h2>
        {isActive && (
          <button
            onClick={onNextTurn}
            className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Next Turn →
          </button>
        )}
      </div>

      {combatants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No combatants yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {combatants.map((c) => (
            <CombatantCard
              key={c.id}
              combatant={c}
              isActive={c.isActive}
              onDamage={onDamage}
              onHeal={onHeal}
              onAddCondition={onAddCondition}
              onRemoveCondition={onRemoveCondition}
            />
          ))}
        </div>
      )}
    </div>
  );
}
