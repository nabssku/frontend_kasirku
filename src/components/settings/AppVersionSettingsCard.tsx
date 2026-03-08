import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { UpdateService, type AppVersionInfo } from '../../services/UpdateService';
import { toast } from 'sonner';

export const AppVersionSettingsCard = () => {
    const [version, setVersion] = useState<string>('0.0.0');
    const [build, setBuild] = useState<string>('0');
    const [isChecking, setIsChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState<AppVersionInfo | null>(null);

    useEffect(() => {
        const getAppInfo = async () => {
            if (Capacitor.isNativePlatform()) {
                const info = await App.getInfo();
                setVersion(info.version);
                setBuild(info.build);
            }
        };
        getAppInfo();
    }, []);

    const handleCheckUpdate = async () => {
        setIsChecking(true);
        setLastChecked(new Date());

        try {
            const update = await UpdateService.checkUpdate();
            if (update) {
                setUpdateAvailable(update);
                toast.success(`Versi baru tersedia: v${update.version_name}`);
            } else {
                setUpdateAvailable(null);
                toast.info('Aplikasi sudah versi terbaru');
            }
        } catch (error) {
            console.error('Manual check failed', error);
            toast.error('Gagal memeriksa pembaruan. Periksa koneksi internet Anda.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleDownload = async () => {
        if (!updateAvailable) return;

        try {
            toast.info('Memulai unduhan pembaruan...');
            await UpdateService.downloadAndInstall(
                updateAvailable.download_url,
                updateAvailable.version_name
            );
        } catch (error: any) {
            toast.error(`Gagal mengunduh: ${error.message || 'Terjadi kesalahan'}`);
        }
    };

    const handleClearCache = async () => {
        const success = await UpdateService.clearUpdateCache();
        if (success) {
            toast.success('Cache pembaruan berhasil dibersihkan');
        } else {
            toast.error('Gagal membersihkan cache');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> Informasi Aplikasi
            </h3>

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-700">Versi Saat Ini</p>
                    <p className="text-xl font-bold text-indigo-600">v{version} <span className="text-xs font-normal text-slate-400">({build})</span></p>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleCheckUpdate}
                        disabled={isChecking}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                        {isChecking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Cek Pembaruan
                    </button>
                    <button
                        onClick={handleClearCache}
                        className="text-[10px] text-slate-400 hover:text-red-500 transition-colors text-right"
                    >
                        Bersihkan Cache
                    </button>
                </div>
            </div>

            {updateAvailable && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <div>
                            <p className="text-sm font-bold text-amber-900">Versi v{updateAvailable.version_name} Tersedia!</p>
                            <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">{updateAvailable.release_notes || 'Pembaruan tersedia untuk performa dan stabilitas.'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="w-full bg-amber-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                    >
                        Unduh & Instal Sekarang
                    </button>
                </div>
            )}

            {!updateAvailable && lastChecked && !isChecking && (
                <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                    <CheckCircle2 size={12} />
                    Aplikasi versi terbaru (Dicek {lastChecked.toLocaleTimeString()})
                </div>
            )}

            <p className="text-[10px] text-slate-400 italic">
                Fitur self-update hanya berfungsi pada perangkat Android. Pastikan Anda memberikan izin instalasi dari sumber tidak dikenal jika diminta.
            </p>
        </div>
    );
};
