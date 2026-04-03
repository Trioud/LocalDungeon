import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SessionsPage from '../page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('SessionsPage', () => {
  it('shows loading skeleton while fetching', () => {
    render(<SessionsPage />, { wrapper });
    // Skeletons use animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders session cards with name, status, player count', async () => {
    render(<SessionsPage />, { wrapper });
    expect(await screen.findByText('The Lost Mine')).toBeInTheDocument();
    expect(screen.getByText(/Players: 1 \/ 6/)).toBeInTheDocument();
    expect(screen.getByText('🟢 Lobby')).toBeInTheDocument();
  });

  it('shows empty state when no sessions', async () => {
    const { server } = await import('../../../../test/mocks/server.js');
    const { http, HttpResponse } = await import('msw');
    server.use(http.get('*/sessions', () => HttpResponse.json([])));
    render(<SessionsPage />, { wrapper });
    expect(await screen.findByText(/No sessions yet/)).toBeInTheDocument();
  });

  it('"Create New Session" link is present', async () => {
    render(<SessionsPage />, { wrapper });
    const link = screen.getByRole('link', { name: /Create New Session/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/sessions/new');
  });
});
