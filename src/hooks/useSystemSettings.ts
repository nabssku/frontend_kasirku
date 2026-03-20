import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from 'sonner';

export const useSystemSettings = (keys?: string[]) => {
    return useQuery({
        queryKey: ['system-settings', keys],
        queryFn: async () => {
            const params = keys ? { keys: keys.join(',') } : {};
            const { data } = await api.get('/system-settings', { params });
            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useAdminSystemSettings = () => {
    return useQuery({
        queryKey: ['admin-system-settings'],
        queryFn: async () => {
            const { data } = await api.get('/super-admin/system-settings');
            return data.data;
        },
    });
};

export const useUpdateSystemSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Record<string, any>) => {
            const { data } = await api.put('/super-admin/system-settings', { settings });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
            toast.success('Pengaturan sistem berhasil diperbarui');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Gagal memperbarui pengaturan sistem');
        },
    });
};
