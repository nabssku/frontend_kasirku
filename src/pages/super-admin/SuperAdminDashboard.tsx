import { useSuperAdminStats, useSuperAdminPaymentStats } from '../../hooks/useSuperAdmin';
import { Building2, Users, CreditCard, DollarSign, Clock, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { formatRp } from '../../lib/format';

export default function SuperAdminDashboard() {
    const [period, setPeriod] = useState('month');
    const { data: stats, isLoading } = useSuperAdminStats();
    const { data: paymentStats } = useSuperAdminPaymentStats(period);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Tenants', value: stats?.total_tenants ?? 0, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Tenants', value: stats?.active_tenants ?? 0, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'Active Subscriptions', value: stats?.active_subscriptions ?? 0, icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Trial Subscriptions', value: stats?.trial_subscriptions ?? 0, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'Est. Monthly Revenue', value: formatRp(stats?.total_revenue ?? 0), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
                    <p className="text-slate-400 mt-1">Monitor your entire JagoKasir platform from here</p>
                </div>

                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {['today', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* BayarGg Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <TrendingUp size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Bayar.gg Revenue</p>
                            <p className="text-xl font-bold text-white mt-0.5">
                                {formatRp(paymentStats?.total_revenue ?? 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <BarChart3 size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Successful Tx</p>
                            <p className="text-xl font-bold text-white mt-0.5">
                                {paymentStats?.total_transactions ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <BarChart3 size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Pending Tx</p>
                            <p className="text-xl font-bold text-white mt-0.5">
                                {paymentStats?.pending_transactions ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-red-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <BarChart3 size={20} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Failed Tx</p>
                            <p className="text-xl font-bold text-white mt-0.5">
                                {paymentStats?.failed_transactions ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon size={22} className={card.color} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">{card.label}</p>
                                <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Tenants */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Tenants</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                <th className="pb-3 pr-4">Name</th>
                                <th className="pb-3 pr-4">Domain</th>
                                <th className="pb-3 pr-4">Status</th>
                                <th className="pb-3">Registered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {stats?.recent_tenants?.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="py-3 pr-4 text-sm font-medium text-white">{tenant.name}</td>
                                    <td className="py-3 pr-4 text-sm text-slate-400">{tenant.domain || '-'}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                            tenant.status === 'suspended' ? 'bg-red-500/10 text-red-400' :
                                                'bg-slate-500/10 text-slate-400'
                                            }`}>
                                            {tenant.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-slate-400">
                                        {new Date(tenant.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
