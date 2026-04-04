import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MasteryBadge from '../MasteryBadge';

describe('MasteryBadge', () => {
  it('renders Cleave badge', () => {
    render(<MasteryBadge property="cleave" />);
    expect(screen.getByText('Cleave')).toBeInTheDocument();
  });

  it('renders Vex badge', () => {
    render(<MasteryBadge property="vex" />);
    expect(screen.getByText('Vex')).toBeInTheDocument();
  });

  it('renders Topple badge', () => {
    render(<MasteryBadge property="topple" />);
    expect(screen.getByText('Topple')).toBeInTheDocument();
  });

  it('has tooltip description for Graze', () => {
    render(<MasteryBadge property="graze" />);
    const badge = screen.getByText('Graze');
    expect(badge).toHaveAttribute('title');
  });

  it('applies correct color class for Push', () => {
    render(<MasteryBadge property="push" />);
    const badge = screen.getByText('Push');
    expect(badge.className).toContain('blue');
  });
});
