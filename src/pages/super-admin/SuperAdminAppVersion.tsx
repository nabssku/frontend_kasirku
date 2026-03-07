import { useState } from 'react';
import { useSuperAdminAppVersions, useCreateAppVersion, useDeleteAppVersion } from '../../hooks/useSuperAdmin';
import { Plus, Trash2, Download, AlertTriangle, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminAppVersion() {
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [versionName, setVersionName] = useState('');
    const [versionCode, setVersionCode] = useState('');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [isCritical, setIsCritical] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const { data: response, isLoading } = useSuperAdminAppVersions({ page });
    const createMutation = useCreateAppVersion();
    const deleteMutation = useDeleteAppVersion();

    const versions = response?.data ?? [];
    const meta = response?.meta;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Pilih file APK terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('version_name', versionName);
        formData.append('version_code', versionCode);
        formData.append('release_notes', releaseNotes);
        formData.append('is_critical', isCritical ? '1' : '0');
        formData.append('apk_file', file);

        try {
            await createMutation.mutateAsync(formData);
            toast.success('Versi berhasil diunggah');
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengunggah versi');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus versi ini? File APK juga akan dihapus dari server.')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Versi berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus versi');
        }
    };

    const resetForm = () => {
        setVersionName('');
        setVersionCode('');
        setReleaseNotes('');
        setIsCritical(false);
        setFile(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">App Version Management</h1>
                    <p className="text-slate-400 mt-1">Manage Android APK updates for JagoKasir</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Unggah Versi Baru
                </button>
            </div>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-5 py-4 font-bold">Version</th>
                                    <th className="px-5 py-4 font-bold">Code</th>
                                    <th className="px-5 py-4 font-bold">Type</th>
                                    <th className="px-5 py-4 font-bold">Release Notes</th>
                                    <th className="px-5 py-4 font-bold">Date</th>
                                    <th className="px-5 py-4 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {versions.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-white">v{v.version_name}</div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-400">{v.version_code}</td>
                                        <td className="px-5 py-4">
                                            {v.is_critical ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                                                    <AlertTriangle size={12} /> Critical
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                                                    Regular
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 max-w-xs truncate text-slate-400">
                                            {v.release_notes || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-400">
                                            {new Date(v.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(v.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!versions.length && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                                            Belum ada versi yang diunggah.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

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
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Unggah APK Baru</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Version Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="E.g. 1.0.1"
                                        value={versionName}
                                        onChange={(e) => setVersionName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Version Code</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder="E.g. 2"
                                        value={versionCode}
                                        onChange={(e) => setVersionCode(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Release Notes</label>
                                <textarea
                                    value={releaseNotes}
                                    onChange={(e) => setReleaseNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Apa yang baru di versi ini?"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 resize-none"
                                />
                            </div>

                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Update Kritikal</p>
                                        <p className="text-[10px] text-slate-500">Paksa pengguna untuk update aplikasi</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isCritical}
                                    onChange={(e) => setIsCritical(e.target.checked)}
                                    className="w-5 h-5 accent-red-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">File APK</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".apk"
                                        required
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="apk-upload"
                                    />
                                    <label
                                        htmlFor="apk-upload"
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-8 hover:border-amber-500/50 transition-all cursor-pointer bg-slate-950 group"
                                    >
                                        <FileUp size={32} className="text-slate-600 group-hover:text-amber-500 transition-colors mb-2" />
                                        <span className="text-sm font-medium text-slate-400">
                                            {file ? file.name : 'Pilih file APK atau lepas di sini'}
                                        </span>
                                        <span className="text-[10px] text-slate-600 mt-1">Maksimal 100MB</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 border border-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-[2] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Mengunggah...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} /> Simpan & Publikasikan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
