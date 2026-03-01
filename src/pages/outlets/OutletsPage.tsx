import { useState } from 'react';
import { Plus, Pencil, Trash2, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { useOutlets, useCreateOutlet, useUpdateOutlet, useDeleteOutlet } from '../../hooks/useOutlets';
import type { Outlet } from '../../types';

export default function OutletsPage() {

    const { data: outlets = [], isLoading } = useOutlets();
    const createOutlet = useCreateOutlet();
    const updateOutlet = useUpdateOutlet();
    const deleteOutlet = useDeleteOutlet();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<Outlet | null>(null);
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
                                { label: 'Email', key: 'email', placeholder: 'outlet@kasirku.com' },
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
        </div>
    );
}

