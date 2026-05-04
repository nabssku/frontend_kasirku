import {
    TrendingUp, ShoppingCart, DollarSign, Store,
    ArrowUpRight, ArrowDownRight, Clock, User,
    CreditCard, LayoutDashboard, History, Zap
} from 'lucide-react';
import { formatRp } from '../../lib/format';
import { useDailyReport, useDashboardSummary } from '../../hooks/useReports';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    isLoading,
    trend,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    isLoading: boolean;
    trend?: { value: string; positive: boolean };
}) {
    // Mapping bg color to text color for the icon
    const textColorMap: Record<string, string> = {
        'bg-indigo-500': 'text-indigo-600',
        'bg-emerald-500': 'text-emerald-600',
        'bg-rose-500': 'text-rose-600',
        'bg-amber-500': 'text-amber-600',
        'bg-slate-800': 'text-slate-800',
        'bg-slate-500': 'text-slate-600',
    };
    
    const bgColorMap: Record<string, string> = {
        'bg-indigo-500': 'bg-indigo-50',
        'bg-emerald-500': 'bg-emerald-50',
        'bg-rose-500': 'bg-rose-50',
        'bg-amber-500': 'bg-amber-50',
        'bg-slate-800': 'bg-slate-100',
        'bg-slate-500': 'bg-slate-50',
    };

    const iconColorClass = textColorMap[color] || 'text-slate-600';
    const iconBgClass = bgColorMap[color] || 'bg-slate-50';

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-lg ${iconBgClass} ${iconColorClass}`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium truncate">{label}</p>
                    {trend && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {trend.value}
                        </span>
                    )}
                </div>
                {isLoading ? (
                    <div className="h-8 bg-slate-100 animate-pulse rounded mt-2 w-2/3" />
                ) : (
                    <p className="text-2xl font-bold text-slate-800 mt-1 truncate">{value}</p>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const roles = user?.roles?.map(r => r.slug) || [];
    const isSuperAdmin = roles.includes('owner') || roles.includes('super_admin');
    const isAdmin = roles.includes('admin');

    const [selectedOutletId, setSelectedOutletId] = useState<string | undefined>(
        !isSuperAdmin && user?.outlet_id ? user.outlet_id : undefined
    );
    const [paymentPeriod, setPaymentPeriod] = useState<'today' | 'week' | 'month'>('week');

    const paymentRange = useMemo(() => {
        const now = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        
        if (paymentPeriod === 'today') {
            return { start: formatDate(now), end: formatDate(now) };
        }
        if (paymentPeriod === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: formatDate(start), end: formatDate(now) };
        }
        // week (default)
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        return { start: formatDate(start), end: formatDate(now) };
    }, [paymentPeriod]);

    const { data: outlets } = useOutlets();
    
    const filteredOutlets = useMemo(() => {
        if (isSuperAdmin) return outlets;
        if (isAdmin && user?.outlet_id) {
            return outlets?.filter(o => o.id === user.outlet_id);
        }
        return outlets;
    }, [outlets, isSuperAdmin, isAdmin, user]);

    const { data: daily, isLoading: loadingDaily } = useDailyReport(undefined, selectedOutletId);
    const { data: summary, isLoading: loadingSummary } = useDashboardSummary(
        selectedOutletId, 
        undefined, 
        paymentRange.start, 
        paymentRange.end
    );

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const peakHoursData = useMemo(() => {
        if (!summary?.peak_hours) return [];
        return summary.peak_hours;
    }, [summary]);

    const paymentData = useMemo(() => {
        if (!summary?.payment_methods) return [];
        return summary.payment_methods.map(p => ({
            name: p.payment_method || 'Unknown',
            value: Number(p.total_revenue)
        }));
    }, [summary]);

    const topProductsData = useMemo(() => {
        if (!summary?.top_products) return [];
        return summary.top_products.map(p => ({
            name: p.product_name,
            qty: Number(p.total_quantity)
        }));
    }, [summary]);

    const leastProductsData = useMemo(() => {
        if (!summary?.least_products) return [];
        return summary.least_products.map(p => ({
            name: p.product_name,
            qty: Number(p.total_quantity)
        }));
    }, [summary]);

    return (
        <div className="space-y-6 pb-8">
            {/* Header & Outlet Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutDashboard className="text-slate-500" size={24} />
                        Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Ringkasan harian dan performa penjualan outlet.</p>
                </div>

                {(isSuperAdmin || isAdmin) && (
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 min-w-[200px]">
                        <Store size={16} className="text-slate-400" />
                        <select
                            value={selectedOutletId || ''}
                            onChange={(e) => setSelectedOutletId(e.target.value || undefined)}
                            disabled={!isSuperAdmin && (filteredOutlets?.length || 0) <= 1}
                            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none w-full cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isSuperAdmin && <option value="">Semua Outlet</option>}
                            {filteredOutlets?.map((outlet) => (
                                <option key={outlet.id} value={outlet.id}>
                                    {outlet.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={ShoppingCart}
                    label="Penjualan Kotor"
                    value={formatRp(daily?.gross_sales || 0)}
                    color="bg-slate-800"
                    isLoading={loadingDaily}
                />
                <StatCard
                    icon={ArrowDownRight}
                    label="Total Refund"
                    value={formatRp(daily?.refund_amount || 0)}
                    color="bg-rose-500"
                    isLoading={loadingDaily}
                />
                <StatCard
                    icon={DollarSign}
                    label="Penjualan Bersih"
                    value={formatRp(daily?.total_revenue || 0)}
                    color="bg-emerald-500"
                    isLoading={loadingDaily}
                />
                <StatCard
                    icon={Zap}
                    label="Total Transaksi"
                    value={String(daily?.total_sales || 0)}
                    color="bg-indigo-500"
                    isLoading={loadingDaily}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Analytics Section (Left 2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Peak Hours Chart */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock size={18} className="text-amber-500" />
                            <h2 className="font-semibold text-slate-700">Jam Transaksi Paling Ramai</h2>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorHour)" name="Total Transaksi" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Best Selling Products */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-indigo-500" />
                                <h2 className="font-semibold text-slate-700">Produk Terlaris</h2>
                            </div>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 11, fill: '#475569'}} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                        <Bar dataKey="qty" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} name="Terjual" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Least Selling Products */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <ArrowDownRight size={18} className="text-rose-500" />
                                <h2 className="font-semibold text-slate-700">Kurang Diminati</h2>
                            </div>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={leastProductsData} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 11, fill: '#475569'}} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                        <Bar dataKey="qty" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16} name="Terjual" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Analytics Section (Right 1/3) */}
                <div className="space-y-6">
                    {/* Payment Methods Pie Chart */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <CreditCard size={20} />
                                </div>
                                <h2 className="font-semibold text-slate-700">
                                    Metode Pembayaran ({paymentPeriod === 'today' ? 'Hari Ini' : paymentPeriod === 'week' ? '7 Hari' : 'Bulan Ini'})
                                </h2>
                            </div>
                            <select 
                                value={paymentPeriod} 
                                onChange={(e) => setPaymentPeriod(e.target.value as any)}
                                className="text-[11px] font-bold border-none bg-slate-50 rounded-lg focus:ring-0 cursor-pointer text-slate-500 uppercase tracking-wider"
                            >
                                <option value="today">Hari Ini</option>
                                <option value="week">Minggu Ini</option>
                                <option value="month">Bulan Ini</option>
                            </select>
                        </div>
                        <div className="h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {paymentData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => formatRp(Number(value) || 0)}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {paymentData.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <p className="text-xs font-medium">Belum ada data</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 space-y-2">
                            {paymentData.map((p, idx) => (
                                <div key={p.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="text-slate-600 capitalize">{p.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">{formatRp(p.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <History size={18} className="text-slate-500" />
                            <h2 className="font-semibold text-slate-700">Aktivitas Hari Ini</h2>
                        </div>
                        <div className="space-y-3">
                            {loadingSummary ? (
                                [1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-lg" />)
                            ) : !summary?.recent_activities || summary.recent_activities.length === 0 ? (
                                <div className="text-center py-6 text-slate-400">
                                    <p className="text-sm">Belum ada transaksi</p>
                                </div>
                            ) : (
                                summary.recent_activities.map((act) => {
                                    const isCancelled = act.status === 'cancelled' || act.status === 'refunded';
                                    return (
                                        <div key={act.id} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${isCancelled ? 'bg-rose-50/50 border-rose-100' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {isCancelled ? <ArrowDownRight size={14} /> : <ShoppingCart size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-slate-800 truncate">#{act.invoice_number}</p>
                                                        {isCancelled && (
                                                            <span className="text-[10px] font-bold text-rose-600 uppercase">Refund</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-400">{act.time}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <User size={12} className="text-slate-400" />
                                                        <p className="text-xs text-slate-500 truncate">{act.cashier_name}</p>
                                                    </div>
                                                    <p className={`text-sm font-semibold ${isCancelled ? 'text-rose-600' : 'text-indigo-600'}`}>
                                                        {isCancelled ? '-' : ''}{formatRp(act.grand_total)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/transactions')}
                            className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Lihat Semua Transaksi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
