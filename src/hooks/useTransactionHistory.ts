import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Transaction } from '../types';

interface TransactionHistoryResponse {
  success: boolean;
  data: Transaction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const useTransactionHistory = (page = 1, outletId?: string) => {
  return useQuery({
    queryKey: ['transactions', page, outletId],
    queryFn: async () => {
      const { data } = await api.get<TransactionHistoryResponse>('/transactions', {
        params: { page, per_page: 15, outlet_id: outletId },
      });
      return data;
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
