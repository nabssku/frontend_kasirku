import { useState } from 'react';
import { useSuperAdminOrders } from '../../hooks/useSuperAdmin';
import { Receipt, Search, Eye, X, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { PaymentTransaction } from '../../types';

export default function SuperAdminOrders() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<PaymentTransaction | null>(null);

    const { data, isLoading } = useSuperAdminOrders({
        page,
        status: statusFilter || undefined,
        search: search || undefined,
    });

    const orders = data?.data ?? [];
    const meta = data?.meta ?? data;

    const statusStyles: Record<string, string> = {
        paid: 'bg-emerald-500/10 text-emerald-400',
        pending: 'bg-amber-500/10 text-amber-400',
        failed: 'bg-red-500/10 text-red-400',
        expired: 'bg-slate-500/10 text-slate-400',
    };

    const statusIcons: Record<string, typeof CheckCircle2> = {
        paid: CheckCircle2,
        pending: Clock,
        failed: XCircle,
        expired: Clock,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Receipt className="text-amber-400" size={24} />
                    Order History
                </h1>
                <p className="text-slate-400 mt-1">Track all payment transactions across tenants</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by order ID or tenant..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="expired">Expired</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                        <th className="px-5 py-3">Order ID</th>
                                        <th className="px-5 py-3">Tenant</th>
                                        <th className="px-5 py-3">Amount</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {orders.map((order: PaymentTransaction) => {
                                        const StatusIcon = statusIcons[order.status] || Clock;
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <span className="text-white font-mono text-xs">{order.gateway_order_id}</span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-300">{order.tenant?.name ?? '-'}</td>
                                                <td className="px-5 py-3">
                                                    <span className="text-white font-medium flex items-center gap-1">
                                                        <DollarSign size={12} className="text-green-400" />
                                                        Rp {order.amount.toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status] || 'bg-slate-700 text-slate-400'}`}>
                                                        <StatusIcon size={10} />
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-400 text-xs">
                                                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta?.last_page > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
                                <span className="text-xs text-slate-500">
                                    Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= (meta?.last_page ?? 1)}
                                        className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Order Detail</h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Order ID</span>
                                <span className="text-white font-mono text-xs">{selectedOrder.gateway_order_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tenant</span>
                                <span className="text-white">{selectedOrder.tenant?.name ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Amount</span>
                                <span className="text-white font-medium">Rp {selectedOrder.amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[selectedOrder.status]}`}>
                                    {selectedOrder.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Gateway</span>
                                <span className="text-white capitalize">{selectedOrder.gateway}</span>
                            </div>
                            {selectedOrder.gateway_transaction_id && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Transaction ID</span>
                                    <span className="text-white font-mono text-xs">{selectedOrder.gateway_transaction_id}</span>
                                </div>
                            )}
                            {selectedOrder.paid_at && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Paid At</span>
                                    <span className="text-white">{new Date(selectedOrder.paid_at).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-400">Created</span>
                                <span className="text-white">{new Date(selectedOrder.created_at).toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {selectedOrder.gateway_payload && (
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Gateway Payload</p>
                                <pre className="bg-slate-800 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto max-h-48">
                                    {JSON.stringify(selectedOrder.gateway_payload, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
