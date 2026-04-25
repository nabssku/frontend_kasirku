import { useState, useMemo, useEffect } from 'react';
import { 
    CreditCard, 
    Store, 
    ChevronRight, 
    Loader2, 
    AlertCircle, 
    Check, 
    Save,
    ChevronLeft,
    Plus,
    X,
    Smartphone,
    Banknote,
    Building,
    LayoutGrid
} from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { 
    useOutletPaymentMethods, 
    useUpdateOutletPaymentMethods,
    useCreateCustomPaymentMethod 
} from '../../hooks/useOutletPaymentMethods';
import { useCurrentSubscription } from '../../hooks/useSubscription';
import { toast } from 'sonner';
import type { Outlet, PlanFeature } from '../../types';

const CATEGORY_STYLES: Record<string, { icon: any; color: string }> = {
    'cash': { icon: Banknote, color: 'text-emerald-500 bg-emerald-50' },
    'e-wallet': { icon: Smartphone, color: 'text-blue-500 bg-blue-50' },
    'card': { icon: CreditCard, color: 'text-indigo-500 bg-indigo-50' },
    'bank_transfer': { icon: Building, color: 'text-amber-500 bg-amber-50' },
    'other': { icon: LayoutGrid, color: 'text-slate-500 bg-slate-50' }
};

function CustomPaymentModal({ onClose, onSave, isLoading }: { onClose: () => void; onSave: (name: string, category: string) => void; isLoading: boolean }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('other');

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Custom Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Metode</label>
                        <input 
                            type="text"
                            placeholder="Contoh: QRIS Bank ABC"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`
                                        flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all
                                        ${category === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                                    `}
                                >
                                    <style.icon size={14} />
                                    <span className="capitalize">{cat.replace('_', ' ')}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">Batal</button>
                    <button 
                        onClick={() => onSave(name, category)}
                        disabled={isLoading || !name.trim()}
                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                    >
                        {isLoading ? 'Menyimpan...' : 'Tambah'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MethodsList({ outlet, maxAllowed, onBack }: { outlet: Outlet; maxAllowed: number; onBack?: () => void }) {
    const { data, isLoading } = useOutletPaymentMethods(outlet.id);
    const updateMethods = useUpdateOutletPaymentMethods(outlet.id);
    const createCustom = useCreateCustomPaymentMethod(outlet.id);
    
    const [localState, setLocalState] = useState<Record<string, boolean>>({});
    const [isAddingCustom, setIsAddingCustom] = useState(false);

    useEffect(() => {
        if (data) {
            const initialState: Record<string, boolean> = {};
            data.master_methods.forEach(master => {
                const pivotData = data.outlet_methods.find((om: any) => om.id === master.id)?.pivot;
                initialState[master.id] = pivotData?.is_enabled ?? false;
            });
            setLocalState(initialState);
        }
    }, [data]);

    const enabledCount = Object.values(localState).filter(Boolean).length;
    const isOverLimit = enabledCount > maxAllowed;

    const handleSave = async () => {
        if (!data) return;
        if (isOverLimit) {
            toast.error(`Maksimal ${maxAllowed} metode diperbolehkan.`);
            return;
        }

        const payload = {
            payment_methods: data.master_methods.map(master => ({
                payment_method_id: master.id,
                is_enabled: localState[master.id] ?? false,
            }))
        };

        try {
            await updateMethods.mutateAsync(payload);
            toast.success('Metode pembayaran berhasil diperbarui');
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Gagal memperbarui metode pembayaran');
        }
    };

    const handleCreateCustom = async (name: string, category: string) => {
        try {
            await createCustom.mutateAsync({ name, category });
            toast.success('Metode custom ditambahkan');
            setIsAddingCustom(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Gagal menambahkan metode custom');
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-sm text-slate-400 font-medium">Memuat konfigurasi...</p>
        </div>
    );

    const groupedMethods = data?.master_methods.reduce((acc, method) => {
        const cat = method.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(method);
        return acc;
    }, {} as Record<string, any[]>) || {};

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header / Info Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900">{outlet.name}</h2>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">Outlet Aktif</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">Kelola metode pembayaran yang tersedia di kasir.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex flex-col items-end px-4 py-2 rounded-2xl border transition-all ${isOverLimit ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none opacity-60">Limit Aktif</span>
                        <span className="text-lg font-black">{enabledCount} <span className="text-xs opacity-40">/ {maxAllowed}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsAddingCustom(true)}
                            className="flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                            title="Tambah Custom Payment"
                        >
                            <Plus size={20} />
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={updateMethods.isPending || isOverLimit}
                            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            {updateMethods.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Simpan
                        </button>
                    </div>
                </div>
            </div>

            {isOverLimit && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in shake duration-500">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">Limit paket terlampaui. Silakan nonaktifkan beberapa metode.</p>
                </div>
            )}

            {/* Methods Grid */}
            <div className="grid gap-10 pb-12">
                {Object.entries(groupedMethods).map(([category, methods]) => {
                    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['other'];
                    const Icon = style.icon;

                    return (
                        <div key={category} className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Icon size={16} className="text-slate-400" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{category.replace('_', ' ')}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {methods.map(method => (
                                    <div 
                                        key={method.id}
                                        className={`
                                            flex items-center justify-between p-5 bg-white border rounded-2xl transition-all
                                            ${localState[method.id] ? 'border-indigo-100 shadow-sm' : 'border-slate-100 opacity-60'}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl transition-all ${localState[method.id] ? style.color : 'bg-slate-50 text-slate-400'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold text-sm transition-colors ${localState[method.id] ? 'text-slate-900' : 'text-slate-500'}`}>{method.name}</h4>
                                                    {method.tenant_id && (
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold uppercase tracking-tighter">Custom</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{category.replace('_', ' ')}</p>
                                            </div>
                                        </div>

                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={localState[method.id] || false}
                                                onChange={(e) => setLocalState(prev => ({ ...prev, [method.id]: e.target.checked }))}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isAddingCustom && (
                <CustomPaymentModal 
                    onClose={() => setIsAddingCustom(false)}
                    onSave={handleCreateCustom}
                    isLoading={createCustom.isPending}
                />
            )}
        </div>
    );
}

export default function PaymentMethodsPage() {
    const { user } = useAuthStore();
    const { data: outletsData = [], isLoading } = useOutlets();
    const { data: subscriptionData } = useCurrentSubscription();
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

    const outlets = useMemo(() => {
        if (!user) return [];
        if (user.roles?.some(r => r.slug === 'super_admin' || r.slug === 'owner')) return outletsData;
        return outletsData.filter(o => o.id === user.outlet_id);
    }, [outletsData, user]);

    useEffect(() => {
        if (outlets.length === 1 && !selectedOutlet) setSelectedOutlet(outlets[0]);
    }, [outlets, selectedOutlet]);

    const maxAllowed = useMemo(() => {
        const features = subscriptionData?.subscription?.plan?.features || [];
        const feature = features.find((f: PlanFeature) => f.feature_key === 'max_payment_methods');
        return feature ? parseInt(feature.feature_value) : 2;
    }, [subscriptionData]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Memuat Outlet...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Main Selection Header */}
            {!selectedOutlet || outlets.length > 1 ? (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Metode Pembayaran</h1>
                        <p className="text-slate-500 font-medium mt-1">Konfigurasi cara pelanggan membayar di kasir Anda.</p>
                    </div>
                </div>
            ) : null}

            {/* Outlet Selection */}
            {!selectedOutlet && outlets.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outlets.map(outlet => (
                        <button 
                            key={outlet.id}
                            onClick={() => setSelectedOutlet(outlet)}
                            className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                <Store size={24} />
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{outlet.name}</h3>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{outlet.address || 'Outlet POS'}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-end">
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Settings View */}
            {selectedOutlet && (
                <MethodsList 
                    outlet={selectedOutlet} 
                    maxAllowed={maxAllowed}
                    onBack={outlets.length > 1 ? () => setSelectedOutlet(null) : undefined} 
                />
            )}
        </div>
    );
}






