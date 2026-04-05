'use client';
import { useEffect, useState } from 'react';
import type { ConsensusProposal, VoteChoice } from '@local-dungeon/shared';
import { getVoteSummary } from '@local-dungeon/shared';
import VoteBar from './VoteBar';

const CATEGORY_LABELS: Record<string, string> = {
  rest: 'Rest',
  inspiration: 'Inspiration',
  action: 'Action',
  custom: 'Custom',
};

interface ProposalCardProps {
  proposal: ConsensusProposal;
  userId: string;
  onVote: (proposalId: string, choice: VoteChoice) => void;
}

export default function ProposalCard({ proposal, userId, onVote }: ProposalCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, proposal.expiresAt - Date.now()),
  );

  useEffect(() => {
    if (proposal.status !== 'pending') return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, proposal.expiresAt - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [proposal.expiresAt, proposal.status]);

  const summary = getVoteSummary(proposal);
  const hasVoted = proposal.votes[userId] !== undefined;
  const isResolved = proposal.status !== 'pending';
  const votingDisabled = hasVoted || isResolved;

  const secondsLeft = Math.ceil(timeLeft / 1000);
  const progressPct = Math.round((timeLeft / 60_000) * 100);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-700 text-indigo-200">
          {CATEGORY_LABELS[proposal.category] ?? proposal.category}
        </span>
        {isResolved ? (
          <span
            className={`text-xs font-semibold uppercase ${
              proposal.status === 'passed' ? 'text-green-400' : proposal.status === 'rejected' ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {proposal.status}
          </span>
        ) : (
          <span className="text-xs text-gray-400">{secondsLeft}s</span>
        )}
      </div>

      <p className="text-sm text-white">{proposal.description}</p>

      {!isResolved && (
        <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <VoteBar {...summary} />

      <div className="flex gap-2 text-xs text-gray-300">
        <span>✓ {summary.yes}</span>
        <span>✗ {summary.no}</span>
        <span>~ {summary.abstain}</span>
        <span>? {summary.pending}</span>
      </div>

      {!votingDisabled && (
        <div className="flex gap-2">
          <button
            onClick={() => onVote(proposal.id, 'yes')}
            className="flex-1 rounded bg-green-700 hover:bg-green-600 px-2 py-1 text-xs font-semibold text-white"
          >
            Yes
          </button>
          <button
            onClick={() => onVote(proposal.id, 'no')}
            className="flex-1 rounded bg-red-700 hover:bg-red-600 px-2 py-1 text-xs font-semibold text-white"
          >
            No
          </button>
          <button
            onClick={() => onVote(proposal.id, 'abstain')}
            className="flex-1 rounded bg-gray-600 hover:bg-gray-500 px-2 py-1 text-xs font-semibold text-white"
          >
            Abstain
          </button>
        </div>
      )}

      {hasVoted && !isResolved && (
        <p className="text-xs text-gray-400">
          You voted: <span className="font-semibold text-white">{proposal.votes[userId]}</span>
        </p>
      )}
    </div>
  );
}
