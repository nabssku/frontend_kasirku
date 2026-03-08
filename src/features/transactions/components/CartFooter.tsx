import { Printer, Percent, ClipboardList, Send, X } from 'lucide-react';
import { formatRp } from '../../../lib/format';
import type { CartItem } from '../../../app/store/useCartStore';

interface CartFooterProps {
    total: number;
    grandTotal: number;
    paidAmount: number;
    items: CartItem[];
    handleCheckout: () => void;
    handleSaveOrder: () => void;
    handlePrintCheck: () => Promise<void>;
    handleResetAll: () => void;
    currentShift: any;
    activeTransactionId: string | null;
    setShowCancelModal: (show: boolean) => void;
    setShowOrderModal: (show: boolean) => void;
    setShowPaymentModal: (show: boolean) => void;
    isPending: boolean;
}

export const CartFooter = ({
    grandTotal, paidAmount, items, handleCheckout, handleSaveOrder, handlePrintCheck, currentShift, activeTransactionId, setShowCancelModal, setShowOrderModal, setShowPaymentModal, isPending
}: CartFooterProps) => {

    const actionButtons = [
        { icon: <Printer size={20} />, label: 'Print Check', onClick: () => handlePrintCheck() },
        { icon: <Percent size={20} />, label: 'Disc. Order', onClick: () => setShowOrderModal(true) },
        { icon: <ClipboardList size={20} />, label: 'Order Notes', onClick: () => setShowOrderModal(true) },
        { icon: <Send size={20} />, label: 'Send to Kitchen', onClick: () => handleSaveOrder() },
    ];

    const handleMainAction = () => {
        if (paidAmount < grandTotal) {
            setShowPaymentModal(true);
        } else {
            handleCheckout();
        }
    };

    return (
        <div className="mt-auto bg-white border-t border-slate-100 flex flex-col">
            <div className="p-4 grid grid-cols-4 gap-4 items-center">
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    {actionButtons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={btn.onClick}
                            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all active:scale-95 group"
                        >
                            <div className="text-indigo-500 group-hover:scale-110 transition-transform">
                                {btn.icon}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{btn.label}</span>
                        </button>
                    ))}
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center">
                    <button
                        onClick={() => activeTransactionId ? setShowCancelModal(true) : {}}
                        disabled={!activeTransactionId}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${activeTransactionId ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'}`}
                    >
                        <X size={28} strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 mt-2 text-center uppercase">Cancel Order</span>
                </div>
            </div>

            <button
                onClick={handleMainAction}
                disabled={items.length === 0 || isPending || !currentShift}
                className={`w-full h-20 transition-all flex items-center justify-center active:bg-opacity-90 disabled:grayscale disabled:opacity-50 ${paidAmount >= grandTotal ? 'bg-[#5cb85c] hover:bg-[#4cae4c]' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">
                        {paidAmount >= grandTotal ? 'Complete Checkout' : 'Process Payment'}
                    </span>
                    <span className="text-2xl font-black text-white tracking-wide">
                        {formatRp(grandTotal)}
                    </span>
                </div>
            </button>
        </div>
    );
};
