import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Plan, Subscription } from '../types';

// ─── Responses ────────────────────────────────────────────────────────────────

interface CurrentSubscriptionResponse {
    subscription: Subscription | null;
    tenant_name: string | null;
    tenant_status: string | null;
}

interface SubscribeResponse {
    payment_transaction: {
        id: string;
        snap_token: string;
        gateway_order_id: string;
        amount: number;
        status: string;
    };
    snap_token: string;
    client_key: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCurrentSubscription() {
    return useQuery<CurrentSubscriptionResponse>({
        queryKey: ['subscription', 'current'],
        queryFn: async () => {
            const { data } = await api.get('/subscriptions/current');
            return data.data;
        },
    });
}

export function useSubscriptionHistory(page = 1) {
    return useQuery({
        queryKey: ['subscription', 'history', page],
        queryFn: async () => {
            const { data } = await api.get('/subscriptions/history', { params: { page } });
            return data.data;
        },
    });
}

export function usePlans() {
    return useQuery<Plan[]>({
        queryKey: ['plans'],
        queryFn: async () => {
            const { data } = await api.get('/plans');
            return data.data;
        },
    });
}

export function useSubscribe() {
    const queryClient = useQueryClient();

    return useMutation<SubscribeResponse, Error, { plan_id: number; billing_cycle?: string }>({
        mutationFn: async (payload) => {
            const { data } = await api.post('/subscriptions/subscribe', payload);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
        },
    });
}
