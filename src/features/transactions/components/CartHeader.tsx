import { ShoppingCart, ChevronDown, X, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RestaurantTable } from '../../../types';

interface CartHeaderProps {
    activeTransactionId: string | null;
    orderType: string;
    tableId: string | null;
    tables?: RestaurantTable[];
    setShowOrderModal: (show: boolean) => void;
    onClose?: () => void;
    pendingTransactionsCount: number;
    setShowResumeModal: (show: boolean) => void;
    itemsCount: number;
    handleResetAll: () => void;
    isFnb: boolean;
}

export const CartHeader = ({
    activeTransactionId,
    orderType,
    tableId,
    tables,
    setShowOrderModal,
    onClose,
    pendingTransactionsCount,
    setShowResumeModal,
    itemsCount,
    handleResetAll,
    isFnb
}: CartHeaderProps) => {
    const tableName = tableId && tables ? tables.find(t => t.id === tableId)?.name : tableId;

    return (
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex flex-col text-left">
                <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight">
                    <div className="p-2.5 bg-indigo-50/50 backdrop-blur-sm rounded-xl mr-3 text-indigo-600 shadow-sm border border-indigo-100/50 relative">
                        <ShoppingCart size={22} strokeWidth={2.5} />
                        <AnimatePresence>
                            {itemsCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm"
                                >
                                    <motion.span
                                        key={itemsCount}
                                        initial={{ y: 5, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="inline-block"
                                    >
                                        {itemsCount}
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                        {isFnb
                            ? (orderType === 'dine_in' ? (tableName ? `Meja ${tableName}` : 'Pilih Meja') : orderType.replace('_', ' '))
                            : (orderType === 'walk_in' ? 'Walk-In' : orderType === 'online' ? 'Online' : orderType.replace('_', ' '))
                        }
                        <ChevronDown size={12} strokeWidth={3} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button onClick={onClose} className="lg:hidden p-2.5 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all active:scale-95">
                    <X size={22} />
                </button>

                {!activeTransactionId && pendingTransactionsCount > 0 && (
                    <button onClick={() => setShowResumeModal(true)} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative group">
                        <Clock size={20} />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
                        <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                            Lihat Pesanan Tersimpan
                        </div>
                    </button>
                )}

                {itemsCount > 0 && (
                    <button onClick={handleResetAll} className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all group" title="Kosongkan">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
