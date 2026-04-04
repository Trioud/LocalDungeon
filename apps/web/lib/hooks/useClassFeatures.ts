'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ClassResource } from '@local-dungeon/shared';

export function useClassFeatures(socket: any, sessionId: string) {
  const [resourcesMap, setResourcesMap] = useState<Record<string, ClassResource[]>>({});

  useEffect(() => {
    if (!socket) return;

    function onResourceUsed({
      combatantId,
      resources,
    }: {
      combatantId: string;
      resourceId: string;
      resources: ClassResource[];
    }) {
      setResourcesMap((prev) => ({ ...prev, [combatantId]: resources }));
    }

    function onResourcesInitialized({
      combatantId,
      resources,
    }: {
      combatantId: string;
      resources: ClassResource[];
    }) {
      setResourcesMap((prev) => ({ ...prev, [combatantId]: resources }));
    }

    socket.on('feature:resource_used', onResourceUsed);
    socket.on('feature:resources_initialized', onResourcesInitialized);

    return () => {
      socket.off('feature:resource_used', onResourceUsed);
      socket.off('feature:resources_initialized', onResourcesInitialized);
    };
  }, [socket]);

  const useResource = useCallback(
    (combatantId: string, resourceId: string, amount?: number) => {
      socket?.emit('feature:use_resource', { sessionId, combatantId, resourceId, amount });
    },
    [socket, sessionId],
  );

  const initResources = useCallback(
    (combatantId: string, classLevels: Record<string, number>, profBonus: number) => {
      socket?.emit('feature:init_resources', { sessionId, combatantId, classLevels, profBonus });
    },
    [socket, sessionId],
  );

  const getResources = useCallback(
    (combatantId: string): ClassResource[] => resourcesMap[combatantId] ?? [],
    [resourcesMap],
  );

  return { useResource, initResources, getResources, resourcesMap };
}
