'use client';
import { useState, useCallback } from 'react';
import type { SessionSummary } from '@local-dungeon/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function useSessionLog(sessionId: string) {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/export/json`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to fetch session log: ${res.status}`);
      const data = (await res.json()) as SessionSummary;
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const downloadExport = useCallback(
    (format: 'text' | 'markdown' | 'json') => {
      const ext = format === 'text' ? 'txt' : format === 'markdown' ? 'md' : 'json';
      const url = `${API_BASE}/sessions/${sessionId}/export/${format}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-log.${ext}`;
      a.click();
    },
    [sessionId],
  );

  return { summary, loading, error, fetchSummary, downloadExport };
}
