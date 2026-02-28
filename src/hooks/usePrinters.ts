import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { BluetoothPrinterDevice } from '../types';

export const usePrinters = () => {
    return useQuery({
        queryKey: ['bluetooth-printers'],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: BluetoothPrinterDevice[] }>('/bluetooth-printers');
            return data.data;
        },
    });
};

export const useAddPrinter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { name: string; mac_address?: string; outlet_id?: string; is_default?: boolean; type?: 'cashier' | 'kitchen' | 'both' }) => {
            const { data } = await api.post<{ success: boolean; data: BluetoothPrinterDevice }>('/bluetooth-printers', payload);
            return data.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-printers'] }),
    });
};

export const useUpdatePrinter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: { name?: string; mac_address?: string; outlet_id?: string; type?: 'cashier' | 'kitchen' | 'both' } }) => {
            const { data } = await api.put<{ success: boolean; data: BluetoothPrinterDevice }>(`/bluetooth-printers/${id}`, payload);
            return data.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-printers'] }),
    });
};

export const useDeletePrinter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/bluetooth-printers/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-printers'] }),
    });
};

export const useSetDefaultPrinter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.patch<{ success: boolean; data: BluetoothPrinterDevice }>(`/bluetooth-printers/${id}/set-default`);
            return data.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-printers'] }),
    });
};

export const useTransactionReceipt = (transactionId: string | null) => {
    return useQuery({
        queryKey: ['transaction-receipt', transactionId],
        queryFn: async () => {
            const { data } = await api.get(`/transactions/${transactionId}/receipt`);
            return data.data;
        },
        enabled: !!transactionId,
        staleTime: 0,
    });
};
