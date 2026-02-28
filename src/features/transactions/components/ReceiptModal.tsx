import { useEffect, useRef, useState } from 'react';
import { X, Printer, Bluetooth, BluetoothOff, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import type { PrinterReceiptData } from '../../../types';
import { useBluetoothPrint } from '../../../hooks/useBluetoothPrint';
import { usePrinters } from '../../../hooks/usePrinters';
import { usePrinterStore } from '../../../app/store/usePrinterStore';
import { shareContent } from '../../../utils/capacitor';

interface ReceiptModalProps {
    receipt: PrinterReceiptData | null;
    onClose: () => void;
    autoPrint?: boolean; // trigger auto-print when modal opens
}

const PaymentLabel: Record<string, string> = {
    cash: 'Tunai',
    bank_transfer: 'Transfer Bank',
    'e-wallet': 'E-Wallet',
};

const TypeLabel: Record<string, string> = {
    dine_in: 'Dine In',
    takeaway: 'Bungkus',
    delivery: 'Delivery',
};

export function ReceiptModal({ receipt, onClose, autoPrint = false }: ReceiptModalProps) {
    const { isSupported, printReceipt } = useBluetoothPrint();
    const { data: printers = [] } = usePrinters();
    const { isConnecting, lastError, isConnected } = usePrinterStore();
    const defaultPrinter = printers.find(p => p.is_default);

    const [status, setStatus] = useState<'idle' | 'printing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const autoPrintTriggered = useRef(false);

    const handlePrint = async () => {
        if (!receipt) return;
        setStatus('printing');
        setErrorMsg('');
        try {
            const success = await printReceipt(receipt);
            if (success) {
                setStatus('done');
            } else {
                setStatus('idle');
            }
        } catch (err: any) {
            setErrorMsg(err.message ?? 'Print gagal.');
            setStatus('error');
        }
    };

    const handleShare = async () => {
        if (!receipt) return;

        const storeName = receipt.receipt_settings?.store_name || receipt.store_name;
        const itemsText = receipt.items.map(item =>
            `${item.name}\n${item.quantity} x ${fmt(item.price)} = ${fmt(item.subtotal)}`
        ).join('\n');

        const shareText = `
*${storeName}*
${receipt.store_address || ''}
${receipt.store_phone ? 'Tel: ' + receipt.store_phone : ''}
--------------------------------
No: ${receipt.invoice_number}
Tgl: ${receipt.date}
--------------------------------
${itemsText}
--------------------------------
Subtotal: ${fmt(receipt.subtotal)}
Diskon: -${fmt(receipt.discount)}
Pajak: ${fmt(receipt.tax)}
*TOTAL: ${fmt(receipt.grand_total)}*
--------------------------------
Terima kasih!
`.trim();

        await shareContent(`Struk ${receipt.invoice_number}`, shareText);
    };

    // Auto-print via browser window.print() or Bluetooth when modal opens
    useEffect(() => {
        if (!autoPrint || !receipt || autoPrintTriggered.current) return;
        autoPrintTriggered.current = true;

        // Small delay to let the modal render first
        const timer = setTimeout(() => {
            handlePrint();
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPrint, receipt]);

    if (!receipt) return null;

    const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Printer size={18} className="text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Struk Pembayaran</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                {/* Receipt Preview */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs space-y-1 text-slate-700 border border-slate-100">
                        {/* Store header */}
                        <div className={receipt.receipt_settings?.alignment === 'center' ? 'text-center' : 'text-left'}>
                            {receipt.receipt_settings?.logo_url && (
                                <div className={`mb-3 flex ${receipt.receipt_settings.alignment === 'center' ? 'justify-center' : 'justify-start'}`}>
                                    <img
                                        src={receipt.receipt_settings.logo_url}
                                        alt="Logo"
                                        style={{ width: `${receipt.receipt_settings.logo_width || 80}px` }}
                                        className="h-auto object-contain grayscale"
                                    />
                                </div>
                            )}
                            <p className="font-bold text-base text-slate-900">
                                {receipt.receipt_settings?.store_name || receipt.store_name}
                            </p>
                            {receipt.store_address && <p>{receipt.store_address}</p>}
                            {receipt.store_phone && <p>Tel: {receipt.store_phone}</p>}
                            {receipt.receipt_settings?.header_text && (
                                <p className="italic text-slate-400 whitespace-pre-wrap mt-1">{receipt.receipt_settings.header_text}</p>
                            )}
                        </div>

                        <p className="text-center border-t border-dashed border-slate-300 pt-1 mt-1">
                            --------------------------------
                        </p>

                        {/* Invoice info */}
                        <p>No: {receipt.invoice_number}</p>
                        <p>Tgl: {receipt.date}</p>
                        <p>Kasir: {receipt.cashier}</p>
                        <p>Pelanggan: {receipt.customer}</p>
                        {receipt.type && <p>Tipe: {TypeLabel[receipt.type] ?? receipt.type}</p>}

                        <p className="border-t border-dashed border-slate-300 pt-1 mt-1">--------------------------------</p>

                        {/* Items */}
                        {receipt.items.map((item, idx) => (
                            <div key={idx}>
                                <p className="font-semibold">{item.name}</p>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{item.quantity} x {fmt(item.price)}</span>
                                    <span>{fmt(item.subtotal)}</span>
                                </div>
                            </div>
                        ))}

                        <p className="border-t border-dashed border-slate-300 pt-1 mt-1">--------------------------------</p>

                        {/* Totals */}
                        <div className="flex justify-between"><span>Subtotal</span><span>{fmt(receipt.subtotal)}</span></div>
                        {receipt.discount > 0 && (
                            <div className="flex justify-between text-red-500"><span>Diskon</span><span>-{fmt(receipt.discount)}</span></div>
                        )}
                        {receipt.service_charge > 0 && (
                            <div className="flex justify-between"><span>Service</span><span>{fmt(receipt.service_charge)}</span></div>
                        )}
                        <div className="flex justify-between">
                            <span>Pajak ({receipt.tax_rate}%)</span>
                            <span>{fmt(receipt.tax)}</span>
                        </div>

                        <p className="border-t border-dashed border-slate-300 pt-1 mt-1">--------------------------------</p>

                        <div className="flex justify-between font-bold text-base text-slate-900">
                            <span>TOTAL</span>
                            <span>{fmt(receipt.grand_total)}</span>
                        </div>
                        <div className="flex justify-between"><span>Bayar</span><span>{fmt(receipt.paid_amount)}</span></div>
                        <div className="flex justify-between font-semibold">
                            <span>Kembali</span>
                            <span>{fmt(receipt.change_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Metode</span>
                            <span>{PaymentLabel[receipt.payment_method] ?? receipt.payment_method}</span>
                        </div>

                        <p className="border-t border-dashed border-slate-300 pt-1 mt-1">--------------------------------</p>
                        <div className={receipt.receipt_settings?.alignment === 'center' ? 'text-center' : 'text-left'}>
                            {receipt.receipt_settings?.footer_text ? (
                                <p className="whitespace-pre-wrap">{receipt.receipt_settings.footer_text}</p>
                            ) : (
                                <>
                                    <p>Terima kasih!</p>
                                    <p>Selamat datang kembali :)</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="p-4 border-t border-slate-100 space-y-3">
                    {/* Printer status indicator */}
                    {isSupported ? (
                        defaultPrinter ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                                <Bluetooth size={13} />
                                <span className="flex-1">Printer default: <strong>{defaultPrinter.name}</strong></span>
                                {isConnected ? (
                                    <span className="flex items-center gap-1.5 font-bold text-[9px] text-emerald-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> TERHUBUNG
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold text-slate-400">TERPUTUS</span>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                <Bluetooth size={13} />
                                <span>Belum ada printer default. Klik Print untuk pilih printer.</span>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                            <BluetoothOff size={13} />
                            <span>Web Bluetooth tidak didukung. Akan menggunakan print browser.</span>
                        </div>
                    )}

                    {/* Status message */}
                    {(status === 'done') && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle2 size={14} />
                            <span>Struk berhasil dicetak!</span>
                        </div>
                    )}
                    {(status === 'error' || lastError) && (
                        <p className="text-xs text-red-500">{errorMsg || lastError}</p>
                    )}
                    {isConnecting && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Menghubungkan ke printer...</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={status === 'printing'}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 flex-1"
                        >
                            {status === 'printing' ? (
                                <><Loader2 size={15} className="animate-spin" /> Mencetak...</>
                            ) : (
                                <><Printer size={15} /> Print</>
                            )}
                        </button>
                        <button
                            onClick={handleShare}
                            className="border border-indigo-200 text-indigo-600 p-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 size={15} /> Bagikan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
