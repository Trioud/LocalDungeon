import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InspirationBadge from '../InspirationBadge';

describe('InspirationBadge', () => {
  it('renders a glowing star when character has inspiration', () => {
    render(
      <InspirationBadge hasInspiration={true} characterName="Aldric" isOwn={false} />,
    );
    const star = screen.getByLabelText('Has Heroic Inspiration');
    expect(star).toBeTruthy();
    expect(star.className).toContain('text-yellow-400');
  });

  it('renders a dim star when character has no inspiration', () => {
    render(
      <InspirationBadge hasInspiration={false} characterName="Aldric" isOwn={false} />,
    );
    const star = screen.getByLabelText('No Heroic Inspiration');
    expect(star.className).toContain('text-gray-300');
  });

  it('shows Use and Gift buttons when isOwn=true and hasInspiration=true', () => {
    render(
      <InspirationBadge hasInspiration={true} characterName="Aldric" isOwn={true} />,
    );
    expect(screen.getByLabelText('Use Heroic Inspiration to reroll')).toBeTruthy();
    expect(screen.getByLabelText('Gift Heroic Inspiration')).toBeTruthy();
  });

  it('does not show Use/Gift buttons when isOwn=false', () => {
    render(
      <InspirationBadge hasInspiration={true} characterName="Aldric" isOwn={false} />,
    );
    expect(screen.queryByLabelText('Use Heroic Inspiration to reroll')).toBeNull();
    expect(screen.queryByLabelText('Gift Heroic Inspiration')).toBeNull();
  });

  it('does not show Use/Gift buttons when hasInspiration=false even if isOwn=true', () => {
    render(
      <InspirationBadge hasInspiration={false} characterName="Aldric" isOwn={true} />,
    );
    expect(screen.queryByLabelText('Use Heroic Inspiration to reroll')).toBeNull();
    expect(screen.queryByLabelText('Gift Heroic Inspiration')).toBeNull();
  });

  it('shows gift picker with eligible recipients on Gift click', () => {
    const players = [
      { id: 'p2', name: 'Brienna', hasInspiration: false },
      { id: 'p3', name: 'Corvin', hasInspiration: true },
    ];
    render(
      <InspirationBadge
        hasInspiration={true}
        characterName="Aldric"
        isOwn={true}
        sessionPlayers={players}
        onGift={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Gift Heroic Inspiration'));
    expect(screen.getByText('Brienna')).toBeTruthy();
    // Corvin already has inspiration — not shown
    expect(screen.queryByText('Corvin')).toBeNull();
  });

  it('calls onGift with correct id when a recipient is selected', () => {
    const onGift = vi.fn();
    const players = [{ id: 'p2', name: 'Brienna', hasInspiration: false }];
    render(
      <InspirationBadge
        hasInspiration={true}
        characterName="Aldric"
        isOwn={true}
        sessionPlayers={players}
        onGift={onGift}
      />,
    );
    fireEvent.click(screen.getByLabelText('Gift Heroic Inspiration'));
    fireEvent.click(screen.getByText('Brienna'));
    expect(onGift).toHaveBeenCalledWith('p2');
  });
});
