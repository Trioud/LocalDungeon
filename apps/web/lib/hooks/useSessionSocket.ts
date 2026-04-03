'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

export function useSessionSocket(sessionId: string) {
  const { socket, status } = useSocket();
  const qc = useQueryClient();
  const [connectedUserIds, setConnectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!socket || status !== 'connected' || !sessionId) return;

    socket.emit('session:join', { sessionId });

    socket.on('session:players_updated', ({ players }: { players: string[] }) => {
      setConnectedUserIds(players);
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
    });

    socket.on('game:state_update', () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
    });

    socket.on('connect', () => {
      socket.emit('session:join', { sessionId });
    });

    return () => {
      socket.emit('session:leave', { sessionId });
      socket.off('session:players_updated');
      socket.off('game:state_update');
    };
  }, [socket, status, sessionId, qc]);

  const ping = useCallback(() => {
    return new Promise<number>((resolve) => {
      if (!socket) return resolve(-1);
      const start = Date.now();
      socket.emit('game:ping');
      socket.once('game:pong', () => resolve(Date.now() - start));
    });
  }, [socket]);

  return { status, connectedUserIds, ping };
}
