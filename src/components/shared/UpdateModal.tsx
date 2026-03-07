import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { AppVersionInfo } from '../../services/UpdateService';
import { UpdateService } from '../../services/UpdateService';
import { toast } from 'sonner';

interface UpdateModalProps {
    info: AppVersionInfo;
    onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ info, onClose }) => {
    const [status, setStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState(0);

    const handleUpdate = async () => {
        try {
            setStatus('downloading');
            await UpdateService.downloadAndInstall(info.download_url, info.version_name, (p) => {
                setProgress(p);
            });
            setStatus('completed');
        } catch (error) {
            console.error('Update failed', error);
            setStatus('error');
            toast.error('Gagal mengunduh update');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                                <Download size={24} />
                            </div>
                            {!info.is_critical && status !== 'downloading' && (
                                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                            Update Tersedia (v{info.version_name})
                        </h2>

                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
                            Versi baru telah tersedia. Harap perbarui aplikasi untuk mendapatkan fitur terbaru dan perbaikan sistem.
                        </p>

                        {info.release_notes && (
                            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3 mb-6">
                                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Catatan Rilis:</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{info.release_notes}</p>
                            </div>
                        )}

                        {status === 'downloading' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Mengunduh...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : status === 'completed' ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <CheckCircle2 size={18} />
                                <span className="text-sm font-medium">Unduhan selesai. Memulai instalasi...</span>
                            </div>
                        ) : status === 'error' ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium">Gagal mengunduh update.</span>
                                </div>
                                <button
                                    onClick={handleUpdate}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3 mt-6">
                                {!info.is_critical && (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl font-semibold transition-all"
                                    >
                                        Nanti Saja
                                    </button>
                                )}
                                <button
                                    onClick={handleUpdate}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                                >
                                    Update Sekarang
                                </button>
                            </div>
                        )}

                        {info.is_critical && status !== 'downloading' && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mt-4">
                                * Update ini bersifat wajib untuk melanjutkan penggunaan aplikasi.
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
