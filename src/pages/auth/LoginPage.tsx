import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { AuthResponse } from '../../types';
import { getDefaultPage } from '../../lib/auth';

const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (values: LoginForm) => {
        setErrorMessage('');
        try {
            const { data } = await api.post<{ data: AuthResponse }>('/auth/login', values);
            setAuth(data.data);

            // Role-based redirect
            const redirect = getDefaultPage(data.data.user.roles);
            navigate(redirect, { replace: true });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Email atau password salah.';
            setErrorMessage(msg);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Masuk ke akun Anda</h2>
            <p className="text-slate-500 mb-6 text-sm">
                Masukkan kredensial untuk mengakses terminal POS
            </p>

            {errorMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="shrink-0" />
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        className={`mt-1 block w-full rounded-lg border px-3 py-2.5 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.email ? 'border-red-400' : 'border-slate-300'
                            }`}
                        placeholder="kasir@toko.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            {...register('password')}
                            className={`mt-1 block w-full rounded-lg border px-3 py-2.5 pr-10 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.password ? 'border-red-400' : 'border-slate-300'
                                }`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <LogIn size={18} />
                    )}
                    {isSubmitting ? 'Masuk...' : 'Masuk'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                    Daftar sekarang
                </Link>
            </p>
        </div>
    );
}
