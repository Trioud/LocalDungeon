'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

interface ClassLevelsResponse {
  classLevels: Record<string, number>;
  totalLevel: number;
}

async function fetchClassLevels(characterId: string): Promise<ClassLevelsResponse> {
  const { data } = await apiClient.get<ClassLevelsResponse>(`/characters/${characterId}/class-levels`);
  return data;
}

export function useMulticlass(characterId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['class-levels', characterId],
    queryFn: () => fetchClassLevels(characterId),
    enabled: !!characterId,
  });

  function getClassDisplay(): string {
    if (!data?.classLevels) return '';
    const entries = Object.entries(data.classLevels).filter(([, lvl]) => lvl > 0);
    return entries.map(([cls, lvl]) => `${cls} ${lvl}`).join(' / ');
  }

  return {
    classLevels: data?.classLevels ?? null,
    totalLevel: data?.totalLevel ?? null,
    isLoading,
    error,
    getClassDisplay,
  };
}
