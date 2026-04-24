import { AlertTriangle, Crown, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';

interface SubscriptionExpiredBlockProps {
    status: string;
}

export const SubscriptionExpiredBlock: React.FC<SubscriptionExpiredBlockProps> = ({
    status
}) => {
    const logout = useAuthStore(state => state.logout);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                {/* Decorative Background */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />

                <div className="p-10 text-center relative">
                    {/* Icon Container */}
                    <div className="relative mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-red-100 shadow-2xl">
                            <AlertTriangle className="text-red-500" size={48} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100">
                            <Crown className="text-amber-500" size={20} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                        Layanan Terhenti
                    </h2>

                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100 mb-8">
                        <p className="text-red-900 font-bold text-lg mb-2">
                            {status === 'expired' ? 'Paket Berlangganan Berakhir' : 'Langganan Terhenti'}
                        </p>
                        <p className="text-red-700 font-medium">
                            Akses ke fitur Jagokasir saat ini dibatasi karena status langganan Anda.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-4 text-slate-600 font-semibold bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                <User className="text-indigo-600" size={24} />
                            </div>
                            <p className="leading-relaxed">
                                Mohon segera hubungi <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">Owner</span> untuk memperbarui paket layanan Anda.
                            </p>
                        </div>

                        <p className="text-sm text-slate-400 font-medium italic">
                            "Upgrade Paket anda pada halaman owner"
                        </p>

                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                        >
                            <LogOut size={20} />
                            Keluar dari Akun
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
