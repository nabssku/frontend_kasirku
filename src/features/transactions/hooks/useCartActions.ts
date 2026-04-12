import { useState, useMemo } from 'react';
import { generateId } from '../../../utils/id';
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
    const items = useCartStore(state => state.items);
    const clearCart = useCartStore(state => state.clearCart);
    const orderType = useCartStore(state => state.orderType);
    const tableId = useCartStore(state => state.tableId);
    const resetCart = useCartStore(state => state.resetCart);
    const activeTransactionId = useCartStore(state => state.activeTransactionId);
    const setActiveTransactionId = useCartStore(state => state.setActiveTransactionId);
    const customerId = useCartStore(state => state.customerId);
    const setCustomerId = useCartStore(state => state.setCustomerId);
    const notes = useCartStore(state => state.notes);
    const setNotes = useCartStore(state => state.setNotes);
    const discount = useCartStore(state => state.discount);
    const setDiscount = useCartStore(state => state.setDiscount);
    const discountType = useCartStore(state => state.discountType);
    const setDiscountType = useCartStore(state => state.setDiscountType);

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
    const [lastChangeAmount, setLastChangeAmount] = useState(0);
    const [printTransactionId, setPrintTransactionId] = useState<string | null>(null);
    const [showNoShiftModal, setShowNoShiftModal] = useState(false);

    const isPending = isCreating || isUpdating || isCancelling;

    const total = useCartStore(state => state.total);

    const { calculatedDiscount, service_charge, tax, grandTotal } = useMemo(() => {
        const t = Number(total) || 0;
        const dValue = Number(discount) || 0;
        const cd = discountType === 'percent' ? (t * (dValue / 100)) : dValue;
        const sad = t - cd;
        const scr = Number(outlet?.service_charge || 0) / 100;
        const tr = Number(outlet?.tax_rate || 0) / 100;
        const sc = sad * scr;
        const tx = (sad + sc) * tr;
        const gt = sad + sc + tx;
        
        return { calculatedDiscount: cd, subtotalAfterDiscount: sad, service_charge: sc, tax: tx, grandTotal: gt };
    }, [items, total, discount, discountType, outlet]);

    const changeAmount = paidAmount > grandTotal ? paidAmount - grandTotal : 0;

    const handleResetAll = () => {
        clearCart();
        setPaidAmount(0);
        setPaymentMethod('cash');
    };

    const handleCheckout = (options?: { onSuccess?: () => void }) => {
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
            local_id: `trx-local-${generateId()}`,
            items: items.map((item: CartItem) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount || 0,
                notes: item.notes || '',
            modifiers: (item.modifiers || []).map((m: any) => ({
                modifier_id: m.modifier_id || m.id,
                name: m.name,
                price: m.price
            })),
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
            
            // Record change for the success modal
            setLastChangeAmount(changeAmount);

            // Print to kitchen
            printKitchenOrder({
                type: orderType,
                table_id: tableId,
                table_name: tableId ? tables.find(t => t.id === tableId)?.name : undefined,
                items: items,
                notes: notes
            });

            // Trigger modal
            if (newTxId) setPrintTransactionId(newTxId);

            // Reset cart immediately (modal handles the success message)
            handleResetAll();
            refetchPending();
            if (options?.onSuccess) options.onSuccess();
        };

        const onError = (error: any) => {
            toast.error(error?.response?.data?.message || 'Transaksi gagal.');
        };

        // Offline handling
        if (!useAuthStore.getState().isOnline) {
            import('../../../app/store/useSyncStore').then(({ useSyncStore }) => {
                useSyncStore.getState().addToQueue(payload);
                toast.success('Offline: Transaksi disimpan secara lokal.');
                
                // Reset cart immediately
                handleResetAll();
                refetchPending();
                if (options?.onSuccess) options.onSuccess();
            });
            return;
        }

        if (activeTransactionId) {
            updateTransaction({ id: activeTransactionId, payload }, { 
                onSuccess: (data: any) => onSuccess(data), 
                onError 
            });
        } else {
            createTransaction(payload, { 
                onSuccess: (data: any) => onSuccess(data), 
                onError 
            });
        }
    };

    const handleSaveOrder = () => {
        if (items.length === 0) return;
        if (!currentShift || currentShift.status !== 'open') {
            setShowNoShiftModal(true);
            return;
        }

        const payload: any = {
            local_id: `trx-local-${generateId()}`,
            items: items.map((item: CartItem) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount || 0,
                notes: item.notes || '',
                modifiers: (item.modifiers || []).map((m: any) => ({
                    modifier_id: m.modifier_id || m.id,
                    name: m.name,
                    price: m.price
                })),
            })),
            customer_id: customerId || undefined,
            discount: calculatedDiscount || 0,
            notes: notes,
            table_id: tableId || undefined,
            type: orderType,
            shift_id: currentShift.id,
            status: 'pending',
            paid_amount: 0,
            payment_method: 'cash', // Default for pending
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

        const onError = (error: any) => {
            toast.error(error?.response?.data?.message || 'Gagal menyimpan pesanan.');
        };

        // Offline handling
        if (!useAuthStore.getState().isOnline) {
            import('../../../app/store/useSyncStore').then(({ useSyncStore }) => {
                useSyncStore.getState().addToQueue(payload);
                toast.success('Offline: Pesanan disimpan sementara secara lokal.');
                handleResetAll();
                refetchPending();
            });
            return;
        }

        if (activeTransactionId) {
            updateTransaction({ id: activeTransactionId, payload }, { onSuccess, onError });
        } else {
            createTransaction(payload, { onSuccess, onError });
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
                discount: parseFloat(item.discount) || 0,
                is_free: parseFloat(item.discount) >= (parseFloat(item.price) * item.quantity),
                notes: item.notes || '',
                modifiers: item.modifiers || []
            })),
            orderType: tx.type,
            tableId: tx.table_id,
            activeTransactionId: tx.id,
            customerId: tx.customer_id || '',
            notes: tx.notes || '',
            discount: parseFloat(tx.discount) || 0,
            discountType: 'fixed',
        });
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
                discount: item.discount || 0,
                subtotal: (item.price * item.quantity) - (item.discount || 0),
                notes: item.notes || '',
                modifiers: item.modifiers
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
            notes: notes,
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
        lastChangeAmount,
        activeTransactionId, setActiveTransactionId,
        printTransactionId, setPrintTransactionId,
        isPending,
        total, tax, service_charge, grandTotal, changeAmount,
        handleCheckout, handleSaveOrder, handleResumeOrder, handleResetAll, handleCancelOrder, handlePrintCheck,
        currentShift,
        showNoShiftModal, setShowNoShiftModal,
        serviceChargeRate: (Number(outlet?.service_charge || 0)),
        taxRate: (Number(outlet?.tax_rate || 0))
    };
};
