import { useState } from 'react';
import { Plus, Pencil, Trash2, Store, X, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOutlets, useCreateOutlet, useUpdateOutlet, useDeleteOutlet } from '../../hooks/useOutlets';
import { useOutletPaymentMethods, useUpdateOutletPaymentMethods } from '../../hooks/useOutletPaymentMethods';
import { useCurrentSubscription } from '../../hooks/useSubscription';
import type { Outlet, PlanFeature } from '../../types';

function PaymentMethodsModal({ outlet, onClose }: { outlet: Outlet; onClose: () => void }) {
    const { data, isLoading } = useOutletPaymentMethods(outlet.id);
    const updateMethods = useUpdateOutletPaymentMethods(outlet.id);
    const { data: subscriptionData } = useCurrentSubscription();
    const [localState, setLocalState] = useState<Record<string, boolean>>({});

    const maxAllowed = (() => {
        const features = subscriptionData?.subscription?.plan?.features || [];
        const feature = features.find((f: PlanFeature) => f.feature_key === 'max_payment_methods');
        return feature ? parseInt(feature.feature_value) : 2;
    })();

    const enabledCount = Object.values(localState).filter(Boolean).length;
    const isOverLimit = enabledCount > maxAllowed;

    // Initialize local state when data loads
    if (data && Object.keys(localState).length === 0) {
        const initialState: Record<string, boolean> = {};
        data.master_methods.forEach(master => {
            // Wait, the API returns the master methods and the relationship.
            // Let's use the master method ID to find if it's enabled in pivot.
            const pivotData = data.outlet_methods.find((om: any) => om.id === master.id)?.pivot;
            initialState[master.id] = pivotData?.is_enabled ?? false;
        });
        setLocalState(initialState);
    }

    const handleSave = async () => {
        if (!data) return;

        if (isOverLimit) {
            toast.error(`Paket Anda hanya memperbolehkan maksimal ${maxAllowed} metode pembayaran.`);
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
            toast.success('Metode pembayaran berhasil disimpan');
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Metode Pembayaran - {outlet.name}</h2>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isOverLimit ? 'text-red-500' : 'text-indigo-500'}`}>
                            Limit Paket: {enabledCount} / {maxAllowed}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                    <div className="space-y-3">
                        {data?.master_methods.map(master => (
                            <label key={master.id} className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{master.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{master.category}</p>
                                    </div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                    checked={localState[master.id] || false}
                                    onChange={(e) => setLocalState(prev => ({ ...prev, [master.id]: e.target.checked }))}
                                />
                            </label>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                    <button onClick={handleSave} disabled={updateMethods.isPending || isLoading} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                        {updateMethods.isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OutletsPage() {

    const { data: outlets = [], isLoading } = useOutlets();
    const createOutlet = useCreateOutlet();
    const updateOutlet = useUpdateOutlet();
    const deleteOutlet = useDeleteOutlet();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<Outlet | null>(null);
    const [paymentOutlet, setPaymentOutlet] = useState<Outlet | null>(null);
    const [form, setForm] = useState({
        name: '', address: '', phone: '', email: '',
        tax_rate: 11, service_charge: 0, is_active: true, business_type: 'fnb' as 'fnb' | 'retail',
    });

    const resetForm = () => {
        setForm({ name: '', address: '', phone: '', email: '', tax_rate: 11, service_charge: 0, is_active: true, business_type: 'fnb' });
        setEditItem(null);
    };

    const openEdit = (item: Outlet) => {
        setEditItem(item);
        setForm({ name: item.name, address: item.address ?? '', phone: item.phone ?? '', email: item.email ?? '', tax_rate: item.tax_rate, service_charge: item.service_charge, is_active: item.is_active, business_type: item.business_type ?? 'fnb' });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        try {
            if (editItem) {
                await updateOutlet.mutateAsync({ id: editItem.id, payload: form });
                toast.success('Outlet berhasil diperbarui');
            } else {
                await createOutlet.mutateAsync(form);
                toast.success('Outlet berhasil ditambahkan');
            }
            resetForm();
            setShowForm(false);
        } catch (error) {
            // Error is handled by global axios interceptor
            console.error('Mutation error:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Outlet</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola cabang/outlet bisnis Anda</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium">
                    <Plus size={18} /> Tambah Outlet
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-16 text-slate-400">Memuat...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {outlets.map(outlet => (
                        <div key={outlet.id} className={`bg-white rounded-2xl border shadow-sm p-6 relative transition-all ${outlet.is_active ? 'border-slate-100 hover:shadow-md' : 'border-red-100 opacity-60'}`}>
                            <div className="absolute top-4 right-4 flex gap-1">
                                <button onClick={() => setPaymentOutlet(outlet)} title="Metode Pembayaran" className="p-1.5 text-slate-300 hover:text-green-500 rounded-lg transition-colors"><CreditCard size={14} /></button>
                                <button onClick={() => openEdit(outlet)} className="p-1.5 text-slate-300 hover:text-indigo-500 rounded-lg transition-colors"><Pencil size={14} /></button>
                                <button onClick={() => deleteOutlet.mutate(outlet.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <Store size={24} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{outlet.name}</h3>
                                    <div className="flex items-center gap-2 flex-wrap mt-1">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${outlet.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${outlet.business_type === 'retail' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {outlet.business_type === 'retail' ? '🛍️ Retail' : '🍽️ FNB'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-sm text-slate-600">
                                {outlet.address && <p className="text-xs">📍 {outlet.address}</p>}
                                {outlet.phone && <p className="text-xs">📞 {outlet.phone}</p>}
                                {outlet.email && <p className="text-xs">✉️ {outlet.email}</p>}
                            </div>
                            <div className="mt-4 flex gap-3">
                                <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                                    <p className="text-xs text-slate-400">Pajak</p>
                                    <p className="font-bold text-slate-900 text-sm">{outlet.tax_rate}%</p>
                                </div>
                                <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                                    <p className="text-xs text-slate-400">Service</p>
                                    <p className="font-bold text-slate-900 text-sm">{outlet.service_charge}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {outlets.length === 0 && (
                        <div className="col-span-3 text-center py-16 text-slate-400">
                            <Store size={48} className="mx-auto mb-4 text-slate-200" />
                            <p>Belum ada outlet. Tambahkan outlet pertama!</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- Form Modal --- */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">{editItem ? 'Edit Outlet' : 'Tambah Outlet Baru'}</h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Nama Outlet', key: 'name', placeholder: 'Warung Kopi Pusat' },
                                { label: 'Alamat', key: 'address', placeholder: 'Jl. Sudirman No. 1' },
                                { label: 'Telepon', key: 'phone', placeholder: '021-5551234' },
                                { label: 'Email', key: 'email', placeholder: 'outlet@jagokasir.store' },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
                                    <input value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder={placeholder} />
                                </div>
                            ))}
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-500 uppercase">Tipe Bisnis</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, business_type: 'fnb' }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.business_type === 'fnb'
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        🍽️ FNB
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, business_type: 'retail' }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.business_type === 'retail'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        🛍️ Retail
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {form.business_type === 'fnb'
                                        ? 'Aktifkan fitur Dine In, Meja, Kitchen Display, dan Modifier'
                                        : 'Tampilan POS disederhanakan, tanpa meja & kitchen display'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Pajak (%)</label>
                                    <input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Service Charge (%)</label>
                                    <input type="number" step="0.01" value={form.service_charge} onChange={e => setForm(f => ({ ...f, service_charge: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
                                <span className="text-sm text-slate-700">Outlet aktif</span>
                            </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleSubmit} disabled={createOutlet.isPending || updateOutlet.isPending} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                                {createOutlet.isPending || updateOutlet.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paymentOutlet && (
                <PaymentMethodsModal outlet={paymentOutlet} onClose={() => setPaymentOutlet(null)} />
            )}
        </div>
    );
}


