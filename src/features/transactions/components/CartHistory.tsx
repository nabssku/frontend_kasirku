import { History, Receipt, ArrowRight } from 'lucide-react';
import { formatRp } from '../../../lib/format';
import { useTodayTransactions } from '../../../hooks/useTransactions';
import type { Transaction } from '../../../types';

interface CartHistoryProps {
    onSelectTransaction: (id: string) => void;
}

export const CartHistory = ({ onSelectTransaction }: CartHistoryProps) => {
    const { data: transactions = [], isLoading } = useTodayTransactions();

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 opacity-50">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Memuat Histori...</span>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <History size={32} />
                </div>
                <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Belum ada transaksi</p>
                    <p className="text-xs text-slate-400">Transaksi hari ini akan muncul di sini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaksi Hari Ini</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black">{transactions.length}</span>
            </div>

            {transactions.map((tx: Transaction) => (
                <button
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx.id)}
                    className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-left transition-all hover:border-indigo-200 hover:shadow-md active:scale-[0.98] group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{tx.invoice_number}</span>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.payment_method}
                            </p>
                        </div>
                        <span className="font-black text-slate-800 text-sm">{formatRp(tx.grand_total)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Receipt size={12} />
                            <span>Lihat Struk</span>
                        </div>
                        <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </button>
            ))}
        </div>
    );
};
