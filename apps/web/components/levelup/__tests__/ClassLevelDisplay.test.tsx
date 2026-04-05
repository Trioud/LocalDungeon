import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ClassLevelDisplay from '../ClassLevelDisplay';

describe('ClassLevelDisplay', () => {
  it('renders single class normally', () => {
    render(<ClassLevelDisplay classLevels={{ Fighter: 5 }} />);
    expect(screen.getByText(/Fighter/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('renders two classes with separator', () => {
    render(<ClassLevelDisplay classLevels={{ Fighter: 3, Wizard: 2 }} />);
    expect(screen.getByText(/Fighter/)).toBeInTheDocument();
    expect(screen.getByText(/Wizard/)).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('renders class icons for known classes', () => {
    const { container } = render(<ClassLevelDisplay classLevels={{ Wizard: 3 }} />);
    expect(container.textContent).toContain('📚');
  });

  it('uses fallback icon for unknown class', () => {
    const { container } = render(<ClassLevelDisplay classLevels={{ CustomClass: 2 }} />);
    expect(container.textContent).toContain('⚔️');
  });

  it('renders nothing when classLevels is empty', () => {
    const { container } = render(<ClassLevelDisplay classLevels={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders three classes with two separators', () => {
    render(<ClassLevelDisplay classLevels={{ Fighter: 2, Rogue: 3, Wizard: 1 }} />);
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2);
  });
});
