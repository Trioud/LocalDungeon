import { create } from 'zustand';

interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth(user: AuthUser, accessToken: string): void;
  clearAuth(): void;
  setLoading(loading: boolean): void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
