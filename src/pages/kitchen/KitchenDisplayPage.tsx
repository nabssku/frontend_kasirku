import { Clock, ChefHat, CheckCircle, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { useKitchenOrders, useUpdateKitchenStatus } from '../../hooks/useKitchenOrders';
import type { KitchenOrder } from '../../types';
import { useBusinessType } from '../../hooks/useBusinessType';

const STATUS_FLOW: Record<string, { next: KitchenOrder['status'] | null; label: string; color: string }> = {
    queued: { next: 'cooking', label: 'Proses', color: 'bg-amber-500 hover:bg-amber-600' },
    cooking: { next: 'ready', label: 'Siap', color: 'bg-green-500 hover:bg-green-600' },
    ready: { next: 'served', label: 'Diantar', color: 'bg-indigo-500 hover:bg-indigo-600' },
    served: { next: null, label: 'Selesai', color: 'bg-slate-400' },
    cancelled: { next: null, label: 'Dibatalkan', color: 'bg-red-400' },
};

const CARD_COLORS: Record<string, string> = {
    queued: 'border-amber-300 bg-amber-50',
    cooking: 'border-blue-300 bg-blue-50',
    ready: 'border-green-300 bg-green-50',
    served: 'border-slate-200 bg-slate-50 opacity-60',
};

const COLUMN_LABELS = [
    { status: 'queued', icon: Clock, label: 'Antrian', color: 'text-amber-600 bg-amber-100' },
    { status: 'cooking', icon: ChefHat, label: 'Dimasak', color: 'text-blue-600 bg-blue-100' },
    { status: 'ready', icon: CheckCircle, label: 'Siap Antar', color: 'text-green-600 bg-green-100' },
];

function timeSince(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}d`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}j`;
}

function KitchenCard({ order }: { order: KitchenOrder }) {
    const updateStatus = useUpdateKitchenStatus();
    const flow = STATUS_FLOW[order.status];

    return (
        <div className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${CARD_COLORS[order.status] ?? 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-bold text-slate-900">#{order.order_code}</p>
                    {order.table_name && <p className="text-xs text-slate-500">{order.type === 'dine_in' ? order.table_name : order.type}</p>}
                </div>
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{timeSince(order.created_at)} lalu</span>
            </div>

            <ul className="space-y-1.5">
                {order.items.map(item => (
                    <li key={item.id} className="flex gap-2 text-sm">
                        <span className="font-bold text-slate-800 min-w-[20px]">{item.quantity}×</span>
                        <div>
                            <span className="text-slate-700">{item.product_name}</span>
                            {item.modifier_notes && <p className="text-xs text-slate-400 italic">{item.modifier_notes}</p>}
                        </div>
                    </li>
                ))}
            </ul>

            {order.notes && (
                <p className="text-xs bg-amber-100 text-amber-800 rounded-lg px-2 py-1 font-medium">📝 {order.notes}</p>
            )}

            {flow.next && (
                <button
                    onClick={() => updateStatus.mutate({ id: order.id, status: flow.next! })}
                    disabled={updateStatus.isPending}
                    className={`w-full text-white text-sm font-semibold py-2 rounded-xl transition-colors ${flow.color} disabled:opacity-60 flex items-center justify-center gap-2`}
                >
                    {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    {flow.label}
                </button>
            )}
        </div>
    );
}

export default function KitchenDisplayPage() {
    const { isRetail } = useBusinessType();
    const { data: orders = [], isLoading, refetch, isFetching } = useKitchenOrders();

    const byStatus = (status: string) => orders.filter(o => o.status === status);

    if (isRetail) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
                <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center ring-8 ring-purple-50/50">
                    <ShoppingBag size={44} className="text-purple-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-800">Fitur Tidak Tersedia</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Kitchen Display System hanya tersedia untuk bisnis tipe <span className="font-bold text-indigo-600">FNB</span>.
                        Ubah tipe bisnis outlet Anda di halaman <span className="font-bold">Outlet</span> untuk mengaktifkan fitur ini.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kitchen Display System</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Auto-refresh setiap 10 detik</p>
                </div>
                <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                    <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <Loader2 className="animate-spin mr-2" /> Memuat pesanan dapur...
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                    {COLUMN_LABELS.map(col => {
                        const colOrders = byStatus(col.status);
                        const Icon = col.icon;
                        return (
                            <div key={col.status} className="flex flex-col min-h-0">
                                <div className={`flex items-center justify-between mb-4 px-3 py-2 rounded-xl ${col.color.split(' ')[1]} shrink-0`}>
                                    <div className="flex items-center gap-2">
                                        <Icon size={18} className={col.color.split(' ')[0]} />
                                        <span className={`font-bold text-sm ${col.color.split(' ')[0]}`}>{col.label}</span>
                                    </div>
                                    <span className={`text-sm font-bold ${col.color.split(' ')[0]}`}>{colOrders.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {colOrders.length === 0 && (
                                        <div className="text-center py-8 text-slate-300 text-sm">Tidak ada pesanan</div>
                                    )}
                                    {colOrders.map(order => (
                                        <KitchenCard key={order.id} order={order} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
