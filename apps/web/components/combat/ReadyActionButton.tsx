'use client';
import { useState } from 'react';
import ReadyActionModal from './ReadyActionModal';
import ReadyActionIndicator from './ReadyActionIndicator';
import type { Socket } from 'socket.io-client';
import type { ReadyAction } from '@local-dungeon/shared';

interface ReadyActionButtonProps {
  combatantId: string;
  sessionId: string;
  expiresOnTurn: number;
  socket: Socket | null;
  readyAction?: ReadyAction | null;
}

export default function ReadyActionButton({
  combatantId,
  sessionId,
  expiresOnTurn,
  socket,
  readyAction,
}: ReadyActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isActive = !!readyAction && !readyAction.used;

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Set Ready Action"
      >
        Ready
      </button>
      <ReadyActionIndicator active={isActive} />
      <ReadyActionModal
        isOpen={isModalOpen}
        combatantId={combatantId}
        sessionId={sessionId}
        expiresOnTurn={expiresOnTurn}
        socket={socket}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
