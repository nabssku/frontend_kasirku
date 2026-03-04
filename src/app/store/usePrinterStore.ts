import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrinterState {
    cashierDevice: any | null;
    kitchenDevice: any | null;
    lastCashierPrinterId: string | null;
    lastKitchenPrinterId: string | null;
    isConnecting: boolean;
    isConnected: boolean; // General connection status
    lastError: string | null;
    setCashierDevice: (device: any | null) => void;
    setKitchenDevice: (device: any | null) => void;
    setIsConnecting: (status: boolean) => void;
    setIsConnected: (status: boolean) => void;
    setLastError: (error: string | null) => void;
}

export const usePrinterStore = create<PrinterState>()(
    persist(
        (set, get) => ({
            cashierDevice: null,
            kitchenDevice: null,
            lastCashierPrinterId: null,
            lastKitchenPrinterId: null,
            isConnecting: false,
            isConnected: false,
            lastError: null,
            setCashierDevice: (device) => {
                const kitchen = get().kitchenDevice;
                set({ 
                    cashierDevice: device, 
                    isConnected: (!!device?.gatt?.connected || !!device?.native) || (!!kitchen?.gatt?.connected || !!kitchen?.native),
                    lastCashierPrinterId: device?.id || null 
                });
            },
            setKitchenDevice: (device) => {
                const cashier = get().cashierDevice;
                set({ 
                    kitchenDevice: device, 
                    isConnected: (!!device?.gatt?.connected || !!device?.native) || (!!cashier?.gatt?.connected || !!cashier?.native),
                    lastKitchenPrinterId: device?.id || null 
                });
            },
            setIsConnecting: (isConnecting) => set({ isConnecting }),
            setIsConnected: (isConnected) => set({ isConnected }),
            setLastError: (lastError) => set({ lastError }),
        }),
        {
            name: 'kasirku-printer-storage',
            partialize: (state) => ({ 
                lastCashierPrinterId: state.lastCashierPrinterId,
                lastKitchenPrinterId: state.lastKitchenPrinterId 
            }),
        }
    )
);
