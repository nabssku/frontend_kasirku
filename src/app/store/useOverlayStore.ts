import { create } from 'zustand';

interface OverlayState {
    activeOverlays: (() => void)[]; // Stack of close callbacks
    registerOverlay: (onClose: () => void) => () => void;
    popOverlay: () => boolean; // Returns true if an overlay was popped
    clearOverlays: () => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
    activeOverlays: [],
    
    registerOverlay: (onClose) => {
        set((state) => ({
            activeOverlays: [...state.activeOverlays, onClose]
        }));
        
        // Return unregister function
        return () => {
            set((state) => ({
                activeOverlays: state.activeOverlays.filter(cb => cb !== onClose)
            }));
        };
    },
    
    popOverlay: () => {
        const { activeOverlays } = get();
        if (activeOverlays.length === 0) return false;
        
        const lastOverlay = activeOverlays[activeOverlays.length - 1];
        lastOverlay(); // Call the close function
        
        set((state) => ({
            activeOverlays: state.activeOverlays.slice(0, -1)
        }));
        
        return true;
    },
    
    clearOverlays: () => set({ activeOverlays: [] }),
}));
