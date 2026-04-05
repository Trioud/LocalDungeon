import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadyActionModal from '../ReadyActionModal';

function makeProps(overrides = {}) {
  return {
    isOpen: true,
    combatantId: 'c1',
    sessionId: 'sess_1',
    expiresOnTurn: 3,
    socket: null,
    onClose: vi.fn(),
    ...overrides,
  };
}

describe('ReadyActionModal', () => {
  it('renders when isOpen is true', () => {
    render(<ReadyActionModal {...makeProps()} />);
    expect(screen.getByText('Set Ready Action')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ReadyActionModal {...makeProps({ isOpen: false })} />);
    expect(screen.queryByText('Set Ready Action')).not.toBeInTheDocument();
  });

  it('shows error when trigger is empty and form submitted', () => {
    render(<ReadyActionModal {...makeProps()} />);
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Trigger is required')).toBeInTheDocument();
  });

  it('shows error when actionDescription is empty and form submitted', () => {
    render(<ReadyActionModal {...makeProps()} />);
    fireEvent.change(screen.getByPlaceholderText('When an enemy moves within reach…'), { target: { value: 'enemy moves' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Action description is required')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ReadyActionModal {...makeProps({ onClose })} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls socket.emit with correct data on valid submit', () => {
    const emit = vi.fn();
    const socket = { emit } as any;
    const onClose = vi.fn();
    render(<ReadyActionModal {...makeProps({ socket, onClose })} />);
    fireEvent.change(screen.getByPlaceholderText('When an enemy moves within reach…'), { target: { value: 'enemy moves' } });
    fireEvent.change(screen.getByPlaceholderText('I attack with my sword'), { target: { value: 'attack' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(emit).toHaveBeenCalledWith('combat:ready_action_set', expect.objectContaining({
      sessionId: 'sess_1',
      combatantId: 'c1',
      trigger: 'enemy moves',
      actionDescription: 'attack',
    }));
  });

  it('calls onClose after successful submit', () => {
    const onClose = vi.fn();
    render(<ReadyActionModal {...makeProps({ onClose })} />);
    fireEvent.change(screen.getByPlaceholderText('When an enemy moves within reach…'), { target: { value: 'enemy moves' } });
    fireEvent.change(screen.getByPlaceholderText('I attack with my sword'), { target: { value: 'attack' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(onClose).toHaveBeenCalled();
  });
});
