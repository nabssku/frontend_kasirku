import React, { useState } from 'react';
import {
    History,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Lock,
    ArrowRight,
    User,
    Store,
    Calendar,
    Info
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useOutlets } from '../../hooks/useOutlets';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { AuditLog } from '../../types';

const AuditLogPage: React.FC = () => {
    const { user: _user } = useAuthStore();
    const [page, setPage] = useState(1);
    const [selectedOutletId, setSelectedOutletId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const { data: outlets } = useOutlets();
    const { data: response, isLoading } = useAuditLogs({
        page,
        outlet_id: selectedOutletId,
        model_type: searchTerm,
    });

    const logs = response?.data || [];
    const meta = response?.meta;
    const hasPlanAccess = meta?.has_plan_access ?? true;

    if (!hasPlanAccess) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Audit Log</h1>
                <p className="text-gray-600 mb-8 text-lg">
                    Lacak setiap perubahan di bisnis Anda. Audit Log mencatat siapa yang melakukan apa dan kapan itu terjadi, memberikan Anda keamanan dan transparansi penuh.
                </p>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-left">Kenapa Anda butuh Audit Log?</h2>
                    <ul className="space-y-4 text-left">
                        <li className="flex items-start gap-3 text-gray-700">
                            <div className="mt-1 bg-green-100 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600" /></div>
                            <span>Lacak penghapusan atau pengeditan transaksi mencurigakan.</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                            <div className="mt-1 bg-green-100 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600" /></div>
                            <span>Pantau perubahan harga produk dan pengaturan outlet.</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                            <div className="mt-1 bg-green-100 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600" /></div>
                            <span>Audit aktivitas staf untuk akuntabilitas tim yang lebih baik.</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.href = '/settings/subscription'}
                    className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                    Upgrade Sekarang ke Plan Premium <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <History className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                        <p className="text-gray-500 text-sm">Riwayat aktivitas sistem lengkap</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedOutletId}
                            onChange={(e) => {
                                setSelectedOutletId(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white"
                        >
                            <option value="">Semua Outlet</option>
                            {Array.isArray(outlets) && outlets.map((o: any) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan tipe model (cth: Product, Transaction)..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Pengguna</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Outlet</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Model</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada riwayat ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log: AuditLog) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                                    {log.user?.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{log.user?.name || 'Sistem'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{log.outlet?.name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.action === 'created' ? 'bg-green-100 text-green-700' :
                                                log.action === 'updated' ? 'bg-blue-100 text-blue-700' :
                                                    log.action === 'deleted' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {log.action === 'created' ? 'Tambah' :
                                                    log.action === 'updated' ? 'Update' :
                                                        log.action === 'deleted' ? 'Hapus' : log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.model_type?.split('\\').pop()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Menampilkan {(meta.current_page - 1) * meta.per_page + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} dari {meta.total} log
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={page === meta.last_page}
                                onClick={() => setPage(page + 1)}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Detail Aktivitas</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">ID: {selectedLog.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4" /> Pengguna</p>
                                    <p className="font-semibold">{selectedLog.user?.name || 'Sistem'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Waktu</p>
                                    <p className="font-semibold">{format(new Date(selectedLog.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: id })}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 flex items-center gap-2"><Store className="w-4 h-4" /> Outlet</p>
                                    <p className="font-semibold">{selectedLog.outlet?.name || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 flex items-center gap-2"><Info className="w-4 h-4" /> IP Address</p>
                                    <p className="font-semibold font-mono">{selectedLog.ip_address || '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Perubahan Data</h4>

                                {selectedLog.action === 'updated' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Sebelum</p>
                                            <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                                                {JSON.stringify(selectedLog.old_values, null, 2)}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Sesudah</p>
                                            <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                                                {JSON.stringify(selectedLog.new_values, null, 2)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Data Snapshot</p>
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                                            {JSON.stringify(selectedLog.action === 'created' ? selectedLog.new_values : selectedLog.old_values, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase">User Agent</p>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 break-all">
                                    {selectedLog.user_agent}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                            >
                                Tutup Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
