import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatRp } from '../../lib/format';
import {
    Plus, Search, Edit2, Trash2, Tag, Calendar,
    Users, Layout, CheckCircle2, XCircle, Loader2,
    Percent, Banknote
} from 'lucide-react';
import type { Discount, Plan } from '../../types';

export default function SuperAdminDiscounts() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

    // Queries
    const { data: discountsData, isLoading: discountsLoading } = useQuery<{ data: { data: Discount[], meta: any } }>({
        queryKey: ['admin', 'discounts', page, search],
        queryFn: async () => {
            const { data } = await api.get('/super-admin/discounts', {
                params: { page, search, per_page: 10 }
            });
            return data;
        },
    });

    const { data: plans } = useQuery<Plan[]>({
        queryKey: ['plans'],
        queryFn: async () => {
            const { data } = await api.get('/plans');
            return data.data;
        },
    });

    // Mutations
    const upsertDiscount = useMutation({
        mutationFn: async (payload: any) => {
            if (editingDiscount) {
                const { data } = await api.put(`/super-admin/discounts/${editingDiscount.id}`, payload);
                return data;
            } else {
                const { data } = await api.post('/super-admin/discounts', payload);
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'discounts'] });
            setIsModalOpen(false);
            setEditingDiscount(null);
        },
    });

    const deleteDiscount = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/super-admin/discounts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'discounts'] });
        },
    });

    const handleEdit = (discount: Discount) => {
        setEditingDiscount(discount);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus diskon ini?')) {
            deleteDiscount.mutate(id);
        }
    };

    const discounts = discountsData?.data.data || [];
    const meta = discountsData?.data.meta;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl border border-slate-800">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Manajemen Diskon</h1>
                    <p className="text-slate-400 mt-1">Kelola kode promo dan potongan harga langganan.</p>
                </div>
                <button
                    onClick={() => { setEditingDiscount(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Buat Diskon Baru
                </button>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari kode atau nama diskon..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                    <button className="flex-1 py-3 text-sm font-bold text-white bg-slate-800 rounded-xl">Semua</button>
                    <button className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-300">Aktif</button>
                    <button className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-300">Berakhir</button>
                </div>
            </div>

            {/* Discounts List */}
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800">
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Detail Diskon</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Nilai Potongan</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Penggunaan</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Masa Berlaku</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {discountsLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : discounts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                                                <Tag size={32} />
                                            </div>
                                            <p className="text-slate-500 font-medium">Belum ada data diskon.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                discounts.map((discount) => (
                                    <tr key={discount.id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-6">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                                    <Tag size={20} className="font-bold" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{discount.code}</span>
                                                        {discount.applicable_plan_ids?.length ? (
                                                            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Khusus Paket</span>
                                                        ) : null}
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{discount.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                {discount.type === 'percentage' ? (
                                                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 flex items-center gap-1">
                                                        <Percent size={14} />
                                                        {discount.value}%
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 font-bold rounded-lg border border-blue-500/20 flex items-center gap-1">
                                                        <Banknote size={14} />
                                                        {formatRp(discount.value)}
                                                    </div>
                                                )}
                                            </div>
                                            {discount.min_purchase_amount > 0 && (
                                                <p className="text-[10px] text-slate-500 font-bold mt-1">Min. Belanja {formatRp(discount.min_purchase_amount)}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 font-medium text-slate-400">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users size={14} className="text-slate-600" />
                                                    <span>{discount.uses_count} / {discount.max_uses_total || '∞'} Terpakai</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                                    <Layout size={12} />
                                                    Limit {discount.max_uses_per_user}x Per User
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Calendar size={14} className="text-slate-600" />
                                                {discount.valid_until ? (
                                                    <span>Sampai {new Date(discount.valid_until).toLocaleDateString('id-ID')}</span>
                                                ) : (
                                                    <span className="italic text-slate-600 font-bold">Seterusnya</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            {discount.is_active ? (
                                                <span className="flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                                                    <CheckCircle2 size={12} />
                                                    AKTIF
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs font-black text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 w-fit">
                                                    <XCircle size={12} />
                                                    NONAKTIF
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(discount)}
                                                    className="p-3 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all active:scale-90"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(discount.id)}
                                                    className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Simplified) */}
                {meta && meta.last_page > 1 && (
                    <div className="px-6 py-4 flex justify-between items-center border-t border-slate-800">
                        <p className="text-xs text-slate-500 font-bold">Menampilkan {discounts.length} dari {meta.total} diskon</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-xs font-bold bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                SMT
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                disabled={page === meta.last_page}
                                className="px-4 py-2 text-xs font-bold bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                Lanjut
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Upsert Discount */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-xl shadow-2xl relative my-auto animate-in fade-in zoom-in duration-300">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const payload = {
                                    code: formData.get('code'),
                                    name: formData.get('name'),
                                    description: formData.get('description'),
                                    type: formData.get('type'),
                                    value: Number(formData.get('value')),
                                    min_purchase_amount: Number(formData.get('min_purchase_amount')),
                                    max_uses_total: formData.get('max_uses_total') ? Number(formData.get('max_uses_total')) : null,
                                    max_uses_per_user: Number(formData.get('max_uses_per_user')),
                                    is_active: formData.get('is_active') === 'on',
                                    valid_until: formData.get('valid_until') || null,
                                    applicable_plan_ids: Array.from(formData.getAll('applicable_plan_ids')).map(Number),
                                };
                                upsertDiscount.mutate(payload);
                            }}
                            className="p-8 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black tracking-tight text-white">{editingDiscount ? 'Edit Diskon' : 'Buat Diskon Baru'}</h2>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                                    <XCircle size={22} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Kode Diskon</label>
                                    <input
                                        name="code"
                                        required
                                        defaultValue={editingDiscount?.code}
                                        placeholder="KODE PROMO"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-black uppercase text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Nama Promo</label>
                                    <input
                                        name="name"
                                        required
                                        defaultValue={editingDiscount?.name}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Tipe</label>
                                    <select
                                        name="type"
                                        defaultValue={editingDiscount?.type || 'percentage'}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm"
                                    >
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="fixed">Nominal (Rp)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Nilai Potongan</label>
                                    <input
                                        name="value"
                                        type="number"
                                        required
                                        defaultValue={editingDiscount?.value}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Deskripsi</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingDiscount?.description}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Limit Total</label>
                                    <input
                                        name="max_uses_total"
                                        type="number"
                                        defaultValue={editingDiscount?.max_uses_total}
                                        placeholder="Tak Terbatas"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Limit Per User</label>
                                    <input
                                        name="max_uses_per_user"
                                        type="number"
                                        defaultValue={editingDiscount?.max_uses_per_user || 1}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Min. Belanja</label>
                                    <input
                                        name="min_purchase_amount"
                                        type="number"
                                        defaultValue={editingDiscount?.min_purchase_amount || 0}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Berlaku Sampai</label>
                                    <input
                                        name="valid_until"
                                        type="date"
                                        defaultValue={editingDiscount?.valid_until ? new Date(editingDiscount.valid_until).toISOString().split('T')[0] : ''}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Paket Berlaku</label>
                                <div className="flex flex-wrap gap-2">
                                    {plans?.map(plan => (
                                        <label key={plan.id} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
                                            <input
                                                type="checkbox"
                                                name="applicable_plan_ids"
                                                value={plan.id}
                                                defaultChecked={editingDiscount?.applicable_plan_ids?.includes(plan.id)}
                                                className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded bg-slate-900 border-slate-700"
                                            />
                                            <span className="text-xs font-bold text-slate-300">{plan.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <input
                                    id="is_active"
                                    name="is_active"
                                    type="checkbox"
                                    defaultChecked={editingDiscount ? editingDiscount.is_active : true}
                                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                                />
                                <label htmlFor="is_active" className="text-xs font-bold text-slate-300 cursor-pointer">Aktifkan Voucher Ini</label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={upsertDiscount.isPending}
                                    className="flex-[2] py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                                >
                                    {upsertDiscount.isPending ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {editingDiscount ? 'Simpan' : 'Terbitkan'}
                                            <CheckCircle2 size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
