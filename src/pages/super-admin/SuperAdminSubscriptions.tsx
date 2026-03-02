import { useState } from 'react';
import { useSuperAdminSubscriptions, useUpdateSubscription, useSuperAdminPlans } from '../../hooks/useSuperAdmin';
import { formatRp } from '../../lib/format';
import {
    Edit2, X, Check, Search, Calendar, ChevronRight, Power, PowerOff, AlertTriangle
} from 'lucide-react';

export default function SuperAdminSubscriptions() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ status?: string; plan_id?: number; ends_at?: string; trial_ends_at?: string }>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'activate' | 'deactivate'; tenantName: string } | null>(null);

    const { data, isLoading } = useSuperAdminSubscriptions({
        search: search || undefined,
        status: statusFilter || undefined,
        page
    });
    const { data: plans } = useSuperAdminPlans();
    const updateSubscription = useUpdateSubscription();

    const subscriptions = data?.data ?? [];
    const meta = data?.meta;

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleUpdate = (id: string) => {
        setMessage(null);
        updateSubscription.mutate({ id, ...editForm } as any, {
            onSuccess: () => {
                setEditingId(null);
                showMessage('success', 'Subscription updated successfully');
            },
            onError: (err: any) => {
                showMessage('error', err?.response?.data?.message || 'Failed to update subscription');
            }
        });
    };

    const handleToggleStatus = () => {
        if (!confirmAction) return;
        const newStatus = confirmAction.action === 'deactivate' ? 'cancelled' : 'active';
        updateSubscription.mutate({ id: confirmAction.id, status: newStatus } as any, {
            onSuccess: () => {
                setConfirmAction(null);
                showMessage('success', `Subscription ${confirmAction.action === 'deactivate' ? 'deactivated' : 'activated'} successfully`);
            },
            onError: (err: any) => {
                setConfirmAction(null);
                showMessage('error', err?.response?.data?.message || `Failed to ${confirmAction.action} subscription`);
            }
        });
    };

    const startEditing = (sub: any) => {
        setEditingId(sub.id);
        setEditForm({
            status: sub.status,
            plan_id: sub.plan_id,
            ends_at: sub.ends_at ? sub.ends_at.split('T')[0] : '',
            trial_ends_at: sub.trial_ends_at ? sub.trial_ends_at.split('T')[0] : '',
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
                <p className="text-slate-400 mt-1">Manage subscriptions across all tenants</p>
            </div>

            {/* Confirmation Dialog */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmAction.action === 'deactivate' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                {confirmAction.action === 'deactivate' ? 'Deactivate' : 'Activate'} Subscription
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">
                            Are you sure you want to {confirmAction.action} the subscription for <span className="text-white font-semibold">{confirmAction.tenantName}</span>?
                            {confirmAction.action === 'deactivate' && (
                                <span className="block mt-2 text-red-400">This will immediately revoke their access to the platform.</span>
                            )}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                disabled={updateSubscription.isPending}
                                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${confirmAction.action === 'deactivate'
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                                    }`}
                            >
                                {updateSubscription.isPending ? 'Processing...' : confirmAction.action === 'deactivate' ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[300px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by tenant name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                    <option value="">All Status</option>
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-5 py-3">Tenant Info</th>
                                    <th className="px-5 py-3">Plan</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Period</th>
                                    <th className="px-5 py-3">Remaining</th>
                                    <th className="px-5 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {subscriptions.map((sub: any) => (
                                    <tr key={sub.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">{sub.tenant?.name ?? '-'}</span>
                                                <span className="text-xs text-slate-500">{sub.tenant?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {editingId === sub.id ? (
                                                <select
                                                    value={editForm.plan_id ?? sub.plan_id}
                                                    onChange={(e) => setEditForm(f => ({ ...f, plan_id: parseInt(e.target.value) }))}
                                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs w-full max-w-[150px]"
                                                >
                                                    {plans?.map((plan) => (
                                                        <option key={plan.id} value={plan.id}>{plan.name} ({formatRp(plan.price)})</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-white">{sub.plan?.name ?? '-'}</span>
                                                    <span className="text-xs text-slate-500">{formatRp(Number(sub.plan?.price ?? 0))} / {sub.plan?.billing_cycle}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {editingId === sub.id ? (
                                                <select
                                                    value={editForm.status ?? sub.status}
                                                    onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                                                >
                                                    <option value="trial">Trial</option>
                                                    <option value="active">Active</option>
                                                    <option value="expired">Expired</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    sub.status === 'trial' ? 'bg-cyan-500/10 text-cyan-400' :
                                                        sub.status === 'expired' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-slate-500/10 text-slate-400'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {editingId === sub.id ? (
                                                <div className="space-y-1">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 uppercase">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={editForm.ends_at ?? ''}
                                                            onChange={(e) => setEditForm(f => ({ ...f, ends_at: e.target.value }))}
                                                            className="block px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 uppercase">Trial End</label>
                                                        <input
                                                            type="date"
                                                            value={editForm.trial_ends_at ?? ''}
                                                            onChange={(e) => setEditForm(f => ({ ...f, trial_ends_at: e.target.value }))}
                                                            className="block px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs w-full"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Calendar size={12} />
                                                    <span>
                                                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('id-ID') : '-'}
                                                    </span>
                                                    <ChevronRight size={12} />
                                                    <span className={sub.ends_at && new Date(sub.ends_at) < new Date() ? 'text-red-400' : ''}>
                                                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('id-ID') : '-'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {sub.days_remaining != null ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${sub.days_remaining <= 0 ? 'text-red-400' :
                                                        sub.days_remaining <= 7 ? 'text-amber-400' :
                                                            'text-emerald-400'
                                                        }`}>
                                                        {sub.days_remaining}
                                                    </span>
                                                    <span className="text-xs text-slate-500">hari</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1">
                                                {editingId === sub.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdate(sub.id)}
                                                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                                                            disabled={updateSubscription.isPending}
                                                            title="Save"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(sub)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                            title="Edit subscription"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {(sub.status === 'active' || sub.status === 'trial') ? (
                                                            <button
                                                                onClick={() => setConfirmAction({ id: sub.id, action: 'deactivate', tenantName: sub.tenant?.name ?? 'Unknown' })}
                                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                                                title="Deactivate subscription"
                                                            >
                                                                <PowerOff size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmAction({ id: sub.id, action: 'activate', tenantName: sub.tenant?.name ?? 'Unknown' })}
                                                                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors"
                                                                title="Activate subscription"
                                                            >
                                                                <Power size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!subscriptions.length && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No subscriptions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Showing {subscriptions.length} of {meta.total} subscriptions
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= (meta?.last_page ?? 1)}
                                className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
