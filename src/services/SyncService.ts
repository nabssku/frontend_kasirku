import api from '../lib/axios';
import { useSyncStore } from '../app/store/useSyncStore';
import { toast } from 'sonner';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SyncService {
    private static isProcessing = false;

    static async processQueue() {
        if (this.isProcessing) return;
        
        const { offlineQueue, updateStatus, removeFromQueue, incrementRetry } = useSyncStore.getState();
        if (offlineQueue.length === 0) return;

        this.isProcessing = true;
        
        // Filter out items that have reached retry limit
        const pendingItems = offlineQueue.filter(item => item.retryCount < 5 && item.status !== 'syncing');

        for (const item of pendingItems) {
            updateStatus(item.id, 'syncing');
            
            try {
                // The local_id is used by backend for idempotency
                await api.post('/transactions', item.payload);
                
                // Success: Remove from queue
                removeFromQueue(item.id);
                console.log(`[SYNC SUCCESS] Transaction ${item.id} synced.`);

                // Also notify QueryClient to refresh data (we need access to it)
                // Since this is a service, we can emit an event or just do it in the worker
                
                // Optional small delay between requests
                await delay(300);
            } catch (error: any) {
                console.error(`[SYNC FAILED] Transaction ${item.id}:`, error);
                
                // If it's a network error, stop processing the rest of the queue
                if (!error.response) {
                    updateStatus(item.id, 'failed');
                    this.isProcessing = false;
                    return; 
                }

                // If it's a server error (e.g., 400), mark as failed and increment retry
                updateStatus(item.id, 'failed');
                incrementRetry(item.id);
                
                // Continue to next item if it was a data-related error (4xx) 
                // but not a connection error
            }
        }

        this.isProcessing = false;
        
        // Final feedback if queue is cleared
        const remaining = useSyncStore.getState().offlineQueue.length;
        if (remaining === 0 && offlineQueue.length > 0) {
            toast.success('Semua transaksi offline berhasil disinkronkan.');
        } else if (remaining > 0) {
            console.warn(`[SYNC] ${remaining} items remaining in queue.`);
        }
    }
}
