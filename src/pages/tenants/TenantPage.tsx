import { useState } from 'react';
import { useCurrentSubscription, useSubscriptionHistory, usePlans, useSubscribe } from '../../hooks/useSubscription';
import {
    CreditCard, Clock, AlertTriangle, CheckCircle2, Crown, Package,
    Users, ShoppingBag, Tag, Beaker, Sliders, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

// Midtrans Snap types
declare global {
    interface Window {
        snap: {
            pay: (token: string, callbacks: {
                onSuccess?: (result: unknown) => void;
                onPending?: (result: unknown) => void;
                onError?: (result: unknown) => void;
                onClose?: () => void;
            }) => void;
        };
    }
}

// Load Midtrans Snap script dynamically
function loadMidtransSnap(clientKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.snap) { resolve(); return; }
        const script = document.createElement('script');
        script.src = `https://app.sandbox.midtrans.com/snap/snap.js`;
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Midtrans Snap'));
        document.head.appendChild(script);
    });
}

export default function TenantPage() {
    const { data: subscriptionData, isLoading } = useCurrentSubscription();
    const { data: history } = useSubscriptionHistory();
    const { data: plans, isLoading: plansLoading } = usePlans();
    const subscribe = useSubscribe();
    const [expandHistory, setExpandHistory] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [payingPlanId, setPayingPlanId] = useState<number | null>(null);

    const sub = subscriptionData?.subscription;
    const isTrial = sub?.status === 'trial';
    const isActive = sub?.status === 'active';
    const isExpired = sub?.status === 'expired' || sub?.status === 'cancelled';
    const daysRemaining = sub?.days_remaining ?? 0;
    const trialEndsAt = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;

    const handleSubscribe = async (planId: number) => {
        setPayingPlanId(planId);
        try {
            const result = await subscribe.mutateAsync({
                plan_id: planId,
                billing_cycle: selectedCycle,
            });

            if (result.snap_token && result.client_key) {
                await loadMidtransSnap(result.client_key);
                window.snap.pay(result.snap_token, {
                    onSuccess: () => {
                        window.location.reload();
                    },
                    onPending: () => {
                        alert('Pembayaran sedang diproses. Kami akan memperbarui status Anda segera.');
                    },
                    onError: () => {
                        alert('Pembayaran gagal. Silakan coba lagi.');
                    },
                    onClose: () => {
                        // User closed Snap popup
                    },
                });
            }
        } catch {
            alert('Gagal membuat transaksi. Silakan coba lagi.');
        } finally {
            setPayingPlanId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Langganan & Paket</h1>
                    <p className="text-slate-500 mt-1 max-w-xl">
                        Kelola paket langganan Anda dan scale bisnis Anda dengan fitur-fitur premium JagoKasir.
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner-sm">
                    {(['monthly', 'yearly'] as const).map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedCycle(c)}
                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedCycle === c
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {c === 'monthly' ? 'Bulanan' : 'Tahunan'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trial/Expiry Warning Banner */}
            {(isTrial || isExpired) && (
                <div className={`p-5 rounded-3xl border shadow-sm transition-all duration-500 ${isExpired
                    ? 'bg-red-50 border-red-100'
                    : daysRemaining <= 3
                        ? 'bg-amber-50 border-amber-100'
                        : 'bg-indigo-50 border-indigo-100'
                    }`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-2xl ${isExpired ? 'bg-red-100 text-red-600' : daysRemaining <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className={`text-lg font-bold ${isExpired ? 'text-red-900' : daysRemaining <= 3 ? 'text-amber-900' : 'text-indigo-900'
                                }`}>
                                {isExpired
                                    ? 'Masa uji coba Anda telah berakhir!'
                                    : `Pemberitahuan: Masa trial tersisa ${daysRemaining} hari`}
                            </p>
                            <p className={`text-sm mt-1 ${isExpired ? 'text-red-700' : daysRemaining <= 3 ? 'text-amber-700' : 'text-indigo-700'}`}>
                                {isExpired
                                    ? 'Untuk melanjutkan akses ke semua fitur dan data Anda, silakan pilih salah satu paket berlangganan di bawah.'
                                    : trialEndsAt
                                        ? `Akses trial Anda akan berakhir pada ${trialEndsAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. 
                                           Tingkatkan ke paket berbayar sekarang untuk menghindari gangguan layanan.`
                                        : 'Tingkatkan ke paket berbayar sekarang untuk mendapatkan akses tanpa batas ke semua fitur.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Subscription Card */}
            {sub && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100/50">
                                <CreditCard size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Langganan Aktif</h2>
                                <p className="text-sm text-slate-500">Informasi paket yang sedang Anda gunakan</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                isTrial ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                    'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                {isActive && <CheckCircle2 size={14} />}
                                {isTrial && <Clock size={14} />}
                                {isExpired && <AlertTriangle size={14} />}
                                {sub.status === 'trial' ? 'Masa Percobaan' : sub.status === 'active' ? 'Aktif' : sub.status === 'expired' ? 'Kedaluwarsa' : sub.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-8 relative z-10">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Paket</p>
                            <div className="flex items-center gap-2">
                                <Crown size={16} className="text-amber-500" />
                                <p className="text-lg font-bold text-slate-900">{sub.plan?.name ?? 'Tidak ada'}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sisa Waktu</p>
                            <p className={`text-lg font-bold ${daysRemaining <= 3 ? 'text-red-500' : 'text-slate-900'}`}>
                                {daysRemaining > 0 ? `${daysRemaining} Hari` : 'Berakhir'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal Mulai</p>
                            <p className="text-lg font-semibold text-slate-900">
                                {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Siklus Penagihan</p>
                            <p className="text-lg font-semibold text-slate-900 capitalize">
                                {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) :
                                    sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Plan features/limits with progress concept simplified */}
                    {sub.plan && (
                        <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Benefit & Kapasitas Paket</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                {[
                                    { icon: ShoppingBag, label: 'Produk', value: sub.plan.max_products, bg: 'bg-indigo-50', color: 'text-indigo-600' },
                                    { icon: Tag, label: 'Kategori', value: sub.plan.max_categories, bg: 'bg-violet-50', color: 'text-violet-600' },
                                    { icon: Users, label: 'Pengguna', value: sub.plan.max_users, bg: 'bg-blue-50', color: 'text-blue-600' },
                                    { icon: Package, label: 'Outlet', value: sub.plan.max_outlets, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                                    { icon: Beaker, label: 'Bahan Bakar', value: sub.plan.max_ingredients, bg: 'bg-amber-50', color: 'text-amber-600' },
                                    { icon: Sliders, label: 'Modifier', value: sub.plan.max_modifiers, bg: 'bg-rose-50', color: 'text-rose-600' },
                                ].map(item => (
                                    <div key={item.label} className="p-3 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                                        <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-2`}>
                                            <item.icon size={16} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                                        <p className="text-sm font-bold text-slate-900">{item.value === -1 ? 'Unlimited' : item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Available Plans */}
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Pilih Paket yang Sesuai</h2>
                    <p className="text-slate-500 mt-2">Dapatkan lebih banyak fitur untuk menunjang pertumbuhan bisnis Anda.</p>
                </div>

                {plansLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        {plans?.filter(p => p.billing_cycle === selectedCycle).map(plan => {
                            const isCurrentPlan = sub?.plan_id === plan.id && (isTrial || isActive);
                            const isPro = plan.name.toLowerCase().includes('premium');

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white border-2 rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1 ${isCurrentPlan
                                        ? 'border-indigo-500 shadow-xl shadow-indigo-100'
                                        : isPro ? 'border-amber-200 shadow-lg hover:border-amber-400 shadow-amber-50' : 'border-slate-100 shadow-sm hover:border-indigo-200'
                                        }`}
                                >
                                    {isCurrentPlan && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                                            PAKET AKTIF
                                        </div>
                                    )}
                                    {isPro && !isCurrentPlan && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-full shadow-lg">
                                            TERPOPULER
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                        {plan.description && (
                                            <p className="text-sm text-slate-500 mt-2 min-h-[40px] leading-relaxed">{plan.description}</p>
                                        )}
                                    </div>

                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                                Rp {plan.price.toLocaleString('id-ID')}
                                            </span>
                                            <span className="text-sm font-bold text-slate-400">
                                                /{plan.billing_cycle === 'monthly' ? 'bulan' : 'tahun'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {[
                                            { label: 'Produk', value: plan.max_products },
                                            { label: 'Kategori', value: plan.max_categories },
                                            { label: 'Pengguna', value: plan.max_users },
                                            { label: 'Outlet', value: plan.max_outlets },
                                            { label: 'Bahan Bakar', value: plan.max_ingredients },
                                            { label: 'Modifier', value: plan.max_modifiers },
                                        ].map(item => (
                                            <div key={item.label} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium">{item.label}</span>
                                                <span className="text-slate-900 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                    {item.value === -1 ? 'Unlimited' : item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {plan.features?.length > 0 && (
                                        <div className="pt-6 mb-8 border-t border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Fitur Tambahan</p>
                                            <div className="space-y-3">
                                                {plan.features.map(f => (
                                                    <div key={f.feature_key} className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                            <CheckCircle2 size={12} />
                                                        </div>
                                                        <span className="text-xs text-slate-600 font-medium capitalize">
                                                            {f.feature_key.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={isCurrentPlan || payingPlanId === plan.id || subscribe.isPending}
                                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 transform active:scale-95 shadow-md ${isCurrentPlan
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                            : isPro
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                                : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 shadow-indigo-100/50'
                                            }`}
                                    >
                                        {payingPlanId === plan.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={18} className="animate-spin" />
                                                Menyiapkan Pembayaran...
                                            </span>
                                        ) : isCurrentPlan ? 'Telah Terdaftar' : 'Pilih Paket Ini'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Subscription History */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <button
                    onClick={() => setExpandHistory(e => !e)}
                    className="w-full flex items-center justify-between p-8 text-left hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Riwayat Langganan</h2>
                            <p className="text-sm text-slate-500">Lihat log perpanjangan dan paket Anda sebelumnya</p>
                        </div>
                    </div>
                    <div className={`p-2 rounded-xl transition-all duration-300 ${expandHistory ? 'bg-indigo-50 text-indigo-600 rotate-0' : 'bg-slate-100 text-slate-400'}`}>
                        {expandHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </button>
                {expandHistory && (
                    <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300 mt-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-left text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                                        <th className="pb-4 px-4 font-extrabold">Paket</th>
                                        <th className="pb-4 px-4 font-extrabold">Status</th>
                                        <th className="pb-4 px-4 font-extrabold">Periode Mulai</th>
                                        <th className="pb-4 px-4 font-extrabold">Periode Berakhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history?.data?.map((h: { id: string; plan?: { name: string }; status: string; starts_at?: string; ends_at?: string; trial_ends_at?: string }) => (
                                        <tr key={h.id} className="hover:bg-slate-50 transition-colors rounded-xl overflow-hidden group">
                                            <td className="py-4 px-4 text-slate-900 font-bold border-y border-transparent border-l first:rounded-l-2xl group-hover:border-slate-100">{h.plan?.name ?? '-'}</td>
                                            <td className="py-4 px-4 border-y border-transparent group-hover:border-slate-100">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight uppercase ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    h.status === 'trial' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {h.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-slate-500 font-medium border-y border-transparent group-hover:border-slate-100">
                                                {h.starts_at ? new Date(h.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="py-4 px-4 text-slate-500 font-medium border-y border-transparent border-r last:rounded-r-2xl group-hover:border-slate-100">
                                                {h.ends_at ? new Date(h.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) :
                                                    h.trial_ends_at ? new Date(h.trial_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!history?.data || history.data.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 font-medium italic">Belum ada riwayat langganan yang tercatat</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
