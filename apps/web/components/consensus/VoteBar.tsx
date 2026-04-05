'use client';

interface VoteBarProps {
  yes: number;
  no: number;
  abstain: number;
  pending: number;
}

export default function VoteBar({ yes, no, abstain, pending }: VoteBarProps) {
  const total = yes + no + abstain + pending;
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <div className="flex h-2 w-full rounded overflow-hidden">
      {yes > 0 && <div className="bg-green-500" style={{ width: pct(yes) }} title={`Yes: ${yes}`} />}
      {no > 0 && <div className="bg-red-500" style={{ width: pct(no) }} title={`No: ${no}`} />}
      {abstain > 0 && <div className="bg-gray-400" style={{ width: pct(abstain) }} title={`Abstain: ${abstain}`} />}
      {pending > 0 && <div className="bg-white/30" style={{ width: pct(pending) }} title={`Pending: ${pending}`} />}
    </div>
  );
}
