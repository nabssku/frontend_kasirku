import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();

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
        Network.addListener('networkStatusChange', (status) => {
            callback({ connected: status.connected });
        });
    } else {
        window.addEventListener('online', () => callback({ connected: true }));
        window.addEventListener('offline', () => callback({ connected: false }));
    }
};
