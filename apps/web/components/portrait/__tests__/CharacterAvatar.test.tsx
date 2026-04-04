import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CharacterAvatar from '../CharacterAvatar';

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

describe('CharacterAvatar', () => {
  it('renders an img when portraitUrl is provided', () => {
    render(<CharacterAvatar portraitUrl="https://example.com/pic.jpg" name="Aragorn" />);
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/pic.jpg');
    expect(img.getAttribute('alt')).toBe('Aragorn');
  });

  it('renders initials fallback when no portraitUrl', () => {
    render(<CharacterAvatar name="Gandalf" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('G')).toBeDefined();
  });

  it('renders two-letter initials for "John Doe"', () => {
    render(<CharacterAvatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeDefined();
  });

  it('renders single initial for single-word name', () => {
    render(<CharacterAvatar name="Gandalf" />);
    expect(screen.getByText('G')).toBeDefined();
  });

  it('truncates initials to max 2 characters for long names', () => {
    render(<CharacterAvatar name="Aragorn Son Of Arathorn" />);
    const el = screen.getByLabelText('Aragorn Son Of Arathorn');
    expect(el.textContent).toHaveLength(2);
    expect(el.textContent).toBe('AS');
  });

  it('applies correct size for xl', () => {
    render(<CharacterAvatar name="Test" size="xl" />);
    const el = screen.getByLabelText('Test');
    expect(el.style.width).toBe('96px');
    expect(el.style.height).toBe('96px');
  });

  it('applies correct size for sm', () => {
    render(<CharacterAvatar name="Test" size="sm" />);
    const el = screen.getByLabelText('Test');
    expect(el.style.width).toBe('32px');
    expect(el.style.height).toBe('32px');
  });
});
