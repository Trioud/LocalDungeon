import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ExportPanel from '../ExportPanel';

describe('ExportPanel', () => {
  const originalCreateElement = document.createElement.bind(document);
  let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockAnchor as unknown as HTMLElement;
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders TXT button', () => {
    render(<ExportPanel sessionId="s-1" />);
    expect(screen.getByText('TXT')).toBeDefined();
  });

  it('renders MD button', () => {
    render(<ExportPanel sessionId="s-1" />);
    expect(screen.getByText('MD')).toBeDefined();
  });

  it('renders JSON button', () => {
    render(<ExportPanel sessionId="s-1" />);
    expect(screen.getByText('JSON')).toBeDefined();
  });

  it('renders export heading', () => {
    render(<ExportPanel sessionId="s-1" />);
    expect(screen.getByText('Export Session Log')).toBeDefined();
  });

  it('all three buttons are enabled initially', () => {
    render(<ExportPanel sessionId="s-1" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    for (const btn of buttons) {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it('clicking TXT button triggers a download via anchor click', () => {
    render(<ExportPanel sessionId="s-1" characterNames={['Aragorn']} />);
    fireEvent.click(screen.getByText('TXT'));
    expect(mockAnchor.click).toHaveBeenCalled();
  });
});

