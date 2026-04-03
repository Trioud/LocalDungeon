import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineEdit from '../InlineEdit';

describe('InlineEdit', () => {
  it('renders value as text initially', () => {
    render(<InlineEdit value="Hello" onSave={vi.fn()} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('clicking switches to input', async () => {
    const user = userEvent.setup();
    render(<InlineEdit value="Hello" onSave={vi.fn()} />);
    await user.click(screen.getByText('Hello'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Hello');
  });

  it('blur with new value calls onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<InlineEdit value="Hello" onSave={onSave} />);
    await user.click(screen.getByText('Hello'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'World');
    await user.tab();
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('World');
    });
  });

  it('Escape key reverts value without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="Hello" onSave={onSave} />);
    await user.click(screen.getByText('Hello'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Changed');
    await user.keyboard('{Escape}');
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('Enter key saves value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<InlineEdit value="Hello" onSave={onSave} />);
    await user.click(screen.getByText('Hello'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Saved');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Saved');
    });
  });
});
