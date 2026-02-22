import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Outlet } from '../types';

export const useOutlets = () =>
  useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const { data } = await api.get('/outlets');
      return data.data.data as Outlet[];
    },
  });

export const useCreateOutlet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Outlet>) => {
      const { data } = await api.post('/outlets', payload);
      return data.data as Outlet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

export const useUpdateOutlet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Outlet> }) => {
      const { data } = await api.put(`/outlets/${id}`, payload);
      return data.data as Outlet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

export const useDeleteOutlet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/outlets/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outlets'] }),
  });
};
