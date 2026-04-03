import { useAuthStore } from '../../../app/store/useAuthStore';
import { WifiOff, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkStatusIndicatorProps {
    isSyncing?: boolean;
}

export const NetworkStatusIndicator = ({ isSyncing }: NetworkStatusIndicatorProps) => {
    const { isOnline } = useAuthStore();

    return (
        <AnimatePresence>
            {(!isOnline || isSyncing) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
                >
                    <div className={`
                        px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-white/20 backdrop-blur-md text-white font-bold uppercase tracking-wider text-[10px]
                        ${isSyncing ? 'bg-indigo-500' : 'bg-red-500'}
                    `}>
                        {isSyncing ? <RefreshCcw size={14} className="animate-spin" /> : <WifiOff size={14} />}
                        <span>{isSyncing ? 'Sinkronisasi...' : 'Mode Offline'}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
