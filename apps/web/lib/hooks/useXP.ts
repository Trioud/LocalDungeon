'use client';
import { useState, useEffect, useCallback } from 'react';
import { xpToLevel, levelToXP } from '@local-dungeon/shared';
import apiClient from '@/lib/apiClient';
import { useSocket } from '@/lib/hooks/useSocket';

interface UseXPOptions {
  characterId: string;
  initialXP?: number;
}

interface AwardXPResult {
  newXP: number;
  leveledUp: boolean;
  newLevel: number;
}

export function useXP({ characterId, initialXP = 0 }: UseXPOptions) {
  const [xp, setXP] = useState(initialXP);
  const [level, setLevel] = useState(() => xpToLevel(initialXP));
  const [levelUpAvailable, setLevelUpAvailable] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    setXP(initialXP);
    const lvl = xpToLevel(initialXP);
    setLevel(lvl);
    setLevelUpAvailable(lvl < 20 && initialXP >= levelToXP(lvl + 1 as Parameters<typeof levelToXP>[0]));
  }, [initialXP]);

  useEffect(() => {
    if (!socket) return;

    function onXPGained({ newXP, leveledUp, newLevel }: AwardXPResult) {
      setXP(newXP);
      setLevel(newLevel);
      if (leveledUp) setLevelUpAvailable(true);
    }

    function onLevelUpAvailable() {
      setLevelUpAvailable(true);
    }

    socket.on('character:xp_gained', onXPGained);
    socket.on('character:level_up_available', onLevelUpAvailable);

    return () => {
      socket.off('character:xp_gained', onXPGained);
      socket.off('character:level_up_available', onLevelUpAvailable);
    };
  }, [socket]);

  const awardXP = useCallback(
    async (amount: number): Promise<AwardXPResult> => {
      const res = await apiClient.post<AwardXPResult>(`/characters/${characterId}/award-xp`, { xp: amount });
      const result = res.data;
      setXP(result.newXP);
      setLevel(result.newLevel);
      if (result.leveledUp) setLevelUpAvailable(true);
      return result;
    },
    [characterId],
  );

  const dismissLevelUp = useCallback(() => {
    setLevelUpAvailable(false);
  }, []);

  return { xp, level, levelUpAvailable, awardXP, dismissLevelUp };
}
