import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SyncItem {
    id: string; // local_id
    payload: any;
    status: 'pending' | 'syncing' | 'failed';
    created_at_local: number;
    retryCount: number;
}

interface SyncState {
    offlineQueue: SyncItem[];
    addToQueue: (payload: any) => void;
    updateStatus: (id: string, status: SyncItem['status']) => void;
    removeFromQueue: (id: string) => void;
    clearQueue: () => void;
    incrementRetry: (id: string) => void;
}

export const useSyncStore = create<SyncState>()(
    persist(
        (set, get) => ({
            offlineQueue: [],
            addToQueue: (payload) => {
                const id = payload.local_id || `trx-local-${crypto.randomUUID()}`;
                const newItem: SyncItem = {
                    id,
                    payload,
                    status: 'pending',
                    created_at_local: Date.now(),
                    retryCount: 0,
                };
                
                // Limit queue size to 500
                const currentQueue = get().offlineQueue;
                if (currentQueue.length >= 500) {
                    console.warn('Sync queue is full. Ignoring new transaction.');
                    return;
                }

                set({ offlineQueue: [...currentQueue, newItem] });
            },
            updateStatus: (id, status) => set((state) => ({
                offlineQueue: state.offlineQueue.map((item) =>
                    item.id === id ? { ...item, status } : item
                ),
            })),
            removeFromQueue: (id) => set((state) => ({
                offlineQueue: state.offlineQueue.filter((item) => item.id !== id),
            })),
            clearQueue: () => set({ offlineQueue: [] }),
            incrementRetry: (id) => set((state) => ({
                offlineQueue: state.offlineQueue.map((item) =>
                    item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
                ),
            })),
        }),
        {
            name: 'sync-storage',
        }
    )
);
