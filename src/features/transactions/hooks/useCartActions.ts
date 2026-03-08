import { useState } from 'react';
import { useCartStore } from '../../../app/store/useCartStore';
import type { CartItem } from '../../../app/store/useCartStore';
import { useCreateTransaction, useUpdateTransaction, usePendingTransactions, useCancelTransaction } from '../../../hooks/useTransactions';
import { useCurrentShift } from '../../../hooks/useShifts';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { useReceiptSettings } from '../../../hooks/useReceiptSettings';
import { useBluetoothPrint } from '../../../hooks/useBluetoothPrint';
import { useTables } from '../../../hooks/useTables';
import { toast } from 'sonner';

export const useCartActions = () => {
    const {
        items, clearCart, getTotal, orderType, tableId, resetCart
    } = useCartStore();

    const { mutate: createTransaction, isPending: isCreating } = useCreateTransaction();
    const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
    const { mutate: cancelTransaction, isPending: isCancelling } = useCancelTransaction();
    const { refetch: refetchPending } = usePendingTransactions();
    const { data: currentShift } = useCurrentShift();
    const { user } = useAuthStore();
    const { outlet } = useReceiptSettings(user?.outlet_id);
    const { data: tables = [] } = useTables();
    const { printKitchenOrder, printReceipt } = useBluetoothPrint();

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

    const isPending = isCreating || isUpdating || isCancelling;

    const total = getTotal();
    const calculatedDiscount = discountType === 'percent' ? (total * (discount / 100)) : discount;
    const subtotalAfterDiscount = total - calculatedDiscount;
    const serviceChargeRate = Number(outlet?.service_charge || 0) / 100;
    const taxRate = Number(outlet?.tax_rate || 0) / 100;
    
    const service_charge = subtotalAfterDiscount * serviceChargeRate;
    const tax = (subtotalAfterDiscount + service_charge) * taxRate;
    const grandTotal = subtotalAfterDiscount + service_charge + tax;
    const changeAmount = paidAmount > grandTotal ? paidAmount - grandTotal : 0;

    const handleResetAll = () => {
        clearCart();
        setPaidAmount(0);
        setCustomerId('');
        setDiscount(0);
        setDiscountType('fixed');
        setNotes('');
        setActiveTransactionId(null);
        setPaymentMethod('cash');
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        if (!currentShift || currentShift.status !== 'open') {
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
            notes: notes,
            table_id: tableId || undefined,
            type: orderType,
            shift_id: currentShift.id,
            status: 'completed',
            service_charge: service_charge,
            tax: tax,
            tax_rate: (outlet?.tax_rate || 0).toString()
        };

        const onSuccess = (data: any) => {
            const newTxId: string = data?.data?.id ?? data?.id ?? null;
            setShowSuccess(true);
            
            // Print to kitchen
            printKitchenOrder({
                type: orderType,
                table_id: tableId,
                table_name: tableId ? tables.find(t => t.id === tableId)?.name : undefined,
                items: items,
                notes: notes
            });

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
        if (!currentShift || currentShift.status !== 'open') {
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
            notes: notes,
            table_id: tableId || undefined,
            type: orderType,
            shift_id: currentShift.id,
            status: 'pending',
            service_charge: service_charge,
            tax: tax,
            tax_rate: (outlet?.tax_rate || 0).toString()
        };

        const onSuccess = () => {
            toast.success('Pesanan disimpan sementara');
            
            // Print to kitchen
            printKitchenOrder({
                type: orderType,
                table_id: tableId,
                table_name: tableId ? tables.find(t => t.id === tableId)?.name : undefined,
                items: items,
                notes: notes
            });

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
        if (tx.payment_method) setPaymentMethod(tx.payment_method);
        if (tx.paid_amount) setPaidAmount(parseFloat(tx.paid_amount));
    };

    const handleCancelOrder = (reason: string) => {
        if (!activeTransactionId) return;
        cancelTransaction({ id: activeTransactionId, notes: reason }, {
            onSuccess: () => {
                toast.success('Pesanan berhasil dibatalkan');
                handleResetAll();
                refetchPending();
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || 'Gagal membatalkan pesanan');
            }
        });
    };

    const handlePrintCheck = async () => {
        if (items.length === 0) {
            toast.error('Keranjang kosong');
            return;
        }

        const receiptData: any = {
            store_name: outlet?.name || 'JagoKasir',
            store_address: outlet?.address || '',
            store_phone: outlet?.phone || '',
            invoice_number: 'PRO-FORMA',
            date: new Date().toLocaleString('id-ID'),
            cashier: user?.name || '',
            customer: customerId ? 'Customer' : 'Guest', // Simplification for now
            table_name: tableId ? tables.find(t => t.id === tableId)?.name : undefined,
            type: orderType,
            items: items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            })),
            subtotal: total,
            discount: calculatedDiscount,
            tax: tax,
            tax_rate: (outlet?.tax_rate || 0),
            service_charge: service_charge,
            grand_total: grandTotal,
            paid_amount: paidAmount > 0 ? paidAmount : grandTotal,
            change_amount: paidAmount > grandTotal ? paidAmount - grandTotal : 0,
            payment_method: paymentMethod,
            status: 'unpaid',
            receipt_settings: outlet?.receipt_settings
        };

        try {
            await printReceipt(receiptData);
            toast.success('Pro-forma receipt dicetak');
        } catch (err) {
            toast.error('Gagal mencetak check.');
        }
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
        total, tax, service_charge, grandTotal, changeAmount,
        handleCheckout, handleSaveOrder, handleResumeOrder, handleResetAll, handleCancelOrder, handlePrintCheck,
        currentShift,
        showNoShiftModal, setShowNoShiftModal,
        serviceChargeRate: serviceChargeRate * 100,
        taxRate: taxRate * 100
    };
};
