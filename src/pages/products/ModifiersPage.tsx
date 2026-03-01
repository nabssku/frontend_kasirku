import { useState } from 'react';
import { Plus, Pencil, Trash2, ListTree } from 'lucide-react';

import { useModifierGroups, useCreateModifierGroup, useUpdateModifierGroup, useDeleteModifierGroup, useCreateModifier, useUpdateModifier, useDeleteModifier } from '../../hooks/useModifiers';
import type { ModifierGroup, Modifier } from '../../types';
import { useBusinessType } from '../../hooks/useBusinessType';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ModifiersPage() {
    const { isFnb } = useBusinessType();

    useEffect(() => {
        if (!isFnb) {
            toast.error('Halaman Modifiers tidak tersedia untuk outlet Retail.');
        }
    }, [isFnb]);

    if (!isFnb) {
        return <Navigate to="/products" replace />;
    }

    const { data: groups = [], isLoading } = useModifierGroups();
    const createGroup = useCreateModifierGroup();
    const updateGroup = useUpdateModifierGroup();
    const deleteGroup = useDeleteModifierGroup();
    const createMod = useCreateModifier();
    const updateMod = useUpdateModifier();
    const deleteMod = useDeleteModifier();

    const [showGroupForm, setShowGroupForm] = useState(false);
    const [editGroup, setEditGroup] = useState<ModifierGroup | null>(null);
    const [groupForm, setGroupForm] = useState({ name: '', min_select: 0, max_select: 1, required: false });

    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [showModForm, setShowModForm] = useState(false);
    const [editMod, setEditMod] = useState<Modifier | null>(null);
    const [modForm, setModForm] = useState({ name: '', price: 0, is_available: true });

    const resetGroupForm = () => { setGroupForm({ name: '', min_select: 0, max_select: 1, required: false }); setEditGroup(null); };
    const resetModForm = () => { setModForm({ name: '', price: 0, is_available: true }); setEditMod(null); };

    const handleGroupSubmit = async () => {
        if (editGroup) {
            await updateGroup.mutateAsync({ id: editGroup.id, payload: groupForm });
        } else {
            await createGroup.mutateAsync(groupForm);
        }
        setShowGroupForm(false);
        resetGroupForm();
    };

    const handleModSubmit = async () => {
        if (!activeGroupId) return;
        if (editMod) {
            await updateMod.mutateAsync({ groupId: activeGroupId, modifierId: editMod.id, payload: modForm });
        } else {
            await createMod.mutateAsync({ groupId: activeGroupId, payload: modForm });
        }
        setShowModForm(false);
        resetModForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tambahan (Modifiers)</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola ekstra, topping, atau pilihan menu</p>
                </div>
                <button onClick={() => { resetGroupForm(); setShowGroupForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm">
                    <Plus size={18} /> Tambah Grup
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-16 text-slate-400">Memuat...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groups.map(group => (
                        <div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                        <ListTree size={16} className="text-indigo-500" />
                                        {group.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                        {group.required ? 'Wajib' : 'Opsional'} • Pilih {group.min_select}-{group.max_select}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setEditGroup(group); setGroupForm({ name: group.name, min_select: group.min_select, max_select: group.max_select, required: group.required }); setShowGroupForm(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                                    <button onClick={() => deleteGroup.mutate(group.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="p-5 space-y-3 flex-1">
                                {group.modifiers?.map(m => (
                                    <div key={m.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${m.is_available ? 'bg-green-400' : 'bg-red-400'}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                                                <p className="text-xs text-slate-400">Rp {m.price.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setActiveGroupId(group.id); setEditMod(m); setModForm({ name: m.name, price: m.price, is_available: m.is_available }); setShowModForm(true); }} className="p-1 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded">Edit</button>
                                            <button onClick={() => deleteMod.mutate({ groupId: group.id, modifierId: m.id })} className="p-1 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded">Hapus</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => { setActiveGroupId(group.id); resetModForm(); setShowModForm(true); }} className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-xs font-bold text-slate-400 hover:border-indigo-100 hover:text-indigo-400 transition-all flex items-center justify-center gap-1">
                                    <Plus size={12} /> Tambah Item
                                </button>
                            </div>
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <div className="lg:col-span-2 text-center py-16 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <ListTree size={48} className="mx-auto mb-4 opacity-10" />
                            <p>Belum ada grup modifier.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- Group Form Modal --- */}
            {showGroupForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">{editGroup ? 'Edit Grup' : 'Grup Modifier Baru'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Nama Grup</label>
                                <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Contoh: Pilih Saus / Level Pedas" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Min. Pilih</label>
                                    <input type="number" min="0" value={groupForm.min_select} onChange={e => setGroupForm(f => ({ ...f, min_select: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Maks. Pilih</label>
                                    <input type="number" min="1" value={groupForm.max_select} onChange={e => setGroupForm(f => ({ ...f, max_select: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={groupForm.required} onChange={e => setGroupForm(f => ({ ...f, required: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
                                <span className="text-sm font-medium text-slate-700">Wajib diisi</span>
                            </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowGroupForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleGroupSubmit} disabled={createGroup.isPending} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modifier Form Modal --- */}
            {showModForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">{editMod ? 'Edit Pilihan' : 'Tambah Pilihan'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Nama Pilihan</label>
                                <input value={modForm.name} onChange={e => setModForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Contoh: Keju Ekstra" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Harga Tambah (Rp)</label>
                                <input type="number" value={modForm.price} onChange={e => setModForm(f => ({ ...f, price: +e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={modForm.is_available} onChange={e => setModForm(f => ({ ...f, is_available: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
                                <span className="text-sm font-medium text-slate-700">Tersedia</span>
                            </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowModForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleModSubmit} disabled={createMod.isPending} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
