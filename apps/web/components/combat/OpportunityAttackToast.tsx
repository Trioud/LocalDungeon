'use client';
import { useEffect, useState } from 'react';
import type { OpportunityAttack } from '@local-dungeon/shared';

interface OpportunityAttackToastProps {
  attack: OpportunityAttack & { attackerName?: string; targetName?: string };
  onDismiss: () => void;
}

export default function OpportunityAttackToast({ attack, onDismiss }: OpportunityAttackToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white rounded-lg px-4 py-3 shadow-lg z-50 flex items-center gap-2">
      <span className="text-lg">⚔️</span>
      <span className="text-sm font-medium">
        Opportunity Attack: {attack.attackerName ?? attack.attackerId} → {attack.targetName ?? attack.targetId}
      </span>
    </div>
  );
}
