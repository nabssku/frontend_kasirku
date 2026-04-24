import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { LogOut, AlertCircle, ShieldAlert, Store } from 'lucide-react';

export const AccountStatusOverlay: React.FC = () => {
    const { user, logout } = useAuthStore();

    if (!user) return null;

    const isSuperAdmin = user.roles?.some(r => r.slug === 'super_admin');
    if (isSuperAdmin) return null;

    const isUserInactive = user.is_active === false;
    const isOutletInactive = user.outlet && user.outlet.is_active === false;
    const isTenantSuspended = user.tenant && (user.tenant.status === 'suspended' || user.tenant.status === 'inactive');

    const isSuspended = isUserInactive || isOutletInactive || isTenantSuspended;

    if (!isSuspended) return null;

    let title = "Akses Ditangguhkan";
    let message = "Akun Anda saat ini tidak dapat mengakses layanan KasirKu.";
    let icon = <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />;

    if (isUserInactive) {
        title = "Akun Pengguna Nonaktif";
        message = "Akun pengguna Anda telah dinonaktifkan oleh administrator. Silakan hubungi pemilik outlet Anda.";
        icon = <AlertCircle className="w-16 h-16 text-red-500 mb-6" />;
    } else if (isOutletInactive) {
        title = "Outlet Nonaktif";
        message = "Outlet tempat Anda bekerja saat ini sedang nonaktif. Silakan hubungi administrator sistem.";
        icon = <Store className="w-16 h-16 text-orange-500 mb-6" />;
    } else if (isTenantSuspended) {
        title = "Layanan Ditangguhkan";
        message = "Layanan untuk bisnis Anda telah ditangguhkan. Hal ini biasanya terjadi karena masa berlangganan berakhir atau pelanggaran kebijakan.";
        icon = <ShieldAlert className="w-16 h-16 text-red-600 mb-6" />;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transform animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                            {icon}
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        {title}
                    </h2>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
                        >
                            <LogOut className="w-5 h-5" />
                            Keluar dari Akun
                        </button>
                        
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Butuh bantuan? Hubungi <span className="text-indigo-500 font-medium">support@jagokasir.store</span>
                        </p>
                    </div>
                </div>
                
                <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
            </div>
        </div>
    );
};
