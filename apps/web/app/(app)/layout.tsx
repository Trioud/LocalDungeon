'use client';

import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1 },
        },
      })
  );
  const { user, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  // Start restoring only if we have no user in memory yet.
  // useRef guard prevents React 18 StrictMode from double-firing the effect
  // and sending two concurrent refresh requests.
  const [restoring, setRestoring] = useState(!user);
  const didFetch = useRef(false);

  useEffect(() => {
    if (user) {
      setRestoring(false);
      return;
    }
    // Guard: only one fetch per mount (StrictMode fires effects twice in dev)
    if (didFetch.current) return;
    didFetch.current = true;

    fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuth(data.user, data.accessToken);
        } else {
          // Cookie already cleared by the route handler — just redirect.
          // Middleware will allow /login through because the cookie is gone.
          clearAuth();
          router.replace('/login');
        }
      })
      .catch(() => {
        clearAuth();
        router.replace('/login');
      })
      .finally(() => setRestoring(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    const accessToken = useAuthStore.getState().accessToken;
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
    clearAuth();
    router.push('/login');
  };

  if (restoring) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-yellow-400 font-bold text-xl">⚔️ LocalDungeon</span>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-gray-300 text-sm">
                  {user.username}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}

