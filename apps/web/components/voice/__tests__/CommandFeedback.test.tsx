import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CommandFeedback from '../CommandFeedback';
import type { ParsedCommand } from '@local-dungeon/shared';

const makeCommand = (overrides: Partial<ParsedCommand> = {}): ParsedCommand => ({
  intent: 'roll_skill',
  confidence: 0.5,
  raw: 'roll stealth',
  entities: { skillName: 'stealth' },
  ...overrides,
});

describe('CommandFeedback', () => {
  let onConfirm: ReturnType<typeof vi.fn>;
  let onDismiss: ReturnType<typeof vi.fn>;
  let onConfirmAlternate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onConfirm = vi.fn();
    onDismiss = vi.fn();
    onConfirmAlternate = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the intent summary and icon', () => {
    render(
      <CommandFeedback
        command={makeCommand()}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        onConfirmAlternate={onConfirmAlternate}
      />,
    );
    expect(screen.getByText(/Roll stealth/i)).toBeInTheDocument();
    expect(screen.getByText('🎲')).toBeInTheDocument();
  });

  it('calls onConfirm when Yes button is clicked', () => {
    render(
      <CommandFeedback
        command={makeCommand()}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        onConfirmAlternate={onConfirmAlternate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when No button is clicked', () => {
    render(
      <CommandFeedback
        command={makeCommand()}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        onConfirmAlternate={onConfirmAlternate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /no/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 4 seconds', () => {
    render(
      <CommandFeedback
        command={makeCommand()}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        onConfirmAlternate={onConfirmAlternate}
      />,
    );
    act(() => { vi.advanceTimersByTime(4000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows "Did you mean?" when alternates are present', () => {
    const alternate: ParsedCommand = {
      intent: 'roll_attack',
      confidence: 0.4,
      raw: 'roll stealth',
      entities: {},
    };
    render(
      <CommandFeedback
        command={makeCommand({ alternates: [alternate] })}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        onConfirmAlternate={onConfirmAlternate}
      />,
    );
    expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
  });

  it('calls onConfirmAlternate when alternate button is clicked', () => {
    const alternate: ParsedCommand = {
      intent: 'roll_attack',
      confidence: 0.4,
      raw: 'roll stealth',
      entities: {},
    };
    render(
      <CommandFeedback
        command={makeCommand({ alternates: [alternate] })}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        onConfirmAlternate={onConfirmAlternate}
      />,
    );
    fireEvent.click(screen.getByText(/Roll Attack/i));
    expect(onConfirmAlternate).toHaveBeenCalledWith(alternate);
  });
});
