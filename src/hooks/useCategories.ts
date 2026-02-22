import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Category } from '../types';

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface CategoryPayload {
  name: string;
}

// ─── Query: List all categories ───────────────────────────────────────────────
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoriesResponse>('/categories');
      return data.data;
    },
  });
};

// ─── Mutation: Create ─────────────────────────────────────────────────────────
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryPayload) => {
      const { data } = await api.post('/categories', payload);
      return data.data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// ─── Mutation: Update ─────────────────────────────────────────────────────────
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CategoryPayload }) => {
      const { data } = await api.put(`/categories/${id}`, payload);
      return data.data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// ─── Mutation: Delete ─────────────────────────────────────────────────────────
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// ─── Query: Single category ───────────────────────────────────────────────────
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/${id}`);
      return data.data as Category;
    },
    enabled: Boolean(id),
  });
};
