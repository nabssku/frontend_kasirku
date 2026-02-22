import { useSuperAdminStats } from '../../hooks/useSuperAdmin';
import { Building2, Users, CreditCard, DollarSign, Clock, Activity, Receipt, AlertCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
    const { data: stats, isLoading } = useSuperAdminStats();

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
        { label: 'Est. Monthly Revenue', value: `Rp ${(stats?.total_revenue ?? 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Total Paid Revenue', value: `Rp ${(stats?.total_paid_revenue ?? 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Total Orders', value: stats?.total_orders ?? 0, icon: Receipt, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Pending Orders', value: stats?.pending_orders ?? 0, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
                <p className="text-slate-400 mt-1">Monitor your entire KasirKu platform from here</p>
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
                                <th className="pb-3 pr-4">Email</th>
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
                            {!stats?.recent_tenants?.length && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-500">No tenants yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
