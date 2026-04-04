'use client';
import { useCallback, useEffect, useState } from 'react';
import type { ParsedCommand } from '@local-dungeon/shared';
import { useSocket } from './useSocket';

export function useCommandParser() {
  const { socket } = useSocket();
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);

  const dispatchCommand = useCallback(
    (command: ParsedCommand) => {
      if (!socket) return;
      const { intent, entities } = command;

      if (
        intent === 'roll_dice' || intent === 'roll_skill' ||
        intent === 'roll_save' || intent === 'roll_attack'
      ) {
        const notation = entities.diceNotation ?? 'd20';
        const mode = entities.withAdvantage
          ? 'advantage'
          : entities.withDisadvantage
          ? 'disadvantage'
          : 'normal';
        socket.emit('game:roll_dice', { notationStr: notation, mode, isPrivate: false, sessionId: '' });
      } else if (intent === 'cast_spell') {
        socket.emit('spell:cast', {
          sessionId: '',
          combatantId: '',
          params: { spellName: entities.spellName ?? '', slotLevel: entities.spellLevel ?? 1 },
        });
      } else if (intent === 'use_resource') {
        socket.emit('feature:use_resource', {
          sessionId: '',
          combatantId: '',
          resourceId: entities.resourceId ?? '',
        });
      } else if (intent === 'apply_damage') {
        socket.emit('combat:apply_damage', { amount: entities.amount ?? 0, targetName: entities.targetName });
      } else if (intent === 'apply_healing') {
        socket.emit('combat:apply_healing', { amount: entities.amount ?? 0, targetName: entities.targetName });
      } else if (intent === 'add_condition') {
        socket.emit('combat:add_condition', { conditionName: entities.conditionName });
      } else if (intent === 'remove_condition') {
        socket.emit('combat:remove_condition', { conditionName: entities.conditionName });
      } else if (intent === 'end_turn') {
        socket.emit('combat:advance_turn', {});
      } else if (intent === 'rest') {
        socket.emit('rest:propose', { restType: 'short' });
      } else {
        socket.emit('game:chat', { message: command.raw, sessionId: '' });
      }
    },
    [socket],
  );

  useEffect(() => {
    if (!socket) return;

    const onCommandParsed = (data: { command: ParsedCommand }) => {
      const { command } = data;
      if (command.confidence >= 0.7) {
        dispatchCommand(command);
      } else {
        setPendingCommand(command);
      }
    };

    socket.on('command:parsed', onCommandParsed);
    return () => { socket.off('command:parsed', onCommandParsed); };
  }, [socket, dispatchCommand]);

  const confirmCommand = useCallback(() => {
    if (pendingCommand) {
      dispatchCommand(pendingCommand);
      setPendingCommand(null);
    }
  }, [pendingCommand, dispatchCommand]);

  const dismissCommand = useCallback((command: ParsedCommand) => {
    if (socket) {
      socket.emit('game:chat', { message: command.raw, sessionId: '' });
    }
    setPendingCommand(null);
  }, [socket]);

  const confirmAlternate = useCallback((alternate: ParsedCommand) => {
    dispatchCommand(alternate);
    setPendingCommand(null);
  }, [dispatchCommand]);

  return { pendingCommand, dispatchCommand, confirmCommand, dismissCommand, confirmAlternate };
}
