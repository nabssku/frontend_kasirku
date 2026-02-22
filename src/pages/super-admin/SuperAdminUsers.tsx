import { useState } from 'react';
import { useSuperAdminUsers } from '../../hooks/useSuperAdmin';
import { Search } from 'lucide-react';

export default function SuperAdminUsers() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useSuperAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
    });

    const users = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-slate-400 mt-1">View all users across all tenants</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                    <option value="">All Roles</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen</option>
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
                                    <th className="px-5 py-3">Tenant</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Outlet</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-white">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">{user.email}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">{user.tenant?.name ?? '-'}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map((role: any) => (
                                                    <span key={role.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${role.slug === 'owner' ? 'bg-amber-500/10 text-amber-400' :
                                                            role.slug === 'admin' ? 'bg-blue-500/10 text-blue-400' :
                                                                role.slug === 'cashier' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                    'bg-slate-500/10 text-slate-400'
                                                        }`}>
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">{user.outlet?.name ?? '-'}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                                {!users.length && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-8 text-center text-slate-500">No users found</td>
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
