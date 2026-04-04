'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RestProposal, RestType } from '@local-dungeon/shared';

type RestPhase = 'idle' | 'proposed' | 'spending_hd' | 'complete';

interface HitDiceResult {
  combatantId: string;
  hpGained: number;
  newHp: number;
  hdRemaining: number;
}

export function useRest(socket: any, sessionId: string) {
  const [proposal, setProposal] = useState<RestProposal | null>(null);
  const [phase, setPhase] = useState<RestPhase>('idle');
  const [lastHitDiceResult, setLastHitDiceResult] = useState<HitDiceResult | null>(null);

  useEffect(() => {
    if (!socket) return;

    function onProposed({ proposal: p }: { proposal: RestProposal }) {
      setProposal(p);
      setPhase('proposed');
    }

    function onConfirmationUpdate({ proposal: p }: { proposal: RestProposal }) {
      setProposal(p);
    }

    function onExecuted({ proposal: p }: { proposal: RestProposal }) {
      setProposal(p);
      const isShort = p.restType === 'short';
      setPhase(isShort ? 'spending_hd' : 'complete');
    }

    function onCancelled() {
      setProposal(null);
      setPhase('idle');
    }

    function onHitDiceResult(result: HitDiceResult) {
      setLastHitDiceResult(result);
    }

    socket.on('rest:proposed', onProposed);
    socket.on('rest:confirmation_update', onConfirmationUpdate);
    socket.on('rest:executed', onExecuted);
    socket.on('rest:cancelled', onCancelled);
    socket.on('rest:hit_dice_result', onHitDiceResult);

    return () => {
      socket.off('rest:proposed', onProposed);
      socket.off('rest:confirmation_update', onConfirmationUpdate);
      socket.off('rest:executed', onExecuted);
      socket.off('rest:cancelled', onCancelled);
      socket.off('rest:hit_dice_result', onHitDiceResult);
    };
  }, [socket]);

  const proposeRest = useCallback(
    (restType: RestType) => {
      socket?.emit('rest:propose', { sessionId, restType });
    },
    [socket, sessionId],
  );

  const confirmRest = useCallback(() => {
    socket?.emit('rest:confirm', { sessionId });
  }, [socket, sessionId]);

  const cancelRest = useCallback(() => {
    socket?.emit('rest:cancel', { sessionId });
  }, [socket, sessionId]);

  const spendHitDice = useCallback(
    (combatantId: string, diceCount: number) => {
      socket?.emit('rest:spend_hit_dice', { sessionId, combatantId, diceCount });
    },
    [socket, sessionId],
  );

  const finishHitDicePhase = useCallback(() => {
    setPhase('complete');
  }, []);

  return {
    proposal,
    phase,
    lastHitDiceResult,
    proposeRest,
    confirmRest,
    cancelRest,
    spendHitDice,
    finishHitDicePhase,
  };
}
