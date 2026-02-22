import { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Package, Download, BarChart2 } from 'lucide-react';
import { useTopProducts, useExportTransactions } from '../../hooks/useReports';
import api from '../../lib/axios';
import { useQuery } from '@tanstack/react-query';
import type { ProfitReport } from '../../types';

function formatRp(n: number) {
    return 'Rp ' + (n ?? 0).toLocaleString('id-ID');
}

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const { data: topProducts } = useTopProducts();
    const { exportCsv } = useExportTransactions();

    // Advanced Profit Report
    const { data: profit, isLoading: loadingProfit } = useQuery({
        queryKey: ['reports', 'profit', dateRange],
        queryFn: async () => {
            const { data } = await api.get('/reports/profit', { params: { start_date: dateRange.start, end_date: dateRange.end } });
            return data.data as ProfitReport;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Laporan & Analitik</h1>
                    <p className="text-sm text-slate-500 mt-1">Pantau performa bisnis Anda secara real-time</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} className="text-sm outline-none" />
                        <span className="text-slate-300">-</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} className="text-sm outline-none" />
                    </div>
                    <button onClick={() => exportCsv(dateRange.start, dateRange.end)} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4"><DollarSign size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatRp(profit?.total_revenue ?? 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-4"><BarChart2 size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total HPP (COGS)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatRp(profit?.total_cogs ?? 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4"><TrendingUp size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Laba Kotor</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatRp(profit?.gross_profit ?? 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4"><Package size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Transaksi</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{profit?.transaction_count ?? 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profit Breakdown Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Rincian Laba per Produk</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-6 py-3">Produk</th>
                                    <th className="text-right px-6 py-3">Terjual</th>
                                    <th className="text-right px-6 py-3">Pendapatan</th>
                                    <th className="text-right px-6 py-3">HPP</th>
                                    <th className="text-right px-6 py-3">Laba</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loadingProfit ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Memuat data...</td></tr>
                                ) : profit?.product_breakdown.map(p => (
                                    <tr key={p.product_name} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900 uppercase text-xs tracking-tight">{p.product_name}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-600">{p.qty_sold}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatRp(p.revenue)}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatRp(p.cogs)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatRp(p.profit)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products Summary */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-bold text-slate-900">Produk Terpopuler</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {topProducts?.slice(0, 8).map((p, i) => (
                            <div key={p.product_id} className="flex items-center gap-4">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight">{p.product_name}</p>
                                    <p className="text-xs text-slate-400">{p.total_quantity} unit terjual</p>
                                </div>
                                <p className="text-sm font-bold text-indigo-600">{formatRp(p.total_revenue)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
