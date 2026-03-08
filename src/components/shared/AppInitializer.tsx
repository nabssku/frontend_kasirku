import { useEffect, useState } from 'react';
import { initializeBluetooth, lockOrientationLandscape, requestStoragePermissions } from '../../utils/capacitor';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { AppVersionInfo } from '../../services/UpdateService';
import { UpdateService } from '../../services/UpdateService';
import { UpdateModal } from './UpdateModal';
import { Capacitor } from '@capacitor/core';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
    const { token, checkAuth } = useAuthStore();
    const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                initializeBluetooth(),
                lockOrientationLandscape(),
                requestStoragePermissions()
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
    }, [token, checkAuth]);

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
