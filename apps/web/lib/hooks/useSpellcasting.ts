'use client';
import { useState, useEffect, useCallback } from 'react';
import type { SpellcastingState, CastSpellParams } from '@local-dungeon/shared';

export function useSpellcasting(socket: any, sessionId: string) {
  const [spellcastingMap, setSpellcastingMap] = useState<Record<string, SpellcastingState>>({});

  useEffect(() => {
    if (!socket) return;

    function onCastResult({ combatant }: { combatant: { id: string; spellcasting?: SpellcastingState } }) {
      if (combatant.spellcasting) {
        setSpellcastingMap((prev) => ({ ...prev, [combatant.id]: combatant.spellcasting! }));
      }
    }

    function onConcentrationEnded({ combatant }: { combatant: { id: string; spellcasting?: SpellcastingState } }) {
      if (combatant.spellcasting) {
        setSpellcastingMap((prev) => ({ ...prev, [combatant.id]: combatant.spellcasting! }));
      }
    }

    socket.on('spell:cast_result', onCastResult);
    socket.on('spell:concentration_ended', onConcentrationEnded);

    return () => {
      socket.off('spell:cast_result', onCastResult);
      socket.off('spell:concentration_ended', onConcentrationEnded);
    };
  }, [socket]);

  const castSpell = useCallback(
    (combatantId: string, params: CastSpellParams) => {
      socket?.emit('spell:cast', { sessionId, combatantId, params });
    },
    [socket, sessionId],
  );

  const endConcentration = useCallback(
    (combatantId: string) => {
      socket?.emit('spell:end_concentration', { sessionId, combatantId });
    },
    [socket, sessionId],
  );

  const getSpellcasting = useCallback(
    (combatantId: string): SpellcastingState | undefined => spellcastingMap[combatantId],
    [spellcastingMap],
  );

  return { castSpell, endConcentration, getSpellcasting, spellcastingMap };
}
