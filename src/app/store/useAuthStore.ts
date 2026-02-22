import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (response: AuthResponse) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (response) =>
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        }),
      logout: async () => {
        try {
          const api = (await import('../../lib/axios')).default;
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
      checkAuth: async () => {
        try {
          const api = (await import('../../lib/axios')).default;
          const { data } = await api.get('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
