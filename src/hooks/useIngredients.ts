import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Ingredient, StockMovement } from '../types';

// ─── List Ingredients ─────────────────────────────────────────────────────────
export const useIngredients = (lowStock?: boolean) =>
  useQuery({
    queryKey: ['ingredients', { lowStock }],
    queryFn: async () => {
      const { data } = await api.get('/ingredients', { params: { low_stock: lowStock ? 1 : undefined, per_page: 100 } });
      // Backend returns paginated: { data: { data: [...], ... } }
      const result = data.data;
      return (Array.isArray(result) ? result : result.data) as Ingredient[];
    },
  });

// ─── Single Ingredient ────────────────────────────────────────────────────────
export const useIngredient = (id: string) =>
  useQuery({
    queryKey: ['ingredients', id],
    queryFn: async () => {
      const { data } = await api.get(`/ingredients/${id}`);
      return data.data as Ingredient & { stockMovements: StockMovement[] };
    },
    enabled: Boolean(id),
  });

// ─── Create ───────────────────────────────────────────────────────────────────
export const useCreateIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Ingredient>) => {
      const { data } = await api.post('/ingredients', payload);
      return data.data as Ingredient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const useUpdateIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Ingredient> }) => {
      const { data } = await api.put(`/ingredients/${id}`, payload);
      return data.data as Ingredient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
};

// ─── Delete ───────────────────────────────────────────────────────────────────
export const useDeleteIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/ingredients/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
};

// ─── Adjust Stock ─────────────────────────────────────────────────────────────
export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      quantity,
      type,
      notes,
    }: {
      id: string;
      quantity: number;
      type: 'in' | 'out' | 'adjustment' | 'waste';
      notes?: string;
    }) => {
      const { data } = await api.post(`/ingredients/${id}/adjust`, { quantity, type, notes });
      return data.data as StockMovement;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
};

// ─── Low Stock ────────────────────────────────────────────────────────────────
export const useLowStockIngredients = () =>
  useQuery({
    queryKey: ['ingredients', 'low-stock'],
    queryFn: async () => {
      const { data } = await api.get('/ingredients/low-stock');
      return data.data as Ingredient[];
    },
  });
