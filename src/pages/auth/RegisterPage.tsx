import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, AlertCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/axios';
import { useOtp } from '../../hooks/useOtp';
import { OtpInput } from '../../components/auth/OtpInput';
import { toast } from 'sonner';
import { useAuthStore } from '../../app/store/useAuthStore';
import { getDefaultPage } from '../../lib/auth';

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
    const { isAuthenticated, user } = useAuthStore();
    
    if (isAuthenticated) {
        return <Navigate to={getDefaultPage(user?.roles)} replace />;
    }

    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [otpValue, setOtpValue] = useState('');
    const [registrationPayload, setRegistrationPayload] = useState<RegisterForm | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    
    const { sendOtp, verifyOtp, isSending, isVerifying } = useOtp();

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
            // First send OTP
            await sendOtp.mutateAsync({ email: values.email, type: 'registration' });
            
            // Save payload for later
            setRegistrationPayload(values);
            setStep('otp');
            toast.success('Kode verifikasi telah dikirim ke email Anda');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Gagal mengirim kode verifikasi.';
            setErrorMessage(msg);
        }
    };

    const handleVerifyAndRegister = async () => {
        if (!registrationPayload || otpValue.length !== 6) return;
        
        setErrorMessage('');
        try {
            // 1. Verify OTP first
            await verifyOtp.mutateAsync({ 
                email: registrationPayload.email, 
                code: otpValue, 
                type: 'registration' 
            });

            // 2. Complete Registration
            const payload = {
                ...registrationPayload,
                domain: registrationPayload.domain || undefined,
            };
            await api.post('/auth/register', payload);
            
            toast.success('Pendaftaran berhasil! Silakan masuk.');
            navigate('/login', { replace: true });
        } catch (err: any) {
            if (err?.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const messages = Object.values(backendErrors).flat().join('. ');
                setErrorMessage(messages);
            } else {
                const msg = err?.response?.data?.message || 'Pendaftaran gagal. Kode OTP mungkin salah atau kedaluwarsa.';
                setErrorMessage(msg);
            }
        }
    };

    if (step === 'otp' && registrationPayload) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                    onClick={() => setStep('form')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Kembali ke form
                </button>

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <Mail size={32} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-center text-slate-900">Verifikasi Email</h2>
                <p className="text-slate-500 mb-8 text-center text-sm px-4">
                    Kami telah mengirimkan 6 digit kode keamanan ke <br />
                    <span className="font-bold text-slate-800">{registrationPayload.email}</span>
                </p>

                {errorMessage && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="mb-8">
                    <OtpInput 
                        value={otpValue} 
                        onChange={setOtpValue} 
                        disabled={isVerifying}
                        onComplete={() => {}} 
                    />
                </div>

                <button
                    onClick={handleVerifyAndRegister}
                    disabled={otpValue.length !== 6 || isVerifying}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:grayscale"
                >
                    {isVerifying ? (
                        <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                    ) : (
                        <ShieldCheck size={20} />
                    )}
                    {isVerifying ? 'Memproses...' : 'Verifikasi & Daftar'}
                </button>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Tidak menerima email?{' '}
                    <button 
                        onClick={() => sendOtp.mutate({ email: registrationPayload.email, type: 'registration' })}
                        disabled={isSending}
                        className="text-indigo-600 font-bold hover:underline disabled:opacity-50"
                    >
                        {isSending ? 'Mengirim ulang...' : 'Kirim Ulang'}
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Daftar Toko Baru</h2>
            <p className="text-slate-500 mb-8 text-sm">Mulai trial gratis 14 hari, tidak perlu kartu kredit.</p>

            {errorMessage && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-in slide-in-from-top-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Toko</label>
                        <input
                            {...register('tenant_name')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${errors.tenant_name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="Toko Maju Jaya"
                        />
                        {errors.tenant_name && <p className="mt-1 text-xs text-red-600 px-1">{errors.tenant_name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Pemilik</label>
                        <input
                            {...register('owner_name')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${errors.owner_name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="Budi Santoso"
                        />
                        {errors.owner_name && <p className="mt-1 text-xs text-red-600 px-1">{errors.owner_name.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Domain Toko (Opsional)</label>
                    <div className="relative group">
                        <input
                            {...register('domain')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${errors.domain ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="my-shop"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-sm font-semibold opacity-50 group-focus-within:opacity-100">
                            .jagokasir.store
                        </div>
                    </div>
                    {errors.domain ? (
                        <p className="mt-1 text-xs text-red-600 px-1">{errors.domain.message}</p>
                    ) : (
                        <p className="mt-1 text-[10px] text-slate-400 px-1 italic">Opsional. URL unik: domain.jagokasir.store</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                    <input
                        type="email"
                        {...register('email')}
                        className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                        placeholder="owner@toko.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600 px-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            {...register('password')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="Min. 8 karakter"
                        />
                        {errors.password && <p className="mt-1 text-xs text-red-600 px-1">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Konfirmasi</label>
                        <input
                            type="password"
                            {...register('password_confirmation')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${errors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="Ulangi password"
                        />
                        {errors.password_confirmation && <p className="mt-1 text-xs text-red-600 px-1">{errors.password_confirmation.message}</p>}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || isSending}
                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                    {isSubmitting || isSending ? (
                        <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                    ) : (
                        <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
                    )}
                    {isSubmitting || isSending ? 'Memproses...' : 'Lanjutkan Pendaftaran'}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                    Masuk di sini
                </Link>
            </p>
        </div>
    );
}
