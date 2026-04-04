'use client';
import { useState } from 'react';
import type { MasteryProperty, WeaponMasteryEntry } from '@local-dungeon/shared';
import { getMasteryProperty, maxMasteriesForClass } from '@local-dungeon/shared';
import MasteryBadge from './MasteryBadge';

const ALL_PROPERTIES: MasteryProperty[] = [
  'cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex',
];

interface MasteryAssignPanelProps {
  combatantId: string;
  className: string;
  classLevel: number;
  assignedMasteries: WeaponMasteryEntry[];
  onAssign: (combatantId: string, weaponName: string, property: MasteryProperty) => void;
}

export default function MasteryAssignPanel({
  combatantId,
  className,
  classLevel,
  assignedMasteries,
  onAssign,
}: MasteryAssignPanelProps) {
  const [weaponInput, setWeaponInput] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<MasteryProperty>('cleave');
  const max = maxMasteriesForClass(className);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const weapon = weaponInput.trim();
    if (!weapon) return;
    onAssign(combatantId, weapon, selectedProperty);
    setWeaponInput('');
  }

  function handleAutoAssign() {
    const weapon = weaponInput.trim();
    if (!weapon) return;
    const suggested = getMasteryProperty(weapon);
    if (suggested) {
      onAssign(combatantId, weapon, suggested);
      setWeaponInput('');
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Weapon Mastery</h4>
        <span className="text-xs text-gray-500">
          {assignedMasteries.length}/{max} slots
        </span>
      </div>

      {assignedMasteries.length > 0 && (
        <div className="space-y-1">
          {assignedMasteries.map((entry) => (
            <div key={entry.weaponName} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 flex-1">{entry.weaponName}</span>
              <MasteryBadge property={entry.property} />
            </div>
          ))}
        </div>
      )}

      {assignedMasteries.length < max && (
        <form onSubmit={handleAdd} className="space-y-2">
          <input
            type="text"
            value={weaponInput}
            onChange={(e) => setWeaponInput(e.target.value)}
            placeholder="Weapon name"
            className="w-full text-xs border rounded px-2 py-1.5"
            aria-label="Weapon name"
          />
          <div className="flex gap-1">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value as MasteryProperty)}
              className="flex-1 text-xs border rounded px-2 py-1.5"
              aria-label="Mastery property"
            >
              {ALL_PROPERTIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Assign
            </button>
            <button
              type="button"
              onClick={handleAutoAssign}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="Auto-assign based on PHB weapon table"
            >
              Auto
            </button>
          </div>
        </form>
      )}

      {classLevel < (className.toLowerCase() === 'bard' ? 3 : 1) && (
        <p className="text-xs text-amber-600">
          {className} gains Weapon Mastery at level {className.toLowerCase() === 'bard' ? 3 : 1}
        </p>
      )}
    </div>
  );
}
