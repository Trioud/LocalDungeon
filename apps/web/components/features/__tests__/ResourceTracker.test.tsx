import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResourceTracker from '../ResourceTracker';
import type { ClassResource } from '@local-dungeon/shared';

function makeResource(overrides: Partial<ClassResource> = {}): ClassResource {
  return {
    id: 'rage',
    name: 'Rage',
    className: 'barbarian',
    max: 3,
    current: 3,
    recharge: 'long',
    ...overrides,
  };
}

describe('ResourceTracker', () => {
  it('renders nothing when resources is empty', () => {
    const { container } = render(<ResourceTracker resources={[]} onUse={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders resource name', () => {
    render(<ResourceTracker resources={[makeResource()]} onUse={vi.fn()} />);
    expect(screen.getByText('Rage')).toBeInTheDocument();
  });

  it('renders class name as group header', () => {
    render(<ResourceTracker resources={[makeResource()]} onUse={vi.fn()} />);
    expect(screen.getByText('barbarian')).toBeInTheDocument();
  });

  it('renders Use button for each resource', () => {
    render(
      <ResourceTracker
        resources={[makeResource({ id: 'rage' }), makeResource({ id: 'ki', name: 'Ki Points', className: 'monk' })]
        }
        onUse={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: /use/i });
    expect(buttons).toHaveLength(2);
  });

  it('Use button is disabled when current = 0', () => {
    render(<ResourceTracker resources={[makeResource({ current: 0 })]} onUse={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /use rage/i });
    expect(btn).toBeDisabled();
  });

  it('renders HP pool display for Lay on Hands', () => {
    render(
      <ResourceTracker
        resources={[makeResource({ id: 'lay_on_hands', name: 'Lay on Hands', className: 'paladin', max: 25, current: 20, unit: 'HP' })]}
        onUse={vi.fn()}
      />,
    );
    expect(screen.getByText('20/25 HP')).toBeInTheDocument();
  });

  it('groups resources by class', () => {
    render(
      <ResourceTracker
        resources={[
          makeResource({ id: 'rage', className: 'barbarian' }),
          makeResource({ id: 'second_wind', name: 'Second Wind', className: 'fighter' }),
        ]}
        onUse={vi.fn()}
      />,
    );
    expect(screen.getByText('barbarian')).toBeInTheDocument();
    expect(screen.getByText('fighter')).toBeInTheDocument();
  });
});
