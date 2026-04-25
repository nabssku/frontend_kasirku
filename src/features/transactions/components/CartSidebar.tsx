import { useCartStore } from '../../../app/store/useCartStore';
import { usePendingTransactions } from '../../../hooks/useTransactions';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTables } from '../../../hooks/useTables';
import { useState, useEffect } from 'react';
import { TransactionSuccessModal } from './TransactionSuccessModal';
import { useTransactionReceipt } from '../../../hooks/usePrinters';
import { CartItemList } from './CartItemList';
import { CartFooter } from './CartFooter';
import { ResumeOrderModal, OrderModal, PaymentModal, NoShiftModal, CancelOrderModal, DiscountOrderModal, OrderNotesModal, ProductItemModal } from './CartModals';
import { useCartActions } from '../hooks/useCartActions';
import { CartHeader } from './CartHeader';
import { useBusinessType } from '../../../hooks/useBusinessType';
import { toast } from 'sonner';
import { useOverlayStore } from '../../../app/store/useOverlayStore';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { useActivePaymentMethods } from '../../../hooks/useOutletPaymentMethods';

interface CartSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
    const { items, updateQuantity, removeItem, updateItemConfig, orderType, setOrderType, tableId, setTable } = useCartStore();
    const { data: pendingTransactions = [] } = usePendingTransactions();
    const { data: customersData } = useCustomers(1, '');
    const { data: tables = [] } = useTables();
    const { isFnb, isRetail } = useBusinessType();
    const { user } = useAuthStore();
    const { data: activePaymentMethods = [] } = useActivePaymentMethods(user?.outlet_id);


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
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProductItem, setSelectedProductItem] = useState<any>(null);

    const {
        paymentMethod, setPaymentMethod, setPaymentMethodName, paidAmount, setPaidAmount,
        customerId, setCustomerId, discount, setDiscount, discountType, setDiscountType,
        notes, setNotes,
        lastChangeAmount, activeTransactionId, printTransactionId, setPrintTransactionId,
        isPending, tax, service_charge, grandTotal,
        handleCheckout, handleSaveOrder, handleResumeOrder, handleResetAll, handleCancelOrder, handlePrintCheck, currentShift,
        showNoShiftModal, setShowNoShiftModal,
        taxRate, serviceChargeRate
    } = useCartActions();

    const { registerOverlay } = useOverlayStore();

    // Register sidebar itself as an overlay when open on mobile
    useEffect(() => {
        if (isOpen && window.innerWidth < 768 && onClose) {
            return registerOverlay(onClose);
        }
    }, [isOpen, registerOverlay, onClose]);

    // Register modals
    useEffect(() => {
        if (showResumeModal) return registerOverlay(() => setShowResumeModal(false));
    }, [showResumeModal, registerOverlay]);

    useEffect(() => {
        if (showOrderModal) return registerOverlay(() => setShowOrderModal(false));
    }, [showOrderModal, registerOverlay]);

    useEffect(() => {
        if (showPaymentModal) return registerOverlay(() => setShowPaymentModal(false));
    }, [showPaymentModal, registerOverlay]);

    useEffect(() => {
        if (showCancelModal) return registerOverlay(() => setShowCancelModal(false));
    }, [showCancelModal, registerOverlay]);

    useEffect(() => {
        if (showDiscountModal) return registerOverlay(() => setShowDiscountModal(false));
    }, [showDiscountModal, registerOverlay]);

    useEffect(() => {
        if (showNotesModal) return registerOverlay(() => setShowNotesModal(false));
    }, [showNotesModal, registerOverlay]);

    useEffect(() => {
        if (showNoShiftModal) return registerOverlay(() => setShowNoShiftModal(false));
    }, [showNoShiftModal, registerOverlay]);

    useEffect(() => {
        if (printTransactionId) return registerOverlay(() => setPrintTransactionId(null));
    }, [printTransactionId, registerOverlay, setPrintTransactionId]);

    const validateOrderInfo = () => {
        if (isFnb && orderType === 'dine_in' && !tableId) {
            toast.error('Silakan pilih nomor meja terlebih dahulu');
            setShowOrderModal(true);
            return false;
        }
        return true;
    };


    const onProceedToPayment = () => {
        if (validateOrderInfo()) {
            setShowPaymentModal(true);
        }
    };

    const onValidatedSaveOrder = () => {
        if (validateOrderInfo()) {
            handleSaveOrder();
        }
    };

    const { data: receiptData } = useTransactionReceipt(printTransactionId);

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
                safe-padding md:pt-0 md:pb-0 md:pl-0
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


                <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                    <div className="flex-1 flex flex-col min-h-0">
                        <CartItemList
                            items={items}
                            updateQuantity={updateQuantity}
                            removeItem={removeItem}
                            onLongPressItem={(item) => {
                                setSelectedProductItem(item);
                                setShowProductModal(true);
                            }}
                            tax={tax}
                            serviceCharge={service_charge}
                            taxRate={taxRate}
                            serviceChargeRate={serviceChargeRate}
                        />
                    </div>
                    <CartFooter
                        grandTotal={grandTotal}
                        items={items}
                        handleSaveOrder={onValidatedSaveOrder}
                        handlePrintCheck={handlePrintCheck}
                        handleResetAll={handleResetAll}
                        isPending={isPending}
                        currentShift={currentShift}
                        activeTransactionId={activeTransactionId}
                        setShowCancelModal={setShowCancelModal}
                        onProceed={onProceedToPayment}
                        setShowDiscountModal={setShowDiscountModal}
                        setShowNotesModal={setShowNotesModal}
                    />
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
                isFnb={isFnb}
            />

            <DiscountOrderModal
                isOpen={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                discount={discount}
                setDiscount={setDiscount}
                discountType={discountType}
                setDiscountType={setDiscountType}
            />

            <OrderNotesModal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                notes={notes}
                setNotes={setNotes}
            />

            <PaymentModal
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)}
                grandTotal={grandTotal} 
                paymentMethod={paymentMethod} 
                setPaymentMethod={setPaymentMethod}
                setPaymentMethodName={setPaymentMethodName}
                paidAmount={paidAmount} 
                setPaidAmount={setPaidAmount}
                onConfirm={() => handleCheckout({ onSuccess: () => setShowPaymentModal(false) })}
                isPending={isPending}
                activePaymentMethods={activePaymentMethods}
            />

            {printTransactionId && receiptData && (
                <TransactionSuccessModal 
                    receipt={receiptData} 
                    changeAmount={lastChangeAmount}
                    onClose={() => setPrintTransactionId(null)} 
                    autoPrint 
                />
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

            <ProductItemModal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    setSelectedProductItem(null);
                }}
                item={selectedProductItem}
                onUpdate={updateItemConfig}
            />
        </>
    );
};
