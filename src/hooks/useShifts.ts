import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Shift, CashDrawerLog } from '../types';

export const useCurrentShift = (outletId?: string) =>
  useQuery({
    queryKey: ['shifts', 'current', outletId],
    queryFn: async () => {
      const { data } = await api.get('/shifts/current', { params: { outlet_id: outletId } });
      return data.data as Shift | null;
    },
  });

export const useShifts = (params?: { outlet_id?: string; start_date?: string; end_date?: string; cashier_id?: string; page?: number }) =>
  useQuery({
    queryKey: ['shifts', params],
    queryFn: async () => {
      const { data } = await api.get('/shifts', { params });
      return data.data as { data: Shift[]; current_page: number; last_page: number; total: number };
    },
  });

export const useShift = (id: string) =>
  useQuery({
    queryKey: ['shifts', id],
    queryFn: async () => {
      const { data } = await api.get(`/shifts/${id}`);
      return data.data as Shift;
    },
    enabled: Boolean(id),
  });

export const useOpenShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { outlet_id: string; opening_cash: number; notes?: string }) => {
      const { data } = await api.post('/shifts', payload);
      return data.data as Shift;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
};

export const useCloseShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, closing_cash, notes }: { id: string; closing_cash: number; notes?: string }) => {
      const { data } = await api.patch(`/shifts/${id}/close`, { closing_cash, notes });
      return data.data as Shift;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
};

export const useAddCashLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shiftId,
      type,
      amount,
      reason,
    }: {
      shiftId: string;
      type: 'in' | 'out';
      amount: number;
      reason?: string;
    }) => {
      const { data } = await api.post(`/shifts/${shiftId}/cash-logs`, { type, amount, reason });
      return data.data as CashDrawerLog;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
};
