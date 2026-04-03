import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Filesystem } from '@capacitor/filesystem';

export const isNative = Capacitor.isNativePlatform();

/**
 * Lock screen orientation to landscape
 */
export const lockOrientationLandscape = async () => {
    if (isNative) {
        try {
            await ScreenOrientation.lock({ orientation: 'landscape' });
            console.log('Screen orientation locked to landscape');
        } catch (e) {
            console.warn('Screen orientation lock failed', e);
        }
    }
};

/**
 * Initialize Bluetooth and request permissions
 */
export const initializeBluetooth = async () => {
    if (isNative) {
        try {
            await BleClient.initialize();
            // In @capacitor-community/bluetooth-le, requestDevice or similar might handle permissions.
            // Some versions don't have a direct requestPermissions() if it's handled within other calls.
            // Leaving just initialize for now if requestPermissions truly doesn't exist.
            console.log('Bluetooth initialized');
        } catch (e) {
            console.warn('Bluetooth initialization failed', e);
        }
    }
};

/**
 * Request Storage Permissions for Updates
 */
export const requestStoragePermissions = async () => {
    if (isNative) {
        try {
            const status = await Filesystem.checkPermissions();
            if (status.publicStorage !== 'granted') {
                await Filesystem.requestPermissions();
            }
            console.log('Storage permissions checked/requested');
        } catch (e) {
            console.warn('Storage permission request failed', e);
        }
    }
};

/**
 * Haptic Feedback
 */
export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (isNative) {
        try {
            await Haptics.impact({ style });
        } catch (e) {
            console.warn('Haptics failed', e);
        }
    }
};

/**
 * Share Content
 */
export const shareContent = async (title: string, text: string, url?: string) => {
    if (isNative) {
        try {
            await Share.share({
                title,
                text,
                url,
                dialogTitle: 'Bagikan',
            });
        } catch (e) {
            console.error('Sharing failed', e);
        }
    } else if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
        } catch (e) {
            console.warn('Web Share failed', e);
        }
    } else {
        alert('Sharing not supported on this browser');
    }
};

/**
 * Get Device Info
 */
export const getDeviceInfo = async () => {
    if (isNative) {
        return await Device.getInfo();
    }
    return { platform: 'web', model: 'Browser' };
};

/**
 * Set Status Bar Style
 */
export const setStatusBarStyle = async (darkMode: boolean) => {
    if (isNative) {
        try {
            await StatusBar.setStyle({
                style: darkMode ? Style.Dark : Style.Light,
            });
        } catch (e) {
            console.warn('Status bar style failed', e);
        }
    }
};

/**
 * Monitor Network
 */
export const onNetworkChange = (callback: (status: { connected: boolean }) => void) => {
    if (isNative) {
        const handler = Network.addListener('networkStatusChange', (status) => {
            callback({ connected: status.connected });
        });
        return () => {
            handler.then(h => h.remove());
        };
    } else {
        const onlineHandler = () => callback({ connected: true });
        const offlineHandler = () => callback({ connected: false });
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);
        return () => {
            window.removeEventListener('online', onlineHandler);
            window.removeEventListener('offline', offlineHandler);
        };
    }
};
