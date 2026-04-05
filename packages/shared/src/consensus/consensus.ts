import type { ConsensusProposal, VoteChoice, ProposalStatus, ProposalCategory } from './types';

export function createProposal(
  id: string,
  sessionId: string,
  proposerId: string,
  category: ProposalCategory,
  description: string,
  requiredVoters: string[],
  payload?: unknown,
  ttlMs = 60_000,
): ConsensusProposal {
  const createdAt = Date.now();
  return {
    id,
    sessionId,
    proposerId,
    category,
    description,
    payload,
    votes: {},
    requiredVoters,
    status: 'pending',
    createdAt,
    expiresAt: createdAt + ttlMs,
  };
}

export function castVote(
  proposal: ConsensusProposal,
  userId: string,
  choice: VoteChoice,
): ConsensusProposal {
  if (proposal.status !== 'pending') {
    throw new Error(`Cannot vote on a proposal with status: ${proposal.status}`);
  }
  if (!proposal.requiredVoters.includes(userId)) {
    throw new Error(`User ${userId} is not a required voter for this proposal`);
  }
  return {
    ...proposal,
    votes: { ...proposal.votes, [userId]: choice },
  };
}

export function evaluateProposal(proposal: ConsensusProposal): ProposalStatus {
  const { requiredVoters, votes } = proposal;

  if (requiredVoters.some(uid => votes[uid] === 'no')) {
    return 'rejected';
  }
  if (requiredVoters.every(uid => votes[uid] === 'yes')) {
    return 'passed';
  }
  return 'pending';
}

export function isExpired(proposal: ConsensusProposal, now = Date.now()): boolean {
  return now >= proposal.expiresAt;
}

export function getVoteSummary(proposal: ConsensusProposal): {
  yes: number;
  no: number;
  abstain: number;
  pending: number;
} {
  const { requiredVoters, votes } = proposal;
  let yes = 0, no = 0, abstain = 0, pending = 0;
  for (const uid of requiredVoters) {
    const choice = votes[uid];
    if (choice === 'yes') yes++;
    else if (choice === 'no') no++;
    else if (choice === 'abstain') abstain++;
    else pending++;
  }
  return { yes, no, abstain, pending };
}
