import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { ModifierGroup, Modifier } from '../types';

// ─── Modifier Groups ──────────────────────────────────────────────────────────
export const useModifierGroups = () =>
  useQuery({
    queryKey: ['modifier-groups'],
    queryFn: async () => {
      const { data } = await api.get('/modifier-groups', { params: { per_page: 100 } });
      // Backend returns paginated response
      const result = data.data;
      return (Array.isArray(result) ? result : result.data) as ModifierGroup[];
    },
  });

export const useCreateModifierGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ModifierGroup>) => {
      const { data } = await api.post('/modifier-groups', payload);
      return data.data as ModifierGroup;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modifier-groups'] }),
  });
};

export const useUpdateModifierGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ModifierGroup> }) => {
      const { data } = await api.put(`/modifier-groups/${id}`, payload);
      return data.data as ModifierGroup;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modifier-groups'] }),
  });
};

export const useDeleteModifierGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/modifier-groups/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modifier-groups'] }),
  });
};

// ─── Individual Modifiers ─────────────────────────────────────────────────────
export const useCreateModifier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, payload }: { groupId: string; payload: Partial<Modifier> }) => {
      const { data } = await api.post(`/modifier-groups/${groupId}/modifiers`, payload);
      return data.data as Modifier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modifier-groups'] }),
  });
};

export const useUpdateModifier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, modifierId, payload }: { groupId: string; modifierId: string; payload: Partial<Modifier> }) => {
      const { data } = await api.put(`/modifier-groups/${groupId}/modifiers/${modifierId}`, payload);
      return data.data as Modifier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modifier-groups'] }),
  });
};

export const useDeleteModifier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, modifierId }: { groupId: string; modifierId: string }) => {
      await api.delete(`/modifier-groups/${groupId}/modifiers/${modifierId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modifier-groups'] }),
  });
};
