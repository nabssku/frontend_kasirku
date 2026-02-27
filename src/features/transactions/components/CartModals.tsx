import { X, Store, ChefHat, Bike, Table2, User, ChevronDown, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

// --- Resume Order Modal ---
interface ResumeOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingTransactions: any[];
    tables: any[];
    onResume: (tx: any) => void;
}

export const ResumeOrderModal = ({ isOpen, onClose, pendingTransactions, tables, onResume }: ResumeOrderModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Lanjutkan Pesanan</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {pendingTransactions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                            Tidak ada pesanan tersimpan
                        </div>
                    ) : (
                        pendingTransactions.map((tx) => (
                            <button
                                key={tx.id}
                                onClick={() => onResume(tx)}
                                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{tx.invoice_number}</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{tx.type}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[11px] text-slate-500">
                                        {tx.table_id ? `Meja: ${tables.find(t => t.id === tx.table_id)?.name || '?'} ` : 'No Table'} • {tx.items?.length || 0} item
                                    </div>
                                    <div className="text-sm font-bold text-indigo-600">
                                        Rp {parseFloat(tx.grand_total.toString()).toLocaleString('id-ID')}
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-400 mt-2 font-medium">
                                    {new Date(tx.created_at).toLocaleString('id-ID')}
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
}

export const OrderModal = ({
    isOpen, onClose, orderType, setOrderType, tableId, setTable, tables,
    customerId, setCustomerId, customersData, discount, setDiscount,
    discountType, setDiscountType, notes, setNotes
}: OrderModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300 text-left">
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
                            {[
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
                            ))}
                        </div>
                    </div>

                    {/* Table Selection (Dine In) */}
                    {orderType === 'dine_in' && (
                        <div className="space-y-3 animate-in slide-in-from-top-4 duration-500 text-left">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nomor Meja</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500/50">
                                    <Table2 size={18} />
                                </div>
                                <select
                                    value={tableId || ''}
                                    onChange={(e) => setTable(e.target.value)}
                                    className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50/50 group-hover:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm text-slate-700"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh] mt-auto sm:mt-0">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                    <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Pembayaran</h3>
                        <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan:</span>
                            <span className="text-xs sm:text-sm font-black text-indigo-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
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
                                        onClick={() => setPaymentMethod(m.id)}
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
                                <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">Rp {(paidAmount - grandTotal).toLocaleString('id-ID')}</span>
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
                                <span className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">Rp {(grandTotal - paidAmount).toLocaleString('id-ID')}</span>
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
