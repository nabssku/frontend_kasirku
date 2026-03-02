import { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Download, Store } from 'lucide-react';
import { useTopProducts, useExportTransactions } from '../../hooks/useReports';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import api from '../../lib/axios';
import { useQuery } from '@tanstack/react-query';
import type { ProfitReport } from '../../types';
import { formatRp } from '../../lib/format';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const setQuickFilter = (type: 'today' | 'month' | 'year') => {
        const now = new Date();
        let start = new Date();
        const end = new Date().toISOString().split('T')[0];

        if (type === 'today') {
            start = now;
        } else if (type === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (type === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end
        });
    };

    const { user } = useAuthStore();
    const isOwnerOrAdmin = user?.roles?.some(r => r.slug === 'owner' || r.slug === 'super_admin' || r.slug === 'admin');
    const [selectedOutletId, setSelectedOutletId] = useState<string | undefined>(undefined);

    const { data: outlets } = useOutlets();
    const { data: topProducts } = useTopProducts(selectedOutletId);
    const { exportCsv } = useExportTransactions();

    // Advanced Profit Report
    const { data: profit, isLoading: loadingProfit } = useQuery({
        queryKey: ['reports', 'profit', dateRange, selectedOutletId],
        queryFn: async () => {
            const { data } = await api.get('/reports/profit', {
                params: {
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                    outlet_id: selectedOutletId
                }
            });
            return data.data as ProfitReport;
        }
    });

    // Helper: Find most profitable menu
    const mostProfitableProduct = profit?.product_breakdown?.length
        ? [...profit.product_breakdown].sort((a, b) => b.profit - a.profit)[0]
        : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Laporan & Analitik</h1>
                    <p className="text-sm text-slate-500 mt-1">Pantau performa bisnis Anda secara real-time</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setQuickFilter('today')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:bg-white/50 active:bg-white"
                        >Hari Ini</button>
                        <button
                            onClick={() => setQuickFilter('month')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:bg-white/50 active:bg-white"
                        >Bulan Ini</button>
                        <button
                            onClick={() => setQuickFilter('year')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:bg-white/50 active:bg-white"
                        >Tahun Ini</button>
                    </div>
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
                                    <option key={outlet.id} value={outlet.id}>
                                        {outlet.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button onClick={() => exportCsv(dateRange.start, dateRange.end, selectedOutletId)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4"><DollarSign size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatRp(profit?.total_revenue ?? 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4"><TrendingUp size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Laba Kotor</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatRp(profit?.gross_profit ?? 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4"><TrendingUp size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Margin Laba</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                        {profit?.total_revenue
                            ? ((profit.gross_profit / profit.total_revenue) * 100).toFixed(1)
                            : '0'}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4"><TrendingUp size={20} /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Menu Paling Menguntungkan</p>
                    <p className="text-lg font-bold text-slate-900 mt-1 truncate uppercase" title={mostProfitableProduct?.product_name}>
                        {mostProfitableProduct?.product_name ?? '-'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{mostProfitableProduct ? formatRp(mostProfitableProduct.profit) : 'Tidak ada data'}</p>
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
                                    <th className="text-right px-6 py-3">Laba</th>
                                    <th className="text-right px-6 py-3">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loadingProfit ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Memuat data...</td></tr>
                                ) : profit?.product_breakdown.map(p => {
                                    const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                                    return (
                                        <tr key={p.product_name} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 uppercase text-xs tracking-tight">{p.product_name}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-600">{p.qty_sold}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{formatRp(p.revenue)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatRp(p.profit)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${margin >= 50 ? 'bg-emerald-50 text-emerald-600' :
                                                        margin >= 25 ? 'bg-indigo-50 text-indigo-600' :
                                                            'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loadingProfit && profit?.product_breakdown.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Tidak ada data transaksi pada periode ini.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products Summary */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-bold text-slate-900">Produk Terpopuler (Qty)</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {topProducts?.slice(0, 8).map((p, i) => (
                            <div key={p.product_id} className="flex items-center gap-4 group">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight">{p.product_name}</p>
                                    <p className="text-xs text-slate-400">{p.total_quantity} unit terjual</p>
                                </div>
                                <p className="text-sm font-bold text-indigo-600">{formatRp(p.total_revenue)}</p>
                            </div>
                        ))}
                        {topProducts?.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">Tidak ada data</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
