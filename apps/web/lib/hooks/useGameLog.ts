'use client';
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GameLogEntry } from '@local-dungeon/shared';
import { getSessionLog } from '@/lib/api/gamelog';
import { useSocket } from './useSocket';

export function useGameLog(sessionId: string) {
  const { socket } = useSocket();
  const [entries, setEntries] = useState<GameLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['gamelog', sessionId],
    queryFn: () => getSessionLog(sessionId, { limit: 50 }),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (data) {
      setEntries(data.events);
      setNextCursor(data.nextCursor);
    }
  }, [data]);

  useEffect(() => {
    if (!socket) return;

    const handler = (entry: GameLogEntry) => {
      setEntries((prev) => [entry, ...prev]);
    };

    socket.on('game:log_entry', handler);
    return () => {
      socket.off('game:log_entry', handler);
    };
  }, [socket]);

  const sendChat = useCallback(
    (message: string, characterName?: string) => {
      if (!socket) return;
      socket.emit('game:chat', { message, sessionId, characterName });
    },
    [socket, sessionId],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const result = await getSessionLog(sessionId, { limit: 50, before: nextCursor });
    setEntries((prev) => [...prev, ...result.events]);
    setNextCursor(result.nextCursor);
  }, [sessionId, nextCursor]);

  return { entries, isLoading, sendChat, loadMore, hasMore: !!nextCursor };
}
