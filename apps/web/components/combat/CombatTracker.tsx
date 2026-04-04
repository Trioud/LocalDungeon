'use client';
import type { CombatantState, ConditionName } from '@local-dungeon/shared';
import { useCombat } from '@/lib/hooks/useCombat';
import InitiativeList from './InitiativeList';
import CombatControls from './CombatControls';

interface CombatTrackerProps {
  sessionId: string;
}

export default function CombatTracker({ sessionId }: CombatTrackerProps) {
  const {
    combatState,
    initCombat,
    startCombat,
    endCombat,
    applyDamage,
    applyHealing,
    addCondition,
    removeCondition,
    nextTurn,
  } = useCombat(sessionId);

  function handleAddCombatant(
    c: Omit<CombatantState, 'isActive' | 'hasAction' | 'hasBonusAction' | 'hasReaction' | 'conditions' | 'exhaustionLevel' | 'isBloodied' | 'isConcentrating' | 'deathSaveSuccesses' | 'deathSaveFailures'>,
  ) {
    const full: CombatantState = {
      ...c,
      isActive: false,
      hasAction: true,
      hasBonusAction: true,
      hasReaction: true,
      conditions: [],
      exhaustionLevel: 0,
      isBloodied: false,
      isConcentrating: false,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
    };
    const existing = combatState?.combatants ?? [];
    initCombat([...existing, full]);
  }

  const isActive = combatState?.isActive ?? false;
  const combatants = combatState?.combatants ?? [];
  const round = combatState?.round ?? 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {isActive && (
        <div className="flex-1">
          <InitiativeList
            combatants={combatants}
            round={round}
            isActive={isActive}
            onNextTurn={nextTurn}
            onDamage={applyDamage}
            onHeal={applyHealing}
            onAddCondition={addCondition}
            onRemoveCondition={removeCondition}
          />
        </div>
      )}

      {!isActive && combatants.length > 0 && (
        <div className="flex-1">
          <InitiativeList
            combatants={combatants}
            round={round}
            isActive={false}
            onNextTurn={nextTurn}
            onDamage={applyDamage}
            onHeal={applyHealing}
            onAddCondition={addCondition}
            onRemoveCondition={removeCondition}
          />
        </div>
      )}

      <div className={isActive || combatants.length > 0 ? 'w-full lg:w-72' : 'w-full'}>
        <CombatControls
          isActive={isActive}
          onStart={startCombat}
          onEnd={endCombat}
          onAddCombatant={handleAddCombatant}
        />
      </div>
    </div>
  );
}
