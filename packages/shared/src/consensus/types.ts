export type VoteChoice = 'yes' | 'no' | 'abstain';
export type ProposalStatus = 'pending' | 'passed' | 'rejected' | 'expired';
export type ProposalCategory = 'rest' | 'inspiration' | 'action' | 'custom';

export interface ConsensusProposal {
  id: string;
  sessionId: string;
  proposerId: string;
  category: ProposalCategory;
  description: string;
  payload?: unknown;
  votes: Record<string, VoteChoice>;
  requiredVoters: string[];
  status: ProposalStatus;
  createdAt: number;
  expiresAt: number;
}
