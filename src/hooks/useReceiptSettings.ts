import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Outlet, ReceiptSettings } from '../types';

export const useReceiptSettings = (outletId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['outlets', outletId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Outlet }>(`/outlets/${outletId}`);
      return data.data;
    },
    enabled: !!outletId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ settings, logo, googleReviewLink }: { settings: ReceiptSettings, logo?: File, googleReviewLink?: string }) => {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel spoofing
      formData.append('receipt_settings', JSON.stringify(settings));
      if (googleReviewLink !== undefined) {
        formData.append('google_review_link', googleReviewLink);
      }
      if (logo) {
        formData.append('logo', logo);
      }

      const { data } = await api.post<{ success: boolean; data: Outlet }>(`/outlets/${outletId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets', outletId] });
      // Also invalidate transactions receipt data if cached
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const outlet = query.data;
  const isLoading = query.isLoading;

  return {
    outlet,
    isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};
