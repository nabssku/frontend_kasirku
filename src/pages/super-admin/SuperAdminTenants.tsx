import { useState } from 'react';
import { useSuperAdminTenants, useUpdateTenant, useDeleteTenant } from '../../hooks/useSuperAdmin';
import { Search, Edit2, Trash2, X, Check } from 'lucide-react';

export default function SuperAdminTenants() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const { data, isLoading } = useSuperAdminTenants({ search, status: statusFilter || undefined, page });
    const updateTenant = useUpdateTenant();
    const deleteTenant = useDeleteTenant();

    const tenants = data?.data ?? [];
    const meta = data?.meta;

    const handleUpdate = (id: string) => {
        updateTenant.mutate({ id, status: editStatus as 'active' | 'inactive' | 'suspended' }, {
            onSuccess: () => setEditingId(null),
        });
    };

    const handleDelete = (id: string) => {
        deleteTenant.mutate(id, {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
                <p className="text-slate-400 mt-1">View and manage all registered tenants</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search tenants..."
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
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
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Users</th>
                                    <th className="px-5 py-3">Plan</th>
                                    <th className="px-5 py-3">Subscription Ends</th>
                                    <th className="px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {tenants.map((tenant: any) => (
                                    <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3.5 text-sm font-medium text-white">{tenant.name}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">{tenant.email}</td>
                                        <td className="px-5 py-3.5">
                                            {editingId === tenant.id ? (
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) => setEditStatus(e.target.value)}
                                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        tenant.status === 'suspended' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-slate-500/10 text-slate-400'
                                                    }`}>
                                                    {tenant.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">{tenant.users_count ?? 0}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">
                                            {tenant.subscription?.plan?.name ?? <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">
                                            {tenant.subscription_ends_at
                                                ? new Date(tenant.subscription_ends_at).toLocaleDateString('id-ID')
                                                : '-'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1">
                                                {editingId === tenant.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdate(tenant.id)}
                                                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                                                            disabled={updateTenant.isPending}
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : deleteConfirm === tenant.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleDelete(tenant.id)}
                                                            className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                            disabled={deleteTenant.isPending}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingId(tenant.id); setEditStatus(tenant.status); }}
                                                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
                                                            title="Edit status"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(tenant.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                            title="Delete tenant"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!tenants.length && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-8 text-center text-slate-500">No tenants found</td>
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
                            Page {meta.current_page} of {meta.last_page} ({meta.total} total)
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
