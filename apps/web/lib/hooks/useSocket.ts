'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/authStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    socketRef.current = socket;
    setStatus('connecting');
    socket.connect();

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  return { socket: socketRef.current, status };
}
