import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  category: string;
  icon: string;
  is_active: boolean;
}

export interface OutletPaymentMethod {
  id: string;
  payment_method_id: string;
  outlet_id: string;
  is_enabled: boolean;
  config: Record<string, any> | null;
  pivot: {
    id: string;
    is_enabled: boolean;
    config: string | null;
  };
}

interface PaymentMethodsResponse {
  master_methods: PaymentMethod[];
  outlet_methods: OutletPaymentMethod[];
}

export const useOutletPaymentMethods = (outletId: string | null) =>
  useQuery({
    queryKey: ['outletPaymentMethods', outletId],
    queryFn: async () => {
      const { data } = await api.get(`/outlets/${outletId}/payment-methods`);
      return data.data as PaymentMethodsResponse;
    },
    enabled: !!outletId,
  });

export const useUpdateOutletPaymentMethods = (outletId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { payment_methods: { payment_method_id: string, is_enabled: boolean, config?: any }[] }) => {
      const { data } = await api.put(`/outlets/${outletId}/payment-methods`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outletPaymentMethods', outletId] });
      qc.invalidateQueries({ queryKey: ['activePaymentMethods', outletId] });
    },
  });
};

export const useActivePaymentMethods = (outletId: string | null | undefined) =>
  useQuery({
    queryKey: ['activePaymentMethods', outletId],
    queryFn: async () => {
      const { data } = await api.get(`/outlets/${outletId}/active-payment-methods`);
      return data.data as PaymentMethod[];
    },
    enabled: !!outletId,
  });

export const useCreateCustomPaymentMethod = (outletId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string, category: string }) => {
      const { data } = await api.post(`/outlets/${outletId}/payment-methods/custom`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outletPaymentMethods', outletId] });
      qc.invalidateQueries({ queryKey: ['activePaymentMethods', outletId] });
    },
  });
};
