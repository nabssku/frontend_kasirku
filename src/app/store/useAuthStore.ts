import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '../../types';

const MAX_OFFLINE_TIME = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isOnline: boolean;
  lastLogin: number | null;
  lastTenant: { id: string; name: string } | null;
  setAuth: (response: AuthResponse) => void;
  setOnline: (status: boolean) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: true,
      isOnline: true,
      lastLogin: null,
      lastTenant: null,
      
      setOnline: (status) => set({ isOnline: status }),

      setAuth: (response) =>
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          isInitializing: false,
          lastLogin: Date.now(),
          lastTenant: response.user.tenant ? { id: response.user.tenant_id, name: response.user.tenant.name } : get().lastTenant,
        }),

      logout: async () => {
        const { token } = get();
        
        // Clear state immediately to avoid recursive loops
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitializing: false,
          lastLogin: null,
          // lastTenant is preserved
        });

        if (token) {
          try {
            const api = (await import('../../lib/axios')).default;
            await api.post('/auth/logout');
          } catch (error) {
            // Ignore logout errors as we've already cleared locally
            console.error('Logout API failed:', error);
          }
        }
      },

      checkAuth: async () => {
        const { token, lastLogin, isOnline } = get();

        if (!token) {
          set({ isAuthenticated: false, isInitializing: false });
          return;
        }

        // 1. Check Session Expiration (Always check this first)
        if (lastLogin && Date.now() - lastLogin > MAX_OFFLINE_TIME) {
          console.warn('Session expired (offline limit reached)');
          set({ user: null, token: null, isAuthenticated: false, isInitializing: false, lastLogin: null });
          return;
        }

        // 2. If Offline, trust the existing session if not expired
        if (!isOnline) {
          set({ isAuthenticated: true, isInitializing: false });
          return;
        }

        // 3. If Online, revalidate with server
        try {
          const api = (await import('../../lib/axios')).default;
          const { data } = await api.get('/auth/me');
          set({ 
            user: data.data, 
            isAuthenticated: true, 
            isInitializing: false,
            lastLogin: Date.now() // Refresh lastLogin on successful online check
          });
        } catch (error: any) {
          // Only clear session if server returns 401/403 or specifically says token is invalid
          // If it's a network error (even if we thought we were online), keep treating as potentially valid
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            set({ user: null, token: null, isAuthenticated: false, isInitializing: false, lastLogin: null });
          } else {
            // Network error/Server down - fallback to offline behavior
            set({ isAuthenticated: true, isInitializing: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      // versioning can help with major store changes if needed in future
      version: 1,
    }
  )
);
