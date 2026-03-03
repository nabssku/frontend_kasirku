import { useState } from 'react';
import { Plus, Pencil, Trash2, Table2, Users, Loader2, ShoppingBag, QrCode, Copy, Check, Eye } from 'lucide-react';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useUpdateTableStatus } from '../../hooks/useTables';
import type { RestaurantTable } from '../../types';
import { useBusinessType } from '../../hooks/useBusinessType';
import { useCurrentSubscription } from '../../hooks/useSubscription';
import api from '../../lib/axios';

const STATUS_COLORS = {
    available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tersedia' },
    occupied: { bg: 'bg-red-100', text: 'text-red-700', label: 'Terisi' },
    reserved: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Dipesan' },
    dirty: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Kotor' },
} as const;

export default function TablesPage() {
    const { isRetail } = useBusinessType();
    const { data: tables = [], isLoading } = useTables();
    const createTable = useCreateTable();
    const updateTable = useUpdateTable();
    const deleteTable = useDeleteTable();
    const updateStatus = useUpdateTableStatus();
    const { data: subscriptionRes } = useCurrentSubscription();

    const hasQrFeature = subscriptionRes?.subscription?.plan?.features?.some(
        (f: { feature_key: string; feature_value: string }) =>
            f.feature_key === 'qr_self_order' && f.feature_value === 'true'
    ) ?? false;

    const [qrLoading, setQrLoading] = useState<string | null>(null);
    const [qrCopied, setQrCopied] = useState<string | null>(null);
    const [qrModal, setQrModal] = useState<{ tableId: string; tableNm: string; url: string } | null>(null);

    const generateQr = async (tableId: string) => {
        setQrLoading(tableId);
        try {
            const { data } = await api.post(`/tables/${tableId}/qr/generate`);
            if (data.success) {
                window.location.reload(); // refresh table data
            } else {
                alert(data.message || 'Gagal generate QR.');
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal generate QR.');
        } finally {
            setQrLoading(null);
        }
    };

    const toggleQr = async (tableId: string, enabled: boolean) => {
        setQrLoading(tableId);
        try {
            const { data } = await api.patch(`/tables/${tableId}/qr/toggle`, { enabled });
            if (!data.success) alert(data.message || 'Gagal mengubah QR.');
            else window.location.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal mengubah QR.');
        } finally {
            setQrLoading(null);
        }
    };

    const copyQrUrl = (url: string, tableId: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setQrCopied(tableId);
            setTimeout(() => setQrCopied(null), 2000);
        });
    };

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

    // Retail guard
    if (isRetail) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
                <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center ring-8 ring-purple-50/50">
                    <ShoppingBag size={44} className="text-purple-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-800">Fitur Tidak Tersedia</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Manajemen meja hanya tersedia untuk bisnis tipe <span className="font-bold text-indigo-600">FNB</span>.
                        Ubah tipe bisnis outlet Anda di halaman <span className="font-bold">Outlet</span> untuk mengaktifkan fitur ini.
                    </p>
                </div>
            </div>
        );
    }

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

                                            {/* QR Self Order Panel (admin only, feature-gated) */}
                                            {hasQrFeature && (
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    {(table as any).qr_token ? (
                                                        <div className="flex items-center justify-between gap-1">
                                                            {/* Toggle */}
                                                            <button
                                                                onClick={e => { e.stopPropagation(); toggleQr(table.id, !(table as any).qr_enabled); }}
                                                                disabled={qrLoading === table.id}
                                                                title={(table as any).qr_enabled ? 'Nonaktifkan QR' : 'Aktifkan QR'}
                                                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${(table as any).qr_enabled
                                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                    }`}
                                                            >
                                                                {qrLoading === table.id
                                                                    ? <Loader2 size={10} className="animate-spin" />
                                                                    : <QrCode size={10} />}
                                                                {(table as any).qr_enabled ? 'QR ON' : 'QR OFF'}
                                                            </button>
                                                            {/* Copy URL */}
                                                            <button
                                                                onClick={e => { e.stopPropagation(); copyQrUrl((table as any).qr_url ?? '', table.id); }}
                                                                title="Salin link menu"
                                                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                            >
                                                                {qrCopied === table.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                                            </button>
                                                            {/* View QR */}
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setQrModal({ tableId: table.id, tableNm: table.name, url: (table as any).qr_url ?? '' }); }}
                                                                title="Lihat QR Code"
                                                                className="p-1 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                                            >
                                                                <Eye size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); generateQr(table.id); }}
                                                            disabled={qrLoading === table.id}
                                                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all"
                                                        >
                                                            {qrLoading === table.id ? <Loader2 size={10} className="animate-spin" /> : <QrCode size={10} />}
                                                            Generate QR
                                                        </button>
                                                    )}
                                                </div>
                                            )}
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

            {/* --- QR Code Modal --- */}
            {qrModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-1">{qrModal.tableNm}</h3>
                        <p className="text-xs text-slate-400 mb-4">Scan QR untuk membuka menu</p>
                        <div className="flex justify-center">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModal.url)}`}
                                alt="QR Code"
                                className="rounded-xl border border-slate-200"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-4 break-all">{qrModal.url}</p>
                        <button
                            onClick={() => { copyQrUrl(qrModal.url, qrModal.tableId); }}
                            className="mt-4 w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                        >
                            <Copy size={14} /> Salin Link Menu
                        </button>
                        <button
                            onClick={() => setQrModal(null)}
                            className="mt-2 text-sm text-slate-400 hover:text-slate-600"
                        >
                            Tutup
                        </button>
                    </div>
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
