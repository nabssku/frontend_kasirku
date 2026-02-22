import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Product } from '../types';

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

interface ProductPayload {
  name: string;
  sku?: string;
  description?: string;
  category_id?: string;
  price: number;
  cost_price?: number;
  stock: number;
  min_stock?: number;
  image?: string;
  is_active?: boolean;
}

// ─── Query: List all products ─────────────────────────────────────────────────
export const useProducts = (categoryId?: string, search?: string) => {
  return useQuery({
    queryKey: ['products', categoryId, search],
    queryFn: async () => {
      const { data } = await api.get<ProductsResponse>('/products', {
        params: { category_id: categoryId, search },
      });
      return data.data;
    },
  });
};

// ─── Mutation: Create ─────────────────────────────────────────────────────────
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductPayload) => {
      const { data } = await api.post('/products', payload);
      return data.data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ─── Mutation: Update ─────────────────────────────────────────────────────────
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ProductPayload> }) => {
      const { data } = await api.put(`/products/${id}`, payload);
      return data.data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ─── Mutation: Delete ─────────────────────────────────────────────────────────
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ─── Query: Single product ────────────────────────────────────────────────────
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data.data as Product;
    },
    enabled: Boolean(id),
  });
};
