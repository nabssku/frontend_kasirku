import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';
import type { TicketResponse, SingleTicketResponse } from '../types/chat';

export const useTickets = (params?: { status?: string; per_page?: number; page?: number }) => {
    return useQuery({
        queryKey: ['tickets', params],
        queryFn: async () => {
            const { data } = await axios.get<any>('/tickets', { params });
            return data.data as TicketResponse;
        },
    });
};

export const useTicket = (id: number | string | undefined) => {
    return useQuery({
        queryKey: ['ticket', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await axios.get<SingleTicketResponse>(`/tickets/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { 
            subject: string; 
            message: string; 
            priority?: string;
            tenant_id?: string;
            user_id?: string;
        }) => {
            const { data } = await axios.post('/tickets', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { ticket_id: number; message: string }) => {
            const { data } = await axios.post('/chat/messages', payload);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticket_id.toString()] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
};

export const useUpdateTicketStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const { data } = await axios.patch(`/tickets/${id}/status`, { status });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.id.toString()] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
};
