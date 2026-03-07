import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Store, Download, FileText } from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { formatRp } from '../../lib/format';
import reportService from '../../services/reportService';
import { useExportTransactions } from '../../hooks/useReports';

export default function ExpenseReport() {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedOutletId, setSelectedOutletId] = useState<string | undefined>(undefined);

    const { user } = useAuthStore();
    const isOwnerOrAdmin = user?.roles?.some(r => ['owner', 'super_admin', 'admin'].includes(r.slug));

    const { data: outlets } = useOutlets();
    const { exportExpense } = useExportTransactions();

    const { data: report, isLoading } = useQuery({
        queryKey: ['reports', 'expense', dateRange, selectedOutletId],
        queryFn: () => reportService.getExpenseReport({
            start_date: dateRange.start,
            end_date: dateRange.end,
            outlet_id: selectedOutletId
        })
    });

    const handleExport = (format: 'pdf' | 'csv') => {
        exportExpense({
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
                    <h1 className="text-2xl font-bold text-slate-900">Laporan Pengeluaran</h1>
                    <p className="text-sm text-slate-500 mt-1">Total pengeluaran berdasarkan kategori operasional dan bahan baku</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <Calendar size={16} className="text-slate-400" />
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} className="text-sm outline-none bg-transparent" />
                        <span className="text-slate-300">-</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} className="text-sm outline-none bg-transparent" />
                    </div>

                    {isOwnerOrAdmin && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm min-w-[200px]">
                            <Store size={18} className="text-slate-400" />
                            <select
                                value={selectedOutletId || ''}
                                onChange={(e) => setSelectedOutletId(e.target.value || undefined)}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none w-full"
                            >
                                <option value="">Semua Outlet</option>
                                {outlets?.map((outlet) => (
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
                                <th className="text-left px-6 py-4">Kategori</th>
                                <th className="text-left px-6 py-4">Sumber / Shift</th>
                                <th className="text-left px-6 py-4">Keterangan</th>
                                <th className="text-right px-6 py-4">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Memuat data...</td></tr>
                            ) : report?.data.map((item, index) => (
                                <tr key={`${item.category_name}-${item.source}-${item.date}-${index}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 text-xs">
                                            {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700 uppercase tracking-tight text-[10px]">{item.category_name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${item.source === 'Shift' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.source}
                                            </span>
                                            {item.shift_opened_at && (
                                                <div className="text-[9px] text-slate-400 italic">
                                                    Buka: {new Date(item.shift_opened_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {new Date(item.shift_opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 italic text-xs max-w-[150px] truncate" title={item.notes}>
                                        {item.notes}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-rose-600">{formatRp(item.total_amount)}</td>
                                </tr>
                            ))}
                            {!isLoading && (!report || report.data.length === 0) && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Tidak ada data pengeluaran untuk periode ini.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50/50 font-bold border-t-2 border-slate-100">
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-slate-900 uppercase">Total Pengeluaran</td>
                                <td className="px-6 py-4 text-right text-rose-700 text-lg">
                                    {formatRp(report?.total_overall ?? 0)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
