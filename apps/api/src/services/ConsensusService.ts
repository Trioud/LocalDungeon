import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';
import {
  ConsensusProposal,
  ProposalCategory,
  VoteChoice,
  createProposal,
  castVote,
  evaluateProposal,
} from '@local-dungeon/shared';

const TTL_MS = 60_000;
const TTL_S = 60;

type ConsensusDeps = { redis: Redis };

export class ConsensusService {
  private redis: Redis;

  constructor({ redis }: ConsensusDeps) {
    this.redis = redis;
  }

  private proposalKey(sessionId: string, proposalId: string): string {
    return `consensus:${sessionId}:${proposalId}`;
  }

  private indexKey(sessionId: string): string {
    return `consensus:index:${sessionId}`;
  }

  async createProposal(
    sessionId: string,
    proposerId: string,
    category: ProposalCategory,
    description: string,
    requiredVoters: string[],
    payload?: unknown,
  ): Promise<ConsensusProposal> {
    const id = randomUUID();
    const proposal = createProposal(id, sessionId, proposerId, category, description, requiredVoters, payload, TTL_MS);

    await this.redis.set(this.proposalKey(sessionId, id), JSON.stringify(proposal), 'EX', TTL_S);
    await this.redis.sadd(this.indexKey(sessionId), id);
    await this.redis.expire(this.indexKey(sessionId), TTL_S * 2);

    setTimeout(() => {
      this.expireProposal(sessionId, id).catch(() => {});
    }, TTL_MS);

    return proposal;
  }

  async castVote(
    sessionId: string,
    proposalId: string,
    userId: string,
    choice: VoteChoice,
  ): Promise<ConsensusProposal> {
    const proposal = await this.getProposal(sessionId, proposalId);
    if (!proposal) throw new Error('Proposal not found');

    let updated = castVote(proposal, userId, choice);
    const newStatus = evaluateProposal(updated);
    if (newStatus !== 'pending') {
      updated = { ...updated, status: newStatus };
    }

    await this.redis.set(this.proposalKey(sessionId, proposalId), JSON.stringify(updated), 'EX', TTL_S);
    return updated;
  }

  async getProposal(sessionId: string, proposalId: string): Promise<ConsensusProposal | null> {
    const raw = await this.redis.get(this.proposalKey(sessionId, proposalId));
    return raw ? (JSON.parse(raw) as ConsensusProposal) : null;
  }

  async getActiveProposals(sessionId: string): Promise<ConsensusProposal[]> {
    const ids = await this.redis.smembers(this.indexKey(sessionId));
    const proposals: ConsensusProposal[] = [];
    for (const id of ids) {
      const p = await this.getProposal(sessionId, id);
      if (p && p.status === 'pending') {
        proposals.push(p);
      }
    }
    return proposals;
  }

  async expireProposal(sessionId: string, proposalId: string): Promise<void> {
    const proposal = await this.getProposal(sessionId, proposalId);
    if (!proposal || proposal.status !== 'pending') return;
    const expired = { ...proposal, status: 'expired' as const };
    await this.redis.set(this.proposalKey(sessionId, proposalId), JSON.stringify(expired), 'EX', TTL_S);
  }
}
