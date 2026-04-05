'use client';
import { useState } from 'react';
import type { ProposalCategory } from '@local-dungeon/shared';

const CATEGORIES: ProposalCategory[] = ['rest', 'inspiration', 'action', 'custom'];

interface ProposeModalProps {
  sessionId: string;
  onSubmit: (category: ProposalCategory, description: string, payload?: unknown) => void;
  onClose: () => void;
}

export default function ProposeModal({ onSubmit, onClose }: ProposeModalProps) {
  const [category, setCategory] = useState<ProposalCategory>('action');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit(category, description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-gray-900 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Propose Action</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProposalCategory)}
              className="w-full rounded bg-white/10 border border-white/10 px-2 py-1.5 text-sm text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-gray-900">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Description{' '}
              <span className="text-gray-500">({description.length}/120)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 120))}
              placeholder="Describe the proposed action..."
              rows={3}
              className="w-full rounded bg-white/10 border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-500 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim()}
              className="rounded bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
