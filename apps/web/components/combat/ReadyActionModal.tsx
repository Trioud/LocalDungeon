'use client';
import { useState } from 'react';
import type { Socket } from 'socket.io-client';

interface ReadyActionModalProps {
  isOpen: boolean;
  combatantId: string;
  sessionId: string;
  expiresOnTurn: number;
  socket: Socket | null;
  onClose: () => void;
}

export default function ReadyActionModal({
  isOpen,
  combatantId,
  sessionId,
  expiresOnTurn,
  socket,
  onClose,
}: ReadyActionModalProps) {
  const [trigger, setTrigger] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trigger.trim()) {
      setError('Trigger is required');
      return;
    }
    if (!actionDescription.trim()) {
      setError('Action description is required');
      return;
    }
    socket?.emit('combat:ready_action_set', {
      sessionId,
      combatantId,
      trigger: trigger.trim(),
      actionDescription: actionDescription.trim(),
      expiresOnTurn,
    });
    setTrigger('');
    setActionDescription('');
    setError('');
    onClose();
  }

  function handleCancel() {
    setTrigger('');
    setActionDescription('');
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">Set Ready Action</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trigger</label>
            <input
              type="text"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="When an enemy moves within reach…"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <input
              type="text"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="I attack with my sword"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm border rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
