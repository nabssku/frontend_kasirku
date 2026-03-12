import { useState } from 'react';
import { Plus, Trash2, Receipt, ImageIcon, FileText, ListTree } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useExpenses, useExpenseCategories, useCreateExpense, useDeleteExpense } from '../../hooks/useExpenses';
import { useOutlets } from '../../hooks/useOutlets';
import { useIngredients } from '../../hooks/useIngredients';
import { formatRp } from '../../lib/format';
import { useEffect } from 'react';

export default function ExpensesPage() {
    const [page, setPage] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        outlet_id: '',
        category_id: '',
        start_date: '',
        end_date: '',
    });

    const { data: expensesData, isLoading, error } = useExpenses({ ...filters, page });
    const { data: categories } = useExpenseCategories();
    const { data: outlets } = useOutlets();
    const { data: ingredients } = useIngredients();
    const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
    const { mutate: deleteExpense } = useDeleteExpense();

    const [form, setForm] = useState<{
        outlet_id: string;
        category_id: string;
        amount: string;
        payment_method: 'cash' | 'bank_transfer' | 'other';
        date: string;
        notes: string;
        reference_number: string;
        type: 'operational' | 'ingredient_purchase';
        items: { ingredient_id: string; quantity: number; unit_price: number }[];
    }>({
        outlet_id: '',
        category_id: '',
        amount: '',
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        reference_number: '',
        type: 'operational',
        items: [],
    });

    // Auto calculate total for ingredient purchase
    useEffect(() => {
        if (form.type === 'ingredient_purchase') {
            const total = form.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
            setForm(prev => ({ ...prev, amount: String(total) }));
        }
    }, [form.items, form.type]);
    const [attachment, setAttachment] = useState<File | null>(null);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.outlet_id || !form.category_id || !form.amount) {
            toast.error('Mohon lengkapi data wajib');
            return;
        }

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (key === 'items') {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });
        if (attachment) {
            formData.append('attachment', attachment);
        }

        createExpense(formData, {
            onSuccess: () => {
                toast.success('Pengeluaran berhasil dicatat');
                setIsAdding(false);
                setForm({
                    outlet_id: '',
                    category_id: '',
                    amount: '',
                    payment_method: 'cash',
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                    reference_number: '',
                    type: 'operational',
                    items: [],
                });
                setAttachment(null);
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('Hapus catatan pengeluaran ini?')) return;
        deleteExpense(id, {
            onSuccess: () => toast.success('Catatan berhasil dihapus')
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Catatan Pengeluaran</h1>
                    <p className="text-slate-500 text-sm mt-1">Pantau dan kelola semua biaya operasional</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/expenses/categories"
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
                    >
                        <ListTree size={18} />
                        Kelola Kategori
                    </Link>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} />
                        Catat Pengeluaran
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                    value={filters.outlet_id}
                    onChange={(e) => setFilters({ ...filters, outlet_id: e.target.value })}
                    className="bg-white border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Semua Outlet</option>
                    {outlets?.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select
                    value={filters.category_id}
                    onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                    className="bg-white border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Semua Kategori</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    className="bg-white border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    className="bg-white border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Add Modal/Form overlay */}
            {isAdding && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                            <h2 className="text-xl font-bold text-slate-900">Catat Pengeluaran Baru</h2>
                            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Pengeluaran</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, type: 'operational', items: [] })}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${form.type === 'operational' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                        >
                                            Operasional
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, type: 'ingredient_purchase' })}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${form.type === 'ingredient_purchase' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                        >
                                            Bahan Baku
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outlet</label>
                                    <select
                                        value={form.outlet_id}
                                        onChange={(e) => setForm({ ...form, outlet_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        required
                                    >
                                        <option value="">Pilih Outlet</option>
                                        {outlets?.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                                    <select
                                        value={form.category_id}
                                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {form.type === 'ingredient_purchase' && (
                                    <div className="col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Bahan Baku</label>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, items: [...(form.items || []), { ingredient_id: '', quantity: 1, unit_price: 0 }] })}
                                                className="text-indigo-600 font-bold text-xs hover:underline"
                                            >
                                                + Tambah Item
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {form.items?.map((item, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="col-span-5 space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Bahan</label>
                                                        <select
                                                            value={item.ingredient_id}
                                                            onChange={(e) => {
                                                                const newItems = [...(form.items || [])];
                                                                newItems[index].ingredient_id = e.target.value;
                                                                setForm({ ...form, items: newItems });
                                                            }}
                                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                                                            required
                                                        >
                                                            <option value="">Pilih Bahan</option>
                                                            {ingredients?.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3 space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newItems = [...(form.items || [])];
                                                                newItems[index].quantity = Number(e.target.value);
                                                                setForm({ ...form, items: newItems });
                                                            }}
                                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                                                            placeholder="0"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-3 space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Harga/Unit</label>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => {
                                                                const newItems = [...(form.items || [])];
                                                                newItems[index].unit_price = Number(e.target.value);
                                                                setForm({ ...form, items: newItems });
                                                            }}
                                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                                                            placeholder="0"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-1 pb-1 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = form.items?.filter((_, i) => i !== index);
                                                                setForm({ ...form, items: newItems });
                                                            }}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!form.items || form.items.length === 0) && (
                                                <div className="text-center py-4 text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                                                    Belum ada bahan baku yang dipilih
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Nominal (Rp)</label>
                                    <input
                                        type="number"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold ${form.type === 'ingredient_purchase' ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
                                        placeholder="0"
                                        readOnly={form.type === 'ingredient_purchase'}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sumber Dana</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                    >
                                        <option value="cash">Kasir (Tunai)</option>
                                        <option value="bank_transfer">Rekening Bank</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. Ref/Nota</label>
                                    <input
                                        type="text"
                                        value={form.reference_number}
                                        onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        placeholder="Opsional"
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm h-20 resize-none"
                                        placeholder="Keterangan pengeluaran..."
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bukti / Lampiran</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        accept="image/*,application/pdf"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-slate-500 font-bold text-sm">Batal</button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                                >
                                    {isCreating ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500">
                        <p>Gagal memuat catatan pengeluaran</p>
                    </div>
                ) : expensesData?.data.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Receipt size={48} className="mx-auto mb-3 opacity-10" />
                        <p className="font-bold text-slate-900">Belum ada catatan</p>
                        <p className="text-sm mt-1">Sifatnya bersih! Klik "Catat Pengeluaran" untuk mulai mendata</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                                <th className="px-6 py-4 text-left">Tanggal / Kategori</th>
                                <th className="px-6 py-4 text-left">Outlet / User</th>
                                <th className="px-6 py-4 text-left">Metode / No. Ref</th>
                                <th className="px-6 py-4 text-right">Nominal</th>
                                <th className="px-6 py-4 text-center">Lampiran</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {expensesData?.data.map((expense) => (
                                <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-xs tracking-tight">{new Date(expense.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <div className="flex gap-1 mt-1">
                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit">
                                                    {expense.category?.name || 'Uncategorized'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${expense.type === 'ingredient_purchase' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                                                    {expense.type === 'ingredient_purchase' ? 'Bahan Baku' : 'Operasional'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-700 text-xs font-semibold">{expense.outlet?.name}</span>
                                            <span className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold">{expense.user?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-700 text-xs capitalize">{expense.payment_method.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-slate-400 font-mono italic">{expense.reference_number || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-red-600">
                                        -{formatRp(expense.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {expense.attachment ? (
                                            <a
                                                href={`${import.meta.env.VITE_STORAGE_URL}/${expense.attachment}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                title="Lihat Bukti"
                                            >
                                                <ImageIcon size={14} />
                                            </a>
                                        ) : (
                                            <span className="text-slate-300"><FileText size={14} className="mx-auto" /></span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-1 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Placeholder */}
            {expensesData && expensesData.meta.last_page > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p: number) => p - 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm self-center disabled:opacity-30"
                    >Prev</button>
                    <span className="text-sm font-bold text-slate-500 self-center">Hal {page} dari {expensesData.meta.last_page}</span>
                    <button
                        disabled={page === expensesData.meta.last_page}
                        onClick={() => setPage((p: number) => p + 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm self-center disabled:opacity-30"
                    >Next</button>
                </div>
            )}
        </div>
    );
}
