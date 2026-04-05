import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsensusService } from './ConsensusService.js';

const makeRedis = () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  sadd: vi.fn(),
  smembers: vi.fn(),
  srem: vi.fn(),
  expire: vi.fn(),
});

function makeService(redis = makeRedis()) {
  return { service: new ConsensusService({ redis } as any), redis };
}

const sessionId = 'sess-1';
const proposerId = 'user-1';

const baseProposalData = {
  id: 'prop-id',
  sessionId,
  proposerId,
  category: 'action' as const,
  description: 'Test proposal',
  votes: {},
  requiredVoters: ['user-1', 'user-2'],
  status: 'pending' as const,
  createdAt: 1000,
  expiresAt: 61000,
};

describe('ConsensusService', () => {
  let redis: ReturnType<typeof makeRedis>;
  let service: ConsensusService;

  beforeEach(() => {
    redis = makeRedis();
    service = new ConsensusService({ redis } as any);
    redis.set.mockResolvedValue('OK');
    redis.sadd.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    redis.smembers.mockResolvedValue([]);
    redis.get.mockResolvedValue(null);
  });

  describe('createProposal', () => {
    it('stores the proposal in Redis', async () => {
      const proposal = await service.createProposal(sessionId, proposerId, 'action', 'Test', ['user-1', 'user-2']);
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining(`consensus:${sessionId}:`),
        expect.any(String),
        'EX',
        60,
      );
      expect(proposal.status).toBe('pending');
      expect(proposal.sessionId).toBe(sessionId);
    });

    it('adds proposal id to index set', async () => {
      const proposal = await service.createProposal(sessionId, proposerId, 'rest', 'Rest?', ['user-1']);
      expect(redis.sadd).toHaveBeenCalledWith(
        `consensus:index:${sessionId}`,
        proposal.id,
      );
    });

    it('sets expiry on the index key', async () => {
      await service.createProposal(sessionId, proposerId, 'action', 'Test', ['user-1']);
      expect(redis.expire).toHaveBeenCalledWith(`consensus:index:${sessionId}`, 120);
    });

    it('stores payload when provided', async () => {
      const payload = { target: 'dragon' };
      const proposal = await service.createProposal(sessionId, proposerId, 'custom', 'Attack?', ['user-1'], payload);
      expect(proposal.payload).toEqual(payload);
    });

    it('generates a unique id for each proposal', async () => {
      const p1 = await service.createProposal(sessionId, proposerId, 'action', 'First', ['user-1']);
      const p2 = await service.createProposal(sessionId, proposerId, 'action', 'Second', ['user-1']);
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('getProposal', () => {
    it('returns null when proposal not found', async () => {
      redis.get.mockResolvedValue(null);
      const result = await service.getProposal(sessionId, 'missing-id');
      expect(result).toBeNull();
    });

    it('returns parsed proposal when found', async () => {
      redis.get.mockResolvedValue(JSON.stringify(baseProposalData));
      const result = await service.getProposal(sessionId, 'prop-id');
      expect(result).toEqual(baseProposalData);
    });
  });

  describe('castVote', () => {
    it('throws when proposal not found', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.castVote(sessionId, 'missing', 'user-1', 'yes')).rejects.toThrow('Proposal not found');
    });

    it('records the vote and saves updated proposal', async () => {
      redis.get.mockResolvedValue(JSON.stringify(baseProposalData));
      const updated = await service.castVote(sessionId, 'prop-id', 'user-1', 'yes');
      expect(updated.votes['user-1']).toBe('yes');
      expect(redis.set).toHaveBeenCalledWith(
        `consensus:${sessionId}:prop-id`,
        expect.any(String),
        'EX',
        60,
      );
    });

    it('resolves proposal to passed when all voters vote yes', async () => {
      const allYes = { ...baseProposalData, votes: { 'user-1': 'yes' } };
      redis.get.mockResolvedValue(JSON.stringify(allYes));
      const updated = await service.castVote(sessionId, 'prop-id', 'user-2', 'yes');
      expect(updated.status).toBe('passed');
    });

    it('resolves proposal to rejected when any voter votes no', async () => {
      redis.get.mockResolvedValue(JSON.stringify(baseProposalData));
      const updated = await service.castVote(sessionId, 'prop-id', 'user-1', 'no');
      expect(updated.status).toBe('rejected');
    });
  });

  describe('getActiveProposals', () => {
    it('returns empty array when no proposals', async () => {
      redis.smembers.mockResolvedValue([]);
      const result = await service.getActiveProposals(sessionId);
      expect(result).toEqual([]);
    });

    it('returns only pending proposals', async () => {
      redis.smembers.mockResolvedValue(['prop-1', 'prop-2']);
      redis.get
        .mockResolvedValueOnce(JSON.stringify({ ...baseProposalData, id: 'prop-1', status: 'pending' }))
        .mockResolvedValueOnce(JSON.stringify({ ...baseProposalData, id: 'prop-2', status: 'passed' }));
      const result = await service.getActiveProposals(sessionId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prop-1');
    });
  });

  describe('expireProposal', () => {
    it('marks a pending proposal as expired', async () => {
      redis.get.mockResolvedValue(JSON.stringify(baseProposalData));
      await service.expireProposal(sessionId, 'prop-id');
      const saved = JSON.parse(redis.set.mock.calls[0][1]);
      expect(saved.status).toBe('expired');
    });

    it('does nothing when proposal is not found', async () => {
      redis.get.mockResolvedValue(null);
      await service.expireProposal(sessionId, 'missing-id');
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('does nothing when proposal is already resolved', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ ...baseProposalData, status: 'passed' }));
      await service.expireProposal(sessionId, 'prop-id');
      expect(redis.set).not.toHaveBeenCalled();
    });
  });
});
