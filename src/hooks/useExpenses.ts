import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Expense, ExpenseCategory } from '../types';

interface CategoriesResponse {
  success: boolean;
  data: ExpenseCategory[];
}

interface ExpenseResponse {
  success: boolean;
  data: Expense[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Expense Categories ───────────────────────────────────────────────────────

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoriesResponse>('/expense-categories');
      return data.data;
    },
  });
};

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post('/expense-categories', payload);
      return data.data as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

interface ExpenseFilters {
  outlet_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

export const useExpenses = (filters: ExpenseFilters = {}) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const { data } = await api.get<ExpenseResponse>('/expenses', { params: filters });
      return data;
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post('/expenses', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};
