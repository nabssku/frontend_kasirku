import { useState } from 'react';
import {
    Clock, DollarSign, ChevronDown, ChevronUp, Loader2, LogIn, LogOut,
    X, AlertCircle, Printer, Calendar, User as UserIcon,
    ArrowDownRight, ArrowUpRight, AlertTriangle
} from 'lucide-react';
import { useCurrentShift, useOpenShift, useCloseShift, useShifts, useAddCashLog } from '../../hooks/useShifts';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useUsers } from '../../hooks/useUsers';
import { useBluetoothPrint } from '../../hooks/useBluetoothPrint';
import { toast } from 'sonner';
import type { Shift } from '../../types';
import { formatRp } from '../../lib/format';
import { useOverlayStore } from '../../app/store/useOverlayStore';
import { useEffect } from 'react';

function DiscrepancyBadge({ status }: { status?: string }) {
    if (!status || status === 'OK') return null;

    const colors = {
        'Shortage': 'bg-amber-100 text-amber-700 border-amber-200',
        'Over': 'bg-blue-100 text-blue-700 border-blue-200',
        'Requires Approval': 'bg-red-100 text-red-700 border-red-200 animate-pulse'
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[status as keyof typeof colors] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
}

function ShiftSummaryCard({ shift }: { shift: Shift }) {
    const [showDetails, setShowDetails] = useState(false);
    const { printShiftReport } = useBluetoothPrint();
    const report = shift.report;

    if (!report) return null;

    const isNegative = report.difference < 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift #{shift.id.slice(0, 8)}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${shift.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {shift.status === 'open' ? 'AKTIF' : 'SELESAI'}
                            </span>
                            <DiscrepancyBadge status={report.discrepancy_status} />
                        </div>
                        <div className="flex items-center gap-4 text-slate-600 mt-1">
                            <div className="flex items-center gap-1.5">
                                <Clock size={16} className="text-slate-400" />
                                <span className="text-base font-bold">{new Date(shift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-slate-300">-</span>
                                <span className="text-base font-bold">{shift.closed_at ? new Date(shift.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Sekarang'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                                <UserIcon size={14} className="text-slate-400" />
                                <span>{report.opened_by_name ?? 'Kasir'}</span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-1">{new Date(shift.opened_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <button
                        onClick={() => printShiftReport(shift)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 print:hidden"
                        title="Cetak Laporan"
                    >
                        <Printer size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Kas Awal</p>
                        <p className="font-bold text-slate-900 mt-0.5">{formatRp(shift.opening_cash)}</p>
                    </div>
                    <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase">Penjualan (Net)</p>
                        <p className="font-bold text-indigo-700 mt-0.5">{formatRp(report.net_sales)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Kas Masuk</p>
                        <p className="font-bold text-slate-900 mt-0.5">{formatRp(report.expected_cash)}</p>
                    </div>
                    <div className={`${isNegative ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'} rounded-xl p-3 border`}>
                        <p className="text-[10px] font-bold uppercase opacity-70">Selisih Kas</p>
                        <p className="font-bold mt-0.5">{formatRp(report.difference)}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 py-2 border-t border-slate-50 transition-colors print:hidden"
                >
                    {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showDetails ? 'Tutup Detail' : 'Lihat Detail Laporan'}
                </button>

                {showDetails && (
                    <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        {/* Sales Breakdown */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Penjualan & Refund</h4>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="p-2 rounded-lg bg-slate-50">
                                    <p className="text-[10px] text-slate-400 uppercase">Gross Sales</p>
                                    <p className="font-semibold text-slate-900">{formatRp(report.gross_sales)}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-50">
                                    <p className="text-[10px] text-red-400 uppercase">Total Refund</p>
                                    <p className="font-semibold text-red-600">{formatRp(report.refund_total)}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-indigo-50">
                                    <p className="text-[10px] text-indigo-400 uppercase">Net Sales</p>
                                    <p className="font-semibold text-indigo-600">{formatRp(report.net_sales)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Metode Pembayaran (Net)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(report.payment_breakdown).map(([method, amount]) => (
                                    <div key={method} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <span className="text-xs font-medium text-slate-600 capitalize">{method.replace('_', ' ')}</span>
                                        <span className="text-sm font-bold text-slate-900">{formatRp(amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cash Movement */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Pergerakan Laci Kas</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs py-1 text-slate-500">
                                    <span>Kas Awal</span>
                                    <span className="font-bold">{formatRp(shift.opening_cash)}</span>
                                </div>
                                <div className="flex justify-between text-xs py-1 text-green-600 bg-green-50/30 px-2 rounded">
                                    <span className="flex items-center gap-1"><ArrowDownRight size={14} /> Total Kas Masuk (+)</span>
                                    <span className="font-bold">{formatRp(report.expected_cash - shift.opening_cash + report.cash_out)}</span>
                                </div>
                                <div className="flex justify-between text-xs py-1 text-red-500 bg-red-50/30 px-2 rounded">
                                    <span className="flex items-center gap-1"><ArrowUpRight size={14} /> Total Kas Keluar (-)</span>
                                    <span className="font-bold">{formatRp(report.cash_out)}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-t border-dashed border-slate-200 mt-2">
                                    <span className="font-bold text-slate-600">Ekspektasi Kas Laci</span>
                                    <span className="font-bold text-slate-900 underline decoration-slate-300">{formatRp(report.expected_cash)}</span>
                                </div>
                                {shift.status === 'closed' && (
                                    <div className="flex justify-between text-sm py-2 bg-slate-900 text-white px-3 rounded-xl mt-1">
                                        <span className="font-medium">Kas Aktual Terhitung</span>
                                        <span className="font-black text-white">{formatRp(report.actual_cash)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Sales Breakdown */}
                        {report.product_sales && report.product_sales.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Produk Terjual</h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black">
                                                <th className="px-3 py-2">Produk</th>
                                                <th className="px-3 py-2 text-center">Qty</th>
                                                <th className="px-3 py-2 text-right">Harga</th>
                                                <th className="px-3 py-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {report.product_sales.map((ps, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-3 py-2 font-bold text-slate-700">{ps.product_name}</td>
                                                    <td className="px-3 py-2 text-center text-slate-600">{ps.quantity}</td>
                                                    <td className="px-3 py-2 text-right text-slate-500">{formatRp(ps.price)}</td>
                                                    <td className="px-3 py-2 text-right font-black text-slate-900">{formatRp(ps.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent Logs toggle */}
                        {shift.cash_drawer_logs && shift.cash_drawer_logs.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Log Laci</h4>
                                <div className="max-h-60 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {shift.cash_drawer_logs.map(log => (
                                        <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white transition-colors group">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${log.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                        {log.type === 'in' ? 'Masuk' : 'Keluar'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className={`font-black text-sm ${log.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {log.type === 'in' ? '+' : '-'} {formatRp(log.amount)}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {log.reason || 'Tanpa Keterangan'}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    {log.user && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <UserIcon size={10} />
                                                            <span>Oleh: {log.user.name}</span>
                                                        </div>
                                                    )}
                                                    {log.expense?.category && (
                                                        <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                                                            <span>Kategori: {log.expense.category.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Print Only View */}
            <div className="hidden print:block p-8 space-y-6 text-black bg-white">
                <div className="text-center space-y-2 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-black uppercase">LAPORAN SUMMARY SHIFT</h1>
                    <p className="text-sm font-bold">OUTLET: {shift.outlet_id}</p>
                    <p className="text-ls font-bold">Petugas: {report.opened_by_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 py-4 border-b border-slate-300">
                    <div>
                        <p className="text-xs font-bold text-slate-500">WAKTU BUKA</p>
                        <p className="text-lg font-black">{new Date(shift.opened_at).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500">WAKTU TUTUP</p>
                        <p className="text-lg font-black">{shift.closed_at ? new Date(shift.closed_at).toLocaleString('id-ID') : '-'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm font-bold border-l-4 border-black pl-2">RINGKASAN PENJUALAN</h2>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                            <tr><td className="py-2">Gross Sales</td><td className="py-2 text-right font-bold">{formatRp(report.gross_sales)}</td></tr>
                            <tr><td className="py-2">Total Refund</td><td className="py-2 text-right font-bold text-red-600">({formatRp(report.refund_total)})</td></tr>
                            <tr className="bg-slate-50"><td className="py-2 font-bold">NET SALES</td><td className="py-2 text-right font-black">{formatRp(report.net_sales)}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div className="space-y-2">
                    <h2 className="text-sm font-bold border-l-4 border-black pl-2">BREAKDOWN PEMBAYARAN</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(report.payment_breakdown).map(([m, a]) => (
                            <div key={m} className="flex justify-between border-b pb-1 text-sm border-slate-100">
                                <span className="capitalize">{m}</span>
                                <span className="font-bold">{formatRp(a)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {report.product_sales && report.product_sales.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold border-l-4 border-black pl-2">DETAIL PRODUK TERJUAL</h2>
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-1">Produk</th>
                                    <th className="py-1 text-center">Qty</th>
                                    <th className="py-1 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.product_sales.map((ps, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="py-1">{ps.product_name}</td>
                                        <td className="py-1 text-center">{ps.quantity}</td>
                                        <td className="py-1 text-right font-bold">{formatRp(ps.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="space-y-2 pt-4 border-t-2 border-black">
                    <div className="flex justify-between text-sm"><span>EKSPEKTASI KAS LACI</span><span className="font-bold">{formatRp(report.expected_cash)}</span></div>
                    <div className="flex justify-between text-lg font-black bg-slate-100 p-2"><span>KAS AKTUAL</span><span>{formatRp(report.actual_cash)}</span></div>
                    <div className="flex justify-between text-sm font-bold italic pt-2"><span>SELISIH</span><span className={report.difference < 0 ? 'text-red-600' : ''}>{formatRp(report.difference)}</span></div>
                </div>

                <div className="pt-20 grid grid-cols-2 gap-20 text-center">
                    <div>
                        <div className="h-20 border-b border-slate-300"></div>
                        <p className="text-sm font-bold mt-2">KASIR / PETUGAS</p>
                    </div>
                    <div>
                        <div className="h-20 border-b border-slate-300"></div>
                        <p className="text-sm font-bold mt-2">OWNER / MANAGER</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShiftPage() {
    const [filters, setFilters] = useState({ start_date: '', end_date: '', cashier_id: '' });
    const { data: currentShift, isLoading } = useCurrentShift();
    const { data: historyData, isLoading: isLoadingHistory } = useShifts(filters);
    const { data: users } = useUsers();

    const openShift = useOpenShift();
    const closeShift = useCloseShift();
    const addCashLog = useAddCashLog();

    const [showOpenForm, setShowOpenForm] = useState(false);
    const [showCloseForm, setShowCloseForm] = useState(false);
    const [showCashLog, setShowCashLog] = useState(false);
    const [openingCash, setOpeningCash] = useState('0');
    const [closingCash, setClosingCash] = useState('0');
    const [cashLogForm, setCashLogForm] = useState({ type: 'in' as 'in' | 'out', amount: '0', reason: '' });

    const { registerOverlay } = useOverlayStore();

    // Register overlays for back button handling
    useEffect(() => {
        if (showOpenForm) {
            return registerOverlay(() => setShowOpenForm(false));
        }
    }, [showOpenForm, registerOverlay]);

    useEffect(() => {
        if (showCloseForm) {
            return registerOverlay(() => setShowCloseForm(false));
        }
    }, [showCloseForm, registerOverlay]);

    useEffect(() => {
        if (showCashLog) {
            return registerOverlay(() => setShowCashLog(false));
        }
    }, [showCashLog, registerOverlay]);

    const { user } = useAuthStore();
    const outletId = user?.outlet_id;
    const isOwner = user?.roles?.some(r => r.slug === 'owner' || r.slug === 'admin');
    const history = historyData?.data ?? [];

    const handleOpen = async () => {
        if (!outletId) return;
        try {
            await openShift.mutateAsync({ outlet_id: outletId, opening_cash: Number(openingCash) });
            toast.success('Shift berhasil dibuka');
            setShowOpenForm(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gagal membuka shift');
        }
    };

    const handleClose = async () => {
        if (!currentShift) return;
        try {
            await closeShift.mutateAsync({ id: currentShift.id, closing_cash: Number(closingCash) });
            toast.success('Shift berhasil ditutup');
            setShowCloseForm(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gagal menutup shift');
        }
    };

    const handleCashLog = async () => {
        if (!currentShift) return;
        try {
            await addCashLog.mutateAsync({ shiftId: currentShift.id, ...cashLogForm, amount: Number(cashLogForm.amount) });
            toast.success('Pergerakan kas berhasil dicatat');
            setShowCashLog(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gagal mencatat kas');
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shift & Cash</h1>
                    <p className="text-sm font-medium text-slate-500">Kelola operasional kas dan laci harian Anda.</p>
                </div>
                <div className="flex gap-3">
                    {currentShift ? (
                        <div className="flex gap-2">
                            <button onClick={() => { setShowCashLog(true); setCashLogForm({ type: 'in', amount: '0', reason: '' }); }} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-all active:scale-95">
                                <DollarSign size={18} /> Catat Kas
                            </button>
                            <button onClick={() => setShowCloseForm(true)} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-red-700 shadow-sm shadow-red-100 transition-all active:scale-95">
                                <LogOut size={18} /> Tutup Shift
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowOpenForm(true)}
                            disabled={!outletId}
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <LogIn size={18} /> Buka Shift Baru
                        </button>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
                    <p className="text-slate-400 font-medium">Sinkronisasi data shift...</p>
                </div>
            ) : currentShift ? (
                <div className="space-y-4 print:p-0">
                    <div className="flex items-center gap-2 bg-green-50/50 border border-green-200/50 rounded-2xl px-5 py-3 print:hidden">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <p className="text-green-800 font-bold text-xs uppercase tracking-widest">Shift Aktif Berjalan</p>
                    </div>
                    <ShiftSummaryCard shift={currentShift} />
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-6 print:hidden">
                    <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto ring-8 ring-indigo-50/50">
                        <Clock size={48} className="text-indigo-500" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-2">
                        <p className="text-xl font-black text-slate-900">Operasional Terhenti</p>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Belum ada shift yang dibuka untuk outlet ini. Kasir tidak dapat memproses transaksi.</p>
                    </div>
                    {!outletId && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 max-w-sm mx-auto text-left">
                            <AlertTriangle size={24} className="text-amber-500 shrink-0" />
                            <p className="text-amber-900 text-xs font-semibold leading-normal">
                                Akun Anda belum terhubung ke outlet manapun. Transaksi dibatasi.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* History Section */}
            <div className="space-y-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <ArrowDownRight className="text-indigo-500" size={24} />
                        Riwayat Operasional
                    </h2>

                    {/* Filters */}
                    {isOwner && (
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                                <input
                                    type="date"
                                    onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
                                    className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium text-slate-600"
                                />
                            </div>
                            <div className="relative group">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                                <select
                                    onChange={(e) => setFilters(f => ({ ...f, cashier_id: e.target.value }))}
                                    className="pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium text-slate-600 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
                                >
                                    <option value="">Semua Kasir</option>
                                    {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                            </div>
                        </div>
                    )}
                </div>

                {isLoadingHistory ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse" />)}
                    </div>
                ) : history.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {history.filter(s => s.status === 'closed' || s.id !== currentShift?.id).map((shift: Shift) => (
                            <ShiftSummaryCard key={shift.id} shift={shift} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold text-sm">Tidak ada riwayat ditemukan.</p>
                    </div>
                )}
            </div>

            {/* Modals remained same but updated styles slightly */}
            {showOpenForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 safe-padding">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar no-scrollbar">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h2 className="text-lg font-black text-slate-900 leading-tight">Mulai Shift</h2>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Persiapan Laci Kas</p>
                            </div>
                            <button onClick={() => setShowOpenForm(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Modal Kas Awal (Rp)</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={openingCash}
                                    onChange={e => setOpeningCash(e.target.value)}
                                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-lg font-black bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <button onClick={handleOpen} disabled={openShift.isPending} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none">
                            {openShift.isPending ? 'Menginisialisasi...' : 'BUKA SHIFT SEKARANG'}
                        </button>
                    </div>
                </div>
            )}

            {/* Close Shift Modal */}
            {showCloseForm && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 safe-padding">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar no-scrollbar">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h2 className="text-lg font-black text-slate-900 leading-tight">Akhiri Shift</h2>
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Penghitungan Kas Terakhir</p>
                            </div>
                            <button onClick={() => setShowCloseForm(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-[10px]">
                                    <AlertCircle size={12} />
                                    <span>Peringatan</span>
                                </div>
                                <p className="text-[9px] text-amber-700 mt-1 font-medium leading-relaxed">
                                    Pastikan Anda sudah menghitung uang fisik dalam laci secara manual sebelum menutup shift ini.
                                </p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Uang Fisik Terhitung (Rp)</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={closingCash}
                                    onChange={e => setClosingCash(e.target.value)}
                                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-lg font-black bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <button onClick={handleClose} disabled={closeShift.isPending} className="w-full bg-red-600 text-white py-3.5 rounded-xl text-xs font-black hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-[0.98] disabled:opacity-60">
                            {closeShift.isPending ? 'Memproses Penutupan...' : 'KONFIRMASI TUTUP SHIFT'}
                        </button>
                    </div>
                </div>
            )}

            {/* Cash Log Modal */}
            {showCashLog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 safe-padding">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar no-scrollbar">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h2 className="text-lg font-black text-slate-900 leading-tight">Pergerakan Kas</h2>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Input Penambahan / Pengeluaran</p>
                            </div>
                            <button onClick={() => setShowCashLog(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-all"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setCashLogForm(f => ({ ...f, type: 'in' }))}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${cashLogForm.type === 'in' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    KAS MASUK (+)
                                </button>
                                <button
                                    onClick={() => setCashLogForm(f => ({ ...f, type: 'out' }))}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${cashLogForm.type === 'out' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    KAS KELUAR (-)
                                </button>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={cashLogForm.amount}
                                    onChange={e => setCashLogForm(f => ({ ...f, amount: e.target.value }))}
                                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-lg font-black bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Keterangan / Alasan</label>
                                <input
                                    value={cashLogForm.reason}
                                    onChange={e => setCashLogForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                    placeholder="Contoh: Bayar Gas / Parkir"
                                />
                            </div>
                        </div>
                        <button onClick={handleCashLog} disabled={addCashLog.isPending} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-60">
                            {addCashLog.isPending ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
