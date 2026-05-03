import { useEffect, useRef, useState } from 'react';
import { X, Printer, Bluetooth, Loader2, CheckCircle2, Share2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PrinterReceiptData } from '../../../types';
import { useBluetoothPrint } from '../../../hooks/useBluetoothPrint';
import { usePrinters } from '../../../hooks/usePrinters';
import { usePrinterStore } from '../../../app/store/usePrinterStore';
import { shareContent } from '../../../utils/capacitor';
import { formatRp } from '../../../lib/format';

interface TransactionSuccessModalProps {
    receipt: PrinterReceiptData | null;
    changeAmount: number;
    onClose: () => void;
    autoPrint?: boolean;
}

const PaymentLabel: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Transfer Bank',
    'e-wallet': 'E-Wallet',
    qrish: 'QRIS',
    edc: 'EDC',
    custom: 'Lainnya',
};

const TypeLabel: Record<string, string> = {
    dine_in: 'Makan di Tempat',
    takeaway: 'Bungkus',
    delivery: 'Delivery',
    walk_in: 'Direct Order',
    online: 'Online Order',
};



export function TransactionSuccessModal({ receipt, changeAmount, onClose, autoPrint = false }: TransactionSuccessModalProps) {
    const { printReceipt } = useBluetoothPrint();
    const { data: printers = [] } = usePrinters();
    const { isConnected } = usePrinterStore();
    const defaultPrinter = printers.find(p => p.is_default);

    const [status, setStatus] = useState<'idle' | 'printing' | 'done' | 'error'>('idle');
    const autoPrintTriggered = useRef(false);

    const handlePrint = async () => {
        if (!receipt) return;
        setStatus('printing');
        try {
            const success = await printReceipt(receipt);
            if (success) {
                setStatus('done');
            } else {
                setStatus('idle');
            }
        } catch (err: any) {
            setStatus('error');
        }
    };

    const handleShare = async () => {
        if (!receipt) return;
        const storeName = receipt.receipt_settings?.store_name || receipt.store_name;
        const itemsText = receipt.items.map(item => `${item.name}\n${item.quantity} x ${formatRp(item.price)} = ${formatRp(item.subtotal)}`).join('\n');
        const shareText = `*${storeName}*\nNo: ${receipt.invoice_number}\nTgl: ${receipt.date}\n------------------\n${itemsText}\n------------------\n*TOTAL: ${formatRp(receipt.grand_total)}*\nTerima kasih!`.trim();
        await shareContent(`Struk ${receipt.invoice_number}`, shareText);
    };

    useEffect(() => {
        if (!autoPrint || !receipt || autoPrintTriggered.current) return;
        autoPrintTriggered.current = true;
        const timer = setTimeout(() => handlePrint(), 800);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPrint, receipt]);

    if (!receipt) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 safe-area-padding">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* Minimalist Header */}
                <div className="p-6 text-center bg-emerald-50/50 border-b border-slate-50 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-1.5 hover:bg-white rounded-full text-slate-400 transition-colors shadow-sm"
                    >
                        <X size={18} />
                    </button>
                    
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-200 mb-3"
                    >
                        <CheckCircle2 size={24} />
                    </motion.div>
                    
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Berhasil!</h2>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 bg-emerald-100/50 px-3 py-1 rounded-full inline-block">
                        Kembalian: {formatRp(changeAmount)}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Minimalist Actions - Moved to Top */}
                    <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handlePrint}
                                disabled={status === 'printing'}
                                className="flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-100"
                            >
                                {status === 'printing' ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                                Cetak
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 border-2 border-slate-100 text-slate-600 p-3 rounded-xl text-xs font-black hover:bg-slate-50 transition-all active:scale-95 bg-white"
                            >
                                <Share2 size={14} /> Bagikan
                            </button>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 text-white p-3.5 rounded-xl text-xs font-black hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-200"
                        >
                            Transaksi Baru <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* Compact Receipt Preview */}
                    <div className="bg-white rounded-xl p-6 font-mono text-[10px] space-y-1 text-slate-700 shadow-sm border border-slate-100 overflow-hidden mx-auto w-full">
                        {/* Store Header */}
                        <div className="text-center space-y-1 mb-4">
                            {receipt.receipt_settings?.logo_url && (
                                <img 
                                    src={receipt.receipt_settings.logo_url} 
                                    alt="Logo" 
                                    className="h-16 object-contain mx-auto mb-4"
                                />
                            )}
                            <div className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                                {receipt.receipt_settings?.store_name || receipt.store_name}
                            </div>
                            <p className="text-[9px] text-slate-500 whitespace-pre-line leading-tight max-w-[200px] mx-auto">
                                {receipt.store_address}
                            </p>
                            <p className="text-[9px] text-slate-500">Tel: {receipt.store_phone}</p>
                        </div>

                        <div className="text-center text-slate-300 py-1">
                            --------------------------------
                        </div>

                        {/* Metadata Section */}
                        <div className="space-y-0.5 mb-2 py-1">
                            <div className="flex gap-2">
                                <span className="w-12 shrink-0">No:</span>
                                <span className="text-slate-900">{receipt.invoice_number}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-12 shrink-0">Tgl:</span>
                                <span className="text-slate-900">{receipt.date}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-12 shrink-0">Kasir:</span>
                                <span className="text-slate-900">{receipt.cashier}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-12 shrink-0">Pelanggan:</span>
                                <span className="text-slate-900">{receipt.customer || 'Umum'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-12 shrink-0">Tipe:</span>
                                <span className="text-slate-900">{TypeLabel[receipt.type || 'dine_in'] || receipt.type}</span>
                            </div>
                        </div>

                        <div className="text-center text-slate-300 py-1">
                            --------------------------------
                        </div>

                        {/* Items Section */}
                        <div className="space-y-2 py-1">
                            {receipt.items.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="text-slate-900 font-bold uppercase">{item.name}</div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span>{item.quantity} x {formatRp(item.price)}</span>
                                        <span className="text-slate-900">{formatRp(item.subtotal)}</span>
                                    </div>
                                    {item.notes && (
                                        <div className="text-[8px] text-slate-400 italic pl-2">- {item.notes}</div>
                                    )}
                                    {item.modifiers && item.modifiers.length > 0 && item.modifiers.map((m, mIdx) => (
                                        <div key={mIdx} className="flex justify-between text-[8px] text-slate-400 pl-2 italic">
                                            <span>+ {m.name}</span>
                                            <span>{formatRp(m.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="text-center text-slate-300 py-1">
                            --------------------------------
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatRp(receipt.subtotal)}</span>
                            </div>
                            {receipt.discount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Diskon</span>
                                    <span>-{formatRp(receipt.discount)}</span>
                                </div>
                            )}
                            {receipt.service_charge > 0 && (
                                <div className="flex justify-between">
                                    <span>Biaya Layanan</span>
                                    <span>{formatRp(receipt.service_charge)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Pajak ({receipt.tax_rate}%)</span>
                                <span>{formatRp(receipt.tax)}</span>
                            </div>
                            
                            <div className="text-center text-slate-300 py-1">
                                --------------------------------
                            </div>

                            <div className="flex justify-between text-slate-900 text-sm font-black pt-1">
                                <span>TOTAL</span>
                                <span>{formatRp(receipt.grand_total)}</span>
                            </div>
                            
                            <div className="flex justify-between pt-1">
                                <span>Bayar</span>
                                <span>{formatRp(receipt.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali</span>
                                <span>{formatRp(changeAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Metode</span>
                                <span>{PaymentLabel[receipt.payment_method] || receipt.payment_method}</span>
                            </div>
                        </div>

                        <div className="text-center text-slate-300 py-2">
                            --------------------------------
                        </div>

                        {/* Store Footer */}
                        {receipt.receipt_settings?.footer_text && (
                            <div className="text-center text-[9px] text-slate-500 leading-tight whitespace-pre-line italic max-w-[220px] mx-auto px-2">
                                {receipt.receipt_settings.footer_text}
                            </div>
                        )}
                    </div>

                    {/* Printer Status Mini */}
                    {defaultPrinter && (
                        <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400 py-2 border-t border-slate-50 mt-4">
                            <Bluetooth size={10} className={isConnected ? "text-emerald-500" : ""} />
                            <span className="truncate">{defaultPrinter.name}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
