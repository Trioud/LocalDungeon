'use client';
import { useState } from 'react';
import type { CombatantState, ConditionName } from '@local-dungeon/shared';
import ConditionBadge from './ConditionBadge';
import DeathSaveTracker from './DeathSaveTracker';

const ALL_CONDITIONS: ConditionName[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone',
  'restrained', 'stunned', 'unconscious',
];

interface CombatantCardProps {
  combatant: CombatantState;
  isActive: boolean;
  onDamage: (id: string, amount: number) => void;
  onHeal: (id: string, amount: number) => void;
  onAddCondition: (id: string, condition: ConditionName) => void;
  onRemoveCondition: (id: string, condition: ConditionName) => void;
}

export default function CombatantCard({
  combatant,
  isActive,
  onDamage,
  onHeal,
  onAddCondition,
  onRemoveCondition,
}: CombatantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<ConditionName>('blinded');

  const hpPct = combatant.maxHp > 0 ? (combatant.hp / combatant.maxHp) * 100 : 0;
  const hpColor = hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  function handleDamage() {
    const val = parseInt(damageInput, 10);
    if (!isNaN(val) && val > 0) {
      onDamage(combatant.id, val);
      setDamageInput('');
    }
  }

  function handleHeal() {
    const val = parseInt(healInput, 10);
    if (!isNaN(val) && val > 0) {
      onHeal(combatant.id, val);
      setHealInput('');
    }
  }

  const isUnconscious = combatant.conditions.includes('unconscious');

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isActive ? 'border-red-500 bg-red-50 shadow-md' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{combatant.name}</span>
            {combatant.isBloodied && (
              <span className="text-xs text-red-600 font-medium">🩸 Bloodied</span>
            )}
            {combatant.isConcentrating && (
              <span className="text-xs text-purple-600 font-medium">🔮 Conc.</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span>Init: {combatant.initiative}</span>
            <span>AC: {combatant.ac}</span>
            <span className={isUnconscious ? 'text-red-600 font-medium' : ''}>
              HP: {combatant.hp}/{combatant.maxHp}
              {combatant.tempHp > 0 && <span className="text-blue-600"> (+{combatant.tempHp})</span>}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* HP bar */}
      <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hpColor}`}
          style={{ width: `${hpPct}%` }}
          role="progressbar"
          aria-valuenow={combatant.hp}
          aria-valuemin={0}
          aria-valuemax={combatant.maxHp}
          aria-label="HP bar"
        />
      </div>

      {/* Conditions */}
      {combatant.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {combatant.conditions.map((cond) => (
            <ConditionBadge
              key={cond}
              condition={cond}
              onRemove={() => onRemoveCondition(combatant.id, cond)}
            />
          ))}
        </div>
      )}

      {/* Death saves (shown when at 0 HP) */}
      {combatant.hp === 0 && (
        <DeathSaveTracker combatant={combatant} />
      )}

      {/* Expanded controls */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {/* Damage & Heal */}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1">
              <input
                type="number"
                min={1}
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                placeholder="Dmg"
                className="w-full text-xs border rounded px-2 py-1"
                aria-label="Damage amount"
              />
              <button
                onClick={handleDamage}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Hit
              </button>
            </div>
            <div className="flex-1 flex gap-1">
              <input
                type="number"
                min={1}
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                placeholder="Heal"
                className="w-full text-xs border rounded px-2 py-1"
                aria-label="Heal amount"
              />
              <button
                onClick={handleHeal}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Heal
              </button>
            </div>
          </div>

          {/* Add condition */}
          <div className="flex gap-1">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value as ConditionName)}
              className="flex-1 text-xs border rounded px-2 py-1"
              aria-label="Select condition"
            >
              {ALL_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => onAddCondition(combatant.id, selectedCondition)}
              className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
