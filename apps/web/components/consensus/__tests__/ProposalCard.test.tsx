import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProposalCard from '../ProposalCard';
import type { ConsensusProposal } from '@local-dungeon/shared';

vi.mock('@/lib/hooks/useSocket', () => ({
  useSocket: () => ({ socket: null, status: 'disconnected' }),
}));

const now = Date.now();

function makeProposal(overrides: Partial<ConsensusProposal> = {}): ConsensusProposal {
  return {
    id: 'prop-1',
    sessionId: 'sess-1',
    proposerId: 'user-1',
    category: 'action',
    description: 'Should we attack the dragon?',
    votes: {},
    requiredVoters: ['user-1', 'user-2', 'user-3'],
    status: 'pending',
    createdAt: now,
    expiresAt: now + 60_000,
    ...overrides,
  };
}

describe('ProposalCard', () => {
  const onVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the proposal description', () => {
    render(<ProposalCard proposal={makeProposal()} userId="user-1" onVote={onVote} />);
    expect(screen.getByText('Should we attack the dragon?')).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(<ProposalCard proposal={makeProposal()} userId="user-1" onVote={onVote} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('shows Yes, No, Abstain buttons when user has not voted', () => {
    render(<ProposalCard proposal={makeProposal()} userId="user-1" onVote={onVote} />);
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abstain' })).toBeInTheDocument();
  });

  it('calls onVote with yes when Yes button is clicked', () => {
    render(<ProposalCard proposal={makeProposal()} userId="user-1" onVote={onVote} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onVote).toHaveBeenCalledWith('prop-1', 'yes');
  });

  it('calls onVote with no when No button is clicked', () => {
    render(<ProposalCard proposal={makeProposal()} userId="user-1" onVote={onVote} />);
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onVote).toHaveBeenCalledWith('prop-1', 'no');
  });

  it('hides voting buttons after user has voted', () => {
    const proposal = makeProposal({ votes: { 'user-1': 'yes' } });
    render(<ProposalCard proposal={proposal} userId="user-1" onVote={onVote} />);
    expect(screen.queryByRole('button', { name: 'Yes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'No' })).not.toBeInTheDocument();
  });

  it('shows the user\'s vote choice after voting', () => {
    const proposal = makeProposal({ votes: { 'user-1': 'yes' } });
    render(<ProposalCard proposal={proposal} userId="user-1" onVote={onVote} />);
    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('shows resolved status for passed proposal', () => {
    const proposal = makeProposal({
      status: 'passed',
      votes: { 'user-1': 'yes', 'user-2': 'yes', 'user-3': 'yes' },
    });
    render(<ProposalCard proposal={proposal} userId="user-1" onVote={onVote} />);
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yes' })).not.toBeInTheDocument();
  });

  it('shows resolved status for rejected proposal', () => {
    const proposal = makeProposal({
      status: 'rejected',
      votes: { 'user-1': 'no' },
    });
    render(<ProposalCard proposal={proposal} userId="user-1" onVote={onVote} />);
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });
});
