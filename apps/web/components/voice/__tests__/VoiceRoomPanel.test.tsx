import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PeerState } from '@local-dungeon/shared';
import VoiceRoomPanel from '../VoiceRoomPanel';

const defaultProps = {
  isSupported: true,
  isInVoice: false,
  isMuted: false,
  peers: new Map<string, PeerState>(),
  onJoin: vi.fn(),
  onLeave: vi.fn(),
  onToggleMute: vi.fn(),
  onSetVolume: vi.fn(),
};

function makePeer(socketId: string, overrides?: Partial<PeerState>): PeerState {
  return {
    socketId,
    characterName: 'Aragorn',
    connected: true,
    muted: false,
    volume: 1,
    speaking: false,
    ...overrides,
  };
}

describe('VoiceRoomPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Join Voice" button when supported and not in voice', () => {
    render(<VoiceRoomPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /join voice/i })).toBeInTheDocument();
  });

  it('shows "Voice chat unavailable" when RTCPeerConnection not supported', () => {
    render(<VoiceRoomPanel {...defaultProps} isSupported={false} />);
    expect(screen.getByText(/voice chat unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /join voice/i })).not.toBeInTheDocument();
  });

  it('shows "Leave Voice" button when in voice', () => {
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} />);
    expect(screen.getByRole('button', { name: /leave voice/i })).toBeInTheDocument();
  });

  it('calls onJoin when "Join Voice" is clicked', () => {
    const onJoin = vi.fn();
    render(<VoiceRoomPanel {...defaultProps} onJoin={onJoin} />);
    fireEvent.click(screen.getByRole('button', { name: /join voice/i }));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('calls onLeave when "Leave Voice" is clicked', () => {
    const onLeave = vi.fn();
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} onLeave={onLeave} />);
    fireEvent.click(screen.getByRole('button', { name: /leave voice/i }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('shows mute button when in voice', () => {
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} />);
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
  });

  it('calls onToggleMute when mute button clicked', () => {
    const onToggleMute = vi.fn();
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} onToggleMute={onToggleMute} />);
    fireEvent.click(screen.getByRole('button', { name: /mute/i }));
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('renders peer rows when connected with peers', () => {
    const peers = new Map<string, PeerState>();
    peers.set('socket-1', makePeer('socket-1', { characterName: 'Legolas' }));
    peers.set('socket-2', makePeer('socket-2', { characterName: 'Gimli' }));
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} peers={peers} />);
    expect(screen.getByText('Legolas')).toBeInTheDocument();
    expect(screen.getByText('Gimli')).toBeInTheDocument();
  });

  it('shows speaking indicator for a speaking peer', () => {
    const peers = new Map<string, PeerState>();
    peers.set('socket-1', makePeer('socket-1', { characterName: 'Frodo', speaking: true }));
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} peers={peers} />);
    expect(screen.getByLabelText(/speaking/i)).toBeInTheDocument();
  });

  it('shows volume slider per peer', () => {
    const peers = new Map<string, PeerState>();
    peers.set('socket-1', makePeer('socket-1', { characterName: 'Gandalf' }));
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} peers={peers} />);
    expect(screen.getByRole('slider', { name: /volume for gandalf/i })).toBeInTheDocument();
  });

  it('calls onSetVolume when volume slider changes', () => {
    const onSetVolume = vi.fn();
    const peers = new Map<string, PeerState>();
    peers.set('socket-1', makePeer('socket-1', { characterName: 'Gandalf' }));
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} peers={peers} onSetVolume={onSetVolume} />);
    fireEvent.change(screen.getByRole('slider', { name: /volume for gandalf/i }), { target: { value: '0.5' } });
    expect(onSetVolume).toHaveBeenCalledWith('socket-1', 0.5);
  });

  it('shows "Waiting for others" message when in voice with no peers', () => {
    render(<VoiceRoomPanel {...defaultProps} isInVoice={true} peers={new Map()} />);
    expect(screen.getByText(/waiting for others/i)).toBeInTheDocument();
  });
});
