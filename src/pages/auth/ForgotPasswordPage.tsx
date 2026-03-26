import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail, ArrowLeft, AlertCircle, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useOtp } from '../../hooks/useOtp';
import { OtpInput } from '../../components/auth/OtpInput';
import { toast } from 'sonner';

const emailSchema = z.object({
    email: z.string().email('Email tidak valid'),
});

const passwordSchema = z.object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
    message: 'Password tidak cocok',
    path: ['password_confirmation'],
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { sendOtp, verifyOtp, resetPassword, isSending, isVerifying, isResetting } = useOtp();

    const { register: regEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm<EmailForm>({
        resolver: zodResolver(emailSchema),
    });

    const { register: regPass, handleSubmit: handlePassSubmit, formState: { errors: passErrors } } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    const onEmailSubmit = async (values: EmailForm) => {
        setErrorMessage('');
        try {
            await sendOtp.mutateAsync({ email: values.email, type: 'reset_password' });
            setEmail(values.email);
            setStep('otp');
            toast.success('Kode OTP telah dikirim ke email Anda');
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Gagal mengirim email reset password.');
        }
    };

    const onOtpVerify = async () => {
        setErrorMessage('');
        try {
            await verifyOtp.mutateAsync({ email, code: otpValue, type: 'reset_password' });
            setStep('password');
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Kode OTP salah atau kedaluwarsa.');
        }
    };

    const onPasswordSubmit = async (values: PasswordForm) => {
        setErrorMessage('');
        try {
            await resetPassword.mutateAsync({
                email,
                code: otpValue,
                password: values.password,
                password_confirmation: values.password_confirmation,
            });
            setStep('success');
            toast.success('Password berhasil diperbarui');
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || 'Gagal memperbarui password.');
        }
    };

    if (step === 'success') {
        return (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Password Berhasil Diubah</h2>
                <p className="text-slate-500 mb-8">Kini Anda sudah bisa masuk kembali dengan password yang baru.</p>
                <Link
                    to="/login"
                    className="w-full inline-block bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    Masuk Sekarang
                </Link>
            </div>
        );
    }

    return (
        <div>
            {step !== 'email' && (
                <button 
                    onClick={() => setStep(step === 'otp' ? 'email' : 'otp')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Kembali
                </button>
            )}

            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
                    {step === 'email' && <Mail size={32} />}
                    {step === 'otp' && <ShieldCheck size={32} />}
                    {step === 'password' && <Lock size={32} />}
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center text-slate-900">
                {step === 'email' && 'Lupa Password?'}
                {step === 'otp' && 'Verifikasi Kode'}
                {step === 'password' && 'Password Baru'}
            </h2>
            <p className="text-slate-500 mb-8 text-center text-sm px-4">
                {step === 'email' && 'Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan kode untuk mengatur ulang password.'}
                {step === 'otp' && `Masukkan 6 digit kode keamanan yang kami kirim ke ${email}`}
                {step === 'password' && 'Buat password baru yang kuat dan unik untuk meningkatkan keamanan akun Anda.'}
            </p>

            {errorMessage && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-in shake-1">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {step === 'email' && (
                <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Akun</label>
                        <input
                            type="email"
                            {...regEmail('email')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${emailErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="admin@bisnisanda.com"
                        />
                        {emailErrors.email && <p className="mt-1 text-xs text-red-600 px-1">{emailErrors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSending}
                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-60"
                    >
                        {isSending ? (
                            <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                        ) : (
                            <KeyRound size={20} />
                        )}
                        {isSending ? 'Mengirim...' : 'Kirim Kode Reset'}
                    </button>
                </form>
            )}

            {step === 'otp' && (
                <div className="space-y-8">
                    <OtpInput 
                        value={otpValue} 
                        onChange={setOtpValue} 
                        disabled={isVerifying}
                        onComplete={onOtpVerify} 
                    />

                    <button
                        onClick={onOtpVerify}
                        disabled={otpValue.length !== 6 || isVerifying}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                        {isVerifying ? (
                            <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                        ) : (
                            <ShieldCheck size={20} />
                        )}
                        {isVerifying ? 'Memverifikasi...' : 'Verifikasi Kode'}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                        Tidak menerima email?{' '}
                        <button 
                            onClick={() => sendOtp.mutate({ email, type: 'reset_password' })}
                            disabled={isSending}
                            className="text-indigo-600 font-bold hover:underline disabled:opacity-50"
                        >
                            {isSending ? 'Mengirim ulang...' : 'Kirim Ulang'}
                        </button>
                    </p>
                </div>
            )}

            {step === 'password' && (
                <form onSubmit={handlePassSubmit(onPasswordSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password Baru</label>
                        <input
                            type="password"
                            {...regPass('password')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${passErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="Min. 8 karakter"
                        />
                        {passErrors.password && <p className="mt-1 text-xs text-red-600 px-1">{passErrors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Konfirmasi Password</label>
                        <input
                            type="password"
                            {...regPass('password_confirmation')}
                            className={`block w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${passErrors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                            placeholder="Ulangi password baru"
                        />
                        {passErrors.password_confirmation && <p className="mt-1 text-xs text-red-600 px-1">{passErrors.password_confirmation.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isResetting}
                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-60"
                    >
                        {isResetting ? (
                            <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                        ) : (
                            <CheckCircle2 size={20} />
                        )}
                        {isResetting ? 'Menyimpan...' : 'Perbarui Password'}
                    </button>
                </form>
            )}

            {step === 'email' && (
                <p className="mt-8 text-center text-sm text-slate-500">
                    Ingat password Anda?{' '}
                    <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                        Masuk kembali
                    </Link>
                </p>
            )}
        </div>
    );
}
