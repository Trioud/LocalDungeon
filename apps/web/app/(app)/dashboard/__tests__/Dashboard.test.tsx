import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import DashboardPage from '../page';
import { MOCK_CHARACTER } from '@/test/mocks/handlers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: Object.assign(
    () => ({ user: { username: 'testuser' }, clearAuth: vi.fn() }),
    { getState: () => ({ accessToken: null, user: null, clearAuth: vi.fn() }) }
  ),
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no characters', async () => {
    server.use(
      http.get('*/characters', () => HttpResponse.json([]))
    );
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/No characters yet/i)).toBeInTheDocument();
    });
  });

  it('renders character cards when data loads', async () => {
    server.use(
      http.get('*/characters', () => HttpResponse.json([MOCK_CHARACTER]))
    );
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    expect(screen.getByText('Fighter 5')).toBeInTheDocument();
  });

  it('Create New link points to /characters/new', async () => {
    server.use(
      http.get('*/characters', () => HttpResponse.json([MOCK_CHARACTER]))
    );
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    const createLink = screen.getByText('Create New Character').closest('a');
    expect(createLink).toHaveAttribute('href', '/characters/new');
  });

  it('Delete button shows confirmation modal', async () => {
    server.use(
      http.get('*/characters', () => HttpResponse.json([MOCK_CHARACTER]))
    );
    const user = userEvent.setup();
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(MOCK_CHARACTER.name)).toBeInTheDocument();
    });
    const deleteBtn = screen.getByText('🗑');
    await user.click(deleteBtn);
    expect(screen.getByText(`Delete ${MOCK_CHARACTER.name}?`)).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
