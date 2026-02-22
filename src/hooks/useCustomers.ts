import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Customer, PaginatedResponse } from '../types';

interface CustomersResponse {
  success: boolean;
  data: Customer[];
  links: PaginatedResponse<Customer>['links'];
  meta: PaginatedResponse<Customer>['meta'];
}

interface CustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ─── Query: Paginated list ────────────────────────────────────────────────────
export const useCustomers = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const { data } = await api.get<CustomersResponse>('/customers', {
        params: { page, per_page: 15, search: search || undefined },
      });
      return data;
    },
  });
};

// ─── Mutation: Create ─────────────────────────────────────────────────────────
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomerPayload) => {
      const { data } = await api.post('/customers', payload);
      return data.data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// ─── Mutation: Update ─────────────────────────────────────────────────────────
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomerPayload> }) => {
      const { data } = await api.put(`/customers/${id}`, payload);
      return data.data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// ─── Mutation: Delete ─────────────────────────────────────────────────────────
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
