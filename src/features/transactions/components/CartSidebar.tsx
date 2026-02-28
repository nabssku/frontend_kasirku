import { useCartStore } from '../../../app/store/useCartStore';
import { usePendingTransactions } from '../../../hooks/useTransactions';
import { useCustomers } from '../../../hooks/useCustomers';
import { useTables } from '../../../hooks/useTables';
import { useState } from 'react';
import { ReceiptModal } from './ReceiptModal';
import { useTransactionReceipt } from '../../../hooks/usePrinters';
import { useCartDraggable } from '../hooks/useCartDraggable';
import { CartItemList } from './CartItemList';
import { CartFooter } from './CartFooter';
import { ResumeOrderModal, OrderModal, PaymentModal, NoShiftModal } from './CartModals';
import { useCartActions } from '../hooks/useCartActions';
import { CartHeader } from './CartHeader';
import { CartSuccessView } from './CartSuccessView';

interface CartSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
    const { items, updateQuantity, removeItem, orderType, setOrderType, tableId, setTable } = useCartStore();
    const { data: pendingTransactions = [] } = usePendingTransactions();
    const { data: customersData } = useCustomers(1, '');
    const { data: tables = [] } = useTables();

    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const {
        paymentMethod, setPaymentMethod, paidAmount, setPaidAmount,
        customerId, setCustomerId, discount, setDiscount, discountType, setDiscountType,
        calculatedDiscount, notes, setNotes,
        showSuccess, activeTransactionId, printTransactionId, setPrintTransactionId,
        isPending, total, tax, grandTotal, changeAmount,
        handleCheckout, handleSaveOrder, handleResumeOrder, handleResetAll, currentShift,
        showNoShiftModal, setShowNoShiftModal
    } = useCartActions();

    const { data: receiptData } = useTransactionReceipt(printTransactionId);

    const {
        dragOffset, isDragging, handleDragStart, handleDragMove, handleDragEnd
    } = useCartDraggable(showDetails, setShowDetails);

    if (showSuccess) {
        return <CartSuccessView changeAmount={changeAmount} />;
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
                <CartHeader
                    activeTransactionId={activeTransactionId}
                    orderType={orderType}
                    tableId={tableId}
                    setShowOrderModal={setShowOrderModal}
                    onClose={onClose}
                    pendingTransactionsCount={pendingTransactions.length}
                    setShowResumeModal={setShowResumeModal}
                    itemsCount={items.length}
                    handleResetAll={handleResetAll}
                />

                <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                    <CartItemList items={items} updateQuantity={updateQuantity} removeItem={removeItem} />
                </div>

                <CartFooter
                    isDragging={isDragging}
                    dragOffset={dragOffset}
                    handleDragStart={handleDragStart}
                    handleDragMove={handleDragMove}
                    handleDragEnd={handleDragEnd}
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                    setShowOrderModal={setShowOrderModal}
                    customersData={customersData}
                    customerId={customerId}
                    notes={notes}
                    total={total}
                    discount={discount}
                    discountType={discountType}
                    calculatedDiscount={calculatedDiscount}
                    tax={tax}
                    grandTotal={grandTotal}
                    items={items}
                    paymentMethod={paymentMethod}
                    paidAmount={paidAmount}
                    setShowPaymentModal={setShowPaymentModal}
                    handleSaveOrder={handleSaveOrder}
                    handleCheckout={handleCheckout}
                    isPending={isPending}
                    currentShift={currentShift}
                    activeTransactionId={activeTransactionId}
                />
            </div>

            <ResumeOrderModal
                isOpen={showResumeModal} onClose={() => setShowResumeModal(false)}
                pendingTransactions={pendingTransactions} tables={tables} onResume={(tx) => {
                    handleResumeOrder(tx);
                    setShowResumeModal(false);
                }}
            />

            <OrderModal
                isOpen={showOrderModal} onClose={() => setShowOrderModal(false)}
                orderType={orderType} setOrderType={setOrderType} tableId={tableId} setTable={setTable}
                tables={tables} customerId={customerId} setCustomerId={setCustomerId}
                customersData={customersData} discount={discount} setDiscount={setDiscount}
                discountType={discountType} setDiscountType={setDiscountType}
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

            <NoShiftModal isOpen={showNoShiftModal} onClose={() => setShowNoShiftModal(false)} />
        </>
    );
};
