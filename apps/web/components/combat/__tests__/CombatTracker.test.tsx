import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CombatTracker from '../CombatTracker';
import type { CombatState } from '@local-dungeon/shared';

vi.mock('@/lib/hooks/useCombat', () => ({
  useCombat: vi.fn(),
}));

vi.mock('@/lib/hooks/useSocket', () => ({
  useSocket: () => ({ socket: null, status: 'disconnected' }),
}));

import { useCombat } from '@/lib/hooks/useCombat';

const mockUseCombat = useCombat as ReturnType<typeof vi.fn>;

const baseMock = {
  combatState: null,
  initCombat: vi.fn(),
  startCombat: vi.fn(),
  endCombat: vi.fn(),
  applyDamage: vi.fn(),
  applyHealing: vi.fn(),
  addCondition: vi.fn(),
  removeCondition: vi.fn(),
  nextTurn: vi.fn(),
  recordDeathSave: vi.fn(),
};

function makeActiveCombatState(): CombatState {
  return {
    sessionId: 'sess_1',
    round: 2,
    turnIndex: 0,
    isActive: true,
    log: [],
    combatants: [
      {
        id: 'c1',
        name: 'Aldric',
        initiative: 18,
        initiativeRoll: 15,
        hp: 25,
        maxHp: 40,
        tempHp: 0,
        ac: 16,
        conditions: ['poisoned'],
        exhaustionLevel: 0,
        isBloodied: false,
        isConcentrating: false,
        hasAction: true,
        hasBonusAction: true,
        hasReaction: true,
        isPlayer: true,
        isActive: true,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
      },
      {
        id: 'c2',
        name: 'Goblin',
        initiative: 10,
        initiativeRoll: 8,
        hp: 5,
        maxHp: 10,
        tempHp: 0,
        ac: 12,
        conditions: [],
        exhaustionLevel: 0,
        isBloodied: true,
        isConcentrating: false,
        hasAction: true,
        hasBonusAction: true,
        hasReaction: true,
        isPlayer: false,
        isActive: false,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
      },
    ],
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseCombat.mockReturnValue({ ...baseMock });
});

describe('CombatTracker', () => {
  it('shows "Start Combat" button when combat is not active', () => {
    render(<CombatTracker sessionId="sess_1" />, { wrapper });
    expect(screen.getByRole('button', { name: /Start Combat/i })).toBeInTheDocument();
  });

  it('shows combatant name when combat is active', () => {
    mockUseCombat.mockReturnValue({ ...baseMock, combatState: makeActiveCombatState() });
    render(<CombatTracker sessionId="sess_1" />, { wrapper });
    expect(screen.getByText('Aldric')).toBeInTheDocument();
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });

  it('shows round number when combat is active', () => {
    mockUseCombat.mockReturnValue({ ...baseMock, combatState: makeActiveCombatState() });
    render(<CombatTracker sessionId="sess_1" />, { wrapper });
    expect(screen.getByText(/Round 2/i)).toBeInTheDocument();
  });

  it('clicking "Next Turn" calls nextTurn', () => {
    const nextTurn = vi.fn();
    mockUseCombat.mockReturnValue({ ...baseMock, combatState: makeActiveCombatState(), nextTurn });
    render(<CombatTracker sessionId="sess_1" />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Next Turn/i }));
    expect(nextTurn).toHaveBeenCalledOnce();
  });

  it('shows HP bar for combatants', () => {
    mockUseCombat.mockReturnValue({ ...baseMock, combatState: makeActiveCombatState() });
    render(<CombatTracker sessionId="sess_1" />, { wrapper });
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('shows conditions on combatant', () => {
    mockUseCombat.mockReturnValue({ ...baseMock, combatState: makeActiveCombatState() });
    render(<CombatTracker sessionId="sess_1" />, { wrapper });
    expect(screen.getByText('poisoned')).toBeInTheDocument();
  });
});
