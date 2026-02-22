import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { RestaurantTable } from '../types';

export const useTables = (outletId?: string, status?: string) =>
  useQuery({
    queryKey: ['tables', outletId, status],
    queryFn: async () => {
      const { data } = await api.get('/tables', { params: { outlet_id: outletId, status } });
      return data.data as RestaurantTable[];
    },
  });

export const useCreateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<RestaurantTable>) => {
      const { data } = await api.post('/tables', payload);
      return data.data as RestaurantTable;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
};

export const useUpdateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<RestaurantTable> }) => {
      const { data } = await api.put(`/tables/${id}`, payload);
      return data.data as RestaurantTable;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
};

export const useUpdateTableStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RestaurantTable['status'] }) => {
      const { data } = await api.patch(`/tables/${id}/status`, { status });
      return data.data as RestaurantTable;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
};

export const useDeleteTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/tables/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
};
