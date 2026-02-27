import {
    Trash2, ShoppingCart, Clock, X, ChevronDown, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useCartStore } from '../../../app/store/useCartStore';
import { useCreateTransaction, useUpdateTransaction, usePendingTransactions } from '../../../hooks/useTransactions';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTables } from '../../../hooks/useTables';
import { useCurrentShift } from '../../../hooks/useShifts';
import { useState } from 'react';
import { toast } from 'sonner';
import { ReceiptModal } from './ReceiptModal';
import { useTransactionReceipt } from '../../../hooks/usePrinters';
import { useCartDraggable } from '../hooks/useCartDraggable';
import { CartItemList } from './CartItemList';
import { CartFooter } from './CartFooter';
import { ResumeOrderModal, OrderModal, PaymentModal } from './CartModals';

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

    const {
        dragOffset, isDragging, handleDragStart, handleDragMove, handleDragEnd
    } = useCartDraggable(showDetails, setShowDetails);

    const isPending = isCreating || isUpdating;

    const total = getTotal();
    const tax = (total - discount) * 0.1;
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
                handleResetAll();
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
            handleResetAll();
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
                cartId: `${item.product_id}-${(item.modifiers || []).map((m: any) => m.modifier_id).sort().join(',')}`,
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
        setShowPaymentModal(false);
        setShowOrderModal(false);
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
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
            )}

            <div className={`
                h-full flex flex-col bg-gradient-to-b from-white to-slate-50 border-l border-slate-100 shadow-[20px_0_50px_rgba(0,0,0,0.1)] 
                fixed inset-y-0 right-0 z-50 w-full xs:w-[24rem] max-w-[95vw] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                lg:relative lg:translate-x-0 lg:z-0 lg:w-[400px]
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex flex-col text-left">
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
                        <button onClick={onClose} className="lg:hidden p-2.5 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all active:scale-95">
                            <X size={22} />
                        </button>

                        {!activeTransactionId && pendingTransactions.length > 0 && (
                            <button onClick={() => setShowResumeModal(true)} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative group">
                                <Clock size={20} />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
                                <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                                    Lihat Pesanan Tersimpan
                                </div>
                            </button>
                        )}

                        {items.length > 0 && (
                            <button onClick={handleResetAll} className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all group" title="Kosongkan">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                    {!currentShift && (
                        <div className="m-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 animate-pulse">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-left">
                                Shift belum dibuka. Buka shift di Dashboard untuk memulai transaksi.
                            </div>
                        </div>
                    )}
                    <CartItemList items={items} updateQuantity={updateQuantity} removeItem={removeItem} />
                </div>

                <CartFooter
                    isDragging={isDragging} dragOffset={dragOffset} handleDragStart={handleDragStart}
                    handleDragMove={handleDragMove} handleDragEnd={handleDragEnd}
                    showDetails={showDetails} setShowDetails={setShowDetails}
                    setShowOrderModal={setShowOrderModal} customersData={customersData}
                    customerId={customerId} notes={notes} total={total} discount={discount}
                    tax={tax} grandTotal={grandTotal} items={items} paymentMethod={paymentMethod}
                    paidAmount={paidAmount} setShowPaymentModal={setShowPaymentModal}
                    handleSaveOrder={handleSaveOrder} handleCheckout={handleCheckout}
                    isPending={isPending} currentShift={currentShift} activeTransactionId={activeTransactionId}
                />
            </div>

            <ResumeOrderModal
                isOpen={showResumeModal} onClose={() => setShowResumeModal(false)}
                pendingTransactions={pendingTransactions} tables={tables} onResume={handleResumeOrder}
            />

            <OrderModal
                isOpen={showOrderModal} onClose={() => setShowOrderModal(false)}
                orderType={orderType} setOrderType={setOrderType} tableId={tableId} setTable={setTable}
                tables={tables} customerId={customerId} setCustomerId={setCustomerId}
                customersData={customersData} discount={discount} setDiscount={setDiscount}
                notes={notes} setNotes={setNotes}
            />

            <PaymentModal
                isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}
                grandTotal={grandTotal} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                paidAmount={paidAmount} setPaidAmount={setPaidAmount}
            />

            {printTransactionId && receiptData && (
                <ReceiptModal receipt={receiptData} onClose={() => setPrintTransactionId(null)} autoPrint />
            )}
        </>
    );
};
