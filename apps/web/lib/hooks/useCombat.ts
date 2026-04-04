'use client';
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { getCombatState } from '@/lib/api/combat';
import type { CombatState, CombatantState, ConditionName } from '@local-dungeon/shared';

export function useCombat(sessionId: string) {
  const { socket } = useSocket();
  const { data: initialState } = useQuery({
    queryKey: ['combat', sessionId],
    queryFn: () => getCombatState(sessionId),
    enabled: !!sessionId,
  });

  const [combatState, setCombatState] = useState<CombatState | null>(null);

  useEffect(() => {
    if (initialState && 'round' in initialState) {
      setCombatState(initialState as CombatState);
    }
  }, [initialState]);

  useEffect(() => {
    if (!socket) return;
    const handler = (state: CombatState) => setCombatState(state);
    socket.on('combat:state', handler);
    socket.emit('combat:get_state', { sessionId });
    return () => {
      socket.off('combat:state', handler);
    };
  }, [socket, sessionId]);

  const initCombat = useCallback(
    (combatants: CombatantState[]) => {
      socket?.emit('combat:init', { sessionId, combatants });
    },
    [socket, sessionId],
  );

  const startCombat = useCallback(() => {
    socket?.emit('combat:start', { sessionId });
  }, [socket, sessionId]);

  const endCombat = useCallback(() => {
    socket?.emit('combat:end', { sessionId });
  }, [socket, sessionId]);

  const applyDamage = useCallback(
    (combatantId: string, damage: number) => {
      socket?.emit('combat:damage', { sessionId, combatantId, damage });
    },
    [socket, sessionId],
  );

  const applyHealing = useCallback(
    (combatantId: string, amount: number) => {
      socket?.emit('combat:heal', { sessionId, combatantId, amount });
    },
    [socket, sessionId],
  );

  const addCondition = useCallback(
    (combatantId: string, condition: ConditionName) => {
      socket?.emit('combat:condition_add', { sessionId, combatantId, condition });
    },
    [socket, sessionId],
  );

  const removeCondition = useCallback(
    (combatantId: string, condition: ConditionName) => {
      socket?.emit('combat:condition_remove', { sessionId, combatantId, condition });
    },
    [socket, sessionId],
  );

  const nextTurn = useCallback(() => {
    socket?.emit('combat:next_turn', { sessionId });
  }, [socket, sessionId]);

  const recordDeathSave = useCallback(
    (combatantId: string, success: boolean) => {
      socket?.emit('combat:death_save', { sessionId, combatantId, success });
    },
    [socket, sessionId],
  );

  return {
    combatState,
    initCombat,
    startCombat,
    endCombat,
    applyDamage,
    applyHealing,
    addCondition,
    removeCondition,
    nextTurn,
    recordDeathSave,
  };
}
