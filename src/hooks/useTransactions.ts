import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Transaction } from '../types';

interface CreateTransactionPayload {
  items: {
    product_id: string;
    quantity: number;
    price: number;
    modifiers?: {
      modifier_id: string;
      name: string;
      price: number;
    }[];
  }[];
  paid_amount?: number;
  payment_method?: string;
  customer_id?: string;
  discount?: number;
  notes?: string;
  table_id?: string;
  shift_id: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  status?: 'pending' | 'completed';
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async <T>(fn: () => Promise<T>, retries = 3, interval = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await delay(interval);
    return retry(fn, retries - 1, interval);
  }
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload & { local_id?: string }) => {
      // Use the retry utility for better reliability
      return await retry(async () => {
        const { data } = await api.post<Transaction>('/transactions', payload);
        return data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh stock
      queryClient.invalidateQueries({ queryKey: ['reports'] }); // Refresh reports
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Refresh history
      queryClient.invalidateQueries({ queryKey: ['tables'] }); // Refresh tables
    },
    // If mutation fails after all retries, react-query will handle it.
    // For specialized offline handling, we can add logic in onError if needed.
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreateTransactionPayload }) => {
      const { data } = await api.put<Transaction>(`/transactions/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh stock
      queryClient.invalidateQueries({ queryKey: ['reports'] }); // Refresh reports
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Refresh history
      queryClient.invalidateQueries({ queryKey: ['tables'] }); // Refresh tables
    },
  });
};

export const usePendingTransactions = () => {
    return useQuery({
        queryKey: ['transactions', 'pending'],
        queryFn: async () => {
            const { data } = await api.get('/transactions', { params: { status: 'pending', per_page: 50 } });
            return data.data as Transaction[];
        },
    });
};

export const useCancelTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data } = await api.post(`/transactions/${id}/cancel`, { notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};
export const useTodayTransactions = () => {
    return useQuery({
        queryKey: ['transactions', 'today'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await api.get('/transactions', { 
                params: { 
                    date: today,
                    status: 'completed',
                    per_page: 50 
                } 
            });
            return data.data as Transaction[];
        },
    });
};
