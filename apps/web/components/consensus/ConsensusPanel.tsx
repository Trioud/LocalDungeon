'use client';
import { useState } from 'react';
import type { ConsensusProposal, VoteChoice } from '@local-dungeon/shared';
import ProposalCard from './ProposalCard';
import ProposeModal from './ProposeModal';

interface ConsensusPanelProps {
  proposals: ConsensusProposal[];
  userId: string;
  sessionId: string;
  onVote: (proposalId: string, choice: VoteChoice) => void;
  onPropose: (category: string, description: string, payload?: unknown) => void;
}

export default function ConsensusPanel({
  proposals,
  userId,
  sessionId,
  onVote,
  onPropose,
}: ConsensusPanelProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Consensus</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-indigo-700 hover:bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
        >
          Propose Action
        </button>
      </div>

      {proposals.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No active proposals</p>
      ) : (
        <div className="space-y-2">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} userId={userId} onVote={onVote} />
          ))}
        </div>
      )}

      {showModal && (
        <ProposeModal
          sessionId={sessionId}
          onSubmit={(category, description, payload) => {
            onPropose(category, description, payload);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
