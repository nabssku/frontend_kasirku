import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrinterState {
    activeDevice: BluetoothDevice | null;
    lastUsedPrinterId: string | null;
    isConnecting: boolean;
    isConnected: boolean;
    lastError: string | null;
    setActiveDevice: (device: BluetoothDevice | null) => void;
    setIsConnecting: (status: boolean) => void;
    setIsConnected: (status: boolean) => void;
    setLastError: (error: string | null) => void;
}

export const usePrinterStore = create<PrinterState>()(
    persist(
        (set) => ({
            activeDevice: null,
            lastUsedPrinterId: null,
            isConnecting: false,
            isConnected: false,
            lastError: null,
            setActiveDevice: (activeDevice) => set({ 
                activeDevice, 
                isConnected: !!activeDevice?.gatt?.connected,
                lastUsedPrinterId: activeDevice?.id || null 
            }),
            setIsConnecting: (isConnecting) => set({ isConnecting }),
            setIsConnected: (isConnected) => set({ isConnected }),
            setLastError: (lastError) => set({ lastError }),
        }),
        {
            name: 'kasirku-printer-storage',
            partialize: (state) => ({ lastUsedPrinterId: state.lastUsedPrinterId }),
        }
    )
);
