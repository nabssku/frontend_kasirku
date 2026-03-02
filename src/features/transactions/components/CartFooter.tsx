import { User, ChevronDown, CreditCard, Store, Bike, CheckCircle2, Save, Loader2, Trash2 } from 'lucide-react';
import type { CartItem } from '../../../app/store/useCartStore';
import { useBusinessType } from '../../../hooks/useBusinessType';
import { formatRp } from '../../../lib/format';

interface CartFooterProps {
    isDragging: boolean;
    dragOffset: number;
    handleDragStart: (y: number) => void;
    handleDragMove: (y: number) => void;
    handleDragEnd: () => void;
    showDetails: boolean;
    setShowDetails: (show: boolean) => void;
    setShowOrderModal: (show: boolean) => void;
    customersData: any;
    customerId: string;
    notes: string;
    total: number;
    discount: number;
    discountType: 'fixed' | 'percent';
    calculatedDiscount: number;
    tax: number;
    grandTotal: number;
    items: CartItem[];
    paymentMethod: string;
    paidAmount: number;
    setShowPaymentModal: (show: boolean) => void;
    handleSaveOrder: () => void;
    handleCheckout: () => void;
    isPending: boolean;
    currentShift: any;
    activeTransactionId: string | null;
    setShowCancelModal: (show: boolean) => void;
}

export const CartFooter = ({
    isDragging, dragOffset, handleDragStart, handleDragMove, handleDragEnd,
    showDetails, setShowDetails, setShowOrderModal, customersData, customerId, notes,
    total, discount, discountType, calculatedDiscount, tax, grandTotal, items, paymentMethod, paidAmount,
    setShowPaymentModal, handleSaveOrder, handleCheckout, isPending,
    currentShift, activeTransactionId, setShowCancelModal
}: CartFooterProps) => {
    const { isFnb } = useBusinessType();
    return (
        <div
            className={`mt-auto bg-white border-t border-slate-100 p-6 pt-9 space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] z-30 relative rounded-t-[32px] transition-transform ${isDragging ? '' : 'duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]'}`}
            style={{ transform: isDragging ? `translateY(${dragOffset}px)` : 'none' }}
        >
            {/* Toggle Handle / Peek */}
            <div
                className="absolute -top-4 left-0 right-0 h-12 cursor-grab active:cursor-grabbing flex items-center justify-center z-40"
                onMouseDown={(e) => handleDragStart(e.clientY)}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
                onTouchEnd={() => handleDragEnd()}
                onClick={() => !isDragging && Math.abs(dragOffset) < 5 && setShowDetails(!showDetails)}
            >
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <div className={`w-12 h-1.5 rounded-full transition-all duration-300 ${showDetails ? 'bg-indigo-100' : 'bg-slate-200'}`}
                        style={{ transform: `translateY(${Math.max(-10, Math.min(10, dragOffset * 0.2))}px)` }}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                        {showDetails ? 'Ringkasan' : 'Detail Transaksi'}
                    </span>
                </div>
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showDetails ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center justify-between group cursor-pointer hover:bg-indigo-100/50 transition-all" onClick={() => setShowOrderModal(true)}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <User size={20} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</span>
                                <span className="text-sm font-bold text-slate-700">{customersData?.data.find((c: any) => c.id === customerId)?.name || 'Guest / Umum'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Edit Info</span>
                            <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
                        </div>
                    </div>
                    {notes && (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 shadow-sm italic">
                            <Save size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Catatan Transaksi</span>
                                <p className="text-sm font-bold text-amber-900 leading-tight">"{notes}"</p>
                            </div>
                        </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Subtotal</span>
                            <span className="text-slate-700 font-bold">{formatRp(total)}</span>
                        </div>
                        {calculatedDiscount > 0 && (
                            <div className="flex justify-between text-[11px] font-black text-rose-400 uppercase tracking-wider">
                                <span>Diskon {discountType === 'percent' && `(${discount}%)`}</span>
                                <span className="text-rose-500 font-bold">- {formatRp(calculatedDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Pajak (10%)</span>
                            <span className="text-slate-700 font-bold">{formatRp(tax)}</span>
                        </div>
                        {isFnb && (
                            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                <span>Service Charge</span>
                                <span className="text-slate-700 font-bold">—</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Payment Selection Trigger */}
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Informasi Pembayaran</label>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className={`w-full h-16 px-6 rounded-2xl flex items-center justify-between transition-all border group shadow-sm ${paidAmount >= grandTotal
                            ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100/50'
                            : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${paidAmount >= grandTotal ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-indigo-600'}`}>
                                {paymentMethod === 'cash' ? <CreditCard size={20} /> : paymentMethod === 'bank_transfer' ? <Store size={20} /> : <Bike size={20} />}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Metode: {paymentMethod === 'cash' ? 'Tunai' : paymentMethod === 'bank_transfer' ? 'Transfer' : 'E-Wallet'}</span>
                                <span className={`text-sm font-bold ${paidAmount >= grandTotal ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {paidAmount > 0 ? formatRp(paidAmount) : 'Pilih Pembayaran'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {paidAmount >= grandTotal && <CheckCircle2 size={18} className="text-emerald-500" />}
                            <ChevronDown size={16} className="text-slate-400 group-hover:text-indigo-600" />
                        </div>
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSaveOrder}
                        disabled={items.length === 0 || isPending || !currentShift}
                        className="w-16 h-16 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:grayscale shadow-sm border border-amber-100 group"
                        title="Simpan Sementara"
                    >
                        <Save size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={items.length === 0 || isPending || paidAmount < grandTotal || !currentShift}
                        className={`flex-1 h-16 rounded-2xl font-black text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-between px-6 group relative overflow-hidden ${items.length === 0 || isPending || paidAmount < grandTotal || !currentShift
                            ? 'bg-slate-200 text-slate-400 shadow-none'
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 hover:shadow-indigo-300'} `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        <div className="flex items-center gap-3">
                            {isPending ? <Loader2 className="animate-spin text-white" size={24} /> : <CreditCard size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />}
                            <span className="uppercase tracking-[0.15em] text-sm whitespace-nowrap">
                                {isPending ? 'Memproses...' : activeTransactionId ? '' : 'Bayar'}
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest leading-none mb-0.5">Total</span>
                            <span className="text-lg font-black text-white tracking-tight">
                                {formatRp(grandTotal)}
                            </span>
                        </div>
                    </button>

                    {activeTransactionId && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={isPending}
                            className="w-16 h-16 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:grayscale shadow-sm border border-red-100 group shrink-0"
                            title="Batalkan Pesanan"
                        >
                            <Trash2 size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
