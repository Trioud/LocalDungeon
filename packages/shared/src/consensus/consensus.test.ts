import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProposal,
  castVote,
  evaluateProposal,
  isExpired,
  getVoteSummary,
} from './consensus';
import type { ConsensusProposal } from './types';

function makeProposal(overrides: Partial<ConsensusProposal> = {}): ConsensusProposal {
  return createProposal(
    'prop-1',
    'session-1',
    'user-1',
    'action',
    'Should we attack the dragon?',
    ['user-1', 'user-2', 'user-3'],
    undefined,
    60_000,
    ...Object.values(overrides) as [],
  );
}

function baseProposal(overrides: Partial<ConsensusProposal> = {}): ConsensusProposal {
  return {
    id: 'prop-1',
    sessionId: 'session-1',
    proposerId: 'user-1',
    category: 'action',
    description: 'Should we attack the dragon?',
    votes: {},
    requiredVoters: ['user-1', 'user-2', 'user-3'],
    status: 'pending',
    createdAt: 1000,
    expiresAt: 61_000,
    ...overrides,
  };
}

describe('createProposal', () => {
  it('creates a proposal with correct fields', () => {
    const before = Date.now();
    const p = createProposal('id-1', 'sess-1', 'usr-1', 'rest', 'Take a rest', ['usr-1', 'usr-2']);
    const after = Date.now();
    expect(p.id).toBe('id-1');
    expect(p.sessionId).toBe('sess-1');
    expect(p.proposerId).toBe('usr-1');
    expect(p.category).toBe('rest');
    expect(p.description).toBe('Take a rest');
    expect(p.requiredVoters).toEqual(['usr-1', 'usr-2']);
    expect(p.votes).toEqual({});
    expect(p.status).toBe('pending');
    expect(p.createdAt).toBeGreaterThanOrEqual(before);
    expect(p.createdAt).toBeLessThanOrEqual(after);
  });

  it('sets expiresAt = createdAt + ttlMs', () => {
    const p = createProposal('id-1', 'sess-1', 'usr-1', 'action', 'desc', ['usr-1'], undefined, 30_000);
    expect(p.expiresAt).toBe(p.createdAt + 30_000);
  });

  it('defaults ttlMs to 60 000ms', () => {
    const p = createProposal('id-1', 'sess-1', 'usr-1', 'action', 'desc', ['usr-1']);
    expect(p.expiresAt).toBe(p.createdAt + 60_000);
  });

  it('stores optional payload', () => {
    const payload = { target: 'dragon' };
    const p = createProposal('id-1', 'sess-1', 'usr-1', 'custom', 'desc', ['usr-1'], payload);
    expect(p.payload).toEqual(payload);
  });

  it('leaves payload undefined when not provided', () => {
    const p = createProposal('id-1', 'sess-1', 'usr-1', 'rest', 'desc', ['usr-1']);
    expect(p.payload).toBeUndefined();
  });

  it('supports all proposal categories', () => {
    for (const cat of ['rest', 'inspiration', 'action', 'custom'] as const) {
      const p = createProposal('x', 's', 'u', cat, 'desc', ['u']);
      expect(p.category).toBe(cat);
    }
  });
});

describe('castVote', () => {
  let proposal: ConsensusProposal;

  beforeEach(() => {
    proposal = baseProposal();
  });

  it('records a yes vote', () => {
    const updated = castVote(proposal, 'user-1', 'yes');
    expect(updated.votes['user-1']).toBe('yes');
  });

  it('records a no vote', () => {
    const updated = castVote(proposal, 'user-2', 'no');
    expect(updated.votes['user-2']).toBe('no');
  });

  it('records an abstain vote', () => {
    const updated = castVote(proposal, 'user-3', 'abstain');
    expect(updated.votes['user-3']).toBe('abstain');
  });

  it('does not mutate the original proposal', () => {
    const original = { ...proposal, votes: { ...proposal.votes } };
    castVote(proposal, 'user-1', 'yes');
    expect(proposal.votes).toEqual(original.votes);
  });

  it('allows overwriting a previous vote', () => {
    const after1 = castVote(proposal, 'user-1', 'yes');
    const after2 = castVote(after1, 'user-1', 'no');
    expect(after2.votes['user-1']).toBe('no');
  });

  it('throws when proposal status is not pending', () => {
    const passed = baseProposal({ status: 'passed' });
    expect(() => castVote(passed, 'user-1', 'yes')).toThrow(/passed/);
  });

  it('throws for rejected status', () => {
    const rejected = baseProposal({ status: 'rejected' });
    expect(() => castVote(rejected, 'user-1', 'yes')).toThrow(/rejected/);
  });

  it('throws for expired status', () => {
    const expired = baseProposal({ status: 'expired' });
    expect(() => castVote(expired, 'user-1', 'yes')).toThrow(/expired/);
  });

  it('throws when userId is not in requiredVoters', () => {
    expect(() => castVote(proposal, 'outsider', 'yes')).toThrow(/outsider/);
  });
});

describe('evaluateProposal', () => {
  it('returns pending when not all have voted yes', () => {
    const p = baseProposal({ votes: { 'user-1': 'yes' } });
    expect(evaluateProposal(p)).toBe('pending');
  });

  it('returns passed when all voters vote yes', () => {
    const p = baseProposal({ votes: { 'user-1': 'yes', 'user-2': 'yes', 'user-3': 'yes' } });
    expect(evaluateProposal(p)).toBe('passed');
  });

  it('returns rejected when any voter votes no', () => {
    const p = baseProposal({ votes: { 'user-1': 'yes', 'user-2': 'no', 'user-3': 'yes' } });
    expect(evaluateProposal(p)).toBe('rejected');
  });

  it('returns rejected immediately on first no vote', () => {
    const p = baseProposal({ votes: { 'user-1': 'no' } });
    expect(evaluateProposal(p)).toBe('rejected');
  });

  it('returns pending when all abstain (not all yes)', () => {
    const p = baseProposal({
      votes: { 'user-1': 'abstain', 'user-2': 'abstain', 'user-3': 'abstain' },
    });
    expect(evaluateProposal(p)).toBe('pending');
  });

  it('returns passed when single voter votes yes', () => {
    const p = baseProposal({
      requiredVoters: ['only-user'],
      votes: { 'only-user': 'yes' },
    });
    expect(evaluateProposal(p)).toBe('passed');
  });
});

describe('isExpired', () => {
  it('returns false when now < expiresAt', () => {
    const p = baseProposal({ expiresAt: 2000 });
    expect(isExpired(p, 1999)).toBe(false);
  });

  it('returns true when now === expiresAt', () => {
    const p = baseProposal({ expiresAt: 2000 });
    expect(isExpired(p, 2000)).toBe(true);
  });

  it('returns true when now > expiresAt', () => {
    const p = baseProposal({ expiresAt: 2000 });
    expect(isExpired(p, 9999)).toBe(true);
  });
});

describe('getVoteSummary', () => {
  it('returns all pending when no votes cast', () => {
    const p = baseProposal();
    expect(getVoteSummary(p)).toEqual({ yes: 0, no: 0, abstain: 0, pending: 3 });
  });

  it('counts yes votes correctly', () => {
    const p = baseProposal({ votes: { 'user-1': 'yes', 'user-2': 'yes' } });
    expect(getVoteSummary(p)).toEqual({ yes: 2, no: 0, abstain: 0, pending: 1 });
  });

  it('counts no votes correctly', () => {
    const p = baseProposal({ votes: { 'user-1': 'no' } });
    expect(getVoteSummary(p)).toEqual({ yes: 0, no: 1, abstain: 0, pending: 2 });
  });

  it('counts abstain votes correctly', () => {
    const p = baseProposal({ votes: { 'user-3': 'abstain' } });
    expect(getVoteSummary(p)).toEqual({ yes: 0, no: 0, abstain: 1, pending: 2 });
  });

  it('returns all yes when all voted yes', () => {
    const p = baseProposal({
      votes: { 'user-1': 'yes', 'user-2': 'yes', 'user-3': 'yes' },
    });
    expect(getVoteSummary(p)).toEqual({ yes: 3, no: 0, abstain: 0, pending: 0 });
  });

  it('handles mixed votes', () => {
    const p = baseProposal({
      votes: { 'user-1': 'yes', 'user-2': 'no', 'user-3': 'abstain' },
    });
    expect(getVoteSummary(p)).toEqual({ yes: 1, no: 1, abstain: 1, pending: 0 });
  });

  it('returns zeros when requiredVoters is empty', () => {
    const p = baseProposal({ requiredVoters: [], votes: {} });
    expect(getVoteSummary(p)).toEqual({ yes: 0, no: 0, abstain: 0, pending: 0 });
  });
});
