import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ListTree, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useExpenseCategories, useCreateExpenseCategory } from '../../hooks/useExpenses';

export default function ExpenseCategoriesPage() {
    const { data: categories, isLoading, error } = useExpenseCategories();
    const { mutate: createCategory, isPending: isCreating } = useCreateExpenseCategory();

    const [isAdding, setIsAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [newData, setNewData] = useState({ name: '', description: '' });

    const filtered = categories?.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = () => {
        if (!newData.name) {
            toast.error('Nama kategori wajib diisi');
            return;
        }

        createCategory(newData, {
            onSuccess: () => {
                toast.success('Kategori berhasil ditambahkan');
                setIsAdding(false);
                setNewData({ name: '', description: '' });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kategori Pengeluaran</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola kategori biaya operasional Anda</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                >
                    <Plus size={18} />
                    Tambah Kategori
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari kategori..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
            </div>

            {/* Add Form (Inline) */}
            {isAdding && (
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Nama Kategori</label>
                            <input
                                type="text"
                                value={newData.name}
                                onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                                placeholder="Misal: Listrik & Air"
                                className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Deskripsi (Opsional)</label>
                            <input
                                type="text"
                                value={newData.description}
                                onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                                placeholder="Penjelasan singkat kategori"
                                className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isCreating}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                        >
                            <Save size={16} />
                            Simpan Kategori
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500">
                        <p>Gagal memuat kategori</p>
                    </div>
                ) : filtered?.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <ListTree size={48} className="mx-auto mb-3 opacity-10" />
                        <p className="font-bold text-slate-900">Belum ada kategori</p>
                        <p className="text-sm mt-1">Klik "Tambah Kategori" untuk memulai</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                                <th className="px-6 py-4 text-left">Nama Kategori</th>
                                <th className="px-6 py-4 text-left">Deskripsi</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered?.map((category) => (
                                <tr key={category.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-800 uppercase text-xs tracking-tight">
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {category.description || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Edit2 size={15} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        </div>
    );
}
