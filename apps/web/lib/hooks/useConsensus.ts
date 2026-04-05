'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { ConsensusProposal, VoteChoice, ProposalCategory } from '@local-dungeon/shared';

export function useConsensus(sessionId: string) {
  const { socket } = useSocket();
  const [proposals, setProposals] = useState<ConsensusProposal[]>([]);

  useEffect(() => {
    if (!socket) return;

    const onNewProposal = (proposal: ConsensusProposal) => {
      setProposals((prev) => {
        if (prev.some((p) => p.id === proposal.id)) return prev;
        return [...prev, proposal];
      });
    };

    const onVoteUpdate = (updated: ConsensusProposal) => {
      setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    };

    const onResolved = ({ proposal }: { proposal: ConsensusProposal; autoExecute: boolean }) => {
      setProposals((prev) => prev.map((p) => (p.id === proposal.id ? proposal : p)));
    };

    const onActiveProposals = ({ proposals: active }: { proposals: ConsensusProposal[] }) => {
      setProposals(active);
    };

    socket.on('consensus:new_proposal', onNewProposal);
    socket.on('consensus:vote_update', onVoteUpdate);
    socket.on('consensus:resolved', onResolved);
    socket.on('consensus:active_proposals', onActiveProposals);

    socket.emit('consensus:fetch', { sessionId });

    return () => {
      socket.off('consensus:new_proposal', onNewProposal);
      socket.off('consensus:vote_update', onVoteUpdate);
      socket.off('consensus:resolved', onResolved);
      socket.off('consensus:active_proposals', onActiveProposals);
    };
  }, [socket, sessionId]);

  const propose = useCallback(
    (category: ProposalCategory, description: string, payload?: unknown) => {
      socket?.emit('consensus:propose', { sessionId, category, description, payload });
    },
    [socket, sessionId],
  );

  const vote = useCallback(
    (proposalId: string, choice: VoteChoice) => {
      socket?.emit('consensus:vote', { sessionId, proposalId, choice });
    },
    [socket, sessionId],
  );

  return { proposals, propose, vote };
}
