'use client';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ExportPanelProps {
  sessionId: string;
  characterNames?: string[];
}

export default function ExportPanel({ sessionId, characterNames = [] }: ExportPanelProps) {
  const [loading, setLoading] = useState<'text' | 'markdown' | 'json' | null>(null);

  function buildUrl(format: 'text' | 'markdown' | 'json') {
    const chars = characterNames.length > 0 ? `?characters=${encodeURIComponent(characterNames.join(','))}` : '';
    return `${API_BASE}/sessions/${sessionId}/export/${format}${chars}`;
  }

  async function handleDownload(format: 'text' | 'markdown' | 'json') {
    setLoading(format);
    try {
      const url = buildUrl(format);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'text' ? 'txt' : format === 'markdown' ? 'md' : 'json';
      a.download = `session-log.${ext}`;
      a.click();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Export Session Log</h2>
      <div className="flex gap-2">
        <button
          onClick={() => handleDownload('text')}
          disabled={loading !== null}
          className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loading === 'text' ? <span className="animate-spin">⟳</span> : null}
          TXT
        </button>
        <button
          onClick={() => handleDownload('markdown')}
          disabled={loading !== null}
          className="flex-1 py-2 px-3 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loading === 'markdown' ? <span className="animate-spin">⟳</span> : null}
          MD
        </button>
        <button
          onClick={() => handleDownload('json')}
          disabled={loading !== null}
          className="flex-1 py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loading === 'json' ? <span className="animate-spin">⟳</span> : null}
          JSON
        </button>
      </div>
    </div>
  );
}
