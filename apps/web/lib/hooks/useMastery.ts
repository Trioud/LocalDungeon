'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { MasteryEffect, MasteryProperty } from '@local-dungeon/shared';

interface UseMasteryOptions {
  socket: Socket | null;
  sessionId: string;
}

export function useMastery({ socket, sessionId }: UseMasteryOptions) {
  const [lastEffect, setLastEffect] = useState<MasteryEffect | null>(null);

  useEffect(() => {
    if (!socket) return;
    function onMasteryApplied(effect: MasteryEffect) {
      setLastEffect(effect);
    }
    socket.on('combat:mastery_applied', onMasteryApplied);
    return () => {
      socket.off('combat:mastery_applied', onMasteryApplied);
    };
  }, [socket]);

  const applyMastery = useCallback(
    (params: {
      attackerId: string;
      targetId: string;
      weaponName: string;
      hit: boolean;
      abilityMod: number;
      profBonus: number;
      targetSaveRoll?: number;
    }) => {
      socket?.emit('combat:apply_mastery', { sessionId, ...params });
    },
    [socket, sessionId],
  );

  const assignMastery = useCallback(
    (params: {
      combatantId: string;
      weaponName: string;
      property: MasteryProperty;
      className: string;
      classLevel: number;
    }) => {
      socket?.emit('combat:assign_mastery', { sessionId, ...params });
    },
    [socket, sessionId],
  );

  const clearLastEffect = useCallback(() => setLastEffect(null), []);

  return { lastEffect, applyMastery, assignMastery, clearLastEffect };
}
