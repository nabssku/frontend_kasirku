import {
    Trash2, Plus, Minus, CreditCard, User, AlertCircle, CheckCircle2,
    ShoppingCart, Loader2, Table2, ChefHat, Bike, Store, Save, Clock, X, ChevronDown, Building2
} from 'lucide-react';
import { useCartStore } from '../../../app/store/useCartStore';
import { useCreateTransaction, useUpdateTransaction, usePendingTransactions } from '../../../hooks/useTransactions';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTables } from '../../../hooks/useTables';
import { useCurrentShift } from '../../../hooks/useShifts';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ReceiptModal } from './ReceiptModal';
import { useTransactionReceipt } from '../../../hooks/usePrinters';

interface CartSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
    const {
        items, updateQuantity, removeItem, clearCart, getTotal,
        orderType, setOrderType, tableId, setTable, resetCart
    } = useCartStore();
    const { mutate: createTransaction, isPending: isCreating } = useCreateTransaction();
    const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
    const { data: pendingTransactions = [], refetch: refetchPending } = usePendingTransactions();

    const { data: customersData } = useCustomers(1, '');
    const { data: tables = [] } = useTables();
    const { data: currentShift } = useCurrentShift();

    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [customerId, setCustomerId] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [printTransactionId, setPrintTransactionId] = useState<string | null>(null);
    const { data: receiptData } = useTransactionReceipt(printTransactionId);

    // Draggable Footer logic
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number | null>(null);

    const handleDragStart = (y: number) => {
        startY.current = y;
        setIsDragging(true);
    };

    const handleDragMove = (y: number) => {
        if (startY.current === null) return;
        const deltaY = y - startY.current;
        // Resistance when pulling further than allowed
        if (!showDetails && deltaY > 0) return; // Can't pull down when already closed
        setDragOffset(deltaY);
    };

    const handleDragEnd = () => {
        if (startY.current === null) return;
        setIsDragging(false);

        // Threshold to toggle: 50px
        if (Math.abs(dragOffset) > 50) {
            if (dragOffset < 0 && !showDetails) {
                setShowDetails(true);
            } else if (dragOffset > 0 && showDetails) {
                setShowDetails(false);
            }
        }

        setDragOffset(0);
        startY.current = null;
    };

    // Global listeners for mouse up/move to handle dragging outside the handle
    useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
        const onMouseUp = () => handleDragEnd();

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, dragOffset, showDetails]);

    const isPending = isCreating || isUpdating;

    const total = getTotal();
    const tax = (total - discount) * 0.1; // In a real app, this should come from outlet data
    const grandTotal = (total - discount) + tax;
    const changeAmount = paidAmount > grandTotal ? paidAmount - grandTotal : 0;

    const handleCheckout = () => {
        if (items.length === 0) return;
        if (!currentShift) {
            toast.error('Shift belum dibuka!');
            return;
        }
        if (paidAmount < grandTotal) {
            toast.error('Jumlah bayar kurang!');
            return;
        }

        const payload: any = {
            items: items.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                modifiers: item.modifiers,
            })),
            paid_amount: paidAmount,
            payment_method: paymentMethod,
            customer_id: customerId || undefined,
            discount: discount || 0,
            notes: notes || undefined,
            table_id: tableId || undefined,
            type: orderType,
            shift_id: currentShift.id,
            status: 'completed'
        };

        const onSuccess = (data: any) => {
            const newTxId: string = data?.data?.id ?? data?.id ?? null;
            setShowSuccess(true);
            if (newTxId) setPrintTransactionId(newTxId);
            setTimeout(() => {
                setShowSuccess(false);
                clearCart();
                setPaidAmount(0);
                setCustomerId('');
                setDiscount(0);
                setNotes('');
                setActiveTransactionId(null);
                refetchPending();
            }, 2000);
        };

        const onError = (error: any) => {
            toast.error(error?.response?.data?.message || 'Transaksi gagal.');
        };

        if (activeTransactionId) {
            updateTransaction({ id: activeTransactionId, payload }, { onSuccess, onError });
        } else {
            createTransaction(payload, { onSuccess, onError });
        }
    };

    const handleSaveOrder = () => {
        if (items.length === 0) return;
        if (!currentShift) {
            toast.error('Shift belum dibuka!');
            return;
        }

        const payload: any = {
            items: items.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                modifiers: item.modifiers,
            })),
            customer_id: customerId || undefined,
            discount: discount || 0,
            notes: notes || undefined,
            table_id: tableId || undefined,
            type: orderType,
            shift_id: currentShift.id,
            status: 'pending'
        };

        const onSuccess = () => {
            toast.success('Pesanan disimpan sementara');
            clearCart();
            setPaidAmount(0);
            setCustomerId('');
            setDiscount(0);
            setNotes('');
            setActiveTransactionId(null);
            refetchPending();
        };

        if (activeTransactionId) {
            updateTransaction({ id: activeTransactionId, payload }, { onSuccess });
        } else {
            createTransaction(payload, { onSuccess });
        }
    };

    const handleResumeOrder = (tx: any) => {
        resetCart({
            items: tx.items.map((item: any) => ({
                id: item.product_id,
                cartId: `${item.product_id} -${(item.modifiers || []).map((m: any) => m.modifier_id).sort().join(',')} `,
                name: item.product_name,
                price: parseFloat(item.price),
                quantity: item.quantity,
                modifiers: item.modifiers || []
            })),
            orderType: tx.type,
            tableId: tx.table_id
        });
        setCustomerId(tx.customer_id || '');
        setDiscount(parseFloat(tx.discount) || 0);
        setNotes(tx.notes || '');
        setActiveTransactionId(tx.id);
        setShowResumeModal(false);
    };

    const handleResetAll = () => {
        clearCart();
        setPaidAmount(0);
        setCustomerId('');
        setDiscount(0);
        setNotes('');
        setActiveTransactionId(null);
    };

    if (showSuccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white border-l border-slate-200 shadow-xl w-96 p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Transaksi Berhasil!</h2>
                <p className="text-slate-500">Kembalian: <span className="font-bold text-slate-900">Rp {changeAmount.toLocaleString('id-ID')}</span></p>
                <p className="text-sm text-slate-400">Menyiapkan pesanan baru...</p>
            </div>
        );
    }

    return (
        <>
            {/* Backdrop for mobile/tablet */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                h-full flex flex-col bg-gradient-to-b from-white to-slate-50 border-l border-slate-100 shadow-[20px_0_50px_rgba(0,0,0,0.1)] 
                fixed inset-y-0 right-0 z-50 w-full xs:w-[24rem] max-w-[95vw] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                lg:relative lg:translate-x-0 lg:z-0 lg:w-[400px]
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight">
                            <div className="p-2.5 bg-indigo-50/50 backdrop-blur-sm rounded-xl mr-3 text-indigo-600 shadow-sm border border-indigo-100/50">
                                <ShoppingCart size={22} strokeWidth={2.5} />
                            </div>
                            Pesanan
                        </h2>
                        {activeTransactionId && (
                            <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50/50 backdrop-blur-sm px-2.5 py-1 rounded-full mt-2 border border-amber-100/50 uppercase tracking-wider w-fit flex items-center gap-1.5 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Melanjutkan
                            </span>
                        )}
                        {!activeTransactionId && (
                            <button
                                onClick={() => setShowOrderModal(true)}
                                className="flex items-center gap-2 mt-2 px-2 py-1 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-all text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-indigo-100 w-fit"
                            >
                                {orderType === 'dine_in' ? `Meja ${tableId || '?'}` : orderType.replace('_', ' ')}
                                <ChevronDown size={12} strokeWidth={3} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Close button for mobile/tablet */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2.5 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                        >
                            <X size={22} />
                        </button>

                        {!activeTransactionId && pendingTransactions.length > 0 && (
                            <button
                                onClick={() => setShowResumeModal(true)}
                                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative group"
                            >
                                <Clock size={20} />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
                                <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                                    Lihat Pesanan Tersimpan
                                </div>
                            </button>
                        )}

                        {items.length > 0 && (
                            <button
                                onClick={handleResetAll}
                                className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all group"
                                title="Kosongkan"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Simplified Item List - Takes more space */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {!currentShift && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 animate-pulse">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div className="text-[10px] font-bold uppercase tracking-wider">
                                Shift belum dibuka. Buka shift di Dashboard untuk memulai transaksi.
                            </div>
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 px-10 text-center space-y-4 opacity-40">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <ShoppingCart size={40} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Keranjang Kosong</h3>
                                <p className="text-[11px] text-slate-300 mt-1">Pilih produk di sebelah kiri...</p>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.cartId} className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100/50">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                                            <span className="text-[10px] font-bold text-slate-300">× {item.quantity}</span>
                                        </div>
                                        <p className="text-xs font-black text-indigo-600">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>

                                        {item.modifiers.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.modifiers.map((mod, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                        {mod.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-75 shadow-none hover:shadow-sm"
                                            >
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="w-8 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-75 shadow-none hover:shadow-sm"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.cartId)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* --- FOOTER SECTION --- */}
                <div
                    className={`mt-auto bg-white border-t border-slate-100 p-6 pt-9 space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] z-30 relative rounded-t-[32px] transition-transform ${isDragging ? '' : 'duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]'} `}
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
                            <div className={`w-12 h-1.5 rounded-full transition-all duration-300 ${showDetails ? 'bg-indigo-100' : 'bg-slate-200'} `}
                                style={{ transform: `translateY(${Math.max(-10, Math.min(10, dragOffset * 0.2))}px)` }}></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                                {showDetails ? 'Ringkasan' : 'Detail Transaksi'}
                            </span>
                        </div>
                    </div>

                    <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showDetails ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'} `}>
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center justify-between group cursor-pointer hover:bg-indigo-100/50 transition-all" onClick={() => setShowOrderModal(true)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div className="flex flex-col">
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
                                <div className="p-3 bg-amber-50/50 rounded-xl border-l-2 border-amber-200 text-[11px] font-medium text-amber-700 italic">
                                    "{notes}"
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[28px] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all duration-500 ${showDetails ? 'pb-7' : ''}`}>
                        <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showDetails ? 'max-h-[300px] opacity-100 mb-6 border-b border-white/10 pb-5' : 'max-h-0 opacity-0 mb-0'} `}>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] font-black text-indigo-300/80 uppercase tracking-wider">
                                    <span>Subtotal</span>
                                    <span className="text-white font-bold">Rp {total.toLocaleString('id-ID')}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-[11px] font-black text-rose-300 uppercase tracking-wider">
                                        <span>Diskon</span>
                                        <span className="text-rose-300 font-bold">- Rp {discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[11px] font-black text-indigo-300/80 uppercase tracking-wider">
                                    <span>Pajak (10%)</span>
                                    <span className="text-white font-bold">Rp {tax.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-indigo-200/60 uppercase tracking-[0.2em] mb-1">Total Pembayaran</span>
                                <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                                    <span className="text-indigo-300 text-sm font-black mr-1 tracking-normal align-top mt-1 inline-block">Rp</span>
                                    {grandTotal.toLocaleString('id-ID')}
                                </span>
                            </div>
                            {!showDetails && (
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-indigo-200/60 uppercase tracking-widest mb-1">{items.length} ITEM</span>
                                    <div className="flex -space-x-1.5">
                                        {[...Array(Math.min(items.length, 3))].map((_, i) => (
                                            <div key={i} className="w-5 h-5 rounded-full border-2 border-indigo-700 bg-white/20 backdrop-blur-md flex items-center justify-center text-[8px] text-white font-black">
                                                {i === 2 && items.length > 3 ? `+${items.length - 2}` : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Payment Selection Trigger */}
                        <div className="space-y-2">
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
                                            {paidAmount > 0 ? `Rp ${paidAmount.toLocaleString('id-ID')}` : 'Pilih Pembayaran'}
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
                                className={`flex-1 h-16 rounded-2xl font-black text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden ${items.length === 0 || isPending || paidAmount < grandTotal || !currentShift
                                    ? 'bg-slate-200 text-slate-400 shadow-none'
                                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 hover:shadow-indigo-300'} `}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isPending ? <Loader2 className="animate-spin text-white" size={24} /> : <CreditCard size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />}
                                <span className="uppercase tracking-[0.15em] text-sm">
                                    {isPending ? 'Memproses...' : activeTransactionId ? 'Selesaikan Pesanan' : 'Bayar Sekarang'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Resume Order Modal */}
            {showResumeModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Lanjutkan Pesanan</h3>
                            <button onClick={() => setShowResumeModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {pendingTransactions.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 uppercase text-xs font-bold tracking-widest">
                                    Tidak ada pesanan tersimpan
                                </div>
                            ) : (
                                pendingTransactions.map((tx) => (
                                    <button
                                        key={tx.id}
                                        onClick={() => handleResumeOrder(tx)}
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tx.invoice_number}</span>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{tx.type}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-xs text-slate-500">
                                                {tx.table_id ? `Meja: ${tables.find(t => t.id === tx.table_id)?.name || '?'} ` : 'No Table'} • {tx.items?.length || 0} item
                                            </div>
                                            <div className="text-sm font-bold text-indigo-600">
                                                Rp {parseFloat(tx.grand_total.toString()).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2">
                                            {new Date(tx.created_at).toLocaleString('id-ID')}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Info Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Informasi Pesanan</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sesuaikan detail transaksi Anda</p>
                            </div>
                            <button onClick={() => setShowOrderModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar text-left">
                            {/* Order Type Selector */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipe Pesanan</label>
                                <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                                    {[
                                        { id: 'dine_in', icon: Store, label: 'Dine In' },
                                        { id: 'takeaway', icon: ChefHat, label: 'Bungkus' },
                                        { id: 'delivery', icon: Bike, label: 'Delivery' }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setOrderType(t.id as any)}
                                            className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all duration-300 ${orderType === t.id
                                                ? 'bg-white text-indigo-600 shadow-lg scale-[1.02] border border-indigo-100/50'
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'} `}
                                        >
                                            <t.icon size={20} strokeWidth={orderType === t.id ? 2.5 : 2} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${orderType === t.id ? 'opacity-100' : 'opacity-60'} `}>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Table Selection (Dine In) */}
                            {orderType === 'dine_in' && (
                                <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nomor Meja</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500/50">
                                            <Table2 size={18} />
                                        </div>
                                        <select
                                            value={tableId || ''}
                                            onChange={(e) => setTable(e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 rounded-2xl border-slate-200 text-sm font-bold bg-slate-50/50 group-hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm text-slate-700"
                                        >
                                            <option value="">Pilih Nomor Meja</option>
                                            {tables.filter(t => t.status === 'available' || t.id === tableId).map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Customer & Details */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3 col-span-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        <User size={12} strokeWidth={3} className="text-indigo-400" /> Pelanggan
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            className="w-full h-14 pl-4 pr-10 rounded-2xl border-slate-200 text-sm font-bold bg-slate-50/50 group-hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-700 shadow-sm"
                                        >
                                            <option value="">Guest / Umum</option>
                                            {customersData?.data.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Diskon (Rp)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-xs">Rp</div>
                                        <input
                                            type="number"
                                            value={discount || ''}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            className="w-full h-14 pl-10 pr-4 rounded-2xl border-slate-200 text-sm font-bold bg-slate-50/50 group-hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder:text-slate-300 shadow-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catatan</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full h-14 px-4 rounded-2xl border-slate-200 text-sm font-bold bg-slate-50/50 hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder:text-slate-300 shadow-sm"
                                        placeholder="Add notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-indigo-200/50 transition-all active:scale-95"
                            >
                                Simpan Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-print receipt after checkout */}
            {printTransactionId && receiptData && (
                <ReceiptModal
                    receipt={receiptData}
                    onClose={() => setPrintTransactionId(null)}
                    autoPrint
                />
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Pembayaran</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan:</span>
                                    <span className="text-sm font-black text-indigo-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1 no-scrollbar">
                            {/* Payment Method selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Metode Pembayaran</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'cash', label: 'Tunai', icon: Store, color: 'emerald' },
                                        { id: 'bank_transfer', label: 'Transfer', icon: Building2, color: 'blue' },
                                        { id: 'e-wallet', label: 'E-Wallet', icon: Bike, color: 'purple' }
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        const isActive = paymentMethod === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => setPaymentMethod(m.id)}
                                                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300 ${isActive
                                                    ? `bg-${m.color}-50 border-${m.color}-200 text-${m.color}-600 shadow-sm scale-[1.02]`
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                                    }`}
                                            >
                                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Paid Amount Input */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end pl-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal Bayar</label>
                                    {paidAmount > 0 && (
                                        <button
                                            onClick={() => setPaidAmount(0)}
                                            className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 font-black text-lg">Rp</div>
                                    <input
                                        type="number"
                                        value={paidAmount || ''}
                                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                                        className={`w-full h-20 pl-16 pr-6 rounded-[24px] text-3xl font-black transition-all shadow-inner outline-none ${paidAmount < grandTotal && paidAmount > 0
                                            ? 'bg-red-50 border-red-200 text-red-600 focus:ring-red-500/10 focus:border-red-400'
                                            : 'bg-slate-50 border-slate-100 text-indigo-600 focus:ring-indigo-500/10 focus:border-indigo-400'
                                            }`}
                                        placeholder="0"
                                    />
                                </div>

                                {/* Quick amounts (only for cash) */}
                                {paymentMethod === 'cash' && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: 'PAS', value: grandTotal },
                                            { label: '2k', value: 2000 },
                                            { label: '5k', value: 5000 },
                                            { label: '10k', value: 10000 },
                                            { label: '20k', value: 20000 },
                                            { label: '50k', value: 50000 },
                                            { label: '100k', value: 100000 },
                                            { label: '+5k', value: 'add_5000' }
                                        ].map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (typeof q.value === 'string') {
                                                        setPaidAmount(prev => prev + 5000);
                                                    } else {
                                                        setPaidAmount(q.value);
                                                    }
                                                }}
                                                className="h-12 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 text-[10px] font-black uppercase tracking-wider transition-all active:scale-90"
                                            >
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Change / Status info */}
                            {paymentMethod === 'cash' && paidAmount > grandTotal && (
                                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Kembalian</span>
                                        <span className="text-2xl font-black text-emerald-700 tracking-tight">Rp {(paidAmount - grandTotal).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                            )}

                            {paidAmount < grandTotal && paidAmount > 0 && (
                                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Kurang Bayar</span>
                                        <span className="text-2xl font-black text-amber-700 tracking-tight">Rp {(grandTotal - paidAmount).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                        <AlertCircle size={24} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                disabled={paidAmount < grandTotal}
                                className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 ${paidAmount < grandTotal
                                    ? 'bg-slate-200 text-slate-400 shadow-none'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50'
                                    }`}
                            >
                                {paidAmount < grandTotal ? 'Nominal Kurang' : 'Konfirmasi Pembayaran'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
