'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSession, listSessions, getSession, joinSession, leaveSession } from '@/lib/api/sessions';

export function useSessionList() {
  return useQuery({ queryKey: ['sessions'], queryFn: listSessions });
}

export function useSessionInfo(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useJoinSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, characterId }: { id: string; characterId: string }) =>
      joinSession(id, characterId),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['session', id] }),
  });
}

export function useLeaveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
