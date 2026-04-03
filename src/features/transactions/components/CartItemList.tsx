import { ShoppingCart, Plus, Minus, Trash2, Percent, StickyNote } from 'lucide-react';
import { useRef } from 'react';
import type { CartItem } from '../../../app/store/useCartStore';
import { formatCurrency } from '../../../lib/format';

interface CartItemListProps {
    items: CartItem[];
    updateQuantity: (cartId: string, quantity: number) => void;
    removeItem: (cartId: string) => void;
    onLongPressItem: (item: CartItem) => void;
    tax: number;
    serviceCharge: number;
    taxRate: number;
    serviceChargeRate: number;
}

export const CartItemList = ({
    items, updateQuantity, removeItem, onLongPressItem,
    tax, serviceCharge, taxRate, serviceChargeRate
}: CartItemListProps) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleStart = (item: CartItem) => {
        timerRef.current = setTimeout(() => {
            onLongPressItem(item);
            timerRef.current = null;
        }, 700);
    };

    const handleEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-20 px-10 text-center space-y-4 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingCart size={40} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Keranjang Kosong</h3>
                    <p className="text-[11px] text-slate-300 mt-1">Pilih produk di sebelah kanan...</p>
                </div>
            </div>
        );
    }

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity) - (item.discount || 0), 0);
    const rounding = 0; // Simplified for now

    return (
        <div className="flex-1 overflow-y-auto w-full no-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-200 z-10">
                    <tr>
                        <th className="px-4 py-3 text-[13px] font-black text-slate-600 uppercase">Item</th>
                        <th className="px-4 py-3 text-[13px] font-black text-slate-600 uppercase text-center">Qty</th>
                        <th className="px-4 py-3 text-[13px] font-black text-slate-600 uppercase text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                        <tr 
                            key={item.cartId} 
                            className="group hover:bg-slate-50 transition-colors cursor-pointer select-none active:bg-slate-100"
                            onMouseDown={() => handleStart(item)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                            onTouchStart={() => handleStart(item)}
                            onTouchEnd={handleEnd}
                        >
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(item.cartId);
                                        }}
                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[14px] font-bold text-slate-700">{item.name}</span>
                                            {item.is_free && (
                                                <span className="bg-amber-100 text-amber-600 p-0.5 rounded text-[8px] font-black uppercase">Free</span>
                                            )}
                                        </div>
                                        {item.modifiers.length > 0 && (
                                            <span className="text-[11px] text-slate-400">
                                                {item.modifiers.map(m => m.name).join(', ')}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {item.discount > 0 && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-bold bg-red-50 px-1.5 rounded">
                                                    <Percent size={10} /> {formatCurrency(item.discount)}
                                                </span>
                                            )}
                                            {item.notes && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 rounded">
                                                    <StickyNote size={10} /> {item.notes}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(item.cartId, Math.max(0, item.quantity - 1));
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-[14px] font-bold text-slate-700 w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(item.cartId, item.quantity + 1);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-black text-slate-800">
                                        {formatCurrency((item.price * item.quantity) - (item.discount || 0))}
                                    </span>
                                    <span className="text-[11px] text-slate-400">{formatCurrency(item.price)}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Price Summary Section */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-700">{formatCurrency(subtotal)}</span>
                </div>
                {serviceChargeRate > 0 && (
                    <div className="flex justify-between items-center text-[13px] font-medium text-slate-400/80">
                        <span>Service Charge {serviceChargeRate}%</span>
                        <span className="font-bold">{formatCurrency(serviceCharge)}</span>
                    </div>
                )}
                {taxRate > 0 && (
                    <div className="flex justify-between items-center text-[13px] font-medium text-slate-400/80">
                        <span>Pajak {taxRate}%</span>
                        <span className="font-bold">{formatCurrency(tax)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-[13px] font-medium text-slate-400/80">
                    <span>Rounding</span>
                    <span className="font-bold">{formatCurrency(rounding)}</span>
                </div>
            </div>
        </div>
    );
};
