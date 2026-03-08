import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { getDefaultPage } from '../../lib/auth';

export const AuthLayout = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to={getDefaultPage(user?.roles)} replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 overflow-hidden">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-60" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-amber-50 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <img src="/JagoKasir.png" alt="JagoKasir Logo" className="w-12 h-12 object-contain" />
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            JagoKasir <span className="text-indigo-600 italic">POS</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Sistem Kasir Modern untuk Bisnis Anda</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 relative z-10">
                    <Outlet />
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    &copy; {new Date().getFullYear()} JagoKasir. All rights reserved.
                </p>
            </div>
        </div>
    );
};
