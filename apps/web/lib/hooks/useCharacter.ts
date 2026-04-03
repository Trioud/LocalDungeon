'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCharacter, patchCharacter, deleteCharacter, listCharacters } from '@/lib/api/characters';
import type { Character } from '@/lib/api/characters';

export function useCharacterList() {
  return useQuery({ queryKey: ['characters'], queryFn: listCharacters });
}

export function useCharacter(id: string) {
  return useQuery({ queryKey: ['character', id], queryFn: () => getCharacter(id), enabled: !!id });
}

export function usePatchCharacter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Character>) => patchCharacter(id, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['character', id] });
      const prev = qc.getQueryData<Character>(['character', id]);
      qc.setQueryData(['character', id], (old: Character | undefined) => old ? { ...old, ...patch } : old);
      return { prev };
    },
    onError: (_err: unknown, _patch: Partial<Character>, ctx: { prev: Character | undefined } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['character', id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['character', id] }),
  });
}

export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCharacter,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['characters'] }),
  });
}
