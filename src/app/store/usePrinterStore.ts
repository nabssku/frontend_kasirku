import { create } from 'zustand';

interface PrinterState {
    activeDevice: BluetoothDevice | null;
    isConnecting: boolean;
    lastError: string | null;
    setActiveDevice: (device: BluetoothDevice | null) => void;
    setIsConnecting: (status: boolean) => void;
    setLastError: (error: string | null) => void;
}

export const usePrinterStore = create<PrinterState>((set) => ({
    activeDevice: null,
    isConnecting: false,
    lastError: null,
    setActiveDevice: (activeDevice) => set({ activeDevice }),
    setIsConnecting: (isConnecting) => set({ isConnecting }),
    setLastError: (lastError) => set({ lastError }),
}));
