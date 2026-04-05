'use client';

import { useEffect, useRef, useState } from 'react';
import { useAIDM } from '@/lib/hooks/useAIDM';

interface Props {
  sessionId: string;
}

export default function AIDMPanel({ sessionId }: Props) {
  const { messages, isLoading, error, initialized, loadHistory, send, reset } =
    useAIDM(sessionId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Auto-start the adventure when history is empty
  useEffect(() => {
    if (initialized && messages.length === 0 && !isLoading) {
      void send('');
    }
  }, [initialized, messages.length, isLoading, send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    void send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 rounded-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-amber-900/40">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <span>📜</span>
          <span>Dungeon Master</span>
        </div>
        <button
          onClick={() => void reset()}
          title="Restart adventure"
          className="text-stone-400 hover:text-amber-400 text-xs px-2 py-1 rounded hover:bg-stone-800 transition-colors"
        >
          ↺ Restart
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && isLoading && (
          <div className="flex items-center gap-2 text-amber-400/70 text-sm">
            <span className="animate-pulse">⏳</span>
            <span>The Dungeon Master prepares the scene…</span>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === 'assistant' ? (
            <div key={i} className="space-y-1">
              <p className="text-xs text-amber-500/60 font-semibold uppercase tracking-wider">
                🎲 Dungeon Master
              </p>
              <div className="text-amber-100 text-sm leading-relaxed whitespace-pre-wrap font-serif bg-stone-900/60 rounded-lg px-4 py-3 border border-amber-900/20">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] bg-indigo-900/50 border border-indigo-700/40 rounded-lg px-4 py-2 text-sm text-indigo-100">
                {msg.content}
              </div>
            </div>
          )
        )}

        {isLoading && messages.length > 0 && (
          <div className="flex items-center gap-2 text-amber-400/60 text-sm pl-1">
            <span className="animate-pulse">⏳</span>
            <span>The DM is thinking…</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-stone-900 border-t border-amber-900/40">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your action or type a number to choose… (Enter to send)"
            className="flex-1 resize-none min-h-[48px] max-h-[120px] bg-stone-800 border border-stone-700 text-stone-100 placeholder:text-stone-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-12 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
          >
            {isLoading ? '…' : '➤'}
          </button>
        </div>
        <p className="text-xs text-stone-500 mt-1">Shift+Enter for new line</p>
      </div>
    </div>
  );
}

