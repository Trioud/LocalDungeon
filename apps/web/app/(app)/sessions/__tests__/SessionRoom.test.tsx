import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SessionRoomPage from '../[id]/page.js';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'sess_123' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../../../lib/hooks/useSessionSocket.js', () => ({
  useSessionSocket: () => ({ status: 'disconnected', connectedUserIds: [], ping: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('SessionRoomPage', () => {
  it('renders session name in header', async () => {
    render(<SessionRoomPage />, { wrapper });
    expect(await screen.findByText('The Lost Mine')).toBeInTheDocument();
  });

  it('shows invite code', async () => {
    render(<SessionRoomPage />, { wrapper });
    expect(await screen.findByText('ABC123')).toBeInTheDocument();
  });

  it('renders PlayerList with session players', async () => {
    render(<SessionRoomPage />, { wrapper });
    expect(await screen.findByText('aldric')).toBeInTheDocument();
    expect(screen.getByText('Aldric Ironforge')).toBeInTheDocument();
  });

  it('Leave Session button is present', async () => {
    render(<SessionRoomPage />, { wrapper });
    expect(await screen.findByRole('button', { name: /Leave Session/i })).toBeInTheDocument();
  });
});
