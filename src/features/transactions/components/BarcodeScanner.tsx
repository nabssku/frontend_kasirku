import { useState, useEffect } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { X, Camera, Zap, ZapOff } from 'lucide-react';
import { isNative } from '../../../utils/capacitor';

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    onClose: () => void;
}

export const BarcodeScannerModal = ({ onScan, onClose }: BarcodeScannerProps) => {
    const [torch, setTorch] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isNative) {
            setError('Barcode scanning is only supported on native devices.');
            return;
        }

        const startScanning = async () => {
            try {
                // Check and request permissions
                const { camera } = await BarcodeScanner.checkPermissions();
                if (camera !== 'granted') {
                    const { camera: newStatus } = await BarcodeScanner.requestPermissions();
                    if (newStatus !== 'granted') {
                        setError('Camera permission denied.');
                        return;
                    }
                }

                // Prepare for scan - this makes the background transparent
                await BarcodeScanner.removeAllListeners();

                // Set body background to transparent to see the camera behind the webview
                document.body.classList.add('scanner-active');

                // Start scanning
                await BarcodeScanner.addListener('barcodesScanned', (result) => {
                    if (result.barcodes.length > 0) {
                        onScan(result.barcodes[0].displayValue);
                        stopScanning();
                    }
                });

                await BarcodeScanner.startScan({
                    formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.QrCode, BarcodeFormat.Code128],
                    lensFacing: LensFacing.Back,
                });

            } catch (err: any) {
                console.error('Scanner error:', err);
                setError(err.message || 'Failed to start scanner.');
                stopScanning();
            }
        };

        startScanning();

        return () => {
            stopScanning();
        };
    }, []);

    const stopScanning = async () => {
        if (isNative) {
            await BarcodeScanner.stopScan();
            await BarcodeScanner.removeAllListeners();
        }
        document.body.classList.remove('scanner-active');
    };

    const toggleTorch = async () => {
        if (isNative) {
            await BarcodeScanner.toggleTorch();
            setTorch(!torch);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-between text-white p-6">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between py-4">
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
                >
                    <X size={20} />
                </button>
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <span className="text-xs font-bold uppercase tracking-widest">Scanner</span>
                </div>
                <button
                    onClick={toggleTorch}
                    className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
                >
                    {torch ? <ZapOff size={20} /> : <Zap size={20} />}
                </button>
            </div>

            {/* Target Area (Simulated) */}
            <div className="relative w-64 h-64 border-2 border-white/40 rounded-3xl overflow-hidden">
                {/* Viewfinder corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />

                {/* Laser line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan-laser" />
            </div>

            {/* Bottom Section */}
            <div className="w-full bg-black/40 backdrop-blur-md p-6 rounded-[32px] border border-white/20 text-center space-y-4 mb-6">
                {error ? (
                    <div className="text-red-400 font-bold text-sm">{error}</div>
                ) : (
                    <>
                        <p className="text-sm font-medium">Arahkan kamera ke barcode produk</p>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white/40">
                            <Camera size={12} />
                            <span>Powered by ML Kit</span>
                        </div>
                    </>
                )}
                <button
                    onClick={onClose}
                    className="w-full h-12 bg-white text-black rounded-2xl font-black uppercase tracking-wider text-xs"
                >
                    Batalkan
                </button>
            </div>

            <style>{`
                .scanner-active {
                    background-color: transparent !important;
                }
                .scanner-active #root {
                    visibility: hidden !important;
                }
                @keyframes scan-laser {
                    0%, 100% { top: 10%; }
                    50% { top: 90%; }
                }
                .animate-scan-laser {
                    animation: scan-laser 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
