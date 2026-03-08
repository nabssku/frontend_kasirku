import { useState } from 'react';
import { X, Store, ChefHat, Bike, Table2, User, ChevronDown, Building2, CheckCircle2, AlertCircle, LogIn, Clock, Receipt, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRp } from '../../../lib/format';

// --- No Active Shift Modal ---
export const NoShiftModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[120] p-4 text-left safe-area-padding">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                        <AlertCircle size={40} className="text-amber-500" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Shift Belum Dibuka</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Anda harus membuka shift kasir terlebih dahulu sebelum melayani pelanggan.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/shifts"
                            onClick={onClose}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-200 transition-all active:scale-95"
                        >
                            <LogIn size={18} strokeWidth={3} />
                            Buka Shift Sekarang
                        </Link>
                        <button
                            onClick={onClose}
                            className="w-full h-12 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Resume Order Modal ---
interface ResumeOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingTransactions: any[];
    onResume: (tx: any) => void;
}

export const ResumeOrderModal = ({ isOpen, onClose, pendingTransactions, onResume }: ResumeOrderModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 safe-area-padding" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Lanjutkan Pesanan</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {pendingTransactions.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Receipt size={24} className="text-slate-300" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tidak Ada Pesanan Tersimpan</p>
                        </div>
                    ) : (
                        pendingTransactions.map((tx) => (
                            <button
                                key={tx.id}
                                onClick={() => onResume(tx)}
                                className="w-full text-left p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all group relative overflow-hidden bg-white shadow-sm hover:shadow-md"
                            >
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                                        <Clock size={10} strokeWidth={3} />
                                        {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Number</span>
                                    <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{tx.invoice_number}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                                                <Table2 size={16} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipe</p>
                                                <p className="text-xs font-black text-slate-800">
                                                    {tx.type === 'dine_in' ? (tx.table?.name || 'Meja ?')
                                                        : tx.type === 'walk_in' ? 'Walk-In'
                                                            : tx.type === 'online' ? 'Online'
                                                                : tx.type?.replace('_', ' ').toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                <Store size={16} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Item</p>
                                                <p className="text-xs font-black text-slate-800">{tx.items?.length || 0} Produk</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                                        <div className="text-lg font-black text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-xl border border-indigo-100/50">
                                            {formatRp(tx.grand_total)}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Order Info Modal ---
interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderType: string;
    setOrderType: (type: any) => void;
    tableId: string | null;
    setTable: (id: string | null) => void;
    tables: any[];
    customerId: string;
    setCustomerId: (id: string) => void;
    customersData: any;
    discount: number;
    setDiscount: (val: number) => void;
    discountType: 'fixed' | 'percent';
    setDiscountType: (type: 'fixed' | 'percent') => void;
    notes: string;
    setNotes: (val: string) => void;
    isFnb: boolean;
}

export const OrderModal = ({
    isOpen, onClose, orderType, setOrderType, tableId, setTable, tables,
    customerId, setCustomerId, customersData, discount, setDiscount,
    discountType, setDiscountType, notes, setNotes,
    isFnb
}: OrderModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300 text-left safe-area-padding">
            <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Informasi Pesanan</h3>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Sesuaikan detail transaksi Anda</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar text-left">
                    {/* Order Type Selector */}
                    <div className="space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipe Pesanan</label>
                        <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
                            {isFnb ? (
                                // FNB order types
                                [
                                    { id: 'dine_in', icon: Store, label: 'Dine In' },
                                    { id: 'takeaway', icon: ChefHat, label: 'Bungkus' },
                                    { id: 'delivery', icon: Bike, label: 'Delivery' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setOrderType(t.id as any)}
                                        className={`flex-1 flex flex-col items-center gap-1 sm:gap-1.5 py-3 sm:py-4 rounded-xl transition-all duration-300 ${orderType === t.id
                                            ? 'bg-white text-indigo-600 shadow-md sm:shadow-lg scale-[1.02] border border-indigo-100/50'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'} `}
                                    >
                                        <t.icon size={20} strokeWidth={orderType === t.id ? 2.5 : 2} />
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${orderType === t.id ? 'opacity-100' : 'opacity-60'} `}>{t.label}</span>
                                    </button>
                                ))
                            ) : (
                                // Retail order types
                                [
                                    { id: 'walk_in', icon: Store, label: 'Walk-In' },
                                    { id: 'online', icon: Bike, label: 'Online' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setOrderType(t.id as any)}
                                        className={`flex-1 flex flex-col items-center gap-1 sm:gap-1.5 py-3 sm:py-4 rounded-xl transition-all duration-300 ${orderType === t.id
                                            ? 'bg-white text-indigo-600 shadow-md sm:shadow-lg scale-[1.02] border border-indigo-100/50'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'} `}
                                    >
                                        <t.icon size={20} strokeWidth={orderType === t.id ? 2.5 : 2} />
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${orderType === t.id ? 'opacity-100' : 'opacity-60'} `}>{t.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Table Selection (Dine In, FNB only) */}
                    {isFnb && orderType === 'dine_in' && (
                        <div className="space-y-3 animate-in slide-in-from-top-4 duration-500 text-left">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nomor Meja</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                                {tables.map((t) => {
                                    const isSelected = tableId === t.id;
                                    const isAvailable = t.status === 'available' || isSelected;

                                    return (
                                        <button
                                            key={t.id}
                                            disabled={!isAvailable}
                                            onClick={() => setTable(t.id)}
                                            className={`
                                                relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300
                                                ${isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10'
                                                    : isAvailable
                                                        ? 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                                                        : 'bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                                                }
                                            `}
                                        >
                                            <Table2 size={isSelected ? 18 : 16} strokeWidth={isSelected ? 3 : 2} className="mb-1" />
                                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight line-clamp-1">{t.name}</span>
                                            {isSelected && (
                                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-indigo-600">
                                                    <CheckCircle2 size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {tables.length === 0 && (
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest pl-1 italic">
                                    Tidak ada meja tersedia
                                </p>
                            )}
                        </div>
                    )}

                    {/* Customer & Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        <div className="space-y-3 sm:col-span-2">
                            <label className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                <User size={12} strokeWidth={3} className="text-indigo-400" /> Pelanggan
                            </label>
                            <div className="relative group">
                                <select
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    className="w-full h-12 sm:h-14 pl-4 pr-10 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50/50 group-hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-700 shadow-sm"
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
                            <label className="flex items-center justify-between text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                <span>Diskon</span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setDiscountType('fixed')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${discountType === 'fixed' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-400'}`}
                                    >
                                        Rp
                                    </button>
                                    <button
                                        onClick={() => setDiscountType('percent')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${discountType === 'percent' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-400'}`}
                                    >
                                        %
                                    </button>
                                </div>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                                    {discountType === 'fixed' ? 'Rp' : '%'}
                                </div>
                                <input
                                    type="number"
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="w-full h-12 sm:h-14 pl-10 pr-4 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50/50 group-hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder:text-slate-300 shadow-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catatan</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50/50 hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder:text-slate-300 shadow-sm"
                                placeholder="Add notes..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full h-12 sm:h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] sm:text-sm shadow-xl shadow-indigo-200/50 transition-all active:scale-95"
                    >
                        Simpan Detail
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Payment Modal ---
interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    grandTotal: number;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    paidAmount: number;
    setPaidAmount: (amount: number | ((prev: number) => number)) => void;
}

export const PaymentModal = ({
    isOpen, onClose, grandTotal, paymentMethod, setPaymentMethod, paidAmount, setPaidAmount
}: PaymentModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-0 sm:p-4 animate-in fade-in duration-300 safe-area-padding">
            <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh] mt-auto sm:mt-0">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                    <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Pembayaran</h3>
                        <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan:</span>
                            <span className="text-xs sm:text-sm font-black text-indigo-600">{formatRp(grandTotal)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 flex-1 no-scrollbar no-scrollbar">
                    {/* Payment Method selection */}
                    <div className="space-y-3 sm:space-y-4 text-left">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                            {[
                                { id: 'cash', label: 'Tunai', icon: Store, color: 'emerald' },
                                { id: 'bank_transfer', label: 'Transfer', icon: Building2, color: 'blue' },
                                { id: 'e-wallet', label: 'E-Wallet', icon: Bike, color: 'purple' }
                            ].map((m) => {
                                const Icon = m.icon;
                                const isActive = paymentMethod === m.id;
                                const colorClass = m.color === 'emerald' ? 'emerald' : m.color === 'blue' ? 'blue' : 'purple';

                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setPaymentMethod(m.id);
                                            if (m.id !== 'cash') {
                                                setPaidAmount(grandTotal);
                                            }
                                        }}
                                        className={`flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 rounded-2xl border transition-all duration-300 ${isActive
                                            ? `bg-${colorClass}-50 border-${colorClass}-200 text-${colorClass}-600 shadow-sm scale-[1.02]`
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                            }`}
                                    >
                                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Paid Amount Input */}
                    <div className="space-y-3 sm:space-y-4 text-left">
                        <div className="flex justify-between items-end pl-1">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal Bayar</label>
                            {paidAmount > 0 && (
                                <button
                                    onClick={() => setPaidAmount(0)}
                                    className="text-[9px] sm:text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none text-slate-400 font-black text-base sm:text-lg">Rp</div>
                            <input
                                type="number"
                                value={paidAmount || ''}
                                onChange={(e) => setPaidAmount(Number(e.target.value))}
                                className={`w-full h-16 sm:h-20 pl-14 sm:pl-16 pr-5 sm:pr-6 rounded-[20px] sm:rounded-[24px] text-2xl sm:text-3xl font-black transition-all shadow-inner outline-none ${paidAmount < grandTotal && paidAmount > 0
                                    ? 'bg-red-50 border-red-200 text-red-600 focus:ring-red-500/10 focus:border-red-400'
                                    : 'bg-slate-50 border-slate-100 text-indigo-600 focus:ring-indigo-500/10 focus:border-indigo-400'
                                    }`}
                                placeholder="0"
                            />
                        </div>

                        {/* Quick amounts (only for cash) */}
                        {paymentMethod === 'cash' && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                                                setPaidAmount(prev => (typeof prev === 'number' ? prev : 0) + 5000);
                                            } else {
                                                setPaidAmount(q.value);
                                            }
                                        }}
                                        className="h-10 sm:h-12 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 text-[9px] font-black uppercase tracking-wider transition-all active:scale-90"
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Change / Status info */}
                    {paymentMethod === 'cash' && paidAmount > grandTotal && (
                        <div className="p-4 sm:p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 sm:mb-1">Kembalian</span>
                                <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">{formatRp(paidAmount - grandTotal)}</span>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                    )}

                    {paidAmount < grandTotal && paidAmount > 0 && (
                        <div className="p-4 sm:p-6 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5 sm:mb-1">Kurang Bayar</span>
                                <span className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">{formatRp(grandTotal - paidAmount)}</span>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                <AlertCircle size={24} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 pb-10 sm:pb-8">
                    <button
                        onClick={onClose}
                        disabled={paidAmount < grandTotal}
                        className={`w-full h-14 sm:h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] sm:text-sm shadow-xl transition-all active:scale-95 ${paidAmount < grandTotal
                            ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50'
                            }`}
                    >
                        {paidAmount < grandTotal ? 'Nominal Kurang' : 'Konfirmasi Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Cancel Order Modal ---
interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isPending?: boolean;
}

export const CancelOrderModal = ({ isOpen, onClose, onConfirm, isPending }: CancelOrderModalProps) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[130] p-4 text-left safe-area-padding">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
                        <Trash2 size={40} className="text-red-500" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Batalkan Pesanan?</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Pesanan ini akan dihapus dan stok akan dikembalikan. Berikan alasan pembatalan.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Alasan Pembatalan</label>
                        <textarea
                            autoFocus
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold text-slate-700 min-h-[100px] no-scrollbar shadow-inner"
                            placeholder="Contoh: Kesalahan input / Pelanggan batal..."
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onConfirm(reason)}
                            disabled={!reason.trim() || isPending}
                            className="w-full h-14 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:grayscale text-white rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-200 transition-all active:scale-95"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={18} /> : 'Konfirmasi Batalkan'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full h-12 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
