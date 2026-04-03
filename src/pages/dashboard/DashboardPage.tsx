import { TrendingUp, ShoppingCart, DollarSign, BarChart2, Package, Store, Table2 } from 'lucide-react';
import { formatRp } from '../../lib/format';
import { useDailyReport, useTopProducts } from '../../hooks/useReports';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { useTodayTransactions } from '../../hooks/useTransactions';
import { useState, useMemo } from 'react';

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

function TodayReceiptTable({ outletId }: { outletId?: string }) {
    const { data: transactions = [], isLoading } = useTodayTransactions(outletId);

    const aggregates = useMemo(() => {
        const groups: Record<string, { table: string; tunai: number; qris: number; edc: number; total: number }> = {};

        transactions.forEach((tx) => {
            const tableName = tx.table?.name || 'Takeaway/Lainnya';
            if (!groups[tableName]) {
                groups[tableName] = { table: tableName, tunai: 0, qris: 0, edc: 0, total: 0 };
            }

            const method = tx.payment_method?.toLowerCase() || 'cash';
            const amount = tx.grand_total;

            if (method === 'cash') {
                groups[tableName].tunai += amount;
            } else if (
                method.includes('qris') || 
                method.includes('wallet') || 
                ['gopay', 'ovo', 'dana', 'linkaja', 'shopeepay'].some(m => method.includes(m))
            ) {
                groups[tableName].qris += amount;
            } else if (method === 'edc' || method === 'transfer' || method.includes('bank')) {
                groups[tableName].edc += amount;
            } else {
                // Default fallback for unknown methods
                groups[tableName].tunai += amount;
            }

            groups[tableName].total += amount;
        });

        const list = Object.values(groups).sort((a, b) => {
            if (a.table === 'Takeaway/Lainnya') return 1;
            if (b.table === 'Takeaway/Lainnya') return -1;
            return a.table.localeCompare(b.table, undefined, { numeric: true });
        });

        const totals = list.reduce(
            (acc, curr) => ({
                tunai: acc.tunai + curr.tunai,
                qris: acc.qris + curr.qris,
                edc: acc.edc + curr.edc,
                total: acc.total + curr.total,
            }),
            { tunai: 0, qris: 0, edc: 0, total: 0 }
        );

        return { list, totals };
    }, [transactions]);

    const todayStr = useMemo(() => {
        const d = new Date();
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
                <div className="h-16 bg-slate-50 border-b border-slate-100" />
                <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 rounded" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-1">
                    <Table2 className="text-indigo-600" size={20} />
                    <h2 className="font-bold text-slate-800 uppercase tracking-tight">Penerimaan Hari Ini</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium whitespace-pre">
                    Tanggal: <span className="text-indigo-600 font-bold">{todayStr}</span>
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="px-6 py-4">No. Meja</th>
                            <th className="px-6 py-4 text-right">Tunai</th>
                            <th className="px-6 py-4 text-right">Qris</th>
                            <th className="px-6 py-4 text-right">EDC / Transfer</th>
                            <th className="px-6 py-4 text-right bg-indigo-50/30 text-indigo-700">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {aggregates.list.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm italic">
                                    Belum ada data penerimaan hari ini
                                </td>
                            </tr>
                        ) : (
                            aggregates.list.map((row) => (
                                <tr key={row.table} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.table}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">{row.tunai > 0 ? formatRp(row.tunai) : '-'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">{row.qris > 0 ? formatRp(row.qris) : '-'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">{row.edc > 0 ? formatRp(row.edc) : '-'}</td>
                                    <td className="px-6 py-4 text-sm font-black text-indigo-600 text-right bg-indigo-50/10">{formatRp(row.total)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 bg-slate-900 text-white font-black">
                        <tr>
                            <td className="px-6 py-4 text-sm uppercase tracking-wider">Jumlah</td>
                            <td className="px-6 py-4 text-sm text-right">{formatRp(aggregates.totals.tunai)}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatRp(aggregates.totals.qris)}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatRp(aggregates.totals.edc)}</td>
                            <td className="px-6 py-4 text-sm text-right bg-indigo-600">{formatRp(aggregates.totals.total)}</td>
                        </tr>
                    </tfoot>
                </table>
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
                    value={String(daily?.total_sales || 0)}
                    color="bg-indigo-500"
                    isLoading={loadingDaily}
                />
                <StatCard
                    icon={DollarSign}
                    label="Pendapatan Hari Ini"
                    value={fmtRp(daily?.total_revenue)}
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Daily Receipt Table (Left 2/3) */}
                <div className="xl:col-span-2">
                    <TodayReceiptTable outletId={selectedOutletId} />
                </div>

                {/* Top Products (Right 1/3) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-fit">
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
        </div>
    );
}
