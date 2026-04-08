import { useState } from 'react';
import {
    Bluetooth, Plus, Trash2, Star as _Star,
    BluetoothOff, Pencil, X, Loader2, RefreshCw
} from 'lucide-react';
import { usePrinters, useAddPrinter, useDeletePrinter, useUpdatePrinter, useSetDefaultPrinter } from '../../hooks/usePrinters';
import { useBluetoothPrint } from '../../hooks/useBluetoothPrint';
import { usePrinterStore } from '../../app/store/usePrinterStore';
import { useAuthStore } from '../../app/store/useAuthStore';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { BluetoothPrinterDevice } from '../../types';

export default function PrinterSettingsPage() {
    const { user } = useAuthStore();
    const isOwnerOnly = user?.roles?.some(r => r.slug === 'owner') && !user?.roles?.some(r => r.slug === 'admin' || r.slug === 'super_admin');

    const { data: printers = [], isLoading } = usePrinters();
    const addPrinter = useAddPrinter();
    const updatePrinter = useUpdatePrinter();
    const deletePrinter = useDeletePrinter();
    const setDefault = useSetDefaultPrinter();

    const { isSupported, connectPrinter, autoConnect } = useBluetoothPrint();

    const [editItem, setEditItem] = useState<BluetoothPrinterDevice | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<'cashier' | 'kitchen' | 'both'>('both');

    const { isConnecting, cashierDevice, kitchenDevice } = usePrinterStore();

    useEffect(() => {
        // Automatically sync printer connections and roles based on the latest config
        autoConnect(printers);
    }, [printers, autoConnect]);

    const handleReconnect = async () => {
        try {
            await autoConnect(printers);
            toast.success('Mencoba menghubungkan ulang printer...');
        } catch {
            toast.error('Gagal menghubungkan ulang printer.');
        }
    };

    const handleAddPrinter = async () => {
        if (!isSupported) {
            toast.error('Browser Anda tidak mendukung Web Bluetooth API. Gunakan Chrome atau Edge.');
            return;
        }

        try {
            const result = await connectPrinter('both');
            if (!result) {
                toast.info('Pencarian printer dibatalkan.');
                return;
            }

            await addPrinter.mutateAsync({
                name: result.name,
                mac_address: result.device.id ?? undefined,
                is_default: printers.length === 0,
                type: 'both' // Default type for new printer
            });
            toast.success(`Printer "${result.name}" berhasil ditambahkan!`);
        } catch (err: any) {
            toast.error(err.message ?? 'Gagal menambahkan printer.');
        }
    };

    const handleSaveEdit = async () => {
        if (!editItem) return;
        try {
            await updatePrinter.mutateAsync({
                id: editItem.id,
                payload: {
                    name: editName.trim() || editItem.name,
                    type: editType
                }
            });
            toast.success('Pengaturan printer diperbarui.');
            setEditItem(null);
        } catch {
            toast.error('Gagal memperbarui printer.');
        }
    };

    const handleDelete = (printer: BluetoothPrinterDevice) => {
        if (!confirm(`Hapus printer "${printer.name}"?`)) return;
        deletePrinter.mutate(printer.id, {
            onSuccess: () => toast.success('Printer dihapus.'),
            onError: () => toast.error('Gagal menghapus printer.'),
        });
    };

    const handleSetDefault = (id: string) => {
        setDefault.mutate(id, {
            onSuccess: () => toast.success('Printer default diperbarui.'),
            onError: () => toast.error('Gagal mengubah printer default.'),
        });
    };

    const isDeviceConnected = (mac?: string) => {
        return cashierDevice?.id === mac || kitchenDevice?.id === mac;
    };

    const getDeviceRoleLabel = (type: string) => {
        switch (type) {
            case 'cashier': return 'KASIR';
            case 'kitchen': return 'DAPUR';
            default: return 'KEDUANYA';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pengaturan Printer</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola printer Bluetooth untuk Kasir & Dapur</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReconnect}
                        disabled={isConnecting}
                        className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
                    >
                        <RefreshCw size={17} className={isConnecting ? 'animate-spin' : ''} />
                        Hubungkan Ulang
                    </button>
                    {!isOwnerOnly && (
                        <button
                            onClick={handleAddPrinter}
                            disabled={isConnecting || addPrinter.isPending}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
                        >
                            {isConnecting ? (
                                <><Loader2 size={17} className="animate-spin" /> Mencari...</>
                            ) : (
                                <><Plus size={17} /> Tambah Printer</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Role Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border transition-all ${cashierDevice ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Printer Kasir</span>
                        {cashierDevice && <span className="flex h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="text-lg font-bold text-slate-900 truncate">
                        {cashierDevice?.name || 'Belum Terhubung'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Untuk cetak struk pembayaran pelanggan.</p>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${kitchenDevice ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Printer Dapur</span>
                        {kitchenDevice && <span className="flex h-2 w-2 rounded-full bg-indigo-500" />}
                    </div>
                    <p className="text-lg font-bold text-slate-900 truncate">
                        {kitchenDevice?.name || 'Belum Terhubung'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Untuk cetak pesanan otomatis ke dapur.</p>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="text-center py-16 text-slate-400">
                    <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-40" />
                    <p className="text-sm">Memuat daftar printer...</p>
                </div>
            ) : printers.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <BluetoothOff size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-500">Belum ada printer terdaftar</p>
                    <p className="text-sm mt-1">Klik tombol di atas untuk menambahkan printer Bluetooth.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-6 py-3">Nama/Tipe</th>
                                <th className="text-center px-6 py-3">Fungsi</th>
                                <th className="text-center px-6 py-3">Status</th>
                                <th className="text-right px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {printers.map(printer => {
                                const connected = isDeviceConnected(printer.mac_address);
                                return (
                                    <tr key={printer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${printer.is_default ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Bluetooth size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{printer.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono uppercase">{printer.mac_address || 'NO ADDR'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${printer.type === 'cashier' ? 'bg-amber-100 text-amber-700' :
                                                printer.type === 'kitchen' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {getDeviceRoleLabel(printer.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {connected ? (
                                                    <span className="text-[10px] font-bold text-emerald-600">AKTIF</span>
                                                ) : (
                                                    <button
                                                        onClick={() => autoConnect(printers)}
                                                        className="text-[10px] font-bold text-indigo-500 underline"
                                                    >
                                                        HUBUNGKAN
                                                    </button>
                                                )}
                                                {printer.is_default && <span className="text-[9px] text-slate-400 italic">Default Device</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {!isOwnerOnly && (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditItem(printer); setEditName(printer.name); setEditType(printer.type); }}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(printer)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Pengaturan Printer</h2>
                            <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Nama Printer</label>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                                    placeholder="Contoh: Printer Kasir Depan..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Fungsi Printer</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['cashier', 'kitchen', 'both'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setEditType(t)}
                                            className={`py-2.5 rounded-xl text-[10px] font-bold border transition-all ${editType === t
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'
                                                }`}
                                        >
                                            {t === 'cashier' ? 'KASIR' : t === 'kitchen' ? 'DAPUR' : 'KEDUANYA'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleSetDefault(editItem.id)}
                                disabled={editItem.is_default || setDefault.isPending}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${editItem.is_default
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                                    : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                                    }`}
                            >
                                <_Star size={14} className={editItem.is_default ? 'fill-emerald-500' : ''} />
                                {editItem.is_default ? 'Printer Default' : 'Jadikan Printer Default'}
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditItem(null)} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50">
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={updatePrinter.isPending}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 shadow-lg shadow-indigo-100"
                            >
                                {updatePrinter.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
