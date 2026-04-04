'use client';
import type { RestProposal } from '@local-dungeon/shared';

interface Props {
  proposal: RestProposal;
  currentUserId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RestProposalBanner({ proposal, currentUserId, onConfirm, onCancel }: Props) {
  const restLabel = proposal.restType === 'short' ? 'Short Rest' : 'Long Rest';
  const alreadyConfirmed = proposal.confirmedBy.includes(currentUserId);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-300 rounded-lg shadow-lg p-4 flex flex-col gap-2 min-w-80">
      <p className="text-sm font-semibold text-amber-900">
        {proposal.proposedBy} proposes a {restLabel}
      </p>
      <p className="text-xs text-amber-700">
        {proposal.confirmedBy.length}/{proposal.requiredCount} confirmed
      </p>
      {!alreadyConfirmed && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1 px-3 rounded"
          >
            Cancel
          </button>
        </div>
      )}
      {alreadyConfirmed && (
        <p className="text-xs text-green-700 font-medium">Waiting for others…</p>
      )}
    </div>
  );
}
