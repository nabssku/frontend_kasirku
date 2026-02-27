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
    mutationFn: async (payload: ProductPayload | FormData) => {
      const { data } = await api.post('/products', payload, {
        headers: {
          'Content-Type': payload instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      });
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
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ProductPayload> | FormData }) => {
      // Use POST with _method: PUT for FormData to support file uploads in Laravel
      let actualPayload = payload;
      let config = {};

      if (payload instanceof FormData) {
        payload.append('_method', 'PUT');
        actualPayload = payload;
        config = {
          headers: { 'Content-Type': 'multipart/form-data' },
        };
        // Use post instead of put for FormData upload in Laravel
        const { data } = await api.post(`/products/${id}`, actualPayload, config);
        return data.data as Product;
      } else {
        const { data } = await api.put(`/products/${id}`, payload);
        return data.data as Product;
      }
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
