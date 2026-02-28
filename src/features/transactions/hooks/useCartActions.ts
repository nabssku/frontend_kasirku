import { useState } from 'react';
import { useCartStore } from '../../../app/store/useCartStore';
import type { CartItem } from '../../../app/store/useCartStore';
import { useCreateTransaction, useUpdateTransaction, usePendingTransactions } from '../../../hooks/useTransactions';
import { useCurrentShift } from '../../../hooks/useShifts';
import { toast } from 'sonner';

export const useCartActions = () => {
    const {
        items, clearCart, getTotal, orderType, tableId, resetCart
    } = useCartStore();

    const { mutate: createTransaction, isPending: isCreating } = useCreateTransaction();
    const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
    const { refetch: refetchPending } = usePendingTransactions();
    const { data: currentShift } = useCurrentShift();

    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [customerId, setCustomerId] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
    const [notes, setNotes] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
    const [printTransactionId, setPrintTransactionId] = useState<string | null>(null);
    const [showNoShiftModal, setShowNoShiftModal] = useState(false);

    const isPending = isCreating || isUpdating;

    const total = getTotal();
    const calculatedDiscount = discountType === 'percent' ? (total * (discount / 100)) : discount;
    const tax = (total - calculatedDiscount) * 0.1;
    const grandTotal = (total - calculatedDiscount) + tax;
    const changeAmount = paidAmount > grandTotal ? paidAmount - grandTotal : 0;

    const handleResetAll = () => {
        clearCart();
        setPaidAmount(0);
        setCustomerId('');
        setDiscount(0);
        setDiscountType('fixed');
        setNotes('');
        setActiveTransactionId(null);
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        if (!currentShift) {
            setShowNoShiftModal(true);
            return;
        }
        if (paidAmount < grandTotal) {
            toast.error('Jumlah bayar kurang!');
            return;
        }

        const payload: any = {
            items: items.map((item: CartItem) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                modifiers: item.modifiers,
            })),
            paid_amount: paidAmount,
            payment_method: paymentMethod,
            customer_id: customerId || undefined,
            discount: calculatedDiscount || 0,
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
            setShowNoShiftModal(true);
            return;
        }

        const payload: any = {
            items: items.map((item: CartItem) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                modifiers: item.modifiers,
            })),
            customer_id: customerId || undefined,
            discount: calculatedDiscount || 0,
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
        setDiscountType('fixed'); // Recalled discounts are stored as final values
        setNotes(tx.notes || '');
        setActiveTransactionId(tx.id);
    };

    return {
        paymentMethod, setPaymentMethod,
        paidAmount, setPaidAmount,
        customerId, setCustomerId,
        discount, setDiscount,
        discountType, setDiscountType,
        calculatedDiscount,
        notes, setNotes,
        showSuccess, setShowSuccess,
        activeTransactionId, setActiveTransactionId,
        printTransactionId, setPrintTransactionId,
        isPending,
        total, tax, grandTotal, changeAmount,
        handleCheckout, handleSaveOrder, handleResumeOrder, handleResetAll,
        currentShift,
        showNoShiftModal, setShowNoShiftModal
    };
};
