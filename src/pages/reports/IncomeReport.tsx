import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Store, Download, FileText } from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { formatRp } from '../../lib/format';
import reportService from '../../services/reportService';
import { useExportTransactions } from '../../hooks/useReports';

export default function IncomeReport() {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
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
                                <tr key={item.date} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.date}</td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatRp(item.total_revenue)}</td>
                                    <td className="px-6 py-4 text-slate-500 italic text-xs">{item.description}</td>
                                </tr>
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
        </div>
    );
}
