import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Store, TrendingUp, TrendingDown, DollarSign, ReceiptText, FileText } from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { formatRp } from '../../lib/format';
import reportService from '../../services/reportService';
import { useExportTransactions } from '../../hooks/useReports';

export default function ProfitLossReport() {
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
    const { exportProfitLoss } = useExportTransactions();

    const { data: report, isLoading } = useQuery({
        queryKey: ['reports', 'profit-loss', dateRange, selectedOutletId],
        queryFn: () => reportService.getProfitLossSummary({
            start_date: dateRange.start,
            end_date: dateRange.end,
            outlet_id: selectedOutletId
        })
    });

    const handleExport = () => {
        exportProfitLoss({
            start_date: dateRange.start,
            end_date: dateRange.end,
            outlet_id: selectedOutletId
        });
    };

    const isProfit = report ? report.net_profit >= 0 : true;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Laporan Laba Rugi</h1>
                    <p className="text-sm text-slate-500 mt-1">Perhitungan keuntungan atau kerugian usaha Anda</p>
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

                    {!isLoading && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                        >
                            <FileText size={18} /> Export PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Card */}
            <div className={`p-8 rounded-3xl border ${isProfit ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} shadow-sm transition-all text-center`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${isProfit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isProfit ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                </div>
                <h3 className={`text-lg font-bold ${isProfit ? 'text-emerald-800' : 'text-rose-800'} uppercase tracking-widest`}>
                    {isProfit ? 'Keuntungan Bersih (Laba)' : 'Kerugian Bersih (Rugi)'}
                </h3>
                <p className={`text-4xl font-black mt-2 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatRp(Math.abs(report?.net_profit ?? 0))}
                </p>
                <p className="text-sm text-slate-500 mt-2 font-medium">Periode {dateRange.start} s/d {dateRange.end}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-2xl mx-auto">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-900">Rincian Perhitungan</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    <div className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><DollarSign size={20} /></div>
                            <span className="font-bold text-slate-700">Total Pendapatan</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatRp(report?.total_revenue ?? 0)}</span>
                    </div>
                    <div className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><ReceiptText size={20} /></div>
                            <span className="font-bold text-slate-700">Total Pengeluaran</span>
                        </div>
                        <span className="font-bold text-rose-600">({formatRp(report?.total_expenses ?? 0)})</span>
                    </div>
                </div>
                <div className={`p-6 bg-slate-50 border-t flex items-center justify-between`}>
                    <span className="font-black text-slate-900 uppercase tracking-widest text-sm">Laba / Rugi Bersih</span>
                    <span className={`text-xl font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatRp(report?.net_profit ?? 0)}
                    </span>
                </div>
            </div>
        </div>
    );
}
