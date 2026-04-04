'use client';
import { useEffect } from 'react';
import type { ParsedCommand, CommandIntent } from '@local-dungeon/shared';

const INTENT_ICONS: Record<CommandIntent, string> = {
  roll_dice: '🎲',
  roll_skill: '🎲',
  roll_save: '🛡️',
  roll_attack: '⚔️',
  cast_spell: '✨',
  use_resource: '⚡',
  apply_damage: '💥',
  apply_healing: '💚',
  add_condition: '🔴',
  remove_condition: '🟢',
  end_turn: '⏭️',
  rest: '🏕️',
  chat: '💬',
};

function summarise(command: ParsedCommand): string {
  const { intent, entities } = command;
  switch (intent) {
    case 'roll_dice':
      return `Roll ${entities.diceNotation ?? 'dice'}`;
    case 'roll_skill': {
      const adv = entities.withAdvantage ? ' with Advantage' : entities.withDisadvantage ? ' with Disadvantage' : '';
      return `Roll ${entities.skillName ?? 'Skill'}${adv}`;
    }
    case 'roll_save':
      return `Roll ${entities.saveName ?? 'Saving Throw'} Save`;
    case 'roll_attack':
      return `Roll Attack${entities.targetName ? ` vs ${entities.targetName}` : ''}`;
    case 'cast_spell':
      return `Cast ${entities.spellName ?? 'Spell'}${entities.spellLevel ? ` (Level ${entities.spellLevel})` : ''}`;
    case 'use_resource':
      return `Use ${entities.resourceId ?? 'Resource'}`;
    case 'apply_damage':
      return `Apply ${entities.amount ?? '?'} Damage`;
    case 'apply_healing':
      return `Heal ${entities.amount ?? '?'} HP`;
    case 'add_condition':
      return `Add Condition: ${entities.conditionName ?? 'unknown'}`;
    case 'remove_condition':
      return `Remove Condition: ${entities.conditionName ?? 'unknown'}`;
    case 'end_turn':
      return 'End Turn';
    case 'rest':
      return 'Take a Rest';
    default:
      return 'Chat';
  }
}

interface CommandFeedbackProps {
  command: ParsedCommand;
  onConfirm: () => void;
  onDismiss: () => void;
  onConfirmAlternate: (alt: ParsedCommand) => void;
}

export default function CommandFeedback({ command, onConfirm, onDismiss, onConfirmAlternate }: CommandFeedbackProps) {
  const icon = INTENT_ICONS[command.intent];
  const summary = summarise(command);
  const alternate = command.alternates?.[0];

  useEffect(() => {
    const timer = setTimeout(() => { onDismiss(); }, 4000);
    return () => clearTimeout(timer);
  }, [command, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm shadow"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        <span className="font-medium">{summary}</span>
        <span className="ml-auto text-xs text-gray-500">{Math.round(command.confidence * 100)}%</span>
      </div>

      {alternate && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Did you mean:</span>
          <button
            type="button"
            className="rounded bg-amber-200 px-2 py-0.5 font-medium hover:bg-amber-300"
            onClick={() => onConfirmAlternate(alternate)}
          >
            {INTENT_ICONS[alternate.intent]} {summarise(alternate)}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
          onClick={onConfirm}
        >
          Yes
        </button>
        <button
          type="button"
          className="rounded bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300"
          onClick={onDismiss}
        >
          No
        </button>
      </div>
    </div>
  );
}
