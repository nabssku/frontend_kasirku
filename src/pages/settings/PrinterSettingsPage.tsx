import { useState } from 'react';
import {
    Bluetooth, Plus, Trash2, Star as _Star, StarOff, Printer,
    BluetoothOff, Pencil, X, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import { usePrinters, useAddPrinter, useDeletePrinter, useUpdatePrinter, useSetDefaultPrinter } from '../../hooks/usePrinters';
import { useBluetoothPrint } from '../../hooks/useBluetoothPrint';
import { usePrinterStore } from '../../app/store/usePrinterStore';
import { toast } from 'sonner';
import type { BluetoothPrinterDevice } from '../../types';

export default function PrinterSettingsPage() {
    const { data: printers = [], isLoading } = usePrinters();
    const addPrinter = useAddPrinter();
    const updatePrinter = useUpdatePrinter();
    const deletePrinter = useDeletePrinter();
    const setDefault = useSetDefaultPrinter();

    const { isSupported, connectPrinter } = useBluetoothPrint();

    const [editItem, setEditItem] = useState<BluetoothPrinterDevice | null>(null);
    const [editName, setEditName] = useState('');
    const { isConnecting, activeDevice } = usePrinterStore();

    const handleAddPrinter = async () => {
        if (!isSupported) {
            toast.error('Browser Anda tidak mendukung Web Bluetooth API. Gunakan Chrome atau Edge.');
            return;
        }

        try {
            const result = await connectPrinter();
            if (!result) {
                toast.info('Pencarian printer dibatalkan.');
                return;
            }

            await addPrinter.mutateAsync({
                name: result.name,
                mac_address: result.device.id ?? undefined,
                is_default: printers.length === 0,
            });
            toast.success(`Printer "${result.name}" berhasil ditambahkan!`);
        } catch (err: any) {
            toast.error(err.message ?? 'Gagal menambahkan printer.');
        }
    };

    const handleSaveEdit = async () => {
        if (!editItem || !editName.trim()) return;
        try {
            await updatePrinter.mutateAsync({ id: editItem.id, payload: { name: editName.trim() } });
            toast.success('Nama printer diperbarui.');
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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pengaturan Printer</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola printer Bluetooth untuk cetak struk</p>
                </div>
                <button
                    onClick={handleAddPrinter}
                    disabled={isConnecting || addPrinter.isPending}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
                >
                    {isConnecting ? (
                        <><Loader2 size={17} className="animate-spin" /> Mencari Printer...</>
                    ) : (
                        <><Plus size={17} /> Tambah Printer Bluetooth</>
                    )}
                </button>
            </div>

            {/* Browser support warning */}
            {!isSupported && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm">Web Bluetooth tidak didukung</p>
                        <p className="text-xs mt-0.5">
                            Gunakan <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> versi terbaru untuk menggunakan fitur printer Bluetooth.
                            Di perangkat ini, struk akan dicetak menggunakan dialog print browser.
                        </p>
                    </div>
                </div>
            )}

            {/* How it works */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-indigo-800 text-sm flex items-center gap-2">
                    <Printer size={15} /> Cara Kerja
                </h3>
                <ol className="text-xs text-indigo-700 space-y-1 list-decimal list-inside">
                    <li>Pastikan printer Bluetooth sudah dinyalakan dan dalam mode pairing.</li>
                    <li>Klik tombol "Tambah Printer Bluetooth" dan pilih printer dari daftar.</li>
                    <li>Setelah ditambahkan, atur satu printer sebagai <strong>default</strong>.</li>
                    <li>Struk akan otomatis dicetak ke printer default setelah transaksi selesai.</li>
                </ol>
            </div>

            {/* Printer list */}
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
                                <th className="text-left px-6 py-3">Nama Printer</th>
                                <th className="text-left px-6 py-3 hidden md:table-cell">MAC Address</th>
                                <th className="text-center px-6 py-3">Status</th>
                                <th className="text-right px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {printers.map(printer => (
                                <tr key={printer.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${printer.is_default ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <Bluetooth size={16} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900">{printer.name}</p>
                                                    {activeDevice?.id === printer.mac_address && (
                                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Connected" />
                                                    )}
                                                </div>
                                                {printer.outlet && (
                                                    <p className="text-xs text-slate-400">{printer.outlet.name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 hidden md:table-cell font-mono text-xs">
                                        {printer.mac_address || <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {printer.is_default ? (
                                            <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                <CheckCircle2 size={11} /> DEFAULT
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(printer.id)}
                                                disabled={setDefault.isPending}
                                                className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 mx-auto"
                                            >
                                                <StarOff size={13} /> Set Default
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setEditItem(printer); setEditName(printer.name); }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(printer)}
                                                disabled={deletePrinter.isPending}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Name Modal */}
            {editItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Edit Nama Printer</h2>
                            <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                            placeholder="Nama printer..."
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setEditItem(null)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm hover:bg-slate-50">
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={updatePrinter.isPending}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
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
