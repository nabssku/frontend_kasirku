import { useEffect, useRef } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { SyncService } from '../services/SyncService';
import { useSyncStore } from '../app/store/useSyncStore';
import { useQueryClient } from '@tanstack/react-query';

export const useSyncWorker = () => {
    const { isOnline, token } = useAuthStore();
    const offlineQueue = useSyncStore(state => state.offlineQueue);
    const syncCount = offlineQueue.length;
    const isFirstRun = useRef(true);
    const queryClient = useQueryClient();

    // Monitor isOnline transition
    useEffect(() => {
        if (!token) return; // Must be authenticated to sync

        const triggerSync = async () => {
            if (isOnline && syncCount > 0) {
                console.log('[SYNC WORKER] Network online, processing queue...', syncCount);
                await SyncService.processQueue();
                
                // Invalidate relevant queries after sync
                queryClient.invalidateQueries({ queryKey: ['products'] });
                queryClient.invalidateQueries({ queryKey: ['reports'] });
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }
        };

        // Trigger on first load or when coming back online
        if (isOnline && (isFirstRun.current || syncCount > 0)) {
            triggerSync();
            isFirstRun.current = false;
        }

    }, [isOnline, syncCount, token]);

    // Periodic sync (every 5 minutes as a safety net)
    useEffect(() => {
        if (!token) return;

        const interval = setInterval(() => {
            if (isOnline && syncCount > 0) {
                console.log('[SYNC WORKER] Periodic sync check...');
                SyncService.processQueue();
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isOnline, syncCount, token]);

    return { syncCount };
};
