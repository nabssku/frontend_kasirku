import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Recipe } from '../types';

export const useRecipe = (productId: string) =>
  useQuery({
    queryKey: ['recipe', productId],
    queryFn: async () => {
      const { data } = await api.get(`/recipes/${productId}`);
      return data.data as Recipe | null;
    },
    enabled: Boolean(productId),
  });

export const useUpsertRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, payload }: { productId: string; payload: Partial<Recipe> }) => {
      const { data } = await api.post(`/recipes/${productId}`, payload);
      return data.data as Recipe;
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ['recipe', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/recipes/${productId}`);
    },
    onSuccess: (_, productId) => {
      qc.invalidateQueries({ queryKey: ['recipe', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
