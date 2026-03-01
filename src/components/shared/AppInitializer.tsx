import { useEffect } from 'react';
import { initializeBluetooth, lockOrientationPortrait } from '../../utils/capacitor';
import { useAuthStore } from '../../app/store/useAuthStore';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
    const { token, checkAuth } = useAuthStore();

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                initializeBluetooth(),
                lockOrientationPortrait()
            ]);

            if (token) {
                await checkAuth();
            } else {
                // If no token, we are done "initializing" auth
                useAuthStore.setState({ isInitializing: false });
            }
        };
        init();
    }, [token, checkAuth]);

    return <>{children}</>;
};
