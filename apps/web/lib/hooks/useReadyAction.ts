'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { ReadyAction, OpportunityAttack } from '@local-dungeon/shared';

interface UseReadyActionOptions {
  socket: Socket | null;
  sessionId: string;
}

export function useReadyAction({ socket, sessionId }: UseReadyActionOptions) {
  const [readyActions, setReadyActions] = useState<Record<string, ReadyAction>>({});
  const [recentOppAttacks, setRecentOppAttacks] = useState<OpportunityAttack[]>([]);

  useEffect(() => {
    if (!socket) return;

    function onReadyActionUpdated(data: { combatantId: string; readyAction: ReadyAction }) {
      setReadyActions((prev) => ({ ...prev, [data.combatantId]: data.readyAction }));
    }

    function onReadyActionFired(data: { combatantId: string; action: ReadyAction }) {
      setReadyActions((prev) => ({ ...prev, [data.combatantId]: data.action }));
    }

    function onOpportunityAttackTriggered(data: { attack: OpportunityAttack }) {
      setRecentOppAttacks((prev) => [data.attack, ...prev].slice(0, 5));
    }

    socket.on('combat:ready_action_updated', onReadyActionUpdated);
    socket.on('combat:ready_action_fired', onReadyActionFired);
    socket.on('combat:opportunity_attack_triggered', onOpportunityAttackTriggered);

    return () => {
      socket.off('combat:ready_action_updated', onReadyActionUpdated);
      socket.off('combat:ready_action_fired', onReadyActionFired);
      socket.off('combat:opportunity_attack_triggered', onOpportunityAttackTriggered);
    };
  }, [socket]);

  const setReadyAction = useCallback(
    (combatantId: string, trigger: string, actionDescription: string, expiresOnTurn: number) => {
      socket?.emit('combat:ready_action_set', { sessionId, combatantId, trigger, actionDescription, expiresOnTurn });
    },
    [socket, sessionId],
  );

  const fireReadyAction = useCallback(
    (combatantId: string) => {
      socket?.emit('combat:ready_action_fire', { sessionId, combatantId });
    },
    [socket, sessionId],
  );

  const triggerOpportunityAttack = useCallback(
    (attackerId: string, targetId: string) => {
      socket?.emit('combat:opportunity_attack', { sessionId, attackerId, targetId });
    },
    [socket, sessionId],
  );

  return { readyActions, recentOppAttacks, setReadyAction, fireReadyAction, triggerOpportunityAttack };
}
