'use client';
import type { MasteryProperty } from '@local-dungeon/shared';

const PROPERTY_COLORS: Record<MasteryProperty, string> = {
  cleave: 'bg-red-100 text-red-700 border-red-200',
  graze: 'bg-orange-100 text-orange-700 border-orange-200',
  nick: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  push: 'bg-blue-100 text-blue-700 border-blue-200',
  sap: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  slow: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  topple: 'bg-amber-100 text-amber-700 border-amber-200',
  vex: 'bg-purple-100 text-purple-700 border-purple-200',
};

const PROPERTY_DESCRIPTIONS: Record<MasteryProperty, string> = {
  cleave: 'On hit: make a free attack against a nearby creature (no modifier to damage)',
  graze: 'On miss: deal ability modifier damage (min 1) to the target',
  nick: 'On hit with Light weapon: make a free off-hand attack',
  push: 'On hit: target must succeed on STR save or be pushed 10 feet',
  sap: 'On hit: target has Disadvantage on its next attack roll',
  slow: "On hit: target's speed reduced by 10 feet until your next turn",
  topple: 'On hit: target must succeed on CON save or fall Prone',
  vex: 'On hit: your next attack against this target has Advantage',
};

interface MasteryBadgeProps {
  property: MasteryProperty;
}

export default function MasteryBadge({ property }: MasteryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border cursor-help ${PROPERTY_COLORS[property]}`}
      title={PROPERTY_DESCRIPTIONS[property]}
      aria-label={`${property} mastery: ${PROPERTY_DESCRIPTIONS[property]}`}
    >
      {property.charAt(0).toUpperCase() + property.slice(1)}
    </span>
  );
}
