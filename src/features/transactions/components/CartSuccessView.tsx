import { CheckCircle2 } from 'lucide-react';
import { formatRp } from '../../../lib/format';

interface CartSuccessViewProps {
    changeAmount: number;
}

export const CartSuccessView = ({ changeAmount }: CartSuccessViewProps) => {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-white border-l border-slate-200 shadow-xl w-96 p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Transaksi Berhasil!</h2>
            <p className="text-slate-500">
                Kembalian: <span className="font-bold text-slate-900">{formatRp(changeAmount)}</span>
            </p>
            <p className="text-sm text-slate-400">Menyiapkan pesanan baru...</p>
        </div>
    );
};
