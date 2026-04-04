'use client';
import { useState, useCallback, useEffect } from 'react';
import type { DiceResult, DiceRollMode } from '@local-dungeon/shared';
import { useSocket } from './useSocket';

export interface DiceRollEntry {
  result: DiceResult;
  rolledBy: string;
  characterName?: string;
  isPrivate: boolean;
  timestamp: string;
}

export function useDiceRoller(sessionId: string) {
  const { socket } = useSocket();
  const [rolls, setRolls] = useState<DiceRollEntry[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handler = (entry: DiceRollEntry) => {
      setRolls((prev) => [entry, ...prev].slice(0, 10));
    };

    socket.on('game:dice_result', handler);
    return () => {
      socket.off('game:dice_result', handler);
    };
  }, [socket]);

  const roll = useCallback(
    (notationStr: string, mode: DiceRollMode, isPrivate: boolean, characterName?: string) => {
      if (!socket) return;
      socket.emit('game:roll_dice', { notationStr, mode, isPrivate, characterName, sessionId });
    },
    [socket, sessionId],
  );

  return { rolls, roll };
}
