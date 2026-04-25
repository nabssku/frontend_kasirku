import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Store, Download, FileText } from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { formatRp } from '../../lib/format';
import reportService from '../../services/reportService';
import { useExportTransactions } from '../../hooks/useReports';
import { useLongPress } from '../../hooks/useLongPress';
import { X, Receipt, User, Clock } from 'lucide-react';

export default function IncomeReport() {
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [dateRange, setDateRange] = useState({
        start: getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        end: getLocalDateString(new Date())
    });
    const { user } = useAuthStore();
    const isOwnerOrSuperAdmin = user?.roles?.some(r => ['owner', 'super_admin'].includes(r.slug));
    const isAdmin = user?.roles?.some(r => r.slug === 'admin');
    const showOutletDropdown = isOwnerOrSuperAdmin || isAdmin;
    const [selectedOutletId, setSelectedOutletId] = useState<string | undefined>(user?.outlet_id || undefined);

    const { data: outlets } = useOutlets();
    const filteredOutlets = outlets?.filter(o => isOwnerOrSuperAdmin ? true : o.id === user?.outlet_id) || [];

    useEffect(() => {
        if (!selectedOutletId && filteredOutlets.length > 0) {
            setSelectedOutletId(filteredOutlets[0].id);
        }
    }, [filteredOutlets, selectedOutletId]);
    const { exportIncome } = useExportTransactions();

    const { data: report, isLoading } = useQuery({
        queryKey: ['reports', 'income', dateRange, selectedOutletId],
        queryFn: () => reportService.getIncomeReport({
            start_date: dateRange.start,
            end_date: dateRange.end,
            outlet_id: selectedOutletId
        })
    });

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const { data: dayTransactions, isLoading: isLoadingDay } = useQuery({
        queryKey: ['reports', 'income', 'transactions', selectedDate, selectedOutletId],
        queryFn: () => reportService.getTransactionsByDate({
            date: selectedDate!,
            outlet_id: selectedOutletId
        }),
        enabled: !!selectedDate
    });

    const handleExport = (format: 'pdf' | 'csv') => {
        exportIncome({
            start_date: dateRange.start,
            end_date: dateRange.end,
            outlet_id: selectedOutletId,
            format
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Laporan Pendapatan</h1>
                    <p className="text-sm text-slate-500 mt-1">Total pendapatan harian berdasarkan transaksi selesai</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <Calendar size={16} className="text-slate-400" />
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} className="text-sm outline-none bg-transparent" />
                        <span className="text-slate-300">-</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} className="text-sm outline-none bg-transparent" />
                    </div>

                    {showOutletDropdown && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm min-w-[200px]">
                            <Store size={18} className="text-slate-400" />
                            <select
                                value={selectedOutletId || ''}
                                onChange={(e) => setSelectedOutletId(e.target.value || undefined)}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none w-full"
                            >
                                {filteredOutlets.map((outlet) => (
                                    <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                        >
                            <FileText size={18} /> PDF
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Download size={18} /> Excel (CSV)
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-6 py-4">Tanggal</th>
                                <th className="text-right px-6 py-4">Total Pendapatan</th>
                                <th className="text-left px-6 py-4">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Memuat data...</td></tr>
                            ) : report?.data.map((item) => (
                                <IncomeReportRow 
                                    key={item.date} 
                                    item={item} 
                                    onLongPress={() => setSelectedDate(item.date)} 
                                />
                            ))}
                            {!isLoading && (!report || report.data.length === 0) && (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Tidak ada data untuk periode ini.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50/50 font-bold border-t-2 border-slate-100">
                            <tr>
                                <td className="px-6 py-4 text-slate-900">TOTAL</td>
                                <td className="px-6 py-4 text-right text-indigo-700 text-lg uppercase">
                                    {formatRp(report?.total_overall ?? 0)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {selectedDate && (
                <TransactionDetailModal 
                    date={selectedDate} 
                    transactions={dayTransactions || []} 
                    isLoading={isLoadingDay} 
                    onClose={() => setSelectedDate(null)} 
                />
            )}
        </div>
    );
}

function IncomeReportRow({ item, onLongPress }: { item: any, onLongPress: () => void }) {
    const longPressProps = useLongPress(onLongPress, undefined, { delay: 600 });

    return (
        <tr 
            {...longPressProps}
            onContextMenu={(e) => e.preventDefault()}
            className="hover:bg-slate-50 transition-colors select-none cursor-pointer active:bg-slate-100"
        >
            <td className="px-6 py-4 font-medium text-slate-900">{item.date}</td>
            <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatRp(item.total_revenue)}</td>
            <td className="px-6 py-4 text-slate-500 italic text-xs">{item.description}</td>
        </tr>
    );
}

function TransactionDetailModal({ date, transactions, isLoading, onClose }: { date: string, transactions: any[], isLoading: boolean, onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Detail Transaksi</h3>
                        <p className="text-sm text-slate-500">{date}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-slate-400 font-medium">Memuat data transaksi...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Receipt size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Tidak ada transaksi ditemukan.</p>
                        </div>
                    ) : (
                        transactions.map((tx: any) => (
                            <div key={tx.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-indigo-100 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-slate-900">{tx.invoice_number}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                                <Clock size={12} /> {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                                <User size={12} /> {tx.user?.name || 'Staff'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="font-bold text-indigo-600">{formatRp(tx.grand_total)}</p>
                                </div>
                                <div className="space-y-1">
                                    {tx.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-xs text-slate-600">
                                            <span>{item.quantity}x {item.product_name}</span>
                                            <span>{formatRp(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                                {tx.customer && (
                                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                            {tx.customer.name.charAt(0)}
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700">{tx.customer.name}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
