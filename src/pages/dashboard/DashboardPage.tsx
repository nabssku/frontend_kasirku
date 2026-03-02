import { TrendingUp, ShoppingCart, DollarSign, BarChart2, Package, Store } from 'lucide-react';
import { formatRp } from '../../lib/format';
import { useDailyReport, useTopProducts } from '../../hooks/useReports';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { useState } from 'react';

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    isLoading,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    isLoading: boolean;
}) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-sm font-medium truncate">{label}</p>
                {isLoading ? (
                    <div className="h-7 bg-slate-200 animate-pulse rounded mt-1 w-3/4" />
                ) : (
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const isOwner = user?.roles?.some(r => r.slug === 'owner' || r.slug === 'super_admin');
    const [selectedOutletId, setSelectedOutletId] = useState<string | undefined>(undefined);

    const { data: outlets } = useOutlets();
    const { data: daily, isLoading: loadingDaily } = useDailyReport(undefined, selectedOutletId);
    const { data: topProducts, isLoading: loadingTop } = useTopProducts(selectedOutletId);

    const fmtRp = (n?: number) =>
        n !== undefined
            ? formatRp(n)
            : formatRp(0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Ringkasan penjualan hari ini</p>
                </div>

                {isOwner && (
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm min-w-[200px]">
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
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    icon={ShoppingCart}
                    label="Total Penjualan Hari Ini"
                    value={fmtRp(daily?.total_sales)}
                    color="bg-indigo-500"
                    isLoading={loadingDaily}
                />
                <StatCard
                    icon={DollarSign}
                    label="Pendapatan Hari Ini"
                    value={fmtRp(daily?.total_sales)}
                    color="bg-emerald-500"
                    isLoading={loadingDaily}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Rata-rata Transaksi"
                    value={fmtRp(daily?.average_transaction)}
                    color="bg-violet-500"
                    isLoading={loadingDaily}
                />
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                    <BarChart2 className="text-indigo-600" size={20} />
                    <h2 className="font-semibold text-slate-800">Top 5 Produk Terlaris</h2>
                </div>
                <div className="p-6">
                    {loadingTop ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : !topProducts || topProducts.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Package size={40} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Belum ada data penjualan</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.slice(0, 5).map((p, idx) => (
                                <div key={p.product_id} className="flex items-center justify-between gap-4 py-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800 truncate">
                                            {p.product_name}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {fmtRp(p.total_revenue)}
                                        </p>
                                        <p className="text-xs text-slate-400">{p.total_quantity} terjual</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
