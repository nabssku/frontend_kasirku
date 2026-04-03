import { useAuthStore } from '../../../app/store/useAuthStore';
import { useSyncStore } from '../../../app/store/useSyncStore';
import { SyncService } from '../../../services/SyncService';
import { Wifi, WifiOff, RefreshCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface NetworkStatusIndicatorProps {
    isSyncing?: boolean;
}

export const NetworkStatusIndicator = ({ isSyncing: externalSyncing }: NetworkStatusIndicatorProps) => {
    const { isOnline } = useAuthStore();
    const { offlineQueue } = useSyncStore();
    const pendingCount = offlineQueue.length;
    const isInternalSyncing = offlineQueue.some(item => item.status === 'syncing');
    const isSyncing = externalSyncing || isInternalSyncing;
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isManualSyncing, setIsManualSyncing] = useState(false);

    const handleManualSync = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOnline || pendingCount === 0 || isSyncing) return;
        
        setIsManualSyncing(true);
        await SyncService.processQueue();
        setIsManualSyncing(false);
    };

    if (isOnline && pendingCount === 0) return null;

    return (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end gap-2">
            <AnimatePresence>
                {/* Pending Tasks Card */}
                {pendingCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 min-w-[200px] overflow-hidden"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isSyncing || isManualSyncing ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                <RefreshCcw size={16} className={(isSyncing || isManualSyncing) ? 'animate-spin' : ''} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antrian Sinkron</p>
                                <p className="text-sm font-black text-slate-800">{pendingCount} Transaksi</p>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-2">
                            {isOnline ? (
                                <button
                                    onClick={handleManualSync}
                                    disabled={isSyncing || isManualSyncing}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                                >
                                    {(isSyncing || isManualSyncing) ? (
                                        <>MENYINKRONKAN...</>
                                    ) : (
                                        <>SYNC SEKARANG</>
                                    )}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                                    <AlertCircle size={12} />
                                    MENUNGGU INTERNET...
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Status Pill */}
            <motion.div
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 cursor-pointer transition-colors backdrop-blur-md
                    ${isOnline 
                        ? (pendingCount > 0 ? 'bg-amber-500 border-white/20 text-white' : 'bg-white/80 border-slate-100 text-slate-600') 
                        : 'bg-red-500 border-white/20 text-white'}
                `}
            >
                {isOnline ? (
                    pendingCount > 0 ? <RefreshCcw size={14} className="animate-spin" /> : <Wifi size={14} className="text-emerald-500" />
                ) : (
                    <WifiOff size={14} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {isOnline ? (pendingCount > 0 ? 'Syncing...' : 'Online') : 'Offline'}
                </span>
                {pendingCount > 0 && (
                    <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-md text-[9px] font-black">
                        {pendingCount}
                    </span>
                )}
            </motion.div>
        </div>
    );
};
