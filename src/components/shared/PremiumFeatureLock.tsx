import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface PremiumFeatureLockProps {
    featureName: string;
    requiredPlan?: string;
}

export const PremiumFeatureLock: React.FC<PremiumFeatureLockProps> = ({
    featureName,
    requiredPlan = 'Professional'
}) => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-[600px] w-full overflow-hidden rounded-3xl bg-white border border-slate-200">
            {/* ─── Skeleton Background ─── */}
            <div className="absolute inset-0 p-8 space-y-8 opacity-20 pointer-events-none select-none overflow-hidden">
                <div className="flex items-center justify-between mb-12">
                    <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
                    ))}
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse flex items-center px-6 space-x-4">
                            <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                            <div className="h-4 w-1/4 bg-slate-200 rounded" />
                            <div className="h-4 w-1/6 bg-slate-200 rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Lock Overlay ─── */}
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-white/40 backdrop-blur-[2px]">
                <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-[2.5rem] p-10 text-center relative overflow-hidden group">
                    {/* Decorative Gradient Blob */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />

                    {/* Icon Container */}
                    <div className="relative mb-8 flex justify-center">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-indigo-200 shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                            <Lock className="text-white" size={36} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                            <Sparkles className="text-amber-900" size={16} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                        Fitur Premium
                    </h2>

                    <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                        Fitur <span className="text-indigo-600 font-bold">"{featureName}"</span> hanya tersedia bagi pengguna paket <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">{requiredPlan}</span> ke atas.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/subscription')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl"
                        >
                            Tingkatkan Sekarang
                            <ArrowRight size={20} />
                        </button>

                        <p className="text-xs text-slate-400 font-semibold">
                            Buka akses ke fitur canggih lainnya untuk bisnis Anda
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
