import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant } from '../../types';

interface TenantState {
  currentTenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      setTenant: (tenant) => set({ currentTenant: tenant }),
      clearTenant: () => set({ currentTenant: null }),
    }),
    {
      name: 'tenant-storage',
    }
  )
);
