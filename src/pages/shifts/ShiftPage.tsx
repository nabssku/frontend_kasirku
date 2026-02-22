import { useState } from 'react';
import { Clock, DollarSign, ChevronDown, ChevronUp, Loader2, LogIn, LogOut, X, AlertCircle } from 'lucide-react';
import { useCurrentShift, useOpenShift, useCloseShift, useShifts, useAddCashLog } from '../../hooks/useShifts';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { Shift } from '../../types';

function formatRp(n: number) {
    return 'Rp ' + (n ?? 0).toLocaleString('id-ID');
}

function ShiftSummaryCard({ shift }: { shift: Shift }) {
    const [showLogs, setShowLogs] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Dibuka</p>
                    <p className="text-sm text-slate-700 mt-0.5">{new Date(shift.opened_at).toLocaleString('id-ID')}</p>
                    {shift.closed_at && <p className="text-xs text-slate-400 mt-0.5">Ditutup: {new Date(shift.closed_at).toLocaleString('id-ID')}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${shift.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {shift.status === 'open' ? 'Buka' : 'Tutup'}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Kas Awal</p>
                    <p className="font-bold text-slate-900">{formatRp(shift.opening_cash)}</p>
                </div>
                {shift.closing_cash !== undefined && (
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">Kas Akhir</p>
                        <p className="font-bold text-slate-900">{formatRp(shift.closing_cash)}</p>
                    </div>
                )}
                {shift.cash_difference !== undefined && (
                    <div className={`rounded-xl p-3 ${shift.cash_difference >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-xs ${shift.cash_difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>Selisih</p>
                        <p className={`font-bold ${shift.cash_difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatRp(shift.cash_difference)}</p>
                    </div>
                )}
            </div>
            {shift.cash_drawer_logs && shift.cash_drawer_logs.length > 0 && (
                <div className="mt-4">
                    <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                        {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {shift.cash_drawer_logs.length} log laci kas
                    </button>
                    {showLogs && (
                        <div className="mt-2 space-y-1">
                            {shift.cash_drawer_logs.map(log => (
                                <div key={log.id} className="flex justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                                    <span className={`font-semibold ${log.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>{log.type === 'in' ? '+' : '-'} {formatRp(log.amount)}</span>
                                    <span className="text-slate-400">{log.reason}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ShiftPage() {
    const { data: currentShift, isLoading } = useCurrentShift();
    const { data: historyData } = useShifts();
    const openShift = useOpenShift();
    const closeShift = useCloseShift();
    const addCashLog = useAddCashLog();

    const [showOpenForm, setShowOpenForm] = useState(false);
    const [showCloseForm, setShowCloseForm] = useState(false);
    const [showCashLog, setShowCashLog] = useState(false);
    const [openingCash, setOpeningCash] = useState('0');
    const [closingCash, setClosingCash] = useState('0');
    const [cashLogForm, setCashLogForm] = useState({ type: 'in' as 'in' | 'out', amount: '0', reason: '' });

    const { user } = useAuthStore();
    const outletId = user?.outlet_id;
    const history = historyData?.data ?? [];

    const handleOpen = async () => {
        if (!outletId) return;
        await openShift.mutateAsync({ outlet_id: outletId, opening_cash: Number(openingCash) });
        setShowOpenForm(false);
    };

    const handleClose = async () => {
        if (!currentShift) return;
        await closeShift.mutateAsync({ id: currentShift.id, closing_cash: Number(closingCash) });
        setShowCloseForm(false);
    };

    const handleCashLog = async () => {
        if (!currentShift) return;
        await addCashLog.mutateAsync({ shiftId: currentShift.id, ...cashLogForm, amount: Number(cashLogForm.amount) });
        setShowCashLog(false);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manajemen Shift</h1>
                <p className="text-sm text-slate-500 mt-1">Kelola buka dan tutup shift kasir</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="animate-spin mr-2" /> Memuat...</div>
            ) : currentShift ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-green-800 font-semibold text-sm">Shift sedang berjalan</p>
                    </div>
                    <ShiftSummaryCard shift={currentShift} />
                    <div className="flex gap-3">
                        <button onClick={() => { setShowCashLog(true); setCashLogForm({ type: 'in', amount: '0', reason: '' }); }} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
                            <DollarSign size={16} /> Catat Kas
                        </button>
                        <button onClick={() => setShowCloseForm(true)} className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                            <LogOut size={16} /> Tutup Shift
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                        <Clock size={32} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900">Tidak ada shift aktif</p>
                        <p className="text-sm text-slate-500 mt-1">Buka shift baru untuk mulai bertransaksi</p>
                    </div>
                    {!outletId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <p className="text-amber-800 font-semibold text-sm">Akun Anda belum terhubung ke outlet. Hubungi administrator.</p>
                        </div>
                    )}
                    <button onClick={() => setShowOpenForm(true)} disabled={!outletId} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <LogIn size={16} /> Buka Shift Baru
                    </button>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Riwayat Shift</h2>
                    <div className="space-y-3">
                        {history.filter((s: Shift) => s.status === 'closed').slice(0, 5).map((shift: Shift) => (
                            <ShiftSummaryCard key={shift.id} shift={shift} />
                        ))}
                    </div>
                </div>
            )}

            {/* Open Shift Modal */}
            {showOpenForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Buka Shift Baru</h2>
                            <button onClick={() => setShowOpenForm(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Uang Kas Awal (Rp)</label>
                            <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                        </div>
                        <button onClick={handleOpen} disabled={openShift.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60">
                            {openShift.isPending ? 'Membuka...' : 'Buka Shift'}
                        </button>
                    </div>
                </div>
            )}

            {/* Close Shift Modal */}
            {showCloseForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Tutup Shift</h2>
                            <button onClick={() => setShowCloseForm(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Hitung Kas Saat Ini (Rp)</label>
                            <input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                        </div>
                        <button onClick={handleClose} disabled={closeShift.isPending} className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
                            {closeShift.isPending ? 'Menutup...' : 'Tutup Shift'}
                        </button>
                    </div>
                </div>
            )}

            {/* Cash Log Modal */}
            {showCashLog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Catat Kas Laci</h2>
                            <button onClick={() => setShowCashLog(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Tipe</label>
                                <select value={cashLogForm.type} onChange={e => setCashLogForm(f => ({ ...f, type: e.target.value as 'in' | 'out' }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                    <option value="in">Masuk (+)</option>
                                    <option value="out">Keluar (-)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Jumlah (Rp)</label>
                                <input type="number" value={cashLogForm.amount} onChange={e => setCashLogForm(f => ({ ...f, amount: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Keterangan</label>
                                <input value={cashLogForm.reason} onChange={e => setCashLogForm(f => ({ ...f, reason: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Contoh: Bayar supplier" />
                            </div>
                        </div>
                        <button onClick={handleCashLog} disabled={addCashLog.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60">
                            {addCashLog.isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
