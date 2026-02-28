import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { User } from '../types';

interface InvitePayload {
  name: string;
  email: string;
  password: string;
  role_slug: string;
  outlet_id?: string | null;
}

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.data.data as User[];
    },
  });

export const useInviteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InvitePayload) => {
      const { data } = await api.post('/users', payload);
      return data.data as User;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<InvitePayload & { is_active: boolean }> }) => {
      const { data } = await api.put(`/users/${id}`, payload);
      return data.data as User;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/users/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};
