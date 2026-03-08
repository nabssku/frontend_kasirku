import { useCartStore } from '../../../app/store/useCartStore';
import { usePendingTransactions } from '../../../hooks/useTransactions';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTables } from '../../../hooks/useTables';
import { useState, useEffect } from 'react';
import { ReceiptModal } from './ReceiptModal';
import { useTransactionReceipt } from '../../../hooks/usePrinters';
import { CartItemList } from './CartItemList';
import { CartFooter } from './CartFooter';
import { ResumeOrderModal, OrderModal, PaymentModal, NoShiftModal, CancelOrderModal } from './CartModals';
import { useCartActions } from '../hooks/useCartActions';
import { CartHeader } from './CartHeader';
import { CartSuccessView } from './CartSuccessView';
import { useBusinessType } from '../../../hooks/useBusinessType';
import { CartHistory } from './CartHistory';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { ShoppingBag, History } from 'lucide-react';
import { toast } from 'sonner';

interface CartSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
    const { items, updateQuantity, removeItem, orderType, setOrderType, tableId, setTable } = useCartStore();
    const { data: pendingTransactions = [] } = usePendingTransactions();
    const { data: customersData } = useCustomers(1, '');
    const { data: tables = [] } = useTables();
    const { isFnb, isRetail } = useBusinessType();

    // Set a sensible default orderType when switching business mode
    useEffect(() => {
        if (isRetail && (orderType === 'dine_in' || orderType === 'takeaway' || orderType === 'delivery')) {
            setOrderType('walk_in');
        } else if (isFnb && (orderType === 'walk_in' || orderType === 'online')) {
            setOrderType('dine_in');
        }
    }, [isRetail, isFnb]); // eslint-disable-line react-hooks/exhaustive-deps

    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
    const { user } = useAuthStore();
    const isCashier = user?.roles?.some(r => r.slug === 'cashier' || r.slug === 'owner' || r.slug === 'admin'); // Assuming these roles can also see history

    const {
        paymentMethod, setPaymentMethod, paidAmount, setPaidAmount,
        customerId, setCustomerId, discount, setDiscount, discountType, setDiscountType,
        notes, setNotes,
        showSuccess, activeTransactionId, printTransactionId, setPrintTransactionId,
        isPending, total, tax, service_charge, grandTotal, changeAmount,
        handleCheckout, handleSaveOrder, handleResumeOrder, handleResetAll, handleCancelOrder, handlePrintCheck, currentShift,
        showNoShiftModal, setShowNoShiftModal,
        taxRate, serviceChargeRate
    } = useCartActions();

    const validateOrderInfo = () => {
        if (isFnb && orderType === 'dine_in' && !tableId) {
            toast.error('Silakan pilih nomor meja terlebih dahulu');
            setShowOrderModal(true);
            return false;
        }
        return true;
    };

    const onValidatedCheckout = () => {
        if (validateOrderInfo()) {
            handleCheckout();
        }
    };

    const onValidatedSaveOrder = () => {
        if (validateOrderInfo()) {
            handleSaveOrder();
        }
    };

    const { data: receiptData } = useTransactionReceipt(printTransactionId);

    if (showSuccess) {
        return <CartSuccessView changeAmount={changeAmount} />;
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
            )}

            <div className={`
                h-full flex flex-col bg-white border-r border-slate-200 shadow-xl
                fixed inset-y-0 left-0 z-50 w-full xs:w-[26rem] max-w-[95vw] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                md:relative md:translate-x-0 md:z-0 md:w-[450px]
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <CartHeader
                    orderType={orderType}
                    tableId={tableId}
                    tables={tables}
                    setShowOrderModal={setShowOrderModal}
                    onClose={onClose}
                    isFnb={isFnb}
                    activeTransactionId={activeTransactionId}
                    pendingTransactionsCount={pendingTransactions.length}
                    setShowResumeModal={setShowResumeModal}
                    handleResetAll={handleResetAll}
                />

                {/* Role-based Tab Switcher */}
                {isCashier && (
                    <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => setActiveTab('cart')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cart'
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <ShoppingBag size={14} />
                            Keranjang
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history'
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <History size={14} />
                            Histori Hari Ini
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                    {activeTab === 'cart' ? (
                        <>
                            <div className="flex-1 flex flex-col min-h-0">
                                <CartItemList
                                    items={items}
                                    updateQuantity={updateQuantity}
                                    removeItem={removeItem}
                                    tax={tax}
                                    serviceCharge={service_charge}
                                    taxRate={taxRate}
                                    serviceChargeRate={serviceChargeRate}
                                />
                            </div>
                            <CartFooter
                                total={total}
                                grandTotal={grandTotal}
                                paidAmount={paidAmount}
                                items={items}
                                handleCheckout={onValidatedCheckout}
                                handleSaveOrder={onValidatedSaveOrder}
                                handlePrintCheck={handlePrintCheck}
                                handleResetAll={handleResetAll}
                                isPending={isPending}
                                currentShift={currentShift}
                                activeTransactionId={activeTransactionId}
                                setShowCancelModal={setShowCancelModal}
                                setShowOrderModal={setShowOrderModal}
                                setShowPaymentModal={setShowPaymentModal}
                            />
                        </>
                    ) : (
                        <CartHistory onSelectTransaction={(id) => setPrintTransactionId(id)} />
                    )}
                </div>
            </div>

            <ResumeOrderModal
                isOpen={showResumeModal} onClose={() => setShowResumeModal(false)}
                pendingTransactions={pendingTransactions} onResume={(tx) => {
                    handleResumeOrder(tx);
                    setShowResumeModal(false);
                }}
            />

            <OrderModal
                isOpen={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                orderType={orderType}
                setOrderType={setOrderType}
                tableId={tableId}
                setTable={setTable}
                tables={tables}
                customerId={customerId}
                setCustomerId={setCustomerId}
                customersData={customersData}
                discount={discount}
                setDiscount={setDiscount}
                discountType={discountType}
                setDiscountType={setDiscountType}
                notes={notes}
                setNotes={setNotes}
                isFnb={isFnb}
            />

            <PaymentModal
                isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}
                grandTotal={grandTotal} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                paidAmount={paidAmount} setPaidAmount={setPaidAmount}
            />

            {printTransactionId && receiptData && (
                <ReceiptModal receipt={receiptData} onClose={() => setPrintTransactionId(null)} autoPrint />
            )}

            <NoShiftModal isOpen={showNoShiftModal} onClose={() => setShowNoShiftModal(false)} />

            <CancelOrderModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={(reason) => {
                    handleCancelOrder(reason);
                    setShowCancelModal(false);
                }}
                isPending={isPending}
            />
        </>
    );
};
