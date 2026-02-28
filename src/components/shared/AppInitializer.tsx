import { useEffect } from 'react';
import { initializeBluetooth, lockOrientationPortrait } from '../../utils/capacitor';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        const init = async () => {
            await Promise.all([
                initializeBluetooth(),
                lockOrientationPortrait()
            ]);
        };
        init();
    }, []);

    return <>{children}</>;
};
