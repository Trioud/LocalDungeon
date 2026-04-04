'use client';
import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

export interface DeathSaveResult {
  combatantId: string;
  roll: number;
  successes: number;
  failures: number;
  outcome: 'none' | 'stable' | 'dead';
}

export interface DeathSaveOutcome {
  combatantId: string;
  outcome: 'stable' | 'dead';
}

export function useDeathSaves(sessionId: string) {
  const { socket } = useSocket();
  const [lastResult, setLastResult] = useState<DeathSaveResult | null>(null);
  const [lastOutcome, setLastOutcome] = useState<DeathSaveOutcome | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleResult = (data: DeathSaveResult) => setLastResult(data);
    const handleOutcome = (data: DeathSaveOutcome) => setLastOutcome(data);

    socket.on('combat:death_save_result', handleResult);
    socket.on('combat:death_save_outcome', handleOutcome);

    return () => {
      socket.off('combat:death_save_result', handleResult);
      socket.off('combat:death_save_outcome', handleOutcome);
    };
  }, [socket, sessionId]);

  const recordDeathSave = (combatantId: string, roll: number) => {
    socket?.emit('combat:record_death_save', { sessionId, combatantId, roll });
  };

  const stabilize = (combatantId: string) => {
    socket?.emit('combat:stabilize', { sessionId, combatantId });
  };

  return { lastResult, lastOutcome, recordDeathSave, stabilize };
}
