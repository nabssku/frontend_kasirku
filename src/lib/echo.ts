import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '../app/store/useAuthStore';

// @ts-ignore
window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/api/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`,
            Accept: 'application/json',
        },
    },
});

export default echo;
