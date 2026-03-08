import { User, Plus, X, Trash2, Clock } from 'lucide-react';
import type { RestaurantTable } from '../../../types';

interface CartHeaderProps {
    orderType: string;
    tableId: string | null;
    tables?: RestaurantTable[];
    setShowOrderModal: (show: boolean) => void;
    onClose?: () => void;
    isFnb: boolean;
    activeTransactionId: string | null;
    pendingTransactionsCount: number;
    setShowResumeModal: (show: boolean) => void;
    handleResetAll: () => void;
}

export const CartHeader = ({
    orderType,
    tableId,
    tables,
    setShowOrderModal,
    onClose,
    isFnb,
    activeTransactionId,
    pendingTransactionsCount,
    setShowResumeModal,
    handleResetAll
}: CartHeaderProps) => {
    const tableName = tableId && tables ? tables.find(t => t.id === tableId)?.name : tableId;

    return (
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-30 h-20">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-full text-slate-400">
                    <User size={24} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-indigo-600 uppercase tracking-tight">
                            {isFnb
                                ? (orderType === 'dine_in' ? (tableName ? `Table ${tableName}` : 'Select Table') : orderType.replace('_', '-').toUpperCase())
                                : (orderType === 'walk_in' ? 'WALK-IN' : orderType.replace('_', '-').toUpperCase())
                            }
                        </h2>
                        {activeTransactionId && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Resuming
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">(1 Pax)</span>
                </div>
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    onClick={handleResetAll}
                    title="Clear Cart"
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
                >
                    <Trash2 size={20} />
                </button>

                <button
                    onClick={() => setShowResumeModal(true)}
                    title="Saved Orders"
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-all relative"
                >
                    <Clock size={20} />
                    {pendingTransactionsCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                </button>

                <div className="w-px h-6 bg-slate-100 mx-1" />

                <button
                    onClick={() => setShowOrderModal(true)}
                    className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-all active:scale-95"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>

                <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};
