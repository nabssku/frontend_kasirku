import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { KitchenOrder } from '../types';

export const useKitchenOrders = (outletId?: string, statuses = 'queued,cooking,ready') =>
  useQuery({
    queryKey: ['kitchen-orders', outletId, statuses],
    queryFn: async () => {
      const { data } = await api.get('/kitchen-orders', {
        params: { outlet_id: outletId, statuses },
      });
      return data.data as KitchenOrder[];
    },
    refetchInterval: 10000, // auto-refresh every 10s for live KDS
  });

export const useUpdateKitchenStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: KitchenOrder['status'] }) => {
      const { data } = await api.patch(`/kitchen-orders/${id}/status`, { status });
      return data.data as KitchenOrder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });
};
