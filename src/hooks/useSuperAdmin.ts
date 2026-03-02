import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { SuperAdminStats, TenantDetail, Tenant, User, Subscription, Plan, PaginatedResponse } from '../types';

// ─── Stats ────────────────────────────────────────────────────────────────────
export function useSuperAdminStats() {
  return useQuery<SuperAdminStats>({
    queryKey: ['super-admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/stats');
      return data.data;
    },
  });
}

// ─── Tenants ──────────────────────────────────────────────────────────────────
export function useSuperAdminTenants(params?: { search?: string; status?: string; page?: number }) {
  return useQuery<PaginatedResponse<TenantDetail>>({
    queryKey: ['super-admin', 'tenants', params],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/tenants', { params });
      return data.data;
    },
  });
}

export function useSuperAdminTenantDetail(id: string) {
  return useQuery<TenantDetail>({
    queryKey: ['super-admin', 'tenants', id],
    queryFn: async () => {
      const { data } = await api.get(`/super-admin/tenants/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<Tenant>) => {
      const { data } = await api.put(`/super-admin/tenants/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
    },
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/super-admin/tenants/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useSuperAdminUsers(params?: { search?: string; tenant_id?: string; role?: string; page?: number }) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['super-admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/users', { params });
      return data.data;
    },
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export function useSuperAdminSubscriptions(params?: { status?: string; tenant_id?: string; search?: string; page?: number }) {
  return useQuery<PaginatedResponse<Subscription & { tenant?: Tenant }>>({
    queryKey: ['super-admin', 'subscriptions', params],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/subscriptions', { params });
      return data.data;
    },
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<Subscription>) => {
      const { data } = await api.put(`/super-admin/subscriptions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
    },
  });
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export function useSuperAdminPlans() {
  return useQuery<Plan[]>({
    queryKey: ['super-admin', 'plans'],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/plans');
      return data.data;
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Plan>) => {
      const { data } = await api.post('/super-admin/plans', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin', 'plans'] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & Partial<Plan>) => {
      const { data } = await api.put(`/super-admin/plans/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin', 'plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/super-admin/plans/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin', 'plans'] }),
  });
}

// ─── Orders / Revenue ─────────────────────────────────────────────────────────

export function useSuperAdminOrders(params?: { page?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['super-admin', 'orders', params],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/orders', { params });
      return data.data;
    },
  });
}

export function useSuperAdminOrderDetail(id: string) {
  return useQuery({
    queryKey: ['super-admin', 'orders', id],
    queryFn: async () => {
      const { data } = await api.get(`/super-admin/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
// ─── Payment Gateway Stats ───────────────────────────────────────────────────

export function useSuperAdminPaymentStats(period = 'month') {
  return useQuery({
    queryKey: ['super-admin', 'payment-stats', period],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/payment-statistics', { params: { period } });
      return data.data;
    },
  });
}
