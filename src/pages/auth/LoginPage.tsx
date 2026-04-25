import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    LogIn, 
    Eye, 
    EyeOff, 
    AlertCircle, 
    KeyRound, 
    Mail,  
    Store, 
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { AuthResponse } from '../../types';
import { getDefaultPage } from '../../lib/auth';
import { SEO } from '../../components/SEO';
import { PinPad } from '../../components/common/PinPad';
import { useEffect } from 'react';

const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    remember_me: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { setAuth, isAuthenticated, user, lastTenant } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loginMode, setLoginMode] = useState<'password' | 'pin'>('password');
    const [emailForPin, setEmailForPin] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showPinPad, setShowPinPad] = useState(false);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    if (isAuthenticated) {
        return <Navigate to={getDefaultPage(user?.roles)} replace />;
    }

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            remember_me: false,
        },
    });

    const fetchStaff = async () => {
        if (!lastTenant) return;
        setIsLoadingStaff(true);
        try {
            const { data } = await api.get(`/public/tenants/${lastTenant.id}/staff`);
            setStaffList(data.data);
        } catch (err) {
            console.error('Failed to fetch staff list', err);
        } finally {
            setIsLoadingStaff(false);
        }
    };

    useEffect(() => {
        if (loginMode === 'pin' && lastTenant) {
            fetchStaff();
        }
    }, [loginMode, lastTenant]);

    const onSubmit = async (values: LoginForm) => {
        setErrorMessage('');
        try {
            console.log('[Auth] Attempting login...', { email: values.email, remember_me: values.remember_me });
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

    const onPinComplete = async (pin: string) => {
        setErrorMessage('');
        try {
            const { data } = await api.post<{ data: AuthResponse }>('/auth/login-pin', {
                email: emailForPin || selectedUser?.email,
                pin: pin
            });
            setAuth(data.data);
            const redirect = getDefaultPage(data.data.user.roles);
            navigate(redirect, { replace: true });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'PIN salah atau akun tidak ditemukan.';
            setErrorMessage(msg);
        }
    };

    return (
        <div>
            <SEO title="Masuk ke Akun Anda" />
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

            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button 
                    onClick={() => setLoginMode('password')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${loginMode === 'password' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Mail size={16} /> Password
                </button>
                <button 
                    onClick={() => setLoginMode('pin')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${loginMode === 'pin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <KeyRound size={16} /> PIN
                </button>
            </div>

            {loginMode === 'password' ? (
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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember_me"
                                type="checkbox"
                                {...register('remember_me')}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="remember_me" className="ml-2 block text-sm text-slate-700">
                                Ingat saya
                            </label>
                        </div>

                        <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Lupa password?
                        </Link>
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
            ) : (
                <div className="space-y-6">
                    {lastTenant && !showPinPad && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                                    <Store size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider leading-none">Outlet Terakhir</p>
                                    <p className="text-sm font-bold text-slate-800">{lastTenant.name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setLoginMode('password')}
                                className="text-xs font-medium text-indigo-600 hover:underline"
                            >
                                Ganti Toko
                            </button>
                        </div>
                    )}

                    {!showPinPad ? (
                        <div className="space-y-6">
                            {isLoadingStaff ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : lastTenant && staffList.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-700">Pilih Staf</h3>
                                        <button 
                                            onClick={() => setStaffList([])} 
                                            className="text-xs text-slate-400 hover:text-slate-600"
                                        >
                                            Gunakan Email
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {staffList.map((staf) => (
                                            <button
                                                key={staf.id}
                                                onClick={() => {
                                                    setSelectedUser(staf);
                                                    setShowPinPad(true);
                                                }}
                                                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    {staf.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-900 truncate w-full max-w-[60px]">{staf.name}</p>
                                                    <p className="text-[8px] text-slate-400 uppercase font-black">{staf.role}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Staf</label>
                                        <input
                                            type="email"
                                            value={emailForPin}
                                            onChange={(e) => setEmailForPin(e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="kasir@toko.com"
                                        />
                                    </div>
                                    <button
                                        onClick={() => emailForPin && setShowPinPad(true)}
                                        disabled={!emailForPin}
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                                    >
                                        Lanjut ke PIN
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in">

                            <PinPad 
                                onComplete={onPinComplete}
                                onCancel={() => {
                                    setShowPinPad(false);
                                    setSelectedUser(null);
                                }}
                                title={selectedUser ? selectedUser.name : "Login PIN"}
                                description={selectedUser ? `Masukkan PIN untuk ${selectedUser.role}` : `Masukkan PIN untuk ${emailForPin}`}
                                error={errorMessage}
                                variant="simple"
                            />
                        </div>
                    )}
                </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                    Daftar sekarang
                </Link>
            </p>
        </div>
    );
}
