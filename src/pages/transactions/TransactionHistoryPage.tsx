import { useState } from 'react';
import {
    Calendar,
    User,
    ArrowRight,
    X,
    ChevronLeft,
    ChevronRight,
    FileText
} from 'lucide-react';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import type { Transaction } from '../../types';

export default function TransactionHistoryPage() {
    const [page, setPage] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const { data: historyData, isLoading } = useTransactionHistory(page);

    const fmtRp = (n: number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(n);

    const fmtDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
                <p className="text-slate-500">Lihat semua transaksi yang telah dilakukan di toko Anda</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Invoice</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Tanggal</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Pelanggan</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Total</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Metode</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : historyData?.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Belum ada data transaksi.
                                    </td>
                                </tr>
                            ) : (
                                historyData?.data.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedTransaction(tx)}>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                {tx.invoice_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                {fmtDate(tx.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User size={14} className="text-slate-400" />
                                                <span className="text-slate-700 truncate max-w-[120px]">
                                                    {tx.customer?.name || 'Umum'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            {fmtRp(tx.grand_total)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                                                {tx.payment_method?.replace('_', ' ') || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                <ArrowRight size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {historyData?.meta && historyData.meta.last_page > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm text-slate-500 font-medium">
                            Halaman <span className="text-slate-900">{page}</span> dari <span className="text-slate-900">{historyData.meta.last_page}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all shadow-sm bg-slate-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage((p: number) => Math.min(historyData.meta.last_page, p + 1))}
                                disabled={page === historyData.meta.last_page}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all shadow-sm bg-slate-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail Transaksi */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Detail Transaksi</h1>
                                <p className="text-xs font-mono text-indigo-600 font-bold">{selectedTransaction.invoice_number}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                            {/* Info Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tanggal</p>
                                    <p className="text-sm font-medium text-slate-700">{fmtDate(selectedTransaction.created_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Kasir</p>
                                    <p className="text-sm font-medium text-slate-700">{selectedTransaction.cashier?.name || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pelanggan</p>
                                    <p className="text-sm font-medium text-slate-700">{selectedTransaction.customer?.name || 'Umum'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Metode Bayar</p>
                                    <p className="text-sm font-medium text-slate-700 capitalize">{selectedTransaction.payment_method?.replace('_', ' ') || '-'}</p>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="space-y-3">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100 pb-2">Produk</p>
                                <div className="space-y-3">
                                    {selectedTransaction.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-start gap-4 text-sm">
                                            <div className="space-y-0.5">
                                                <p className="font-semibold text-slate-800">{item.product_name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {item.quantity} x {fmtRp(item.price)}
                                                </p>
                                            </div>
                                            <p className="font-bold text-slate-900">{fmtRp(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium text-slate-700">{fmtRp(selectedTransaction.subtotal)}</span>
                                </div>
                                {selectedTransaction.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Diskon</span>
                                        <span className="font-medium text-red-600">-{fmtRp(selectedTransaction.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Pajak</span>
                                    <span className="font-medium text-slate-700">{fmtRp(selectedTransaction.tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2">
                                    <span className="text-slate-800">Total</span>
                                    <span className="text-indigo-600">{fmtRp(selectedTransaction.grand_total)}</span>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center text-sm border border-slate-100">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Dibayar</p>
                                    <p className="font-bold text-slate-700 text-base">{fmtRp(selectedTransaction.paid_amount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Kembali</p>
                                    <p className="font-bold text-emerald-600 text-base">{fmtRp(selectedTransaction.change_amount)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
                            >
                                <FileText size={18} />
                                Cetak Struk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
