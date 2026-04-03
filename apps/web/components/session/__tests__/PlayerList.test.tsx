import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PlayerList from '../PlayerList';
import type { SessionPlayerInfo } from '@/lib/api/sessions';

const PLAYER: SessionPlayerInfo = {
  id: 'sp_1',
  userId: 'user_1',
  username: 'aldric',
  characterId: 'char_123',
  characterName: 'Aldric Ironforge',
  characterClass: 'Fighter',
  characterLevel: 3,
  portraitUrl: null,
  isReady: false,
  isConnected: true,
};

const DISCONNECTED_PLAYER: SessionPlayerInfo = {
  ...PLAYER,
  id: 'sp_2',
  userId: 'user_2',
  username: 'mira',
  characterName: 'Mira Vex',
  isConnected: false,
};

describe('PlayerList', () => {
  it('renders player cards with name, class, level', () => {
    render(
      <PlayerList
        players={[PLAYER]}
        currentUserId="other"
        maxPlayers={4}
        connectedUserIds={['user_1']}
      />
    );
    expect(screen.getByText('aldric')).toBeInTheDocument();
    expect(screen.getByText('Aldric Ironforge')).toBeInTheDocument();
    expect(screen.getByText('Fighter Lv.3')).toBeInTheDocument();
  });

  it('shows connected dot for connected players', () => {
    render(
      <PlayerList
        players={[PLAYER]}
        currentUserId="other"
        maxPlayers={4}
        connectedUserIds={['user_1']}
      />
    );
    const dot = screen.getByTitle('Connected');
    expect(dot).toHaveClass('bg-green-500');
  });

  it('shows disconnected state for disconnected players', () => {
    render(
      <PlayerList
        players={[DISCONNECTED_PLAYER]}
        currentUserId="other"
        maxPlayers={4}
        connectedUserIds={[]}
      />
    );
    const dot = screen.getByTitle('Disconnected');
    expect(dot).toHaveClass('bg-gray-400');
  });

  it('highlights current user card', () => {
    render(
      <PlayerList
        players={[PLAYER]}
        currentUserId="user_1"
        maxPlayers={4}
        connectedUserIds={['user_1']}
      />
    );
    const card = screen.getByText('aldric').closest('div[class*="rounded-lg"]');
    expect(card).toHaveClass('border-indigo-500');
  });

  it('shows empty slot placeholders for unfilled spots', () => {
    render(
      <PlayerList
        players={[PLAYER]}
        currentUserId="other"
        maxPlayers={3}
        connectedUserIds={['user_1']}
      />
    );
    const emptySlots = screen.getAllByText('Empty Slot');
    expect(emptySlots).toHaveLength(2);
  });
});
