import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SpellSlotTracker from '../SpellSlotTracker';
import type { SpellcastingState } from '@local-dungeon/shared';

function makeSpellcasting(overrides: Partial<SpellcastingState> = {}): SpellcastingState {
  return {
    slots: [
      { level: 1, total: 4, used: 1 },
      { level: 2, total: 3, used: 0 },
      { level: 3, total: 2, used: 2 },
    ],
    castBonusActionThisTurn: false,
    ...overrides,
  };
}

describe('SpellSlotTracker', () => {
  it('renders a row for each spell level with slots', () => {
    render(<SpellSlotTracker spellcasting={makeSpellcasting()} />);
    expect(screen.getByText('Level 1:')).toBeInTheDocument();
    expect(screen.getByText('Level 2:')).toBeInTheDocument();
    expect(screen.getByText('Level 3:')).toBeInTheDocument();
  });

  it('does not render rows for levels with total=0', () => {
    render(
      <SpellSlotTracker
        spellcasting={makeSpellcasting({
          slots: [
            { level: 1, total: 2, used: 0 },
            { level: 2, total: 0, used: 0 },
          ],
        })}
      />,
    );
    expect(screen.getByText('Level 1:')).toBeInTheDocument();
    expect(screen.queryByText('Level 2:')).not.toBeInTheDocument();
  });

  it('shows pact magic row when pactMagic is defined with total > 0', () => {
    render(
      <SpellSlotTracker
        spellcasting={makeSpellcasting({
          pactMagic: { level: 2, total: 2, used: 0 },
        })}
      />,
    );
    expect(screen.getByText('Pact:')).toBeInTheDocument();
  });

  it('does not show pact magic row when pactMagic is undefined', () => {
    render(<SpellSlotTracker spellcasting={makeSpellcasting({ pactMagic: undefined })} />);
    expect(screen.queryByText('Pact:')).not.toBeInTheDocument();
  });

  it('renders the Spell Slots heading', () => {
    render(<SpellSlotTracker spellcasting={makeSpellcasting()} />);
    expect(screen.getByText('Spell Slots')).toBeInTheDocument();
  });

  it('shows correct pip counts (used + remaining = total)', () => {
    render(
      <SpellSlotTracker
        spellcasting={makeSpellcasting({
          slots: [{ level: 1, total: 4, used: 1 }],
        })}
      />,
    );
    // 1 used (○) + 3 remaining (●) = 4 pips total
    const level1Row = screen.getByText('Level 1:').closest('div');
    expect(level1Row).not.toBeNull();
    const pips = level1Row!.querySelectorAll('span');
    // spans inside the pip container span
    expect(pips.length).toBeGreaterThanOrEqual(4);
  });
});
