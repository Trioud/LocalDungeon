import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiceRoller from '../DiceRoller';
import type { DiceRollEntry } from '@/lib/hooks/useDiceRoller';
import type { DiceRollMode } from '@local-dungeon/shared';

function makeEntry(overrides: Partial<DiceRollEntry> = {}): DiceRollEntry {
  return {
    result: {
      notation: 'd20',
      rolls: [15],
      total: 15,
      modifier: 0,
      mode: 'normal',
      isNatural20: false,
      isNatural1: false,
      isCritical: false,
      isCriticalFail: false,
    },
    rolledBy: 'user-1',
    isPrivate: false,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('DiceRoller', () => {
  let onRoll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRoll = vi.fn();
  });

  it('renders all 7 dice buttons', () => {
    render(<DiceRoller onRoll={onRoll} recentRolls={[]} />);
    for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
      expect(screen.getByTitle(`d${sides}`)).toBeDefined();
    }
  });

  it('renders mode toggle buttons', () => {
    render(<DiceRoller onRoll={onRoll} recentRolls={[]} />);
    expect(screen.getByText('Normal')).toBeDefined();
    expect(screen.getByText('Advantage')).toBeDefined();
    expect(screen.getByText('Disadvantage')).toBeDefined();
  });

  it('calls onRoll when a dice button is clicked', () => {
    render(<DiceRoller onRoll={onRoll} recentRolls={[]} />);
    fireEvent.click(screen.getByTitle('d20'));
    expect(onRoll).toHaveBeenCalledWith('d20', 'normal', false);
  });

  it('calls onRoll with advantage mode when advantage is selected', () => {
    render(<DiceRoller onRoll={onRoll} recentRolls={[]} />);
    fireEvent.click(screen.getByText('Advantage'));
    fireEvent.click(screen.getByTitle('d6'));
    expect(onRoll).toHaveBeenCalledWith('d6', 'advantage', false);
  });

  it('calls onRoll from custom notation input', () => {
    render(<DiceRoller onRoll={onRoll} recentRolls={[]} />);
    const input = screen.getByPlaceholderText('e.g. 2d6+3');
    fireEvent.change(input, { target: { value: '3d8+2' } });
    fireEvent.click(screen.getByText('Roll'));
    expect(onRoll).toHaveBeenCalledWith('3d8+2', 'normal', false);
  });

  it('calls onRoll with isPrivate true when private checkbox is checked', () => {
    render(<DiceRoller onRoll={onRoll} recentRolls={[]} />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByTitle('d20'));
    expect(onRoll).toHaveBeenCalledWith('d20', 'normal', true);
  });

  it('shows recent rolls', () => {
    const rolls = [makeEntry({ result: { ...makeEntry().result, total: 17, notation: 'd20' } })];
    render(<DiceRoller onRoll={onRoll} recentRolls={rolls} />);
    expect(screen.getByText('17')).toBeDefined();
  });

  it('shows natural 20 badge on crit result', () => {
    const rolls = [
      makeEntry({
        result: {
          notation: 'd20',
          rolls: [20],
          total: 20,
          modifier: 0,
          mode: 'normal',
          isNatural20: true,
          isNatural1: false,
          isCritical: true,
          isCriticalFail: false,
        },
      }),
    ];
    render(<DiceRoller onRoll={onRoll} recentRolls={rolls} />);
    expect(screen.getByText('NAT 20!')).toBeDefined();
  });
});
