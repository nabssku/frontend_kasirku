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
        invoice_id: string;
        payment_url: string;
        final_amount: number;
        gateway_order_id: string;
        amount: number;
        status: string;
    };
    payment_url: string;
    invoice_id: string;
    final_amount: number;
}

interface CheckPaymentResponse {
    success: boolean;
    invoice_id: string;
    status: 'pending' | 'paid' | 'expired' | 'failed';
    amount: number | null;
    final_amount: number | null;
    paid_at: string | null;
    expires_at: string | null;
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

export function useCheckPayment(invoice: string | null, enabled = false) {
    return useQuery<CheckPaymentResponse>({
        queryKey: ['subscription', 'check-payment', invoice],
        queryFn: async () => {
            const { data } = await api.get(`/subscriptions/check-payment/${invoice}`);
            return data;
        },
        enabled: enabled && !!invoice,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            // Stop polling once settled
            if (status === 'paid' || status === 'expired' || status === 'failed') return false;
            return 5000; // poll every 5 seconds while pending
        },
    });
}
