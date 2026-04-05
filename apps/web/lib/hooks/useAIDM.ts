'use client';

import { useState, useCallback } from 'react';
import { sendAIDMMessage, fetchAIDMHistory, resetAIDMHistory } from '@/lib/api/aiDm';
import type { AIDMMessage } from '@/lib/api/aiDm';

export function useAIDM(sessionId: string) {
  const [messages, setMessages] = useState<AIDMMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const { history } = await fetchAIDMHistory(sessionId);
      setMessages(history);
      setInitialized(true);
    } catch {
      setInitialized(true);
    }
  }, [sessionId]);

  const send = useCallback(
    async (message: string) => {
      const isStart = messages.length === 0 && message === '';
      const userMessage: AIDMMessage = {
        role: 'user',
        content: isStart ? 'Begin the adventure.' : message,
      };

      if (!isStart) {
        setMessages((prev) => [...prev, userMessage]);
      }

      setIsLoading(true);
      setError(null);

      try {
        const { response } = await sendAIDMMessage(sessionId, message);
        const dmMessage: AIDMMessage = { role: 'assistant', content: response };
        setMessages((prev) => [...prev, dmMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'The DM is unavailable right now.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, messages.length]
  );

  const reset = useCallback(async () => {
    await resetAIDMHistory(sessionId);
    setMessages([]);
    setInitialized(false);
  }, [sessionId]);

  return { messages, isLoading, error, initialized, loadHistory, send, reset };
}
