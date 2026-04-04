'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { DiceResult } from '@local-dungeon/shared';

interface InspirationState {
  inspirationMap: Map<string, boolean>;
  useInspirationReroll: (combatantId: string, roll: DiceResult, dieIndex: number) => void;
  giftInspiration: (fromId: string, toId: string, sessionId: string) => void;
  hasInspiration: (combatantId: string) => boolean;
}

export function useInspirationState(
  socket: Socket | null,
  sessionId: string,
  initialMap: Record<string, boolean> = {},
): InspirationState {
  const [inspirationMap, setInspirationMap] = useState<Map<string, boolean>>(
    () => new Map(Object.entries(initialMap)),
  );

  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!socket) return;

    const onGranted = ({ combatantId }: { combatantId: string }) => {
      setInspirationMap((prev) => new Map(prev).set(combatantId, true));
    };

    const onUsed = ({ combatantId }: { combatantId: string }) => {
      setInspirationMap((prev) => new Map(prev).set(combatantId, false));
    };

    const onGifted = ({
      fromCombatantId,
      toCombatantId,
    }: {
      fromCombatantId: string;
      toCombatantId: string;
    }) => {
      setInspirationMap((prev) => {
        const next = new Map(prev);
        next.set(fromCombatantId, false);
        next.set(toCombatantId, true);
        return next;
      });
    };

    socket.on('inspiration:granted', onGranted);
    socket.on('inspiration:used', onUsed);
    socket.on('inspiration:gifted', onGifted);

    return () => {
      socket.off('inspiration:granted', onGranted);
      socket.off('inspiration:used', onUsed);
      socket.off('inspiration:gifted', onGifted);
    };
  }, [socket]);

  const useInspirationReroll = useCallback(
    (combatantId: string, roll: DiceResult, dieIndex: number) => {
      socket?.emit('inspiration:use', {
        sessionId: sessionIdRef.current,
        combatantId,
        originalRoll: roll,
        dieIndex,
      });
    },
    [socket],
  );

  const giftInspiration = useCallback(
    (fromId: string, toId: string, sid: string) => {
      socket?.emit('inspiration:gift', {
        sessionId: sid,
        fromCombatantId: fromId,
        toCombatantId: toId,
      });
    },
    [socket],
  );

  const hasInspiration = useCallback(
    (combatantId: string) => inspirationMap.get(combatantId) ?? false,
    [inspirationMap],
  );

  return { inspirationMap, useInspirationReroll, giftInspiration, hasInspiration };
}
