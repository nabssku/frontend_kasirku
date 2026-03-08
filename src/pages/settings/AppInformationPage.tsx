import { Info } from 'lucide-react';
import { AppVersionSettingsCard } from '../../components/settings/AppVersionSettingsCard';

export default function AppInformationPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Informasi Aplikasi</h1>
                <p className="text-sm text-slate-500 mt-1">Cek versi aplikasi dan perbarui sistem</p>
            </div>

            <div className="space-y-6">
                <AppVersionSettingsCard />

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Info size={14} /> Tentang JagoKasir
                    </h3>
                    <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <p>
                            JagoKasir adalah solusi Point of Sales (POS) modern yang dirancang untuk membantu UMKM mengelola bisnis dengan lebih efisien, mulai dari manajemen inventaris hingga laporan keuangan mendalam.
                        </p>
                        <div className="pt-2 border-t border-slate-50">
                            <p className="font-semibold text-slate-700">Dikembangkan oleh:</p>
                            <p>Tim JagoKasir</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
