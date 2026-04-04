import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DeathSaveTracker from '../DeathSaveTracker';
import type { CombatantState } from '@local-dungeon/shared';

function makeCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'c1',
    name: 'Hero',
    initiative: 15,
    initiativeRoll: 10,
    hp: 0,
    maxHp: 30,
    tempHp: 0,
    ac: 15,
    conditions: ['unconscious'],
    exhaustionLevel: 0,
    isBloodied: true,
    isConcentrating: false,
    hasAction: false,
    hasBonusAction: false,
    hasReaction: true,
    isPlayer: true,
    isActive: false,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    isStable: false,
    ...overrides,
  };
}

describe('DeathSaveTracker', () => {
  it('renders success circles and failure skulls', () => {
    render(<DeathSaveTracker combatant={makeCombatant()} />);
    const successImgs = screen.getAllByRole('img', { name: 'empty' });
    expect(successImgs.length).toBe(6);
  });

  it('shows filled successes', () => {
    render(<DeathSaveTracker combatant={makeCombatant({ deathSaveSuccesses: 2 })} />);
    const successFilled = screen.getAllByRole('img', { name: 'success' });
    expect(successFilled.length).toBe(2);
  });

  it('shows filled failures', () => {
    render(<DeathSaveTracker combatant={makeCombatant({ deathSaveFailures: 1 })} />);
    const failureFilled = screen.getAllByRole('img', { name: 'failure' });
    expect(failureFilled.length).toBe(1);
  });

  it('shows Stable label when isStable is true', () => {
    render(<DeathSaveTracker combatant={makeCombatant({ isStable: true })} />);
    expect(screen.getByText('(Stable)')).toBeInTheDocument();
  });

  it('does not show Stable when isStable is false', () => {
    render(<DeathSaveTracker combatant={makeCombatant({ isStable: false })} />);
    expect(screen.queryByText('(Stable)')).not.toBeInTheDocument();
  });
});
