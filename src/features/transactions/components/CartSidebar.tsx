import {
    Trash2, Plus, Minus, CreditCard, User, AlertCircle, CheckCircle2,
    ShoppingCart, Loader2, Table2, ChefHat, Bike, Store, Save, Clock, X
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
    const [printTransactionId, setPrintTransactionId] = useState<string | null>(null);
    const { data: receiptData } = useTransactionReceipt(printTransactionId);

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
                h-full flex flex-col bg-white border-l border-slate-200 shadow-xl 
                fixed inset-y-0 right-0 z-50 w-[24rem] max-w-[90vw] transition-transform duration-300
                lg:relative lg:translate-x-0 lg:z-0 lg:w-96
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <CreditCard className="mr-2 text-indigo-600" size={18} />
                            Pesanan Aktif
                        </h2>
                        {activeTransactionId && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">MELANJUTKAN PESANAN</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {/* Close button for mobile/tablet */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {activeTransactionId ? (
                            <button
                                onClick={handleResetAll}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm border border-indigo-100"
                            >
                                <Plus size={14} />
                                Pesanan Baru
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowResumeModal(true)}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative"
                                title="Pesanan Tersimpan"
                            >
                                <Clock size={18} />
                                {pendingTransactions.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleResetAll}
                            className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            title="Kosongkan Keranjang"
                        >
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Order Type Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 space-y-3">
                    <div className="flex bg-white rounded-xl p-1 border border-slate-200">
                        {[
                            { id: 'dine_in', icon: Store, label: 'Dine In' },
                            { id: 'takeaway', icon: ChefHat, label: 'Bungkus' },
                            { id: 'delivery', icon: Bike, label: 'Delivery' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setOrderType(t.id as any)}
                                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${orderType === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <t.icon size={16} />
                                <span className="text-[10px] font-bold uppercase">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {orderType === 'dine_in' && (
                        <div className="flex items-center gap-2">
                            <Table2 size={16} className="text-slate-400" />
                            <select
                                value={tableId || ''}
                                onChange={(e) => setTable(e.target.value)}
                                className="flex-1 rounded-xl border-slate-200 text-sm py-2 px-3 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">Pilih Meja</option>
                                {tables.filter(t => t.status === 'available' || t.id === tableId).map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!currentShift && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 animate-pulse">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p className="text-xs font-medium">Harap buka shift terlebih dahulu untuk mulai bertransaksi.</p>
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div className="text-center text-slate-400 py-16 flex flex-col items-center gap-2">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p className="font-medium">Keranjang masih kosong</p>
                            <p className="text-sm">Pilih produk di sebelah kiri</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.cartId} className="space-y-1 group">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-xs tracking-tight uppercase line-clamp-1">{item.name}</h4>
                                        <div className="text-sm font-bold text-slate-500">
                                            Rp {item.price.toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-slate-100 rounded-lg p-1 shrink-0">
                                        <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="p-1 rounded-md bg-white shadow-sm hover:text-indigo-600"><Minus size={12} /></button>
                                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="p-1 rounded-md bg-white shadow-sm hover:text-indigo-600"><Plus size={12} /></button>
                                        <button onClick={() => removeItem(item.cartId)} className="p-1 ml-2 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {item.modifiers.length > 0 && (
                                    <div className="pl-2 border-l-2 border-slate-100 mt-1">
                                        {item.modifiers.map(m => (
                                            <p key={m.modifier_id} className="text-[10px] text-slate-400 font-medium">+ {m.name} (Rp {m.price.toLocaleString('id-ID')})</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                    <div className="space-y-1.5 text-slate-600">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <User size={12} /> Pelanggan
                        </label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full rounded-xl border-slate-200 text-sm py-2 px-3 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">Umum (Guest)</option>
                            {customersData?.data.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                        <div className="flex justify-between text-sm text-slate-500 font-medium">
                            <span>Subtotal</span>
                            <span>Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-red-500 font-medium">
                                <span>Diskon</span>
                                <span>- Rp {discount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-slate-500 font-medium">
                            <span>Pajak (10%)</span>
                            <span>Rp {tax.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-slate-900 pt-2 border-t border-slate-100">
                            <span>Total</span>
                            <span className="text-indigo-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Diskon (Rp)</label>
                            <input type="number" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full rounded-xl border-slate-200 text-sm py-2 px-3 focus:ring-indigo-500 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Catatan</label>
                            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border-slate-200 text-sm py-2 px-3 focus:ring-indigo-500 bg-white" placeholder="..." />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-xl border-slate-200 text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition-all font-medium">
                                    <option value="cash">Tunai</option>
                                    <option value="bank_transfer">Transfer</option>
                                    <option value="e-wallet">E-Wallet</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bayar (Rp)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={paidAmount || ''}
                                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                                        className={`w-full rounded-xl text-sm py-2 px-3 focus:ring-2 outline-none transition-all font-bold ${paidAmount < grandTotal && paidAmount > 0
                                            ? 'border-red-300 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white'
                                            }`}
                                        placeholder="0"
                                    />
                                    {paymentMethod === 'cash' && paidAmount > grandTotal && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-emerald-50 border border-emerald-100 rounded-lg p-2 shadow-sm animate-in fade-in slide-in-from-top-1 z-10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Kembalian</span>
                                                <span className="text-xs font-black text-emerald-700">Rp {(paidAmount - grandTotal).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            <button
                                onClick={handleSaveOrder}
                                disabled={items.length === 0 || isPending || !currentShift}
                                className="col-span-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                                title="Simpan Sementara"
                            >
                                <Save size={20} />
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={items.length === 0 || isPending || paidAmount < grandTotal || !currentShift}
                                className={`col-span-4 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${items.length === 0 || isPending || paidAmount < grandTotal || !currentShift ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100'}`}
                            >
                                {isPending ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                                {isPending ? 'Memproses...' : activeTransactionId ? `Selesaikan Rp ${grandTotal.toLocaleString('id-ID')}` : `Bayar Rp ${grandTotal.toLocaleString('id-ID')}`}
                            </button>
                        </div>
                    </div>
                </div>

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
                                                    {tx.table_id ? `Meja: ${tables.find(t => t.id === tx.table_id)?.name || '?'}` : 'No Table'} • {tx.items?.length || 0} item
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
            </div>

            {/* Auto-print receipt after checkout */}
            {printTransactionId && receiptData && (
                <ReceiptModal
                    receipt={receiptData}
                    onClose={() => setPrintTransactionId(null)}
                    autoPrint
                />
            )}
        </>
    );
};
