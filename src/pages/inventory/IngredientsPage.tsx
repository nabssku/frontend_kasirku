import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Package, ChevronRight } from 'lucide-react';
import { useIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient, useAdjustStock } from '../../hooks/useIngredients';
import type { Ingredient } from '../../types';

type AdjustType = 'in' | 'out' | 'adjustment' | 'waste';

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'pcs', 'sachet', 'box', 'slice'];

export default function IngredientsPage() {
    const { data: ingredients = [], isLoading } = useIngredients();
    const createIngredient = useCreateIngredient();
    const updateIngredient = useUpdateIngredient();
    const deleteIngredient = useDeleteIngredient();
    const adjustStock = useAdjustStock();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<Ingredient | null>(null);
    const [adjustItem, setAdjustItem] = useState<Ingredient | null>(null);
    const [form, setForm] = useState({ name: '', unit: 'g', cost_per_unit: 0, current_stock: 0, min_stock: 0 });
    const [adjustForm, setAdjustForm] = useState({ quantity: 0, type: 'in' as AdjustType, notes: '' });

    const resetForm = () => { setForm({ name: '', unit: 'g', cost_per_unit: 0, current_stock: 0, min_stock: 0 }); setEditItem(null); };

    const openEdit = (item: Ingredient) => {
        setEditItem(item);
        setForm({ name: item.name, unit: item.unit, cost_per_unit: item.cost_per_unit, current_stock: item.current_stock, min_stock: item.min_stock });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (editItem) {
            await updateIngredient.mutateAsync({ id: editItem.id, payload: form });
        } else {
            await createIngredient.mutateAsync(form);
        }
        resetForm();
        setShowForm(false);
    };

    const handleAdjust = async () => {
        if (!adjustItem) return;
        await adjustStock.mutateAsync({ id: adjustItem.id, ...adjustForm });
        setAdjustItem(null);
    };

    const lowStockCount = ingredients.filter(i => i.current_stock <= i.min_stock).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bahan Baku</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola stok bahan baku dapur</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium">
                    <Plus size={18} /> Tambah Bahan
                </button>
            </div>

            {lowStockCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                    <p className="text-amber-800 font-medium">{lowStockCount} bahan baku di bawah stok minimum!</p>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-16 text-slate-400">Memuat...</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-6 py-3">Bahan</th>
                                <th className="text-right px-6 py-3">Stok Saat Ini</th>
                                <th className="text-right px-6 py-3">Min. Stok</th>
                                <th className="text-right px-6 py-3">Harga/Unit</th>
                                <th className="text-center px-6 py-3">Status</th>
                                <th className="text-right px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ingredients.map(item => {
                                const isLow = item.current_stock <= item.min_stock;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                    <Package size={16} className="text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-400">{item.unit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">{item.current_stock} {item.unit}</td>
                                        <td className="px-6 py-4 text-right text-slate-500">{item.min_stock} {item.unit}</td>
                                        <td className="px-6 py-4 text-right text-slate-500">Rp {item.cost_per_unit.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {isLow ? <AlertTriangle size={10} /> : null}{isLow ? 'Stok Rendah' : 'Aman'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setAdjustItem(item); setAdjustForm({ quantity: 0, type: 'in', notes: '' }); }} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-1">
                                                    <ChevronRight size={12} /> Adjust
                                                </button>
                                                <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                                                <button onClick={() => deleteIngredient.mutate(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {ingredients.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">Belum ada bahan baku. Tambahkan bahan pertama!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- Ingredient Form Modal --- */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">{editItem ? 'Edit Bahan' : 'Tambah Bahan Baru'}</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nama Bahan</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Contoh: Tepung terigu" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Satuan</label>
                                    <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Harga/Unit (Rp)</label>
                                    <input type="number" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Stok Awal</label>
                                    <input type="number" value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Min. Stok</label>
                                    <input type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleSubmit} disabled={createIngredient.isPending || updateIngredient.isPending} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                                {createIngredient.isPending || updateIngredient.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Stock Adjust Modal --- */}
            {adjustItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">Adjust Stok — {adjustItem.name}</h2>
                        <p className="text-sm text-slate-500">Stok saat ini: <span className="font-semibold text-slate-800">{adjustItem.current_stock} {adjustItem.unit}</span></p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Tipe</label>
                                <select value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value as AdjustType }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                    <option value="in">Masuk (+)</option>
                                    <option value="out">Keluar (-)</option>
                                    <option value="adjustment">Penyesuaian (set absolut)</option>
                                    <option value="waste">Terbuang (-)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Jumlah ({adjustItem.unit})</label>
                                <input type="number" min="0" step="0.01" value={adjustForm.quantity} onChange={e => setAdjustForm(f => ({ ...f, quantity: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Catatan</label>
                                <input value={adjustForm.notes} onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Opsional" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setAdjustItem(null)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleAdjust} disabled={adjustStock.isPending} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                                {adjustStock.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
