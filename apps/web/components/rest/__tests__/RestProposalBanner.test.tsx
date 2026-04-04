import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RestProposalBanner from '../RestProposalBanner';
import type { RestProposal } from '@local-dungeon/shared';

function makeProposal(overrides: Partial<RestProposal> = {}): RestProposal {
  return {
    id: 'p1',
    sessionId: 's1',
    proposedBy: 'Alice',
    restType: 'short',
    confirmedBy: ['Alice'],
    requiredCount: 3,
    status: 'pending',
    ...overrides,
  };
}

describe('RestProposalBanner', () => {
  it('renders the proposer name and rest type', () => {
    render(
      <RestProposalBanner
        proposal={makeProposal()}
        currentUserId="Bob"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Alice proposes a Short Rest/)).toBeInTheDocument();
  });

  it('renders "Long Rest" for long rest type', () => {
    render(
      <RestProposalBanner
        proposal={makeProposal({ restType: 'long' })}
        currentUserId="Bob"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Long Rest/)).toBeInTheDocument();
  });

  it('shows confirmation count', () => {
    render(
      <RestProposalBanner
        proposal={makeProposal({ confirmedBy: ['Alice', 'Bob'], requiredCount: 4 })}
        currentUserId="Carol"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('2/4 confirmed')).toBeInTheDocument();
  });

  it('renders Confirm and Cancel buttons for non-confirmer', () => {
    render(
      <RestProposalBanner
        proposal={makeProposal()}
        currentUserId="Bob"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <RestProposalBanner
        proposal={makeProposal()}
        currentUserId="Bob"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <RestProposalBanner
        proposal={makeProposal()}
        currentUserId="Bob"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('hides Confirm/Cancel and shows waiting message when current user already confirmed', () => {
    render(
      <RestProposalBanner
        proposal={makeProposal({ confirmedBy: ['Alice', 'Bob'] })}
        currentUserId="Bob"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Waiting for others/)).toBeInTheDocument();
  });
});
