import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LevelUpWizard from '../LevelUpWizard';
import type { LevelUpPreview } from '@local-dungeon/shared';

vi.mock('@local-dungeon/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@local-dungeon/shared')>();
  return {
    ...actual,
    checkMulticlassPrereqs: vi.fn().mockReturnValue({ allowed: true }),
  };
});

const mockPreview: LevelUpPreview = {
  newLevel: 4,
  hpOptions: { roll: 12, average: 8 },
  gainsASI: true,
  gainsSubclass: false,
  newProficiencyBonus: 2,
  features: [],
};

const baseProps = {
  characterId: 'char-1',
  className: 'Fighter',
  abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  preview: mockPreview,
  onConfirm: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describe('LevelUpWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wizard with Class step first', () => {
    render(<LevelUpWizard {...baseProps} />);
    expect(screen.getByText('Level Up!')).toBeInTheDocument();
    expect(screen.getAllByText('Fighter').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<LevelUpWizard {...baseProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('advances to HP step when Next is clicked', () => {
    render(<LevelUpWizard {...baseProps} />);
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText(/Take average/)).toBeInTheDocument();
  });

  it('shows ASI step since gainsASI is true', () => {
    render(<LevelUpWizard {...baseProps} />);
    // Navigate to next steps
    fireEvent.click(screen.getByText('Next →')); // → HP
    fireEvent.click(screen.getByText('Next →')); // → ASI
    expect(screen.getByText(/ASI \/ Feat/)).toBeInTheDocument();
  });

  it('shows Summary with level info on final step', () => {
    render(<LevelUpWizard {...baseProps} preview={{ ...mockPreview, gainsASI: false }} />);
    // Class → HP → Summary (no ASI since gainsASI=false)
    fireEvent.click(screen.getByText('Next →'));
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText(/New total level/)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
