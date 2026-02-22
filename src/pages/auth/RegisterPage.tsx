import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/axios';

const registerSchema = z.object({
    tenant_name: z.string().min(2, 'Nama toko minimal 2 karakter'),
    owner_name: z.string().min(2, 'Nama pemilik minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string(),
    domain: z.string()
        .regex(/^[a-z0-9-]*$/, 'Domain hanya boleh berisi huruf kecil, angka, dan tanda hubung')
        .optional()
        .or(z.literal('')),
}).refine((d) => d.password === d.password_confirmation, {
    message: 'Password tidak cocok',
    path: ['password_confirmation'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (values: RegisterForm) => {
        setErrorMessage('');
        try {
            // Remove empty domain so backend treats it as null
            const payload = {
                ...values,
                domain: values.domain || undefined,
            };
            await api.post('/auth/register', payload);
            navigate('/login', { replace: true });
        } catch (err: any) {
            // Show detailed validation errors from backend
            if (err?.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const messages = Object.values(backendErrors).flat().join('. ');
                setErrorMessage(messages);
            } else {
                const msg = err?.response?.data?.message || 'Pendaftaran gagal. Coba lagi.';
                setErrorMessage(msg);
            }
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Daftar Toko Baru</h2>
            <p className="text-slate-500 mb-6 text-sm">Mulai trial gratis 14 hari, tidak perlu kartu kredit.</p>

            {errorMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Toko</label>
                        <input
                            {...register('tenant_name')}
                            className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.tenant_name ? 'border-red-400' : 'border-slate-300'}`}
                            placeholder="Toko Maju Jaya"
                        />
                        {errors.tenant_name && <p className="mt-1 text-xs text-red-600">{errors.tenant_name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemilik</label>
                        <input
                            {...register('owner_name')}
                            className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.owner_name ? 'border-red-400' : 'border-slate-300'}`}
                            placeholder="Budi Santoso"
                        />
                        {errors.owner_name && <p className="mt-1 text-xs text-red-600">{errors.owner_name.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Domain Toko (Opsional)</label>
                    <div className="relative">
                        <input
                            {...register('domain')}
                            className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.domain ? 'border-red-400' : 'border-slate-300'}`}
                            placeholder="my-shop"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-sm font-medium">
                            .kasirku.id
                        </div>
                    </div>
                    {errors.domain ? (
                        <p className="mt-1 text-xs text-red-600">{errors.domain.message}</p>
                    ) : (
                        <p className="mt-1 text-xs text-slate-400">Opsional. URL unik: domain.kasirku.id</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        {...register('email')}
                        className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-400' : 'border-slate-300'}`}
                        placeholder="owner@toko.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                        type="password"
                        {...register('password')}
                        className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-400' : 'border-slate-300'}`}
                        placeholder="Min. 8 karakter"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
                    <input
                        type="password"
                        {...register('password_confirmation')}
                        className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password_confirmation ? 'border-red-400' : 'border-slate-300'}`}
                        placeholder="Ulangi password"
                    />
                    {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <UserPlus size={18} />
                    )}
                    {isSubmitting ? 'Mendaftar...' : 'Daftar Sekarang'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                    Masuk di sini
                </Link>
            </p>
        </div>
    );
}
