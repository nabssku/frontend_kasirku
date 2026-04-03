import { App } from '@capacitor/app';
import { useOverlayStore } from '../app/store/useOverlayStore';

export const initializeBackHandler = () => {
    App.addListener('backButton', (data) => {
        const { canGoBack } = data;
        const popped = useOverlayStore.getState().popOverlay();
        
        if (popped) {
            // An overlay was closed, do nothing else
            return;
        }

        if (canGoBack) {
            window.history.back();
        } else {
            // Exit app or go to root?
            App.exitApp();
        }
    });
};
