import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GameLog from '../GameLog';
import type { GameLogEntry } from '@local-dungeon/shared';

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// Mock useGameLog hook
const mockSendChat = vi.fn();
const mockLoadMore = vi.fn();
let mockEntries: GameLogEntry[] = [];
let mockHasMore = false;

vi.mock('@/lib/hooks/useGameLog', () => ({
  useGameLog: () => ({
    entries: mockEntries,
    isLoading: false,
    sendChat: mockSendChat,
    loadMore: mockLoadMore,
    hasMore: mockHasMore,
  }),
}));

function makeEntry(overrides: Partial<GameLogEntry> = {}): GameLogEntry {
  return {
    id: `entry-${Math.random()}`,
    sessionId: 'session-1',
    type: 'chat',
    actorId: 'user-1',
    actorName: 'Aragorn',
    payload: { message: 'Hello!' },
    timestamp: new Date().toISOString(),
    isPrivate: false,
    ...overrides,
  };
}

describe('GameLog', () => {
  beforeEach(() => {
    mockEntries = [];
    mockHasMore = false;
    mockSendChat.mockClear();
    mockLoadMore.mockClear();
  });

  it('renders empty state when no entries', () => {
    render(<GameLog sessionId="session-1" />);
    expect(screen.getByText('No events yet.')).toBeTruthy();
  });

  it('renders log entries', () => {
    mockEntries = [makeEntry({ payload: { message: 'Hello world!' } })];
    render(<GameLog sessionId="session-1" />);
    expect(screen.getByText(/Aragorn: Hello world!/)).toBeTruthy();
  });

  it('shows Load older messages button when hasMore is true', () => {
    mockHasMore = true;
    mockEntries = [makeEntry()];
    render(<GameLog sessionId="session-1" />);
    expect(screen.getByText('Load older messages')).toBeTruthy();
  });

  it('calls loadMore when Load older messages is clicked', () => {
    mockHasMore = true;
    mockEntries = [makeEntry()];
    render(<GameLog sessionId="session-1" />);
    fireEvent.click(screen.getByText('Load older messages'));
    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it('filters entries — dice only shows dice_roll types', () => {
    mockEntries = [
      makeEntry({ id: 'e1', type: 'dice_roll', payload: { notation: '1d20', rolls: [15], total: 15 } }),
      makeEntry({ id: 'e2', type: 'chat', payload: { message: 'Hello!' } }),
    ];
    render(<GameLog sessionId="session-1" />);

    const select = screen.getByLabelText('Filter log');
    fireEvent.change(select, { target: { value: 'dice' } });

    expect(screen.getByText(/rolled 1d20/)).toBeTruthy();
    expect(screen.queryByText(/Aragorn: Hello!/)).toBeNull();
  });

  it('sends chat via sendChat on button click', () => {
    mockEntries = [];
    render(<GameLog sessionId="session-1" characterName="Aragorn" />);

    const input = screen.getByPlaceholderText('Send a message…');
    fireEvent.change(input, { target: { value: 'For Gondor!' } });
    fireEvent.click(screen.getByText('Send'));

    expect(mockSendChat).toHaveBeenCalledWith('For Gondor!', 'Aragorn');
  });

  it('sends chat on Enter key press', () => {
    render(<GameLog sessionId="session-1" />);

    const input = screen.getByPlaceholderText('Send a message…');
    fireEvent.change(input, { target: { value: 'Roll initiative!' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockSendChat).toHaveBeenCalledWith('Roll initiative!', undefined);
  });

  it('disables Send button when input is empty', () => {
    render(<GameLog sessionId="session-1" />);
    const sendBtn = screen.getByText('Send');
    expect(sendBtn).toHaveProperty('disabled', true);
  });

  it('shows private entry with lock icon', () => {
    mockEntries = [
      makeEntry({ type: 'dice_roll', isPrivate: true, payload: { notation: '1d20', rolls: [15], total: 15 } }),
    ];
    render(<GameLog sessionId="session-1" />);
    expect(screen.getByText('🔒')).toBeTruthy();
  });
});
