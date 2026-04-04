import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VoiceButton from '../VoiceButton';

const defaultProps = {
  isListening: false,
  isSupported: true,
  mode: 'push_to_talk' as const,
  onStart: vi.fn(),
  onStop: vi.fn(),
  onModeToggle: vi.fn(),
};

describe('VoiceButton', () => {
  it('renders mic button when supported', () => {
    render(<VoiceButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument();
  });

  it('shows not supported message when not supported', () => {
    render(<VoiceButton {...defaultProps} isSupported={false} />);
    expect(screen.getByText(/voice not supported/i)).toBeInTheDocument();
  });

  it('shows PTT mode toggle button', () => {
    render(<VoiceButton {...defaultProps} mode="push_to_talk" />);
    expect(screen.getByRole('button', { name: /switch to continuous mode/i })).toBeInTheDocument();
  });

  it('shows Cont. when in continuous mode', () => {
    render(<VoiceButton {...defaultProps} mode="continuous" />);
    expect(screen.getByRole('button', { name: /switch to push-to-talk mode/i })).toBeInTheDocument();
  });

  it('calls onModeToggle when mode button is clicked', () => {
    const onModeToggle = vi.fn();
    render(<VoiceButton {...defaultProps} onModeToggle={onModeToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /switch to continuous mode/i }));
    expect(onModeToggle).toHaveBeenCalledTimes(1);
  });

  it('shows stop listening label when isListening is true', () => {
    render(<VoiceButton {...defaultProps} isListening={true} />);
    expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument();
  });

  it('calls onStart on mousedown in push-to-talk mode', () => {
    const onStart = vi.fn();
    render(<VoiceButton {...defaultProps} onStart={onStart} mode="push_to_talk" />);
    fireEvent.mouseDown(screen.getByRole('button', { name: /start listening/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
