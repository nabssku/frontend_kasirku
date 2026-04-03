import { useEffect, useState } from 'react';
import { initializeBluetooth, lockOrientationLandscape, requestStoragePermissions, onNetworkChange } from '../../utils/capacitor';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { AppVersionInfo } from '../../services/UpdateService';
import { UpdateService } from '../../services/UpdateService';
import { UpdateModal } from './UpdateModal';
import { Capacitor } from '@capacitor/core';
import { initializeBackHandler } from '../../hooks/useBackHandler';
import { useSyncWorker } from '../../hooks/useSyncWorker';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
    const { token, checkAuth, setOnline } = useAuthStore();
    const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);

    // Initialize synchronization worker
    useSyncWorker();

    useEffect(() => {
        // Initial Network Status Check
        if (Capacitor.isNativePlatform()) {
            import('@capacitor/network').then(({ Network }) => {
                Network.getStatus().then(status => {
                    setOnline(status.connected);
                });
            });
        } else {
            setOnline(navigator.onLine);
        }

        // Listen for Network Changes
        const cleanup = onNetworkChange(({ connected }) => {
            const wasOffline = !useAuthStore.getState().isOnline;
            setOnline(connected);
            
            // Online Recovery: If we just came back online and have a token, revalidate
            if (connected && wasOffline && token) {
                console.log('Back online, revalidating session...');
                checkAuth();
            }
        });

        const init = async () => {
            await Promise.all([
                initializeBluetooth(),
                lockOrientationLandscape(),
                requestStoragePermissions(),
                initializeBackHandler()
            ]);

            // Check for updates if on native platform
            if (Capacitor.isNativePlatform()) {
                const latest = await UpdateService.checkUpdate();
                if (latest) {
                    setUpdateInfo(latest);
                }
            }

            if (token) {
                await checkAuth();
            } else {
                // If no token, we are done "initializing" auth
                useAuthStore.setState({ isInitializing: false });
            }
        };
        init();

        return () => {
            if (typeof cleanup === 'function') cleanup();
        };
    }, [token, checkAuth, setOnline]);

    return (
        <>
            {children}
            {updateInfo && (
                <UpdateModal
                    info={updateInfo}
                    onClose={() => setUpdateInfo(null)}
                />
            )}
        </>
    );
};
