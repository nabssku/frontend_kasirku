import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard, X, Loader2, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface MasterPaymentMethod {
    id: string;
    name: string;
    code: string;
    category: 'cash' | 'e-wallet' | 'bank_transfer' | 'card' | 'other';
    is_active: boolean;
}

export default function MasterPaymentMethodsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterPaymentMethod | null>(null);
    const [form, setForm] = useState<{
        name: string;
        code: string;
        category: MasterPaymentMethod['category'];
        is_active: boolean;
    }>({
        name: '',
        code: '',
        category: 'other',
        is_active: true
    });

    const { data: methods = [], isLoading } = useQuery({
        queryKey: ['master-payment-methods'],
        queryFn: async () => {
            const { data } = await api.get('/super-admin/payment-methods');
            return data.data as MasterPaymentMethod[];
        }
    });

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingItem) {
                return api.put(`/super-admin/payment-methods/${editingItem.id}`, payload);
            }
            return api.post('/super-admin/payment-methods', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master-payment-methods'] });
            toast.success('Metode pembayaran berhasil disimpan');
            setIsModalOpen(false);
            setEditingItem(null);
            setForm({ name: '', code: '', category: 'other', is_active: true });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/super-admin/payment-methods/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master-payment-methods'] });
            toast.success('Metode pembayaran berhasil dihapus');
        }
    });

    const handleEdit = (item: MasterPaymentMethod) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            code: item.code,
            category: item.category,
            is_active: item.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini? Ini akan berdampak pada outlet yang menggunakannya.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Metode Pembayaran</h1>
                    <p className="text-slate-500 font-medium mt-1">Kelola daftar metode pembayaran yang tersedia untuk seluruh tenant.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingItem(null);
                        setForm({ name: '', code: '', category: 'other', is_active: true });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 font-bold text-sm active:scale-95"
                >
                    <Plus size={20} /> Tambah Metode
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-amber-500" size={48} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Master Data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.map(item => (
                        <div key={item.id} className={`bg-white rounded-[32px] border-2 shadow-sm p-8 relative transition-all group hover:shadow-xl hover:scale-[1.02] ${item.is_active ? 'border-slate-100' : 'border-red-100 opacity-60'}`}>
                            <div className="absolute top-6 right-6 flex gap-2">
                                <button onClick={() => handleEdit(item)} className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Pencil size={18} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>

                            <div className="flex items-center gap-5 mb-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${item.is_active ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <CreditCard size={32} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg leading-tight">{item.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                            {item.code}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</span>
                                    <span className="text-xs font-bold text-slate-700 uppercase">{item.category.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 space-y-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingItem ? 'Edit Metode' : 'Tambah Metode'}</h2>
                                <p className="text-sm text-slate-500 font-medium">Master Konfigurasi Pembayaran</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Metode</label>
                                    <input 
                                        required
                                        value={form.name} 
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white outline-none transition-all" 
                                        placeholder="Contoh: QRIS" 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Code</label>
                                    <input 
                                        required
                                        value={form.code} 
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/\s/g, '_') }))} 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white outline-none transition-all" 
                                        placeholder="Contoh: qris_merchant" 
                                        disabled={!!editingItem}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                                    <select 
                                        value={form.category} 
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white outline-none transition-all appearance-none"
                                    >
                                        <option value="cash">Cash / Tunai</option>
                                        <option value="e-wallet">E-Wallet / QRIS</option>
                                        <option value="bank_transfer">Transfer Bank</option>
                                        <option value="card">Kartu Kredit/Debit</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={form.is_active}
                                            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Aktifkan Metode Ini</span>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={mutation.isPending} 
                                    className="flex-1 bg-amber-600 text-white py-4 rounded-2xl text-sm font-black hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Simpan Metode
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
