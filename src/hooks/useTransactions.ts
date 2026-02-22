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

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const { data } = await api.post<Transaction>('/transactions', payload);
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
