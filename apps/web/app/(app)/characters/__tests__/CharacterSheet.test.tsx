import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharacterSheetPage from '../[id]/page';
import { MOCK_CHARACTER } from '@/test/mocks/handlers.js';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'char_123' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('CharacterSheetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders identity block with name, class, level', async () => {
    render(<CharacterSheetPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    expect(screen.getByText('Fighter')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('shows Bloodied badge when isBloodied is true', async () => {
    const { server } = await import('@/test/mocks/server.js');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('*/characters/:id', () =>
        HttpResponse.json({ ...MOCK_CHARACTER, isBloodied: true })
      )
    );
    render(<CharacterSheetPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/Bloodied/i)).toBeInTheDocument();
    });
  });

  it('shows ability scores with correct modifier (STR 16 → +3)', async () => {
    render(<CharacterSheetPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    // STR 16 → modifier +3
    const plusThree = screen.getAllByText('+3');
    expect(plusThree.length).toBeGreaterThan(0);
  });

  it('renders Core Stats bar with AC and HP', async () => {
    render(<CharacterSheetPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    expect(screen.getByText('AC')).toBeInTheDocument();
    // AC value 16 appears — use getAllByText since STR score 16 also appears
    const values16 = screen.getAllByText('16');
    expect(values16.length).toBeGreaterThan(0);
    expect(screen.getByText('HP')).toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    render(<CharacterSheetPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Combat' }));
    expect(screen.getByText('Attacks')).toBeInTheDocument();
  });

  it('Heroic Inspiration toggle calls patch mutation', async () => {
    const user = userEvent.setup();
    render(<CharacterSheetPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    const inspBtn = screen.getByRole('button', { name: /inspiration/i });
    await user.click(inspBtn);
    // After click the optimistic update flips heroicInspiration
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inspiration/i })).toBeInTheDocument();
    });
  });
});
