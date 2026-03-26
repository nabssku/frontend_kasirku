import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';

interface SendOtpParams {
    email: string;
    type?: 'registration' | 'reset_password' | 'verification';
}

interface VerifyOtpParams {
    email: string;
    code: string;
    type: 'registration' | 'reset_password' | 'verification';
}

export function useOtp() {
    const sendOtp = useMutation({
        mutationFn: async (params: SendOtpParams) => {
            const { data } = await api.post('/auth/otp/send', params);
            return data;
        },
    });

    const verifyOtp = useMutation({
        mutationFn: async (params: VerifyOtpParams) => {
            const { data } = await api.post('/auth/otp/verify', params);
            return data;
        },
    });

    const resetPassword = useMutation({
        mutationFn: async (params: any) => {
            const { data } = await api.post('/auth/reset-password', params);
            return data;
        },
    });

    return {
        sendOtp,
        verifyOtp,
        resetPassword,
        isSending: sendOtp.isPending,
        isVerifying: verifyOtp.isPending,
        isResetting: resetPassword.isPending,
    };
}
