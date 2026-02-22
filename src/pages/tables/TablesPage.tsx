import { useState } from 'react';
import { Plus, Pencil, Trash2, Table2, Users, Loader2 } from 'lucide-react';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useUpdateTableStatus } from '../../hooks/useTables';
import type { RestaurantTable } from '../../types';

const STATUS_COLORS = {
    available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tersedia' },
    occupied: { bg: 'bg-red-100', text: 'text-red-700', label: 'Terisi' },
    reserved: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Dipesan' },
    dirty: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Kotor' },
} as const;

export default function TablesPage() {
    const { data: tables = [], isLoading } = useTables();
    const createTable = useCreateTable();
    const updateTable = useUpdateTable();
    const deleteTable = useDeleteTable();
    const updateStatus = useUpdateTableStatus();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<RestaurantTable | null>(null);
    const [form, setForm] = useState({ name: '', capacity: 4, floor: 'Ground Floor', status: 'available' as RestaurantTable['status'] });

    const resetForm = () => { setForm({ name: '', capacity: 4, floor: 'Ground Floor', status: 'available' }); setEditItem(null); };

    const openEdit = (item: RestaurantTable) => {
        setEditItem(item);
        setForm({ name: item.name, capacity: item.capacity ?? 4, floor: item.floor ?? 'Ground Floor', status: item.status });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        const payload = {
            name: form.name,
            capacity: form.capacity,
            floor: form.floor,
            status: form.status
        };

        if (editItem) {
            await updateTable.mutateAsync({ id: editItem.id, payload });
        } else {
            await createTable.mutateAsync(payload);
        }
        resetForm();
        setShowForm(false);
    };

    // Group by floor
    const floors = [...new Set(tables.map(t => t.floor ?? 'Other'))];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Meja</h1>
                    <p className="text-sm text-slate-500 mt-1">Pantau dan kelola status meja restoran</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium">
                    <Plus size={18} /> Tambah Meja
                </button>
            </div>

            {/* Status Legend */}
            <div className="flex gap-3 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([key, val]) => (
                    <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${val.bg} ${val.text}`}>
                        <span className={`w-2 h-2 rounded-full ${val.bg.replace('100', '500')}`} />
                        {val.label}
                    </span>
                ))}
            </div>

            {isLoading ? (
                <div className="text-center py-16 text-slate-400">Memuat...</div>
            ) : (
                <div className="space-y-8">
                    {floors.map(floor => (
                        <div key={floor}>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{floor}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {tables.filter(t => (t.floor ?? 'Other') === floor).map(table => {
                                    const sc = STATUS_COLORS[table.status];
                                    return (
                                        <div key={table.id} className={`group relative rounded-2xl border-2 p-4 text-center transition-all bg-white shadow-sm hover:shadow-md ${table.status === 'available' ? 'border-green-100 hover:border-green-300' :
                                            table.status === 'occupied' ? 'border-red-100 hover:border-red-300' :
                                                table.status === 'reserved' ? 'border-amber-100 hover:border-amber-300' : 'border-slate-100 hover:border-slate-300'
                                            }`}>
                                            <div className="flex justify-center mb-2">
                                                <Table2 size={28} className={`${sc.text} transition-transform group-hover:scale-110`} />
                                            </div>
                                            <p className="font-bold text-slate-900 text-sm truncate">{table.name}</p>
                                            <div className="flex items-center justify-center gap-1 mt-1">
                                                <Users size={12} className="text-slate-400" />
                                                <span className="text-xs text-slate-400">{table.capacity}</span>
                                            </div>

                                            {/* Status Badge with Select */}
                                            <div className="relative mt-3">
                                                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${sc.bg} ${sc.text} shadow-sm inline-block min-w-full cursor-pointer hover:brightness-95`}>
                                                    {sc.label}
                                                </div>
                                                <select
                                                    value={table.status}
                                                    onChange={e => updateStatus.mutate({ id: table.id, status: e.target.value as RestaurantTable['status'] })}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                    aria-label="Ubah status"
                                                >
                                                    {Object.entries(STATUS_COLORS).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(table); }} className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-colors">
                                                    <Pencil size={12} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteTable.mutate(table.id); }} className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 shadow-sm transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {tables.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <Table2 size={48} className="mx-auto mb-4 text-slate-200" />
                            <p>Belum ada meja. Tambahkan meja pertama!</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- Form Modal --- */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-6 pb-0">
                            <h2 className="text-xl font-bold text-slate-900">{editItem ? 'Edit Meja' : 'Tambah Meja'}</h2>
                            <p className="text-sm text-slate-500 mt-1">Lengkapi informasi detail meja di bawah ini.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Meja</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-medium"
                                    placeholder="Table 1 / Meja VIP"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapasitas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.capacity}
                                        onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
                                        className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lantai / Area</label>
                                    <input
                                        value={form.floor}
                                        onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-medium"
                                        placeholder="Ground Floor"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Meja</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(STATUS_COLORS).map(([key, val]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, status: key as any }))}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${form.status === key
                                                ? `bg-white ${val.text.replace('text', 'border')} shadow-sm scale-102`
                                                : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${val.bg.replace('100', '500')}`} />
                                            <span className="text-xs font-bold">{val.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={createTable.isPending || updateTable.isPending}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-60 active:scale-95 flex items-center justify-center"
                            >
                                {createTable.isPending || updateTable.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                {createTable.isPending || updateTable.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
